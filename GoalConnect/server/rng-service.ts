import { IStorage } from './storage';

/**
 * Event RNG Service
 * Handles all random event generation for the D&D RPG system
 */

export type EventType = 'loot' | 'encounter';

export interface EventResult {
  eventType: EventType;
  loot?: {
    itemId: number;
    itemName: string;
    quantity: number;
    rarity: string;
  };
  encounter?: {
    speciesId: number;
    speciesName: string;
    level: number;
  };
}

export interface UseRunResult {
  success: boolean;
  event?: EventResult;
  error?: string;
}

/**
 * Rarity weights for loot drops
 * Common: 65%, Uncommon: 28%, Rare: 7%
 */
const RARITY_WEIGHTS = {
  common: 65,
  uncommon: 28,
  rare: 7,
};

export class RNGService {
  constructor(private storage: IStorage) {}

  /**
   * Roll a random number between 0-99
   */
  private roll(): number {
    return Math.floor(Math.random() * 100);
  }

  /**
   * Roll for event type based on biome weights
   * @param lootWeight - Loot event weight (e.g., 70)
   * @param encounterWeight - Encounter event weight (e.g., 30)
   * @returns 'loot' or 'encounter'
   */
  private rollEventType(lootWeight: number, encounterWeight: number): EventType {
    const total = lootWeight + encounterWeight;
    const roll = Math.random() * total;

    if (roll < lootWeight) {
      return 'loot';
    }
    return 'encounter';
  }

  /**
   * Roll for item rarity
   * @returns 'common', 'uncommon', or 'rare'
   */
  private rollRarity(): string {
    const roll = this.roll();

    if (roll < RARITY_WEIGHTS.common) {
      return 'common';
    } else if (roll < RARITY_WEIGHTS.common + RARITY_WEIGHTS.uncommon) {
      return 'uncommon';
    } else {
      return 'rare';
    }
  }

  /**
   * Roll for a random loot item
   * @param biomeId - The biome where the loot is found
   * @param playerLevel - Player's current level
   */
  private async rollLoot(biomeId: number, playerLevel: number): Promise<EventResult['loot']> {
    const rarity = this.rollRarity();

    // Get all items that match the rarity
    const allItems = await this.storage.getItems();
    const matchingItems = allItems.filter(item => item.rarity === rarity);

    if (matchingItems.length === 0) {
      // Fallback to any item if no matches
      const randomItem = allItems[Math.floor(Math.random() * allItems.length)];
      return {
        itemId: randomItem.id,
        itemName: randomItem.name,
        quantity: 1,
        rarity: randomItem.rarity,
      };
    }

    // Pick a random item from matching rarity
    const item = matchingItems[Math.floor(Math.random() * matchingItems.length)];

    // Quantity: common = 1-3, uncommon = 1-2, rare = 1
    let quantity = 1;
    if (rarity === 'common') {
      quantity = Math.floor(Math.random() * 3) + 1; // 1-3
    } else if (rarity === 'uncommon') {
      quantity = Math.floor(Math.random() * 2) + 1; // 1-2
    }

    return {
      itemId: item.id,
      itemName: item.name,
      quantity,
      rarity: item.rarity,
    };
  }

  /**
   * Roll for a random encounter
   * @param biomeId - The biome where the encounter happens
   * @param playerLevel - Player's current level (affects wild creature level)
   */
  private async rollEncounter(biomeId: number, playerLevel: number): Promise<EventResult['encounter']> {
    // Get biome details to check for required tags
    const biome = await this.storage.getBiome(biomeId);

    if (!biome) {
      throw new Error(`Biome ${biomeId} not found`);
    }

    // Get all creature species
    const allSpecies = await this.storage.getCreatureSpecies();

    // Filter by required tag if biome has one
    let eligibleSpecies = allSpecies;
    if (biome.requiredTag) {
      eligibleSpecies = allSpecies.filter(species =>
        species.tags && species.tags.includes(biome.requiredTag!)
      );
    }

    // Filter by biome (creatures should have biome_id matching)
    eligibleSpecies = eligibleSpecies.filter(species => species.biomeId === biomeId);

    if (eligibleSpecies.length === 0) {
      throw new Error(`No eligible creatures found in biome ${biomeId}`);
    }

    // Pick a random species
    const species = eligibleSpecies[Math.floor(Math.random() * eligibleSpecies.length)];

    // Wild creature level = player level ± 1 (min 1, max 10)
    const levelVariance = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
    const wildLevel = Math.max(1, Math.min(10, playerLevel + levelVariance));

    return {
      speciesId: species.id,
      speciesName: species.name,
      level: wildLevel,
    };
  }

  /**
   * Use a run to trigger an event in a biome
   * @param userId - The user ID
   * @param biomeId - The biome to explore
   * @param date - The date string (YYYY-MM-DD)
   * @returns Event result or error
   */
  async useRun(userId: number, biomeId: number, date: string): Promise<UseRunResult> {
    // 1. Check if user has runs available
    const progress = await this.storage.getDailyProgress(userId, date);

    if (!progress) {
      return {
        success: false,
        error: 'No daily progress found',
      };
    }

    if (progress.runsUsed >= progress.runsAvailable) {
      return {
        success: false,
        error: 'No runs available. Complete more habits to unlock runs!',
      };
    }

    // 2. Check if biome is unlocked
    const biome = await this.storage.getBiomeById(biomeId);

    if (!biome) {
      return {
        success: false,
        error: 'Biome not found',
      };
    }

    const playerStats = await this.storage.getPlayerStats(userId);

    if (playerStats.level < biome.unlockPlayerLevel) {
      return {
        success: false,
        error: `Biome requires player level ${biome.unlockPlayerLevel}`,
      };
    }

    // 3. Check party size requirements
    const party = await this.storage.getParty(userId);

    if (party.length < biome.minPartySize) {
      return {
        success: false,
        error: `This biome requires at least ${biome.minPartySize} creatures in your party`,
      };
    }

    // 4. Roll for event type
    const eventType = this.rollEventType(biome.lootWeight, biome.encounterWeight);

    let eventResult: EventResult;

    if (eventType === 'loot') {
      const loot = await this.rollLoot(biomeId, playerStats.level);
      eventResult = {
        eventType: 'loot',
        loot,
      };

      // Add loot to inventory
      await this.storage.addItemToInventory(userId, loot.itemId, loot.quantity);

    } else {
      const encounter = await this.rollEncounter(biomeId, playerStats.level);
      eventResult = {
        eventType: 'encounter',
        encounter,
      };

      // Note: Combat will be handled by combat engine
      // For now, just record the encounter
      await this.storage.createEncounter({
        userId,
        biomeId,
        eventType: 'combat',
        creatureSpeciesId: encounter.speciesId,
        creatureLevel: encounter.level,
        result: 'pending',
        rewardXp: 0,
        timestamp: new Date(),
      });
    }

    // 5. Increment runs used
    await this.storage.updateDailyProgress(userId, date, {
      runsUsed: progress.runsUsed + 1,
    });

    return {
      success: true,
      event: eventResult,
    };
  }

  /**
   * Get available runs for today
   * @param userId - The user ID
   * @param date - The date string (YYYY-MM-DD)
   */
  async getAvailableRuns(userId: number, date: string): Promise<{ available: number; used: number; remaining: number }> {
    const progress = await this.storage.getDailyProgress(userId, date);

    if (!progress) {
      return {
        available: 0,
        used: 0,
        remaining: 0,
      };
    }

    return {
      available: progress.runsAvailable,
      used: progress.runsUsed,
      remaining: progress.runsAvailable - progress.runsUsed,
    };
  }
}

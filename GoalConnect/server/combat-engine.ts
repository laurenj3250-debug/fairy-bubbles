import { IStorage } from './storage';
import type { UserCreature, CreatureSpecies, Item } from '@shared/schema';

/**
 * Turn-based D&D Combat Engine
 * Handles all combat logic including d20 rolls, damage, skills, and capture
 */

export interface CombatState {
  encounterId: number;
  playerParty: Array<UserCreature & { species: CreatureSpecies }>;
  wildCreature: {
    speciesId: number;
    species: CreatureSpecies;
    level: number;
    currentHp: number;
    maxHp: number;
    ac: number; // Armor Class = 10 + DEX mod
    str: number;
    dex: number;
    wis: number;
  };
  turn: number;
  phase: 'player' | 'enemy';
  status: 'ongoing' | 'victory' | 'defeat' | 'captured' | 'fled';
}

export type CombatAction =
  | { type: 'attack'; creatureId: number }
  | { type: 'skill'; creatureId: number; skillName: string }
  | { type: 'item'; itemId: number; targetCreatureId?: number }
  | { type: 'defend'; creatureId: number }
  | { type: 'capture'; itemId: number };

export interface CombatResult {
  success: boolean;
  state: CombatState;
  log: string[];
  rewards?: {
    xp: number;
    capturedCreature?: {
      speciesId: number;
      level: number;
    };
  };
}

export class CombatEngine {
  constructor(private storage: IStorage) {}

  /**
   * Roll a d20
   */
  private d20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Roll a die (dN)
   */
  private rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Calculate ability modifier from ability score
   * D&D formula: (score - 10) / 2, rounded down
   */
  private abilityMod(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Calculate AC (Armor Class) for a creature
   * AC = 10 + DEX modifier + any equipment bonuses
   */
  private calculateAC(creature: UserCreature & { species: CreatureSpecies }, equippedItem?: Item): number {
    const dexMod = this.abilityMod(creature.dex);
    let equipmentBonus = 0;

    if (equippedItem?.effect === 'boost_defense') {
      equipmentBonus = equippedItem.effectValue || 0;
    }

    return 10 + dexMod + equipmentBonus;
  }

  /**
   * Calculate max HP for a creature
   * HP = (level * 5) + (level * CON mod)
   * Using WIS as proxy for CON since we don't have CON stat
   */
  private calculateMaxHP(level: number, wis: number): number {
    const wisMod = this.abilityMod(wis);
    return (level * 5) + (level * Math.max(0, wisMod));
  }

  /**
   * Initialize combat with a wild creature
   */
  async initializeCombat(userId: number, encounterId: number): Promise<CombatState> {
    // Get encounter details
    const encounter = await this.storage.getEncounter(encounterId);
    if (!encounter || encounter.userId !== userId) {
      throw new Error('Encounter not found');
    }

    // Get player party
    const party = await this.storage.getParty(userId);
    if (party.length === 0) {
      throw new Error('No creatures in party');
    }

    // Get party with species data
    const partyWithSpecies = await Promise.all(
      party.map(async (creature) => {
        const species = await this.storage.getCreatureSpeciesById(creature.speciesId);
        if (!species) {
          throw new Error(`Species ${creature.speciesId} not found`);
        }
        return { ...creature, species };
      })
    );

    // Get wild creature species
    const wildSpecies = await this.storage.getCreatureSpeciesById(encounter.creatureSpeciesId);
    if (!wildSpecies) {
      throw new Error(`Wild species ${encounter.creatureSpeciesId} not found`);
    }

    // Initialize wild creature stats
    const wildLevel = encounter.creatureLevel;
    const wildMaxHP = this.calculateMaxHP(wildLevel, wildSpecies.baseWis);

    const wildCreature = {
      speciesId: wildSpecies.id,
      species: wildSpecies,
      level: wildLevel,
      currentHp: wildMaxHP,
      maxHp: wildMaxHP,
      ac: 10 + this.abilityMod(wildSpecies.baseDex),
      str: wildSpecies.baseStr,
      dex: wildSpecies.baseDex,
      wis: wildSpecies.baseWis,
    };

    return {
      encounterId,
      playerParty: partyWithSpecies,
      wildCreature,
      turn: 1,
      phase: 'player',
      status: 'ongoing',
    };
  }

  /**
   * Execute a combat action
   */
  async executeAction(
    userId: number,
    state: CombatState,
    action: CombatAction
  ): Promise<CombatResult> {
    const log: string[] = [];

    if (state.status !== 'ongoing') {
      return {
        success: false,
        state,
        log: ['Combat is already over'],
      };
    }

    // Handle player actions
    if (state.phase === 'player') {
      switch (action.type) {
        case 'attack':
          await this.handleAttack(userId, state, action.creatureId, log);
          break;
        case 'skill':
          await this.handleSkill(userId, state, action.creatureId, action.skillName, log);
          break;
        case 'item':
          await this.handleItem(userId, state, action.itemId, action.targetCreatureId, log);
          break;
        case 'defend':
          await this.handleDefend(state, action.creatureId, log);
          break;
        case 'capture':
          await this.handleCapture(userId, state, action.itemId, log);
          break;
      }

      // Check if wild creature is defeated
      if (state.wildCreature.currentHp <= 0) {
        state.status = 'victory';
        const rewards = await this.calculateRewards(state);
        await this.applyRewards(userId, rewards);

        // Update encounter record
        await this.storage.updateEncounter(state.encounterId, {
          result: 'victory',
          rewardXp: rewards.xp,
        });

        return {
          success: true,
          state,
          log,
          rewards,
        };
      }

      // Switch to enemy phase
      state.phase = 'enemy';
    }

    // Handle enemy turn
    if (state.phase === 'enemy') {
      await this.handleEnemyTurn(state, log);

      // Check if all party creatures are defeated
      const aliveParty = state.playerParty.filter(c => c.currentHp > 0);
      if (aliveParty.length === 0) {
        state.status = 'defeat';

        // Update encounter record
        await this.storage.updateEncounter(state.encounterId, {
          result: 'defeat',
          rewardXp: 0,
        });

        return {
          success: true,
          state,
          log,
        };
      }

      // Next turn
      state.turn += 1;
      state.phase = 'player';
    }

    // Save combat log to database
    for (const entry of log) {
      await this.storage.createCombatLog({
        encounterId: state.encounterId,
        turn: state.turn,
        action: entry,
        timestamp: new Date(),
      });
    }

    return {
      success: true,
      state,
      log,
    };
  }

  /**
   * Handle attack action
   */
  private async handleAttack(
    userId: number,
    state: CombatState,
    creatureId: number,
    log: string[]
  ): Promise<void> {
    const attacker = state.playerParty.find(c => c.id === creatureId);
    if (!attacker || attacker.currentHp <= 0) {
      log.push('Invalid attacker');
      return;
    }

    // Get equipped item for bonuses
    const equipped = await this.storage.getEquippedItem(creatureId);

    // Attack roll: d20 + STR mod
    const attackRoll = this.d20();
    const strMod = this.abilityMod(attacker.str);
    let attackBonus = 0;

    if (equipped?.item.effect === 'boost_attack') {
      attackBonus = equipped.item.effectValue || 0;
    }

    const totalAttack = attackRoll + strMod + attackBonus;

    log.push(`${attacker.species.name} attacks! (d20: ${attackRoll} + ${strMod + attackBonus} = ${totalAttack})`);

    // Check if attack hits
    if (totalAttack >= state.wildCreature.ac) {
      // Damage roll: 1d6 + STR mod
      const damageRoll = this.rollDie(6);
      const damage = damageRoll + strMod;

      state.wildCreature.currentHp = Math.max(0, state.wildCreature.currentHp - damage);

      log.push(`Hit! Dealt ${damage} damage (1d6: ${damageRoll} + ${strMod})`);
      log.push(`${state.wildCreature.species.name} HP: ${state.wildCreature.currentHp}/${state.wildCreature.maxHp}`);

      if (attackRoll === 20) {
        log.push('CRITICAL HIT!');
      }
    } else {
      log.push(`Miss! (AC ${state.wildCreature.ac})`);
      if (attackRoll === 1) {
        log.push('CRITICAL MISS!');
      }
    }
  }

  /**
   * Handle skill action (placeholder for now)
   */
  private async handleSkill(
    userId: number,
    state: CombatState,
    creatureId: number,
    skillName: string,
    log: string[]
  ): Promise<void> {
    const caster = state.playerParty.find(c => c.id === creatureId);
    if (!caster || caster.currentHp <= 0) {
      log.push('Invalid caster');
      return;
    }

    // TODO: Implement skills system
    log.push(`${caster.species.name} used ${skillName} (skills not yet implemented)`);
  }

  /**
   * Handle item usage
   */
  private async handleItem(
    userId: number,
    state: CombatState,
    itemId: number,
    targetCreatureId: number | undefined,
    log: string[]
  ): Promise<void> {
    const item = await this.storage.getItem(itemId);
    if (!item) {
      log.push('Item not found');
      return;
    }

    // Check inventory
    const inventory = await this.storage.getUserInventory(userId);
    const inventoryItem = inventory.find(i => i.itemId === itemId);

    if (!inventoryItem || inventoryItem.quantity <= 0) {
      log.push('Item not in inventory');
      return;
    }

    // Use item
    if (item.type === 'consumable' && item.effect === 'heal') {
      const target = state.playerParty.find(c => c.id === targetCreatureId);
      if (!target) {
        log.push('Invalid target');
        return;
      }

      const healAmount = item.effectValue || 20;
      const oldHp = target.currentHp;
      target.currentHp = Math.min(target.hp, target.currentHp + healAmount);

      log.push(`Used ${item.name} on ${target.species.name}`);
      log.push(`Healed ${target.currentHp - oldHp} HP (${oldHp} → ${target.currentHp})`);

      // Remove from inventory
      await this.storage.removeItemFromInventory(userId, itemId, 1);
    }
  }

  /**
   * Handle defend action
   */
  private async handleDefend(state: CombatState, creatureId: number, log: string[]): Promise<void> {
    const defender = state.playerParty.find(c => c.id === creatureId);
    if (!defender || defender.currentHp <= 0) {
      log.push('Invalid defender');
      return;
    }

    log.push(`${defender.species.name} takes a defensive stance`);
    // TODO: Implement defense buff (reduce damage next turn)
  }

  /**
   * Handle capture attempt
   */
  private async handleCapture(
    userId: number,
    state: CombatState,
    itemId: number,
    log: string[]
  ): Promise<void> {
    const item = await this.storage.getItem(itemId);
    if (!item || item.type !== 'capture') {
      log.push('Invalid capture item');
      return;
    }

    // Check inventory
    const inventory = await this.storage.getUserInventory(userId);
    const inventoryItem = inventory.find(i => i.itemId === itemId);

    if (!inventoryItem || inventoryItem.quantity <= 0) {
      log.push('Capture item not in inventory');
      return;
    }

    // Calculate capture chance
    // Base: 50%, +10% per rarity tier, modified by HP percentage
    const hpPercent = state.wildCreature.currentHp / state.wildCreature.maxHp;
    let baseChance = 50;

    if (item.rarity === 'uncommon') baseChance += 10;
    if (item.rarity === 'rare') baseChance += 20;
    if (item.rarity === 'epic') baseChance += 30;

    // Lower HP = higher capture chance
    const captureChance = baseChance * (1 - (hpPercent * 0.5));

    const roll = Math.random() * 100;

    log.push(`Used ${item.name}! (${Math.floor(captureChance)}% chance)`);

    if (roll < captureChance) {
      // Success!
      log.push('Capture successful!');
      state.status = 'captured';

      // Add creature to collection
      await this.storage.createUserCreature({
        userId,
        speciesId: state.wildCreature.speciesId,
        level: state.wildCreature.level,
        experience: 0,
        hp: state.wildCreature.maxHp,
        currentHp: state.wildCreature.currentHp,
        str: state.wildCreature.str,
        dex: state.wildCreature.dex,
        wis: state.wildCreature.wis,
        isInParty: false,
        partyPosition: null,
      });

      // Update encounter
      await this.storage.updateEncounter(state.encounterId, {
        result: 'captured',
        rewardXp: Math.floor(state.wildCreature.level * 5),
      });

      // Remove capture item
      await this.storage.removeItemFromInventory(userId, itemId, 1);
    } else {
      log.push('Capture failed!');

      // Remove capture item anyway
      await this.storage.removeItemFromInventory(userId, itemId, 1);
    }
  }

  /**
   * Handle enemy turn
   */
  private async handleEnemyTurn(state: CombatState, log: string[]): Promise<void> {
    // Pick random alive party member to attack
    const aliveParty = state.playerParty.filter(c => c.currentHp > 0);
    if (aliveParty.length === 0) return;

    const target = aliveParty[Math.floor(Math.random() * aliveParty.length)];

    // Enemy attack roll
    const attackRoll = this.d20();
    const strMod = this.abilityMod(state.wildCreature.str);
    const totalAttack = attackRoll + strMod;

    // Get target AC
    const equipped = await this.storage.getEquippedItem(target.id);
    const targetAC = this.calculateAC(target, equipped?.item);

    log.push(`${state.wildCreature.species.name} attacks ${target.species.name}! (d20: ${attackRoll} + ${strMod} = ${totalAttack})`);

    if (totalAttack >= targetAC) {
      const damageRoll = this.rollDie(6);
      const damage = damageRoll + strMod;

      target.currentHp = Math.max(0, target.currentHp - damage);

      log.push(`Hit! Dealt ${damage} damage (1d6: ${damageRoll} + ${strMod})`);
      log.push(`${target.species.name} HP: ${target.currentHp}/${target.hp}`);

      if (attackRoll === 20) {
        log.push('CRITICAL HIT!');
      }
    } else {
      log.push(`Miss! (AC ${targetAC})`);
      if (attackRoll === 1) {
        log.push('CRITICAL MISS!');
      }
    }
  }

  /**
   * Calculate rewards for victory
   */
  private async calculateRewards(state: CombatState): Promise<{ xp: number }> {
    // XP = wild creature level * 10
    const xp = state.wildCreature.level * 10;

    return { xp };
  }

  /**
   * Apply rewards to player
   */
  private async applyRewards(userId: number, rewards: { xp: number }): Promise<void> {
    // Award XP
    await this.storage.addExperience(userId, rewards.xp);
  }
}

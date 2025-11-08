import { getDb } from './db';
import { sql } from 'drizzle-orm';

/**
 * Seed the database with sample game data for testing
 * Creates a starter biome with creatures and items
 */
export async function seedGameData() {
  console.log('[seed] 🌱 Starting game data seeding...');

  try {
    const db = getDb();

    // Check if we already have data
    const biomesCheck = await db.execute(sql`SELECT COUNT(*) as count FROM biomes`);
    const existingBiomes = parseInt(biomesCheck.rows[0]?.count || '0');

    if (existingBiomes > 0) {
      console.log('[seed] ℹ️  Game data already exists, skipping seed');
      return { success: true, skipped: true };
    }

    console.log('[seed] Creating starter biome...');

    // Create Enchanted Forest biome
    await db.execute(sql`
      INSERT INTO biomes (name, description, unlock_player_level, loot_weight, encounter_weight, min_party_size, background_sprite)
      VALUES (
        'Enchanted Forest',
        'A mystical forest filled with magical creatures and mysterious treasures. Perfect for beginning your adventure!',
        1,
        70,
        30,
        0,
        NULL
      )
    `);

    const biomeResult = await db.execute(sql`SELECT id FROM biomes WHERE name = 'Enchanted Forest'`);
    const biomeId = biomeResult.rows[0]?.id;

    console.log('[seed] ✅ Created Enchanted Forest biome (ID: ' + biomeId + ')');

    // Create some starter creatures
    console.log('[seed] Creating starter creatures...');

    const creatures = [
      {
        name: 'Forest Sprite',
        description: 'A tiny, mischievous sprite that flits between the trees. Loves pranks and shiny objects.',
        baseHp: 6,
        baseStr: 1,
        baseDex: 3,
        baseWis: 2,
        tag: 'fairy',
        rarity: 'common',
        captureDc: 8,
        skill1Name: 'Sparkle Dust',
        skill1Effect: '+2 DEX for 2 turns',
        skill2Name: 'Giggle Charm',
        skill2Effect: 'Confuse enemy (50% miss chance)',
      },
      {
        name: 'Moss Golem',
        description: 'A gentle giant made of moss and stone. Slow but incredibly sturdy.',
        baseHp: 12,
        baseStr: 3,
        baseDex: 1,
        baseWis: 1,
        tag: 'earth',
        rarity: 'common',
        captureDc: 10,
        skill1Name: 'Stone Shield',
        skill1Effect: 'Reduce incoming damage by 2',
        skill2Name: 'Moss Regeneration',
        skill2Effect: 'Heal 2 HP per turn',
      },
      {
        name: 'Twilight Fox',
        description: 'A cunning fox with fur that shimmers like twilight. Known for its speed and wisdom.',
        baseHp: 8,
        baseStr: 2,
        baseDex: 3,
        baseWis: 3,
        tag: 'beast',
        rarity: 'uncommon',
        captureDc: 12,
        skill1Name: 'Twilight Rush',
        skill1Effect: 'Attack twice in one turn',
        skill2Name: 'Mystic Insight',
        skill2Effect: '+2 WIS, reveal enemy stats',
      },
      {
        name: 'Crystal Butterfly',
        description: 'A rare butterfly with crystalline wings that refract light into rainbows.',
        baseHp: 5,
        baseStr: 1,
        baseDex: 4,
        baseWis: 3,
        tag: 'fairy',
        rarity: 'rare',
        captureDc: 15,
        skill1Name: 'Prism Flash',
        skill1Effect: 'Blind enemy for 1 turn',
        skill2Name: 'Rainbow Barrier',
        skill2Effect: 'Reflect 50% damage back to attacker',
      },
    ];

    for (const creature of creatures) {
      await db.execute(sql`
        INSERT INTO creature_species (
          name, description, base_hp, base_str, base_dex, base_wis,
          tag, rarity, capture_dc,
          skill_1_name, skill_1_effect, skill_2_name, skill_2_effect,
          biome_id, sprite_url
        ) VALUES (
          ${creature.name},
          ${creature.description},
          ${creature.baseHp},
          ${creature.baseStr},
          ${creature.baseDex},
          ${creature.baseWis},
          ${creature.tag},
          ${creature.rarity},
          ${creature.captureDc},
          ${creature.skill1Name},
          ${creature.skill1Effect},
          ${creature.skill2Name},
          ${creature.skill2Effect},
          ${biomeId},
          NULL
        )
      `);
      console.log(`[seed] ✅ Created creature: ${creature.name}`);
    }

    // Create some starter items
    console.log('[seed] Creating starter items...');

    const items = [
      {
        name: 'Capture Net',
        description: 'A magical net that makes capturing creatures easier.',
        type: 'net',
        rarity: 'common',
        effectType: 'capture_bonus',
        effectValue: 3,
        effectStat: null,
        consumable: true,
        equippable: false,
      },
      {
        name: 'Forest Berry Snack',
        description: 'Sweet berries that restore health to your creatures.',
        type: 'snack',
        rarity: 'common',
        effectType: 'heal',
        effectValue: 5,
        effectStat: 'hp',
        consumable: true,
        equippable: false,
      },
      {
        name: 'Friendship Charm',
        description: 'A charm that makes wild creatures more friendly.',
        type: 'charm',
        rarity: 'uncommon',
        effectType: 'capture_bonus',
        effectValue: 5,
        effectStat: null,
        consumable: true,
        equippable: false,
      },
      {
        name: 'Moonlight Cloak',
        description: 'A shimmering cloak that increases wisdom.',
        type: 'cloak',
        rarity: 'uncommon',
        effectType: 'stat_boost',
        effectValue: 2,
        effectStat: 'wis',
        consumable: false,
        equippable: true,
      },
      {
        name: 'Strength Brace',
        description: 'A sturdy brace that enhances physical power.',
        type: 'brace',
        rarity: 'rare',
        effectType: 'stat_boost',
        effectValue: 3,
        effectStat: 'str',
        consumable: false,
        equippable: true,
      },
    ];

    for (const item of items) {
      await db.execute(sql`
        INSERT INTO items (
          name, description, type, rarity,
          effect_type, effect_value, effect_stat,
          consumable, equippable, sprite_url
        ) VALUES (
          ${item.name},
          ${item.description},
          ${item.type},
          ${item.rarity},
          ${item.effectType},
          ${item.effectValue},
          ${item.effectStat},
          ${item.consumable},
          ${item.equippable},
          NULL
        )
      `);
      console.log(`[seed] ✅ Created item: ${item.name}`);
    }

    console.log('[seed] ✅ Game data seeded successfully!');
    console.log('[seed] 📊 Summary:');
    console.log('[seed]    - 1 biome (Enchanted Forest)');
    console.log('[seed]    - 4 creature species');
    console.log('[seed]    - 5 items');
    console.log('[seed] 💡 You can now assign sprites to these entries in the Game Admin!');

    return { success: true, skipped: false };
  } catch (error) {
    console.error('[seed] ❌ Seed failed:', error);
    throw error;
  }
}

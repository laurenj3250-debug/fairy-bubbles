-- Migration: Rebuild D&D-Flavored Creature Collector RPG
-- Replace Phase 1 simple system with full RPG mechanics
-- Date: 2025-11-08

-- Drop old creature tables
DROP TABLE IF EXISTS creature_evolutions CASCADE;
DROP TABLE IF EXISTS creatures CASCADE;
DROP TABLE IF EXISTS creature_species CASCADE;

-- ========== BIOMES (Worlds) ==========
CREATE TABLE IF NOT EXISTS biomes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  unlock_player_level INTEGER NOT NULL DEFAULT 1,

  -- Event weights (percentages)
  loot_weight INTEGER NOT NULL DEFAULT 70, -- % chance of loot event
  encounter_weight INTEGER NOT NULL DEFAULT 30, -- % chance of encounter event

  -- Party gates
  min_party_size INTEGER NOT NULL DEFAULT 0,
  required_tag TEXT, -- e.g., "Water", "Fire" (null = no requirement)
  required_stat_sum INTEGER DEFAULT 0, -- e.g., total DEX >= 3
  required_stat_type VARCHAR(10), -- "STR", "DEX", "WIS"

  -- Visual
  background_sprite TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== CREATURE SPECIES (Collectible creatures) ==========
CREATE TABLE IF NOT EXISTS creature_species (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,

  -- Stats (D&D style: STR, DEX, WIS)
  base_hp INTEGER NOT NULL DEFAULT 8,
  base_str INTEGER NOT NULL DEFAULT 1, -- Strength (bash attacks)
  base_dex INTEGER NOT NULL DEFAULT 1, -- Dexterity (evasion, feint)
  base_wis INTEGER NOT NULL DEFAULT 1, -- Wisdom (soothe, capture)

  -- Tags & rarity
  tag VARCHAR(20) NOT NULL, -- "Water", "Fire", "Grass", "Mystic", "Beast", etc.
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic')),
  capture_dc INTEGER NOT NULL DEFAULT 10, -- d20 + WIS must beat this

  -- Skills (creatures have 1-2 skills)
  skill_1_name TEXT,
  skill_1_effect TEXT, -- e.g., "Bash: 2 dmg, 20% stun"
  skill_2_name TEXT,
  skill_2_effect TEXT,

  -- Biome availability
  biome_id INTEGER REFERENCES biomes(id),

  -- Visual
  sprite_url TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== USER CREATURES (Party/Collection) ==========
CREATE TABLE IF NOT EXISTS user_creatures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_id INTEGER NOT NULL REFERENCES creature_species(id),

  -- Identity
  nickname TEXT,

  -- Stats (can grow slightly with evolution/items)
  current_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  str INTEGER NOT NULL,
  dex INTEGER NOT NULL,
  wis INTEGER NOT NULL,

  -- Party status
  in_party BOOLEAN NOT NULL DEFAULT false,
  party_position INTEGER, -- 1-4 (party size grows with player level)

  -- Evolution/skins (duplicates → shards → alt forms)
  evolution_stage INTEGER NOT NULL DEFAULT 1, -- 1 = base, 2 = evolved skin

  discovered_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== ITEMS (Loot system) ==========
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,

  -- Item type
  type VARCHAR(20) NOT NULL CHECK (type IN ('net', 'charm', 'snack', 'gear', 'cloak', 'brace')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare')),

  -- Effects
  effect_type VARCHAR(20), -- "capture_bonus", "stat_boost", "heal", "dr_boost", "evolve"
  effect_value INTEGER, -- +2 capture, +1 STR, heal 2 HP, etc.
  effect_stat VARCHAR(10), -- "STR", "DEX", "WIS" for stat boosts

  -- Usage
  consumable BOOLEAN NOT NULL DEFAULT true,
  equippable BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== USER INVENTORY ==========
CREATE TABLE IF NOT EXISTS user_inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  quantity INTEGER NOT NULL DEFAULT 1,

  UNIQUE(user_id, item_id)
);

-- ========== EQUIPPED ITEMS ==========
CREATE TABLE IF NOT EXISTS equipped_items (
  id SERIAL PRIMARY KEY,
  user_creature_id INTEGER NOT NULL REFERENCES user_creatures(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),

  UNIQUE(user_creature_id) -- Each creature can equip 1 item
);

-- ========== SHARDS (Duplicate tracking) ==========
CREATE TABLE IF NOT EXISTS shards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species_id INTEGER NOT NULL REFERENCES creature_species(id),
  amount INTEGER NOT NULL DEFAULT 0,

  UNIQUE(user_id, species_id)
);

-- ========== DAILY PROGRESS (Threshold & Runs) ==========
CREATE TABLE IF NOT EXISTS daily_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date VARCHAR(10) NOT NULL, -- YYYY-MM-DD

  -- Threshold tracking
  habit_points_earned INTEGER NOT NULL DEFAULT 0, -- S=1, M=2, L=3
  threshold_1_reached BOOLEAN NOT NULL DEFAULT false, -- 6 pts → unlock Outside World
  threshold_2_reached BOOLEAN NOT NULL DEFAULT false, -- 9 pts → +5% loot
  threshold_3_reached BOOLEAN NOT NULL DEFAULT false, -- 12 pts → +10% loot

  -- Runs (1-3 per day when unlocked)
  runs_available INTEGER NOT NULL DEFAULT 0,
  runs_used INTEGER NOT NULL DEFAULT 0,

  UNIQUE(user_id, date)
);

-- ========== ENCOUNTERS (Event history) ==========
CREATE TABLE IF NOT EXISTS encounters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  biome_id INTEGER NOT NULL REFERENCES biomes(id),
  species_id INTEGER REFERENCES creature_species(id),

  -- Outcome
  event_type VARCHAR(10) NOT NULL CHECK (event_type IN ('loot', 'encounter')),
  combat_won BOOLEAN, -- null if loot event
  captured BOOLEAN, -- null if loot event or lost combat
  shards_earned INTEGER NOT NULL DEFAULT 0,

  -- Loot received (if loot event)
  loot_item_id INTEGER REFERENCES items(id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== COMBAT LOGS (Battle detail) ==========
CREATE TABLE IF NOT EXISTS combat_logs (
  id SERIAL PRIMARY KEY,
  encounter_id INTEGER NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,

  -- Combat state
  party_creatures INTEGER[], -- Array of user_creature IDs used
  enemy_species_id INTEGER NOT NULL REFERENCES creature_species(id),
  enemy_hp INTEGER NOT NULL,

  -- Turn log (JSON array of actions)
  turn_log TEXT NOT NULL DEFAULT '[]', -- JSON: [{round: 1, action: "Attack", dmg: 2, ...}]

  -- Result
  rounds_fought INTEGER NOT NULL,
  victory BOOLEAN NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ========== PLAYER STATS (Level, XP) ==========
CREATE TABLE IF NOT EXISTS player_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

  -- Progression
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 10),
  experience INTEGER NOT NULL DEFAULT 0, -- 1 XP per habit point

  -- Party
  max_party_size INTEGER NOT NULL DEFAULT 1 -- Grows with level: 1→2→3→4
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_creatures_user_id ON user_creatures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_creatures_party ON user_creatures(user_id, in_party);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date ON daily_progress(user_id, date);
CREATE INDEX IF NOT EXISTS idx_encounters_user_id ON encounters(user_id);
CREATE INDEX IF NOT EXISTS idx_shards_user_species ON shards(user_id, species_id);

-- ========== SEED DATA ==========

-- Seed Biomes
INSERT INTO biomes (name, description, unlock_player_level, loot_weight, encounter_weight, min_party_size, required_tag, background_sprite) VALUES
  ('Garden Glade', 'A peaceful meadow where beginners find their footing', 1, 70, 30, 0, NULL, '/sprites/biome_garden.png'),
  ('Moonlit River', 'A mystical waterway flowing with moon-blessed currents', 3, 60, 40, 2, 'Water', '/sprites/biome_river.png'),
  ('Ember Orchard', 'An ancient grove where fruit trees burn with eternal flame', 5, 55, 45, 3, 'Fire', '/sprites/biome_ember.png'),
  ('Zephyr Dunes', 'Windswept sands hide swift and cunning creatures', 7, 50, 50, 3, NULL, '/sprites/biome_dunes.png'),
  ('Clockwork Garden', 'A mechanical paradise where time itself bends to habit', 9, 40, 60, 4, 'Mystic', '/sprites/biome_clockwork.png');

-- Seed Items (Loot table)
INSERT INTO items (name, description, type, rarity, effect_type, effect_value, consumable, equippable) VALUES
  -- Common loot
  ('Snack', 'Restores 2 HP to a creature', 'snack', 'common', 'heal', 2, true, false),
  ('Basic Net', 'Increases capture chance by 2', 'net', 'common', 'capture_bonus', 2, true, false),
  ('Wisdom Charm', 'Grants +1 WIS while equipped', 'charm', 'common', 'stat_boost', 1, false, true),
  ('Guard Brace', 'Grants +1 damage reduction for one round', 'brace', 'common', 'dr_boost', 1, true, false),

  -- Uncommon loot
  ('Dexterity Charm', 'Grants +1 DEX while equipped', 'charm', 'uncommon', 'stat_boost', 1, false, true),
  ('Evasion Cloak', 'Grants +10% dodge chance', 'cloak', 'uncommon', 'dodge', 10, false, true),

  -- Rare loot
  ('Rare Net', 'Increases capture chance by 4', 'net', 'rare', 'capture_bonus', 4, true, false),
  ('Evolution Gear', 'Used with 5 shards to unlock alt skin', 'gear', 'rare', 'evolve', 0, true, false);

-- Seed Creature Species
INSERT INTO creature_species (name, description, base_hp, base_str, base_dex, base_wis, tag, rarity, capture_dc, skill_1_name, skill_1_effect, biome_id, sprite_url) VALUES
  -- Garden Glade creatures
  ('Mossbun', 'A fluffy moss-covered rabbit', 8, 1, 2, 1, 'Beast', 'common', 10, 'Nibble', '1 dmg, heals self 1 HP', 1, '/sprites/mossbun.png'),
  ('Teafox', 'A fox that smells of chamomile', 7, 2, 2, 1, 'Beast', 'common', 10, 'Pounce', '2 dmg', 1, '/sprites/teafox.png'),
  ('Glowmoth', 'A moth with bioluminescent wings', 6, 1, 3, 2, 'Mystic', 'uncommon', 12, 'Dazzle', '-1 enemy hit chance next round', 1, '/sprites/glowmoth.png'),

  -- Moonlit River creatures
  ('Pondskipper', 'A water-walking lizard', 7, 1, 3, 1, 'Water', 'common', 10, 'Splash', '1 dmg, 20% confuse', 2, '/sprites/pondskipper.png'),
  ('Lunafish', 'A fish that swims through air at night', 9, 1, 1, 3, 'Water', 'uncommon', 12, 'Soothe', '-2 capture DC this fight', 2, '/sprites/lunafish.png'),

  -- Ember Orchard creatures
  ('Emberspark', 'A small fire sprite', 6, 3, 1, 1, 'Fire', 'uncommon', 12, 'Ember', '2 dmg, 15% burn', 3, '/sprites/emberspark.png'),
  ('Flamefruit Bat', 'A bat that feeds on burning fruit', 8, 2, 2, 1, 'Fire', 'rare', 14, 'Flame Dive', '3 dmg', 3, '/sprites/flamebat.png'),

  -- Rare/Epic across biomes
  ('Wonderphant', 'A porcelain elephant that grants wishes', 12, 2, 1, 4, 'Mystic', 'epic', 16, 'Wish', 'Fully heal party member', 5, '/sprites/wonderphant.png');

-- Comments
COMMENT ON TABLE biomes IS 'Worlds/areas for exploration with unlock gates';
COMMENT ON TABLE user_creatures IS 'Creatures captured and owned by users (party system)';
COMMENT ON TABLE daily_progress IS 'Daily habit threshold tracking and run availability';
COMMENT ON TABLE encounters IS 'History of loot and encounter events';
COMMENT ON TABLE combat_logs IS 'Detailed turn-by-turn combat records';
COMMENT ON TABLE player_stats IS 'Player level and XP (separate from virtual pet)';

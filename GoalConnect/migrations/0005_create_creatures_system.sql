-- Migration: Create Creatures System
-- Phase 1: Basic creature collection tied to habits
-- Date: 2025-11-08

-- Create creature_species table (blueprint for each species)
CREATE TABLE IF NOT EXISTS creature_species (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  element_type VARCHAR(20) NOT NULL CHECK (element_type IN ('fire', 'water', 'grass', 'electric', 'psychic', 'dark', 'fairy', 'normal', 'dragon')),

  -- Base stats (used as foundation for individual creatures)
  base_hp INTEGER NOT NULL DEFAULT 50,
  base_attack INTEGER NOT NULL DEFAULT 50,
  base_defense INTEGER NOT NULL DEFAULT 50,
  base_speed INTEGER NOT NULL DEFAULT 50,

  -- Visual
  sprite_url TEXT,
  rarity VARCHAR(20) NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')),

  -- Evolution data
  evolution_stage INTEGER NOT NULL DEFAULT 1 CHECK (evolution_stage IN (1, 2, 3)),
  evolves_to_id INTEGER REFERENCES creature_species(id),
  evolution_level INTEGER, -- Level required to evolve
  evolution_streak INTEGER, -- Streak days required to evolve

  -- Discovery
  is_starter BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create creatures table (individual creature instances)
CREATE TABLE IF NOT EXISTS creatures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  species_id INTEGER NOT NULL REFERENCES creature_species(id),

  -- Identity
  nickname TEXT,

  -- Progression
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  experience INTEGER NOT NULL DEFAULT 0,

  -- Stats (calculated from base stats + level + IVs later)
  current_hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  defense INTEGER NOT NULL,
  speed INTEGER NOT NULL,

  -- Meta
  total_completions INTEGER NOT NULL DEFAULT 0, -- Total habit completions
  current_streak INTEGER NOT NULL DEFAULT 0, -- Current habit streak
  best_streak INTEGER NOT NULL DEFAULT 0, -- Best streak ever

  -- Discovery
  discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_interaction TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Ensure one creature per habit
  UNIQUE(habit_id)
);

-- Create creature_evolutions table (tracks evolution history)
CREATE TABLE IF NOT EXISTS creature_evolutions (
  id SERIAL PRIMARY KEY,
  creature_id INTEGER NOT NULL REFERENCES creatures(id) ON DELETE CASCADE,
  from_species_id INTEGER NOT NULL REFERENCES creature_species(id),
  to_species_id INTEGER NOT NULL REFERENCES creature_species(id),
  evolved_at TIMESTAMP NOT NULL DEFAULT NOW(),
  trigger_type VARCHAR(20) NOT NULL CHECK (trigger_type IN ('level', 'streak', 'item')),
  notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creatures_user_id ON creatures(user_id);
CREATE INDEX IF NOT EXISTS idx_creatures_habit_id ON creatures(habit_id);
CREATE INDEX IF NOT EXISTS idx_creatures_species_id ON creatures(species_id);
CREATE INDEX IF NOT EXISTS idx_creature_evolutions_creature_id ON creature_evolutions(creature_id);

-- Add comments
COMMENT ON TABLE creature_species IS 'Species definitions for creatures (like Pokédex entries)';
COMMENT ON TABLE creatures IS 'Individual creatures owned by users, linked to habits';
COMMENT ON TABLE creature_evolutions IS 'History of creature evolutions';

-- Insert starter species (one per element type)
INSERT INTO creature_species (name, description, element_type, base_hp, base_attack, base_defense, base_speed, rarity, evolution_stage, is_starter, sprite_url) VALUES
  ('Emberling', 'A small fire sprite born from dedication', 'fire', 45, 55, 40, 50, 'common', 1, true, '/sprites/fire_1.png'),
  ('Droplet', 'A water spirit that flows with persistence', 'water', 50, 45, 50, 45, 'common', 1, true, '/sprites/water_1.png'),
  ('Sproutling', 'A grass creature that grows with patience', 'grass', 55, 40, 55, 40, 'common', 1, true, '/sprites/grass_1.png'),
  ('Sparkbit', 'An electric entity charged by consistency', 'electric', 40, 50, 35, 65, 'common', 1, true, '/sprites/electric_1.png'),
  ('Mindmote', 'A psychic being powered by learning', 'psychic', 50, 45, 45, 50, 'common', 1, true, '/sprites/psychic_1.png'),
  ('Shadowpip', 'A dark creature born from late-night habits', 'dark', 45, 50, 45, 50, 'common', 1, true, '/sprites/dark_1.png'),
  ('Glimmerwing', 'A fairy that emerges from gentle routines', 'fairy', 50, 40, 50, 50, 'common', 1, true, '/sprites/fairy_1.png'),
  ('Normalkin', 'A balanced creature for everyday tasks', 'normal', 60, 45, 45, 40, 'common', 1, true, '/sprites/normal_1.png');

-- Add evolutions for starter creatures (evolve at level 16 and 32, or streak milestones)
INSERT INTO creature_species (name, description, element_type, base_hp, base_attack, base_defense, base_speed, rarity, evolution_stage, sprite_url) VALUES
  -- Fire line
  ('Blazeclaw', 'Evolution of Emberling', 'fire', 65, 75, 55, 70, 'uncommon', 2, '/sprites/fire_2.png'),
  ('Infernotitan', 'Final evolution of fire line', 'fire', 85, 100, 75, 90, 'rare', 3, '/sprites/fire_3.png'),

  -- Water line
  ('Tidecrest', 'Evolution of Droplet', 'water', 75, 60, 70, 65, 'uncommon', 2, '/sprites/water_2.png'),
  ('Oceanguard', 'Final evolution of water line', 'water', 95, 80, 95, 80, 'rare', 3, '/sprites/water_3.png'),

  -- Grass line
  ('Bloomshade', 'Evolution of Sproutling', 'grass', 80, 55, 75, 60, 'uncommon', 2, '/sprites/grass_2.png'),
  ('Verdantlord', 'Final evolution of grass line', 'grass', 100, 75, 100, 75, 'rare', 3, '/sprites/grass_3.png');

-- Link evolutions
UPDATE creature_species SET evolves_to_id = (SELECT id FROM creature_species WHERE name = 'Blazeclaw'), evolution_level = 16, evolution_streak = 7 WHERE name = 'Emberling';
UPDATE creature_species SET evolves_to_id = (SELECT id FROM creature_species WHERE name = 'Infernotitan'), evolution_level = 32, evolution_streak = 30 WHERE name = 'Blazeclaw';

UPDATE creature_species SET evolves_to_id = (SELECT id FROM creature_species WHERE name = 'Tidecrest'), evolution_level = 16, evolution_streak = 7 WHERE name = 'Droplet';
UPDATE creature_species SET evolves_to_id = (SELECT id FROM creature_species WHERE name = 'Oceanguard'), evolution_level = 32, evolution_streak = 30 WHERE name = 'Tidecrest';

UPDATE creature_species SET evolves_to_id = (SELECT id FROM creature_species WHERE name = 'Bloomshade'), evolution_level = 16, evolution_streak = 7 WHERE name = 'Sproutling';
UPDATE creature_species SET evolves_to_id = (SELECT id FROM creature_species WHERE name = 'Verdantlord'), evolution_level = 32, evolution_streak = 30 WHERE name = 'Bloomshade';

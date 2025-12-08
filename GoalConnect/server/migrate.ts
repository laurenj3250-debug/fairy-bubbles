import { getDb } from './db';
import { sql } from 'drizzle-orm';
import { seedMountaineeringData } from './seed-mountaineering-data';
import { log } from './lib/logger';

/**
 * Run database migrations on startup for Railway PostgreSQL
 * Creates tables if they don't exist (preserves existing data)
 */
export async function runMigrations() {
  log.info('[migrate] Starting Railway database migration...');

  try {
    const db = getDb();

    // Add retry logic for Railway's slow startup
    let retries = 10;
    let checkResult;

    while (retries > 0) {
      try {
        // Check if tables already exist
        checkResult = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_name = 'users'
          ) as users_exists
        `);
        log.info('[migrate] ✅ Database connection successful');
        break; // Success, exit retry loop
      } catch (error: any) {
        retries--;
        log.error(`[migrate] Database connection failed:`, error?.message || error);
        if (retries === 0) {
          log.error('[migrate] ❌ Failed to connect to database after all retries');
          throw error;
        }
        log.info(`[migrate] Database not ready, retrying in 3 seconds... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      }
    }

    const tablesExist = checkResult?.rows[0]?.users_exists;

    if (tablesExist) {
      log.info('[migrate] ✅ Tables already exist, checking critical tables...');

      // Always ensure session table exists (critical for authentication)
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS session (
            sid VARCHAR NOT NULL PRIMARY KEY,
            sess JSON NOT NULL,
            expire TIMESTAMP(6) NOT NULL
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)`);
        log.info('[migrate] ✅ Session table verified/created');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to ensure session table:', error);
      }

      // Run incremental migrations
      try {
        // Add difficulty column to habits if it doesn't exist
        await db.execute(sql`
          ALTER TABLE habits
          ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
        `);
        log.info('[migrate] ✅ Difficulty column added/verified in habits table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add difficulty column to habits:', error);
      }

      try {
        // Add Weekly Hub fields to habits if they don't exist
        await db.execute(sql`
          ALTER TABLE habits
          ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'training'
        `);
        await db.execute(sql`
          ALTER TABLE habits
          ADD COLUMN IF NOT EXISTS effort VARCHAR(10) DEFAULT 'medium'
        `);
        await db.execute(sql`
          ALTER TABLE habits
          ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '5.9'
        `);
        await db.execute(sql`
          ALTER TABLE habits
          ADD COLUMN IF NOT EXISTS scheduled_day VARCHAR(10)
        `);
        log.info('[migrate] ✅ Weekly Hub columns (category, effort, grade, scheduled_day) added/verified in habits table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add Weekly Hub columns to habits:', error);
      }

      try {
        // Add difficulty column to goals if it doesn't exist
        await db.execute(sql`
          ALTER TABLE goals
          ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
        `);
        log.info('[migrate] ✅ Difficulty column added/verified in goals table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add difficulty column to goals:', error);
      }

      try {
        // Add difficulty column to todos if it doesn't exist
        await db.execute(sql`
          ALTER TABLE todos
          ADD COLUMN IF NOT EXISTS difficulty VARCHAR(10) NOT NULL DEFAULT 'medium'
        `);
        log.info('[migrate] ✅ Difficulty column added/verified in todos table');

        // Remove old points column from todos if it exists
        await db.execute(sql`ALTER TABLE todos DROP COLUMN IF EXISTS points`);
        log.info('[migrate] ✅ Old points column removed from todos table');

        // Add subtasks column if it doesn't exist
        await db.execute(sql`
          ALTER TABLE todos
          ADD COLUMN IF NOT EXISTS subtasks TEXT NOT NULL DEFAULT '[]'
        `);
        log.info('[migrate] ✅ Subtasks column added/verified in todos table');

        // Remove old description column from todos if it exists
        await db.execute(sql`ALTER TABLE todos DROP COLUMN IF EXISTS description`);
        log.info('[migrate] ✅ Old description column removed from todos table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to migrate todos table:', error);
      }

      try {
        // Add priority column to goals if it doesn't exist
        await db.execute(sql`
          ALTER TABLE goals
          ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium'
        `);
        log.info('[migrate] ✅ Priority column added/verified in goals table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add priority column to goals:', error);
      }

      try {
        // Add evolutionRequired column to costumes if it doesn't exist
        await db.execute(sql`
          ALTER TABLE costumes
          ADD COLUMN IF NOT EXISTS evolution_required VARCHAR(20) NOT NULL DEFAULT 'seed'
        `);
        log.info('[migrate] ✅ Evolution required column added/verified in costumes table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add evolution_required column to costumes:', error);
      }

      try {
        // Create sprites table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS sprites (
            id SERIAL PRIMARY KEY,
            filename TEXT NOT NULL UNIQUE,
            category VARCHAR(30) NOT NULL DEFAULT 'uncategorized',
            name TEXT,
            data TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            rarity VARCHAR(20),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        log.info('[migrate] ✅ Sprites table created/verified');

        // Add rarity column if it doesn't exist (for existing tables)
        await db.execute(sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name='sprites' AND column_name='rarity'
            ) THEN
              ALTER TABLE sprites ADD COLUMN rarity VARCHAR(20);
            END IF;
          END $$;
        `);

        // Update category constraint to include new categories
        await db.execute(sql`
          DO $$
          BEGIN
            ALTER TABLE sprites DROP CONSTRAINT IF EXISTS sprites_category_check;
            ALTER TABLE sprites ADD CONSTRAINT sprites_category_check
              CHECK (category IN ('creature', 'biome', 'biome-background', 'biome-platform', 'biome-obstacle', 'item', 'egg', 'ui', 'uncategorized'));
          EXCEPTION
            WHEN OTHERS THEN NULL;
          END $$;
        `);
        log.info('[migrate] ✅ Sprites table updated with rarity and new categories');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create/update sprites table:', error);
      }

      try {
        // Create dream_scroll_tags table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS dream_scroll_tags (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category VARCHAR(20) NOT NULL CHECK (category IN ('do', 'buy', 'see', 'visit', 'learn', 'experience', 'music')),
            name TEXT NOT NULL,
            color VARCHAR(50) NOT NULL DEFAULT 'bg-gray-500/20 text-gray-300',
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_dream_scroll_tags_user_category ON dream_scroll_tags(user_id, category)`);
        log.info('[migrate] ✅ Dream scroll tags table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create dream_scroll_tags table:', error);
      }

      try {
        // Create dream_scroll_items table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS dream_scroll_items (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            category VARCHAR(20) NOT NULL CHECK (category IN ('do', 'buy', 'see', 'visit', 'learn', 'experience', 'music')),
            priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            cost VARCHAR(10) CHECK (cost IN ('free', '$', '$$', '$$$')),
            tags TEXT,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            completed_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_dream_scroll_user_id ON dream_scroll_items(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_dream_scroll_category ON dream_scroll_items(user_id, category)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_dream_scroll_completed ON dream_scroll_items(user_id, completed)`);
        log.info('[migrate] ✅ Dream scroll table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create dream_scroll_items table:', error);
      }

      try {
        // Add tags column to dream_scroll_items if it doesn't exist
        await db.execute(sql`
          ALTER TABLE dream_scroll_items
          ADD COLUMN IF NOT EXISTS tags TEXT
        `);
        log.info('[migrate] ✅ Tags column added/verified in dream_scroll_items table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add tags column to dream_scroll_items:', error);
      }


      // ========== MOUNTAINEERING EXPEDITION GAME MIGRATIONS ==========

      try {
        // Create world_map_regions table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS world_map_regions (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            continent VARCHAR(50) NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            unlock_level INTEGER NOT NULL DEFAULT 1,
            display_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        log.info('[migrate] ✅ World map regions table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create world_map_regions table:', error);
      }

      try {
        // Create mountains table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS mountains (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            elevation INTEGER NOT NULL,
            country TEXT NOT NULL,
            mountain_range TEXT NOT NULL,
            continent VARCHAR(50) NOT NULL,
            region_id INTEGER REFERENCES world_map_regions(id),
            latitude TEXT NOT NULL,
            longitude TEXT NOT NULL,
            difficulty_tier VARCHAR(20) NOT NULL CHECK (difficulty_tier IN ('novice', 'intermediate', 'advanced', 'expert', 'elite')),
            required_climbing_level INTEGER NOT NULL DEFAULT 1,
            description TEXT NOT NULL DEFAULT '',
            first_ascent_year INTEGER,
            fatality_rate TEXT,
            best_season_start VARCHAR(20),
            best_season_end VARCHAR(20),
            unlock_requirements TEXT NOT NULL DEFAULT '{}',
            image_url TEXT,
            map_position_x INTEGER,
            map_position_y INTEGER,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_mountains_difficulty_tier ON mountains(difficulty_tier)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_mountains_continent ON mountains(continent)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_mountains_region_id ON mountains(region_id)`);
        log.info('[migrate] ✅ Mountains table and indexes created/verified');

        // Add background_image and theme_colors columns if they don't exist
        await db.execute(sql`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name='mountains' AND column_name='background_image'
            ) THEN
              ALTER TABLE mountains ADD COLUMN background_image TEXT;
            END IF;

            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns
              WHERE table_name='mountains' AND column_name='theme_colors'
            ) THEN
              ALTER TABLE mountains ADD COLUMN theme_colors TEXT DEFAULT '{}';
            END IF;
          END $$;
        `);
        log.info('[migrate] ✅ Mountains table updated with background_image and theme_colors columns');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create mountains table:', error);
      }

      try {
        // Create routes table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS routes (
            id SERIAL PRIMARY KEY,
            mountain_id INTEGER NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
            route_name TEXT NOT NULL,
            grading_system VARCHAR(20) NOT NULL,
            grade_value TEXT NOT NULL,
            elevation_gain INTEGER NOT NULL,
            estimated_days INTEGER NOT NULL,
            terrain_types TEXT NOT NULL DEFAULT '[]',
            hazards TEXT NOT NULL DEFAULT '[]',
            requires_oxygen BOOLEAN NOT NULL DEFAULT false,
            requires_fixed_ropes BOOLEAN NOT NULL DEFAULT false,
            requires_technical_climbing BOOLEAN NOT NULL DEFAULT false,
            route_description TEXT NOT NULL DEFAULT '',
            first_ascent_year INTEGER,
            technical_difficulty INTEGER NOT NULL DEFAULT 1,
            physical_difficulty INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_routes_mountain_id ON routes(mountain_id)`);
        log.info('[migrate] ✅ Routes table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create routes table:', error);
      }

      try {
        // Create alpine_gear table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS alpine_gear (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            category VARCHAR(30) NOT NULL CHECK (category IN ('boots', 'crampons', 'rope', 'tent', 'clothing', 'safety', 'oxygen', 'ice_axe', 'harness', 'backpack', 'sleeping_bag', 'stove', 'miscellaneous')),
            description TEXT NOT NULL DEFAULT '',
            weight_grams INTEGER NOT NULL DEFAULT 0,
            tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'intermediate', 'advanced', 'elite')),
            unlock_level INTEGER NOT NULL DEFAULT 1,
            unlock_habit_count INTEGER NOT NULL DEFAULT 0,
            cost INTEGER NOT NULL DEFAULT 0,
            stats TEXT NOT NULL DEFAULT '{}',
            image_url TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_alpine_gear_category ON alpine_gear(category)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_alpine_gear_tier ON alpine_gear(tier)`);
        log.info('[migrate] ✅ Alpine gear table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create alpine_gear table:', error);
      }

      try {
        // Create route_gear_requirements table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS route_gear_requirements (
            id SERIAL PRIMARY KEY,
            route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
            gear_id INTEGER NOT NULL REFERENCES alpine_gear(id) ON DELETE CASCADE,
            is_required BOOLEAN NOT NULL DEFAULT true,
            quantity INTEGER NOT NULL DEFAULT 1,
            notes TEXT
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_route_gear_route_id ON route_gear_requirements(route_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_route_gear_gear_id ON route_gear_requirements(gear_id)`);
        log.info('[migrate] ✅ Route gear requirements table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create route_gear_requirements table:', error);
      }

      try {
        // Create player_gear_inventory table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS player_gear_inventory (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            gear_id INTEGER NOT NULL REFERENCES alpine_gear(id) ON DELETE CASCADE,
            acquired_date TIMESTAMP NOT NULL DEFAULT NOW(),
            times_used INTEGER NOT NULL DEFAULT 0,
            condition INTEGER NOT NULL DEFAULT 100
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_player_gear_user_id ON player_gear_inventory(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_player_gear_gear_id ON player_gear_inventory(gear_id)`);
        log.info('[migrate] ✅ Player gear inventory table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create player_gear_inventory table:', error);
      }

      try {
        // Create player_climbing_stats table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS player_climbing_stats (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            climbing_level INTEGER NOT NULL DEFAULT 1,
            total_experience INTEGER NOT NULL DEFAULT 0,
            summits_reached INTEGER NOT NULL DEFAULT 0,
            total_elevation_climbed INTEGER NOT NULL DEFAULT 0,
            continents_completed TEXT NOT NULL DEFAULT '[]',
            achievements TEXT NOT NULL DEFAULT '[]',
            current_energy INTEGER NOT NULL DEFAULT 100,
            max_energy INTEGER NOT NULL DEFAULT 100,
            training_days_completed INTEGER NOT NULL DEFAULT 0,
            longest_expedition INTEGER NOT NULL DEFAULT 0,
            highest_peak_climbed INTEGER NOT NULL DEFAULT 0,
            last_energy_refresh TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        log.info('[migrate] ✅ Player climbing stats table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create player_climbing_stats table:', error);
      }

      try {
        // Create player_expeditions table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS player_expeditions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            route_id INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL CHECK (status IN ('planning', 'in_progress', 'completed', 'failed', 'abandoned')),
            start_date TIMESTAMP NOT NULL DEFAULT NOW(),
            completion_date TIMESTAMP,
            current_progress INTEGER NOT NULL DEFAULT 0,
            current_altitude INTEGER NOT NULL DEFAULT 0,
            current_day INTEGER NOT NULL DEFAULT 1,
            energy_spent INTEGER NOT NULL DEFAULT 0,
            habits_completed_during INTEGER NOT NULL DEFAULT 0,
            summit_reached BOOLEAN NOT NULL DEFAULT false,
            experience_earned INTEGER NOT NULL DEFAULT 0,
            notes TEXT DEFAULT '',
            weather_condition VARCHAR(20),
            team_morale INTEGER NOT NULL DEFAULT 100,
            acclimatization_level INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_player_expeditions_user_id ON player_expeditions(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_player_expeditions_route_id ON player_expeditions(route_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_player_expeditions_status ON player_expeditions(user_id, status)`);
        log.info('[migrate] ✅ Player expeditions table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create player_expeditions table:', error);
      }

      try {
        // Create expedition_events table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS expedition_events (
            id SERIAL PRIMARY KEY,
            expedition_id INTEGER NOT NULL REFERENCES player_expeditions(id) ON DELETE CASCADE,
            event_type VARCHAR(30) NOT NULL CHECK (event_type IN ('weather_delay', 'storm', 'avalanche', 'crevasse', 'altitude_sickness', 'equipment_failure', 'success', 'rest_day', 'acclimatization', 'team_conflict', 'rescue')),
            event_day INTEGER NOT NULL,
            event_description TEXT NOT NULL,
            energy_cost INTEGER NOT NULL DEFAULT 0,
            progress_impact INTEGER NOT NULL DEFAULT 0,
            morale_impact INTEGER NOT NULL DEFAULT 0,
            player_choice TEXT DEFAULT '{}',
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_expedition_events_expedition_id ON expedition_events(expedition_id)`);
        log.info('[migrate] ✅ Expedition events table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create expedition_events table:', error);
      }

      try {
        // Create expedition_gear_loadout table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS expedition_gear_loadout (
            id SERIAL PRIMARY KEY,
            expedition_id INTEGER NOT NULL REFERENCES player_expeditions(id) ON DELETE CASCADE,
            gear_id INTEGER NOT NULL REFERENCES alpine_gear(id) ON DELETE CASCADE,
            quantity INTEGER NOT NULL DEFAULT 1,
            condition_before INTEGER NOT NULL DEFAULT 100,
            condition_after INTEGER NOT NULL DEFAULT 100
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_expedition_gear_expedition_id ON expedition_gear_loadout(expedition_id)`);
        log.info('[migrate] ✅ Expedition gear loadout table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create expedition_gear_loadout table:', error);
      }

      try {
        // Create mountain_unlocks table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS mountain_unlocks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mountain_id INTEGER NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
            unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
            unlocked_by VARCHAR(50) NOT NULL
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_mountain_unlocks_user_id ON mountain_unlocks(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_mountain_unlocks_mountain_id ON mountain_unlocks(mountain_id)`);
        await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_mountain_unlocks_user_mountain ON mountain_unlocks(user_id, mountain_id)`);
        log.info('[migrate] ✅ Mountain unlocks table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create mountain_unlocks table:', error);
      }

      try {
        // Create mountain_backgrounds table for unlockable themes
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS mountain_backgrounds (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mountain_id INTEGER NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
            expedition_id INTEGER REFERENCES player_expeditions(id) ON DELETE SET NULL,
            unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
            is_active BOOLEAN NOT NULL DEFAULT false
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_mountain_backgrounds_user_id ON mountain_backgrounds(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_mountain_backgrounds_mountain_id ON mountain_backgrounds(mountain_id)`);
        log.info('[migrate] ✅ Mountain backgrounds table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create mountain_backgrounds table:', error);
      }

      try {
        // Create expedition_missions table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS expedition_missions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mountain_id INTEGER NOT NULL REFERENCES mountains(id) ON DELETE CASCADE,
            status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed', 'failed')),

            start_date TIMESTAMP NOT NULL DEFAULT NOW(),
            completion_date TIMESTAMP,
            total_days INTEGER NOT NULL,
            current_day INTEGER NOT NULL DEFAULT 1,
            required_completion_percent INTEGER NOT NULL,

            days_completed INTEGER NOT NULL DEFAULT 0,
            perfect_days INTEGER NOT NULL DEFAULT 0,
            total_habits_completed INTEGER NOT NULL DEFAULT 0,
            total_habits_possible INTEGER NOT NULL DEFAULT 0,

            xp_earned INTEGER DEFAULT 0,
            points_earned INTEGER DEFAULT 0,
            bonuses_earned TEXT DEFAULT '[]',

            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_expedition_missions_user_id ON expedition_missions(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_expedition_missions_status ON expedition_missions(user_id, status)`);
        await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_expedition_missions_active ON expedition_missions(user_id) WHERE status = 'active'`);
        log.info('[migrate] ✅ Expedition missions table and indexes created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create expedition_missions table:', error);
      }

      try {
        // Add current_mountain_index to player_climbing_stats
        await db.execute(sql`
          ALTER TABLE player_climbing_stats
          ADD COLUMN IF NOT EXISTS current_mountain_index INTEGER NOT NULL DEFAULT 1
        `);
        log.info('[migrate] ✅ current_mountain_index column added to player_climbing_stats');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add current_mountain_index:', error);
      }

      // ========== GAMIFICATION TABLES ==========

      try {
        // Create streak_freezes table if it doesn't exist
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS streak_freezes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            count INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_streak_freezes_user_id ON streak_freezes(user_id)`);
        log.info('[migrate] ✅ Streak freezes table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create streak_freezes table:', error);
      }

      // ========== TODOIST-LEVEL TODO FEATURES ==========

      try {
        // Create projects table for organizing todos
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#3b82f6',
            is_favorite BOOLEAN NOT NULL DEFAULT false,
            is_archived BOOLEAN NOT NULL DEFAULT false,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)`);
        log.info('[migrate] ✅ Projects table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create projects table:', error);
      }

      // Add icon column to projects (added for Todoist-style project icons)
      try {
        await db.execute(sql`
          ALTER TABLE projects
          ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '📁'
        `);
        log.info('[migrate] ✅ icon column added/verified in projects table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add icon column to projects:', error);
      }

      // Add parent_id column for nested projects
      try {
        await db.execute(sql`
          ALTER TABLE projects
          ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
        `);
        log.info('[migrate] ✅ parent_id column added/verified in projects table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add parent_id column to projects:', error);
      }

      // Rename is_archived to archived (schema uses 'archived')
      try {
        await db.execute(sql`
          ALTER TABLE projects
          RENAME COLUMN is_archived TO archived
        `);
        log.info('[migrate] ✅ is_archived renamed to archived in projects table');
      } catch (error) {
        // Column may already be named 'archived' or not exist
        log.debug('[migrate] is_archived rename skipped (may already be correct)');
      }

      // Drop is_favorite column (not in current schema)
      try {
        await db.execute(sql`
          ALTER TABLE projects
          DROP COLUMN IF EXISTS is_favorite
        `);
        log.info('[migrate] ✅ is_favorite column dropped from projects table');
      } catch (error) {
        log.debug('[migrate] is_favorite drop skipped');
      }

      try {
        // Create labels table for tagging todos
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS labels (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            color TEXT NOT NULL DEFAULT '#6b7280',
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_labels_user_id ON labels(user_id)`);
        log.info('[migrate] ✅ Labels table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create labels table:', error);
      }

      try {
        // Create task_labels junction table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS task_labels (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES todos(id) ON DELETE CASCADE,
            label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
            UNIQUE(task_id, label_id)
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_task_labels_task_id ON task_labels(task_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_task_labels_label_id ON task_labels(label_id)`);
        log.info('[migrate] ✅ Task labels table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create task_labels table:', error);
      }

      try {
        // Add project_id column to todos table
        await db.execute(sql`
          ALTER TABLE todos
          ADD COLUMN IF NOT EXISTS project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL
        `);
        log.info('[migrate] ✅ project_id column added/verified in todos table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add project_id column to todos:', error);
      }

      try {
        // Add other Todoist-level columns to todos
        await db.execute(sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 4`);
        await db.execute(sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS recurring_pattern TEXT`);
        await db.execute(sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS next_recurrence VARCHAR(10)`);
        await db.execute(sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0`);
        await db.execute(sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS notes TEXT`);
        await db.execute(sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS parent_task_id INTEGER REFERENCES todos(id) ON DELETE CASCADE`);
        log.info('[migrate] ✅ Todoist-level columns added/verified in todos table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add Todoist columns to todos:', error);
      }

      try {
        // Add created_at column to todos (required by todos-enhanced.ts)
        await db.execute(sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`);
        log.info('[migrate] ✅ created_at column added/verified in todos table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add created_at column to todos:', error);
      }

      // ========== WEEKLY PLANNER HOMEPAGE ==========

      try {
        // Add month, week, and archived columns to goals for monthly/weekly goal lifecycle
        await db.execute(sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS month VARCHAR(7)`); // "2024-12"
        await db.execute(sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS week VARCHAR(10)`); // "2024-W49" (ISO week)
        await db.execute(sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false`);
        log.info('[migrate] ✅ Monthly/weekly goal columns (month, week, archived) added/verified in goals table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add monthly/weekly goal columns to goals:', error);
      }

      try {
        // Add goal_id to todos for task-goal linking
        await db.execute(sql`ALTER TABLE todos ADD COLUMN IF NOT EXISTS goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL`);
        log.info('[migrate] ✅ goal_id column added/verified in todos table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add goal_id column to todos:', error);
      }

      try {
        // Add parent_goal_id to goals for weekly→monthly goal hierarchy
        await db.execute(sql`ALTER TABLE goals ADD COLUMN IF NOT EXISTS parent_goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL`);
        log.info('[migrate] ✅ parent_goal_id column added/verified in goals table');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to add parent_goal_id column to goals:', error);
      }

      // Create outdoor climbing enums and table for manual tick logging
      try {
        // Create route_type enum if not exists
        await db.execute(sql`
          DO $$ BEGIN
            CREATE TYPE route_type AS ENUM('sport', 'trad', 'boulder', 'alpine', 'ice');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
        // Create ascent_style enum if not exists
        await db.execute(sql`
          DO $$ BEGIN
            CREATE TYPE ascent_style AS ENUM('onsight', 'flash', 'redpoint', 'pinkpoint', 'send', 'attempt', 'toprope');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
        // Create outdoor_climbing_ticks table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS outdoor_climbing_ticks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            route_name TEXT NOT NULL,
            grade VARCHAR(20) NOT NULL,
            route_type route_type NOT NULL,
            ascent_style ascent_style NOT NULL,
            date VARCHAR(10) NOT NULL,
            location TEXT,
            area TEXT,
            pitches INTEGER NOT NULL DEFAULT 1,
            stars INTEGER,
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_climbing_ticks_user_id ON outdoor_climbing_ticks(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_climbing_ticks_date ON outdoor_climbing_ticks(user_id, date)`);
        log.info('[migrate] ✅ Outdoor climbing ticks table and enums created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create outdoor_climbing_ticks:', error);
      }

      // ========== STUDY PLANNER TABLES ==========

      try {
        // Create study_task_type enum if not exists
        await db.execute(sql`
          DO $$ BEGIN
            CREATE TYPE study_task_type AS ENUM('remnote_review', 'email_cases', 'chapter', 'mri_lecture', 'papers');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);

        // Create study_books table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS study_books (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            abbreviation TEXT,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_study_books_user_id ON study_books(user_id)`);
        log.info('[migrate] ✅ Study books table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create study_books table:', error);
      }

      try {
        // Create study_chapters table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS study_chapters (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            book_id INTEGER NOT NULL REFERENCES study_books(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            images_completed BOOLEAN NOT NULL DEFAULT false,
            images_completed_at TIMESTAMP,
            cards_completed BOOLEAN NOT NULL DEFAULT false,
            cards_completed_at TIMESTAMP,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_study_chapters_user_id ON study_chapters(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_study_chapters_book_id ON study_chapters(book_id)`);
        log.info('[migrate] ✅ Study chapters table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create study_chapters table:', error);
      }

      try {
        // Create study_papers table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS study_papers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            url TEXT,
            completed BOOLEAN NOT NULL DEFAULT false,
            completed_at TIMESTAMP,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_study_papers_user_id ON study_papers(user_id)`);
        log.info('[migrate] ✅ Study papers table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create study_papers table:', error);
      }

      try {
        // Create study_mri_lectures table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS study_mri_lectures (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            url TEXT,
            completed BOOLEAN NOT NULL DEFAULT false,
            completed_at TIMESTAMP,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_study_mri_lectures_user_id ON study_mri_lectures(user_id)`);
        log.info('[migrate] ✅ Study MRI lectures table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create study_mri_lectures table:', error);
      }

      try {
        // Create study_schedule_logs table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS study_schedule_logs (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            date VARCHAR(10) NOT NULL,
            task_type study_task_type NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT false,
            linked_item_id INTEGER,
            linked_item_type VARCHAR(20),
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_study_schedule_logs_user_id ON study_schedule_logs(user_id)`);
        await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS study_schedule_logs_user_date_task_key ON study_schedule_logs(user_id, date, task_type)`);
        log.info('[migrate] ✅ Study schedule logs table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create study_schedule_logs table:', error);
      }

      try {
        // Create study_schedule_config table for customizable weekly schedule
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS study_schedule_config (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            task_type study_task_type NOT NULL,
            day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_study_schedule_config_user_id ON study_schedule_config(user_id)`);
        await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS study_schedule_config_user_task_day_key ON study_schedule_config(user_id, task_type, day_of_week)`);
        log.info('[migrate] ✅ Study schedule config table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create study_schedule_config table:', error);
      }

      // ========== LIFTING/LIFTOSAUR TABLES ==========

      try {
        // Create lifting enums if they don't exist
        await db.execute(sql`
          DO $$ BEGIN
            CREATE TYPE lifting_category AS ENUM('push', 'pull', 'legs', 'core', 'compound', 'accessory');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
        await db.execute(sql`
          DO $$ BEGIN
            CREATE TYPE equipment_type AS ENUM('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other');
          EXCEPTION
            WHEN duplicate_object THEN null;
          END $$;
        `);
        log.info('[migrate] ✅ Lifting enums created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create lifting enums:', error);
      }

      try {
        // Create lifting_exercises table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS lifting_exercises (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            category lifting_category NOT NULL DEFAULT 'compound',
            equipment equipment_type NOT NULL DEFAULT 'barbell',
            primary_muscle TEXT,
            is_custom BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lifting_exercises_user_id ON lifting_exercises(user_id)`);
        await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS lifting_exercises_user_name_key ON lifting_exercises(user_id, name)`);
        log.info('[migrate] ✅ Lifting exercises table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create lifting_exercises table:', error);
      }

      try {
        // Create lifting_workouts table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS lifting_workouts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            workout_date VARCHAR(10) NOT NULL,
            name TEXT,
            duration_minutes INTEGER,
            total_volume INTEGER DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, workout_date)
          )
        `);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lifting_workouts_user_id ON lifting_workouts(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lifting_workouts_date ON lifting_workouts(user_id, workout_date)`);
        log.info('[migrate] ✅ Lifting workouts table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create lifting_workouts table:', error);
      }

      try {
        // Create lifting_sets table
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS lifting_sets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            exercise_id INTEGER NOT NULL REFERENCES lifting_exercises(id) ON DELETE CASCADE,
            workout_date VARCHAR(10) NOT NULL,
            set_number INTEGER NOT NULL,
            reps INTEGER NOT NULL,
            weight_lbs DECIMAL(10,2) NOT NULL,
            rpe INTEGER,
            is_pr BOOLEAN NOT NULL DEFAULT false,
            notes TEXT,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        // Add rpe column if it doesn't exist (for tables created without it)
        await db.execute(sql`ALTER TABLE lifting_sets ADD COLUMN IF NOT EXISTS rpe INTEGER`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lifting_sets_user_id ON lifting_sets(user_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lifting_sets_exercise_id ON lifting_sets(exercise_id)`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_lifting_sets_date ON lifting_sets(user_id, workout_date)`);
        log.info('[migrate] ✅ Lifting sets table created/verified');
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to create lifting_sets table:', error);
      }

      // Seed mountaineering data (regions, mountains, routes, gear) - runs even when tables exist
      try {
        await seedMountaineeringData();
      } catch (error) {
        log.error('[migrate] ⚠️  Failed to seed mountaineering data:', error);
        // Continue anyway - seeding is optional
      }

      log.info('[migrate] ℹ️  User data preserved');
      return { success: true, skipped: true };
    }

    log.info('[migrate] Creating fresh tables...');

    // Users table
    await db.execute(sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Session table
    await db.execute(sql`
      CREATE TABLE session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
    await db.execute(sql`CREATE INDEX IDX_session_expire ON session (expire)`);

    // Habits table
    await db.execute(sql`
      CREATE TABLE habits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL,
        color VARCHAR(7) NOT NULL,
        cadence VARCHAR(10) NOT NULL CHECK (cadence IN ('daily', 'weekly')),
        target_per_week INTEGER,
        difficulty VARCHAR(10) NOT NULL DEFAULT 'medium',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Habit logs table
    await db.execute(sql`
      CREATE TABLE habit_logs (
        id SERIAL PRIMARY KEY,
        habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT false,
        note TEXT,
        mood INTEGER,
        energy_level INTEGER
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX habit_logs_habit_id_user_id_date_key ON habit_logs(habit_id, user_id, date)`);

    // Goals table
    await db.execute(sql`
      CREATE TABLE goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        target_value INTEGER NOT NULL,
        current_value INTEGER NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        deadline VARCHAR(10) NOT NULL,
        category TEXT NOT NULL,
        difficulty VARCHAR(10) NOT NULL DEFAULT 'medium',
        priority VARCHAR(10) NOT NULL DEFAULT 'medium'
      )
    `);

    // Goal updates table
    await db.execute(sql`
      CREATE TABLE goal_updates (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date VARCHAR(10) NOT NULL,
        value INTEGER NOT NULL,
        note TEXT
      )
    `);

    // Todos table
    await db.execute(sql`
      CREATE TABLE todos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        due_date VARCHAR(10),
        completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        difficulty VARCHAR(10) NOT NULL DEFAULT 'medium',
        subtasks TEXT NOT NULL DEFAULT '[]',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Virtual pets table
    await db.execute(sql`
      CREATE TABLE virtual_pets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        name TEXT NOT NULL DEFAULT 'Forest Friend',
        species VARCHAR(50) NOT NULL DEFAULT 'Gremlin',
        happiness INTEGER NOT NULL DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
        health INTEGER NOT NULL DEFAULT 100 CHECK (health >= 0 AND health <= 100),
        level INTEGER NOT NULL DEFAULT 1,
        experience INTEGER NOT NULL DEFAULT 0,
        evolution VARCHAR(20) NOT NULL DEFAULT 'seed' CHECK (evolution IN ('seed', 'sprout', 'sapling', 'tree', 'ancient')),
        current_costume_id INTEGER,
        last_fed TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // User settings table
    await db.execute(sql`
      CREATE TABLE user_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        dark_mode BOOLEAN NOT NULL DEFAULT true,
        notifications BOOLEAN NOT NULL DEFAULT true
      )
    `);

    // User points table
    await db.execute(sql`
      CREATE TABLE user_points (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        total_earned INTEGER NOT NULL DEFAULT 0,
        total_spent INTEGER NOT NULL DEFAULT 0,
        available INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Point transactions table
    await db.execute(sql`
      CREATE TABLE point_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(30) NOT NULL CHECK (type IN ('habit_complete', 'goal_progress', 'costume_purchase', 'daily_login', 'todo_complete')),
        related_id INTEGER,
        description TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Costumes table (must be created before virtual_pets foreign key)
    await db.execute(sql`
      CREATE TABLE costumes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        category VARCHAR(20) NOT NULL CHECK (category IN ('hat', 'outfit', 'accessory', 'background')),
        price INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
        evolution_required VARCHAR(20) NOT NULL DEFAULT 'seed' CHECK (evolution_required IN ('seed', 'sprout', 'sapling', 'tree', 'ancient'))
      )
    `);

    // User costumes table
    await db.execute(sql`
      CREATE TABLE user_costumes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        costume_id INTEGER NOT NULL REFERENCES costumes(id) ON DELETE CASCADE,
        purchased_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_equipped BOOLEAN NOT NULL DEFAULT false,
        UNIQUE(user_id, costume_id)
      )
    `);

    // Now add the foreign key constraint for virtual_pets.current_costume_id
    await db.execute(sql`
      ALTER TABLE virtual_pets
      ADD CONSTRAINT fk_virtual_pets_costume
      FOREIGN KEY (current_costume_id) REFERENCES costumes(id)
    `);

    // Sprites table
    await db.execute(sql`
      CREATE TABLE sprites (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        category VARCHAR(20) NOT NULL CHECK (category IN ('creature', 'biome', 'item', 'ui', 'uncategorized')),
        name TEXT,
        data TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Dream Scroll table
    await db.execute(sql`
      CREATE TABLE dream_scroll_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        category VARCHAR(20) NOT NULL CHECK (category IN ('do', 'buy', 'see', 'visit', 'learn', 'experience', 'music')),
        priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        cost VARCHAR(10) CHECK (cost IN ('free', '$', '$$', '$$$')),
        tags TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Streak Freezes table (gamification)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS streak_freezes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes
    await db.execute(sql`CREATE INDEX idx_habits_user_id ON habits(user_id)`);
    await db.execute(sql`CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id)`);
    await db.execute(sql`CREATE INDEX idx_habit_logs_user_id ON habit_logs(user_id)`);
    await db.execute(sql`CREATE INDEX idx_goals_user_id ON goals(user_id)`);
    await db.execute(sql`CREATE INDEX idx_goal_updates_goal_id ON goal_updates(goal_id)`);
    await db.execute(sql`CREATE INDEX idx_todos_user_id ON todos(user_id)`);
    await db.execute(sql`CREATE INDEX idx_user_costumes_user_id ON user_costumes(user_id)`);
    await db.execute(sql`CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id)`);
    await db.execute(sql`CREATE INDEX idx_dream_scroll_user_id ON dream_scroll_items(user_id)`);
    await db.execute(sql`CREATE INDEX idx_dream_scroll_category ON dream_scroll_items(user_id, category)`);
    await db.execute(sql`CREATE INDEX idx_dream_scroll_completed ON dream_scroll_items(user_id, completed)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_streak_freezes_user_id ON streak_freezes(user_id)`);

    log.info('[migrate] ✅ Fresh database schema created successfully');
    log.info('[migrate] ✅ Ready for new user signups');

    // Seed mountaineering data (regions, mountains, routes, gear)
    try {
      await seedMountaineeringData();
    } catch (error) {
      log.error('[migrate] ⚠️  Failed to seed mountaineering data:', error);
      // Continue anyway - seeding is optional
    }

    return { success: true, skipped: false };
  } catch (error) {
    log.error('[migrate] ❌ Migration failed:', error);
    throw error;
  }
}

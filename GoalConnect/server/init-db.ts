import { getDb } from './db';
import {
  users,
  goals,
  habits,
  virtualPets,
  userSettings,
  userPoints,
  costumes,
} from "../shared/schema";

const NOVEMBER_DEADLINE = '2025-11-30';

/**
 * Check if database has been seeded
 */
export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const db = getDb();
    const result = await db.select().from(users).limit(1);
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Initialize database with default data
 * NOTE: No longer auto-creates users. Users must sign up via the /signup page.
 */
export async function initializeDatabase() {
  // Database initialization is now handled by simple-auth.ts
  // Users create their own accounts via signup
  // No default/seed users are created

  return {
    success: true,
    message: 'Database ready - users will register via signup page',
    alreadySeeded: false,
  };
}

let initializationPromise: Promise<void> | null = null;

export function ensureDatabaseInitialized(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    return Promise.resolve();
  }

  if (!initializationPromise) {
    initializationPromise = initializeDatabase()
      .then(result => {
        if (!result.success && !result.alreadySeeded) {
          throw new Error(result.message ?? 'Database initialization failed');
        }
      })
      .catch(error => {
        initializationPromise = null;
        throw error;
      });
  }

  return initializationPromise;
}

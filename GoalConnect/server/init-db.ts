import { getDb } from './db';
import {
  users,
  goals,
  habits,
  virtualPets,
  userSettings,
  userPoints,
  costumes,
} from '../shared/schema';

const USER_ID = 1;
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
 */
export async function initializeDatabase() {
  // Check if already seeded
  const alreadySeeded = await isDatabaseSeeded();
  if (alreadySeeded) {
    return {
      success: true,
      message: 'Database already initialized',
      alreadySeeded: true,
    };
  }

  try {
    const db = getDb();
    // Create User
    const [user] = await db
      .insert(users)
      .values({
        name: 'Lauren',
        email: 'lauren@fairybubbles.com',
      })
      .returning();

    // Monthly Goals
    const monthlyGoals = [
      {
        userId: user.id,
        title: 'Pimsleur: Complete 16 Lessons',
        description: 'Finish Level 1 (27-30) + reach Level 2 Lesson 12',
        targetValue: 16,
        currentValue: 0,
        unit: 'lessons',
        deadline: NOVEMBER_DEADLINE,
        category: 'Learning',
      },
      {
        userId: user.id,
        title: 'Duolingo: Finish Current Unit',
        description: 'Complete approximately ¼ progress per week',
        targetValue: 1,
        currentValue: 0,
        unit: 'unit',
        deadline: NOVEMBER_DEADLINE,
        category: 'Learning',
      },
      {
        userId: user.id,
        title: 'RemNote: Complete Chapters 6 & 7',
        description: 'Finish Chapters 6 and 7 (de Lahunta)',
        targetValue: 2,
        currentValue: 0,
        unit: 'chapters',
        deadline: NOVEMBER_DEADLINE,
        category: 'Learning',
      },
      {
        userId: user.id,
        title: 'Convert 10 Papers to Flashcards',
        description: 'Transform 10 academic papers into flashcards',
        targetValue: 10,
        currentValue: 0,
        unit: 'papers',
        deadline: NOVEMBER_DEADLINE,
        category: 'Learning',
      },
      {
        userId: user.id,
        title: 'Watch 2 MRI Education Videos',
        description: 'Complete MRI education videos for Weeks 2 and 3',
        targetValue: 2,
        currentValue: 0,
        unit: 'videos',
        deadline: NOVEMBER_DEADLINE,
        category: 'Learning',
      },
      {
        userId: user.id,
        title: 'Complete 1 Audiobook',
        description: 'Finish one full audiobook this month',
        targetValue: 1,
        currentValue: 0,
        unit: 'book',
        deadline: NOVEMBER_DEADLINE,
        category: 'Creative',
      },
      {
        userId: user.id,
        title: 'Play Piano 12 Times',
        description: 'Practice piano at least 12 times (~3x per week)',
        targetValue: 12,
        currentValue: 0,
        unit: 'sessions',
        deadline: NOVEMBER_DEADLINE,
        category: 'Creative',
      },
      {
        userId: user.id,
        title: 'Complete 16 Gym Sessions',
        description: 'Go to gym 16 times (~4x per week)',
        targetValue: 16,
        currentValue: 0,
        unit: 'sessions',
        deadline: NOVEMBER_DEADLINE,
        category: 'Fitness',
      },
      {
        userId: user.id,
        title: '4 Outdoor Climbing Sessions',
        description: '4 outdoor climbing sessions including 1 overnight trip',
        targetValue: 4,
        currentValue: 0,
        unit: 'sessions',
        deadline: NOVEMBER_DEADLINE,
        category: 'Fitness',
      },
      {
        userId: user.id,
        title: 'Complete 4 Runs',
        description: 'Run once per week (4 total for the month)',
        targetValue: 4,
        currentValue: 0,
        unit: 'runs',
        deadline: NOVEMBER_DEADLINE,
        category: 'Fitness',
      },
      {
        userId: user.id,
        title: '8+ Daylight Exposures',
        description: '≥10 min outside on 3 days each week (minimum 8 total)',
        targetValue: 8,
        currentValue: 0,
        unit: 'sessions',
        deadline: NOVEMBER_DEADLINE,
        category: 'Outdoors',
      },
      {
        userId: user.id,
        title: 'Ship 1 App Feature',
        description: 'Deploy one concrete feature by Nov 30',
        targetValue: 1,
        currentValue: 0,
        unit: 'feature',
        deadline: NOVEMBER_DEADLINE,
        category: 'Projects',
      },
      {
        userId: user.id,
        title: 'Play Video Game Once',
        description: 'Enjoy one video game session this month',
        targetValue: 1,
        currentValue: 0,
        unit: 'session',
        deadline: NOVEMBER_DEADLINE,
        category: 'Personal',
      },
      {
        userId: user.id,
        title: 'Hang Out with Coworker',
        description: 'Spend social time with a coworker',
        targetValue: 1,
        currentValue: 0,
        unit: 'meetup',
        deadline: NOVEMBER_DEADLINE,
        category: 'Personal',
      },
      {
        userId: user.id,
        title: 'Try 1 New Thing',
        description: 'Experience something new and novel',
        targetValue: 1,
        currentValue: 0,
        unit: 'experience',
        deadline: NOVEMBER_DEADLINE,
        category: 'Personal',
      },
    ];

    // Weekly Habits
    const weeklyHabits = [
      {
        userId: user.id,
        title: 'Pimsleur (4 lessons/week)',
        description: 'Complete 4 Pimsleur lessons this week (~1 full lesson + short sessions)',
        icon: 'Languages',
        color: '#8B5CF6',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'Duolingo (5 sessions/week)',
        description: 'Complete 5 Duolingo sessions of at least 10 minutes each',
        icon: 'GraduationCap',
        color: '#10B981',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'Gym (4 sessions/week)',
        description: 'Mon/Tue + pre-shift Wed-Fri workouts',
        icon: 'Dumbbell',
        color: '#EF4444',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'Piano (3 sessions/week)',
        description: '20-30 minute practice sessions',
        icon: 'Music',
        color: '#8B5CF6',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'Daylight (3 times/week)',
        description: '≥10 min outside, minimum 2 if busy week',
        icon: 'Sun',
        color: '#F59E0B',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'RemNote Study (1 chapter/week)',
        description: 'Wk 1 = Ch 6 • Wk 2 = Ch 7 + 2-3 papers per week',
        icon: 'BookOpen',
        color: '#3B82F6',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'Create Flashcards (2-3 papers/week)',
        description: 'Convert 2-3 papers to flashcards weekly (finish 10 by Nov 30)',
        icon: 'FileText',
        color: '#06B6D4',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'MRI Video (Wks 2 & 3 only)',
        description: 'Watch 1 MRI education video (Nov 10-23)',
        icon: 'Video',
        color: '#EC4899',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'Outdoor Climbing (1 session/week)',
        description: 'One outdoor climbing session (Week 2 overnight optional)',
        icon: 'Mountain',
        color: '#059669',
        cadence: 'weekly' as const,
      },
      {
        userId: user.id,
        title: 'Run (1 time/week)',
        description: 'One run per week on flexible day',
        icon: 'Activity',
        color: '#F97316',
        cadence: 'weekly' as const,
      },
    ];

    // Insert monthly goals
    const insertedGoals = await db.insert(goals).values(monthlyGoals).returning();

    // Insert weekly habits
    const insertedHabits = await db.insert(habits).values(weeklyHabits).returning();

    // Create virtual pet
    const [pet] = await db
      .insert(virtualPets)
      .values({
        userId: user.id,
        name: 'Forest Friend',
        species: 'Gremlin',
        level: 1,
        experience: 0,
        evolution: 'seed',
      })
      .returning();

    // Create user settings
    await db.insert(userSettings).values({
      userId: user.id,
      darkMode: true,
      notifications: true,
    });

    // Initialize user points
    await db.insert(userPoints).values({
      userId: user.id,
      totalEarned: 250,
      totalSpent: 0,
      available: 250,
    });

    // Create costumes
    const costumeData = [
      {
        name: 'Party Hat',
        description: 'A festive party hat',
        category: 'hat' as const,
        price: 50,
        imageUrl: '🎉',
        rarity: 'common' as const,
      },
      {
        name: 'Crown',
        description: 'Royal crown fit for a king',
        category: 'hat' as const,
        price: 200,
        imageUrl: '👑',
        rarity: 'rare' as const,
      },
      {
        name: 'Wizard Hat',
        description: 'Magical wizard hat',
        category: 'hat' as const,
        price: 150,
        imageUrl: '🧙',
        rarity: 'rare' as const,
      },
      {
        name: 'Superhero Cape',
        description: 'Feel like a superhero',
        category: 'outfit' as const,
        price: 100,
        imageUrl: '🦸',
        rarity: 'common' as const,
      },
      {
        name: 'Ninja Outfit',
        description: 'Stealth mode activated',
        category: 'outfit' as const,
        price: 250,
        imageUrl: '🥷',
        rarity: 'epic' as const,
      },
      {
        name: 'Sunglasses',
        description: 'Cool shades',
        category: 'accessory' as const,
        price: 75,
        imageUrl: '😎',
        rarity: 'common' as const,
      },
      {
        name: 'Gold Medal',
        description: 'Achievement unlocked',
        category: 'accessory' as const,
        price: 300,
        imageUrl: '🏅',
        rarity: 'epic' as const,
      },
      {
        name: 'Space Background',
        description: 'Explore the cosmos',
        category: 'background' as const,
        price: 400,
        imageUrl: '🌌',
        rarity: 'legendary' as const,
      },
      {
        name: 'Forest Background',
        description: 'Nature vibes',
        category: 'background' as const,
        price: 150,
        imageUrl: '🌲',
        rarity: 'rare' as const,
      },
      {
        name: 'Rainbow Background',
        description: 'Bright and cheerful',
        category: 'background' as const,
        price: 100,
        imageUrl: '🌈',
        rarity: 'common' as const,
      },
    ];
    const insertedCostumes = await db.insert(costumes).values(costumeData).returning();

    return {
      success: true,
      message: 'Database initialized successfully!',
      data: {
        user: user.name,
        goals: insertedGoals.length,
        habits: insertedHabits.length,
        pet: pet.name,
        costumes: insertedCostumes.length,
        points: 250,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to initialize database: ${error.message}`,
      error: error.message,
    };
  }
}

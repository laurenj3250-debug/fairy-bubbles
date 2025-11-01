import "./load-env.js";
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import {
  users,
  goals,
  habits,
  virtualPets,
  userSettings,
  userPoints,
  costumes,
  goalUpdates,
  habitLogs,
  pointTransactions,
  userCostumes,
  todos,
} from "../shared/schema";

/**
 * Complete database setup with user, goals, habits, and all necessary data
 * Run with: npm exec tsx server/setup-november-goals.ts
 */

const NOVEMBER_DEADLINE = "2025-11-30";

async function setupNovemberGoals() {
  console.log("🎯 Setting up complete database with November goals and habits...\n");
  const db = getDb();

  const configuredUsername = process.env.APP_USERNAME?.trim() || "laurenj3250";
  const configuredName = process.env.APP_USER_NAME?.trim() || "Lauren";
  const configuredEmail =
    process.env.APP_USER_EMAIL?.trim() || `${configuredUsername.toLowerCase()}@goalconnect.local`;

  console.log(`👤 Ensuring user exists for ${configuredUsername}...`);
  const existingUsers = await db.select().from(users).where(eq(users.email, configuredEmail));

  let user = existingUsers[0];
  if (!user) {
    const [createdUser] = await db
      .insert(users)
      .values({
        name: configuredName,
        email: configuredEmail,
      })
      .returning();

    user = createdUser;
    console.log(`✅ Created user: ${user.name} (${user.email})\n`);
  } else {
    const [updatedUser] = await db
      .update(users)
      .set({ name: configuredName })
      .where(eq(users.id, user.id))
      .returning();

    user = updatedUser ?? user;
    console.log(`✅ Reusing existing user: ${user.name} (${user.email})\n`);
  }

  const USER_ID = user.id;

  console.log("🧹 Clearing existing data for this user...\n");
  await db.delete(goalUpdates).where(eq(goalUpdates.userId, USER_ID));
  await db.delete(pointTransactions).where(eq(pointTransactions.userId, USER_ID));
  await db.delete(habitLogs).where(eq(habitLogs.userId, USER_ID));
  await db.delete(todos).where(eq(todos.userId, USER_ID));
  await db.delete(userCostumes).where(eq(userCostumes.userId, USER_ID));
  await db.delete(habits).where(eq(habits.userId, USER_ID));
  await db.delete(goals).where(eq(goals.userId, USER_ID));
  await db.delete(userSettings).where(eq(userSettings.userId, USER_ID));
  await db.delete(userPoints).where(eq(userPoints.userId, USER_ID));
  await db.delete(virtualPets).where(eq(virtualPets.userId, USER_ID));

  console.log("🧽 Resetting shared resources...\n");
  await db.delete(costumes);

  // Monthly Goals
  const monthlyGoals = [
    {
      userId: USER_ID,
      title: "Pimsleur: Complete 16 Lessons",
      description: "Finish Level 1 (27-30) + reach Level 2 Lesson 12",
      targetValue: 16,
      currentValue: 0,
      unit: "lessons",
      deadline: NOVEMBER_DEADLINE,
      category: "Learning",
    },
    {
      userId: USER_ID,
      title: "Duolingo: Finish Current Unit",
      description: "Complete approximately ¼ progress per week",
      targetValue: 1,
      currentValue: 0,
      unit: "unit",
      deadline: NOVEMBER_DEADLINE,
      category: "Learning",
    },
    {
      userId: USER_ID,
      title: "RemNote: Complete Chapters 6 & 7",
      description: "Finish Chapters 6 and 7 (de Lahunta)",
      targetValue: 2,
      currentValue: 0,
      unit: "chapters",
      deadline: NOVEMBER_DEADLINE,
      category: "Learning",
    },
    {
      userId: USER_ID,
      title: "Convert 10 Papers to Flashcards",
      description: "Transform 10 academic papers into flashcards",
      targetValue: 10,
      currentValue: 0,
      unit: "papers",
      deadline: NOVEMBER_DEADLINE,
      category: "Learning",
    },
    {
      userId: USER_ID,
      title: "Watch 2 MRI Education Videos",
      description: "Complete MRI education videos for Weeks 2 and 3",
      targetValue: 2,
      currentValue: 0,
      unit: "videos",
      deadline: NOVEMBER_DEADLINE,
      category: "Learning",
    },
    {
      userId: USER_ID,
      title: "Complete 1 Audiobook",
      description: "Finish one full audiobook this month",
      targetValue: 1,
      currentValue: 0,
      unit: "book",
      deadline: NOVEMBER_DEADLINE,
      category: "Creative",
    },
    {
      userId: USER_ID,
      title: "Play Piano 12 Times",
      description: "Practice piano at least 12 times (~3x per week)",
      targetValue: 12,
      currentValue: 0,
      unit: "sessions",
      deadline: NOVEMBER_DEADLINE,
      category: "Creative",
    },
    {
      userId: USER_ID,
      title: "Complete 16 Gym Sessions",
      description: "Go to gym 16 times (~4x per week)",
      targetValue: 16,
      currentValue: 0,
      unit: "sessions",
      deadline: NOVEMBER_DEADLINE,
      category: "Fitness",
    },
    {
      userId: USER_ID,
      title: "4 Outdoor Climbing Sessions",
      description: "4 outdoor climbing sessions including 1 overnight trip",
      targetValue: 4,
      currentValue: 0,
      unit: "sessions",
      deadline: NOVEMBER_DEADLINE,
      category: "Fitness",
    },
    {
      userId: USER_ID,
      title: "Complete 4 Runs",
      description: "Run once per week (4 total for the month)",
      targetValue: 4,
      currentValue: 0,
      unit: "runs",
      deadline: NOVEMBER_DEADLINE,
      category: "Fitness",
    },
    {
      userId: USER_ID,
      title: "8+ Daylight Exposures",
      description: "≥10 min outside on 3 days each week (minimum 8 total)",
      targetValue: 8,
      currentValue: 0,
      unit: "sessions",
      deadline: NOVEMBER_DEADLINE,
      category: "Outdoors",
    },
    {
      userId: USER_ID,
      title: "Ship 1 App Feature",
      description: "Deploy one concrete feature by Nov 30",
      targetValue: 1,
      currentValue: 0,
      unit: "feature",
      deadline: NOVEMBER_DEADLINE,
      category: "Projects",
    },
    {
      userId: USER_ID,
      title: "Play Video Game Once",
      description: "Enjoy one video game session this month",
      targetValue: 1,
      currentValue: 0,
      unit: "session",
      deadline: NOVEMBER_DEADLINE,
      category: "Personal",
    },
    {
      userId: USER_ID,
      title: "Hang Out with Coworker",
      description: "Spend social time with a coworker",
      targetValue: 1,
      currentValue: 0,
      unit: "meetup",
      deadline: NOVEMBER_DEADLINE,
      category: "Personal",
    },
    {
      userId: USER_ID,
      title: "Try 1 New Thing",
      description: "Experience something new and novel",
      targetValue: 1,
      currentValue: 0,
      unit: "experience",
      deadline: NOVEMBER_DEADLINE,
      category: "Personal",
    },
  ];

  // Weekly Habits
  const weeklyHabits = [
    {
      userId: USER_ID,
      title: "Pimsleur (4 lessons/week)",
      description: "Complete 4 Pimsleur lessons this week (~1 full lesson + short sessions)",
      icon: "Languages",
      color: "#8B5CF6",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "Duolingo (5 sessions/week)",
      description: "Complete 5 Duolingo sessions of at least 10 minutes each",
      icon: "GraduationCap",
      color: "#10B981",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "Gym (4 sessions/week)",
      description: "Mon/Tue + pre-shift Wed-Fri workouts",
      icon: "Dumbbell",
      color: "#EF4444",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "Piano (3 sessions/week)",
      description: "20-30 minute practice sessions",
      icon: "Music",
      color: "#8B5CF6",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "Daylight (3 times/week)",
      description: "≥10 min outside, minimum 2 if busy week",
      icon: "Sun",
      color: "#F59E0B",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "RemNote Study (1 chapter/week)",
      description: "Wk 1 = Ch 6 • Wk 2 = Ch 7 + 2-3 papers per week",
      icon: "BookOpen",
      color: "#3B82F6",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "Create Flashcards (2-3 papers/week)",
      description: "Convert 2-3 papers to flashcards weekly (finish 10 by Nov 30)",
      icon: "FileText",
      color: "#06B6D4",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "MRI Video (Wks 2 & 3 only)",
      description: "Watch 1 MRI education video (Nov 10-23)",
      icon: "Video",
      color: "#EC4899",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "Outdoor Climbing (1 session/week)",
      description: "One outdoor climbing session (Week 2 overnight optional)",
      icon: "Mountain",
      color: "#059669",
      cadence: "weekly" as const,
    },
    {
      userId: USER_ID,
      title: "Run (1 time/week)",
      description: "One run per week on flexible day",
      icon: "Activity",
      color: "#F97316",
      cadence: "weekly" as const,
    },
  ];

  try {
    // Insert monthly goals
    console.log("📋 Inserting monthly goals...");
    const insertedGoals = await db.insert(goals).values(monthlyGoals).returning();
    console.log(`✅ Created ${insertedGoals.length} monthly goals\n`);

    // Insert weekly habits
    console.log("🔄 Inserting weekly habits...");
    const insertedHabits = await db.insert(habits).values(weeklyHabits).returning();
    console.log(`✅ Created ${insertedHabits.length} weekly habits\n`);

    // Create virtual pet
    console.log("🐾 Creating virtual pet...");
    const [pet] = await db.insert(virtualPets).values({
      userId: USER_ID,
      name: "Forest Friend",
      species: "Gremlin",
      level: 1,
      experience: 0,
      evolution: "seed",
    }).returning();
    console.log(`✅ Created virtual pet: ${pet.name}\n`);

    // Create user settings
    console.log("⚙️ Creating user settings...");
    await db.insert(userSettings).values({
      userId: USER_ID,
      darkMode: true,
      notifications: true,
    });
    console.log(`✅ Created user settings\n`);

    // Initialize user points
    console.log("💰 Initializing points...");
    await db.insert(userPoints).values({
      userId: USER_ID,
      totalEarned: 250,
      totalSpent: 0,
      available: 250,
    });
    console.log(`✅ Starting with 250 points\n`);

    // Create costumes
    console.log("👔 Creating costume shop...");
    const costumeData = [
      { name: "Party Hat", description: "A festive party hat", category: "hat" as const, price: 50, imageUrl: "🎉", rarity: "common" as const },
      { name: "Crown", description: "Royal crown fit for a king", category: "hat" as const, price: 200, imageUrl: "👑", rarity: "rare" as const },
      { name: "Wizard Hat", description: "Magical wizard hat", category: "hat" as const, price: 150, imageUrl: "🧙", rarity: "rare" as const },
      { name: "Superhero Cape", description: "Feel like a superhero", category: "outfit" as const, price: 100, imageUrl: "🦸", rarity: "common" as const },
      { name: "Ninja Outfit", description: "Stealth mode activated", category: "outfit" as const, price: 250, imageUrl: "🥷", rarity: "epic" as const },
      { name: "Sunglasses", description: "Cool shades", category: "accessory" as const, price: 75, imageUrl: "😎", rarity: "common" as const },
      { name: "Gold Medal", description: "Achievement unlocked", category: "accessory" as const, price: 300, imageUrl: "🏅", rarity: "epic" as const },
      { name: "Space Background", description: "Explore the cosmos", category: "background" as const, price: 400, imageUrl: "🌌", rarity: "legendary" as const },
      { name: "Forest Background", description: "Nature vibes", category: "background" as const, price: 150, imageUrl: "🌲", rarity: "rare" as const },
      { name: "Rainbow Background", description: "Bright and cheerful", category: "background" as const, price: 100, imageUrl: "🌈", rarity: "common" as const },
    ];
    const insertedCostumes = await db.insert(costumes).values(costumeData).returning();
    console.log(`✅ Created ${insertedCostumes.length} costumes\n`);

    console.log("🎉 Database setup complete!\n");
    console.log("Summary:");
    console.log(`  - User: ${user.name}`);
    console.log(`  - ${insertedGoals.length} monthly goals`);
    console.log(`  - ${insertedHabits.length} weekly habits`);
    console.log(`  - Virtual pet: ${pet.name}`);
    console.log(`  - ${insertedCostumes.length} costumes available`);
    console.log(`  - Starting points: 250`);
    console.log(`  - Deadline: ${NOVEMBER_DEADLINE}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

setupNovemberGoals();

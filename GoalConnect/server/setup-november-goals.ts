import { db } from "./db";
import { goals, habits } from "../shared/schema";

/**
 * Setup November goals and weekly habits for user
 * Run with: npm exec tsx server/setup-november-goals.ts
 */

const USER_ID = 1;
const NOVEMBER_DEADLINE = "2025-11-30";

async function setupNovemberGoals() {
  console.log("🎯 Setting up November goals and habits...\n");

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

    console.log("🎉 November setup complete!\n");
    console.log("Summary:");
    console.log(`  - ${insertedGoals.length} monthly goals`);
    console.log(`  - ${insertedHabits.length} weekly habits`);
    console.log(`  - User ID: ${USER_ID}`);
    console.log(`  - Deadline: ${NOVEMBER_DEADLINE}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up November goals:", error);
    process.exit(1);
  }
}

setupNovemberGoals();

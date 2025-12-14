import { getDb } from "../server/db";
import { yearlyGoals } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

interface SeedGoal {
  category: string;
  title: string;
  goalType: "binary" | "count" | "compound";
  targetValue: number;
  linkedJourneyKey?: string;
  linkedDreamScrollCategory?: string;
  xpReward: number;
  subItems?: { id: string; title: string; completed: boolean }[];
}

const goals2026: SeedGoal[] = [
  // RESIDENCY
  { category: "residency", title: "Complete a solo hemilaminectomy", goalType: "binary", targetValue: 1, xpReward: 200 },
  { category: "residency", title: "Finish de Lahunta", goalType: "binary", targetValue: 1, xpReward: 150 },
  { category: "residency", title: "Finish year one of residency", goalType: "binary", targetValue: 1, xpReward: 500 },

  // FITNESS
  { category: "fitness", title: "200 lifting days", goalType: "count", targetValue: 200, linkedJourneyKey: "lifting_workouts", xpReward: 300 },
  { category: "fitness", title: "10 pull-ups in a row", goalType: "binary", targetValue: 1, xpReward: 100 },
  { category: "fitness", title: "10 chin-ups in a row", goalType: "binary", targetValue: 1, xpReward: 100 },

  // CLIMBING
  { category: "climbing", title: "12 outdoor climbing days", goalType: "count", targetValue: 12, linkedJourneyKey: "outdoor_days", xpReward: 150 },
  { category: "climbing", title: "Climbing trip (New River Gorge)", goalType: "binary", targetValue: 1, xpReward: 150 },
  { category: "climbing", title: "Ice climbing in Adirondacks once", goalType: "binary", targetValue: 1, xpReward: 150 },
  { category: "climbing", title: "V5 on Kilter", goalType: "binary", targetValue: 1, linkedJourneyKey: "kilter_max_grade", xpReward: 200 },

  // OUTDOOR
  { category: "outdoor", title: "52 outdoor days (1/week)", goalType: "count", targetValue: 52, xpReward: 200 },

  // GERMAN
  {
    category: "german",
    title: "Finish Pimsleur Modules 3, 4, 5",
    goalType: "compound",
    targetValue: 3,
    xpReward: 200,
    subItems: [
      { id: randomUUID(), title: "Module 3", completed: false },
      { id: randomUUID(), title: "Module 4", completed: false },
      { id: randomUUID(), title: "Module 5", completed: false },
    ]
  },
  { category: "german", title: "Finish Paul Noble Intermediate", goalType: "binary", targetValue: 1, xpReward: 100 },
  { category: "german", title: "German Vocabulary Course (Michel Thomas)", goalType: "binary", targetValue: 1, xpReward: 100 },
  { category: "german", title: "Intermediate German (Michel Thomas)", goalType: "binary", targetValue: 1, xpReward: 100 },
  { category: "german", title: "Easy Pod German Book 1", goalType: "binary", targetValue: 1, xpReward: 100 },

  // BOOKS
  { category: "books", title: "6 audiobooks", goalType: "count", targetValue: 6, xpReward: 100 },
  { category: "books", title: "2 physical books", goalType: "count", targetValue: 2, xpReward: 100 },

  // PIANO
  { category: "piano", title: "Start taking lessons", goalType: "binary", targetValue: 1, xpReward: 100 },
  { category: "piano", title: "Learn 1 piece to completion", goalType: "binary", targetValue: 1, xpReward: 150 },

  // TRAVEL
  { category: "travel", title: "Visit Scotland once", goalType: "binary", targetValue: 1, xpReward: 200 },

  // RELATIONSHIP
  { category: "relationship", title: "4 in-person visits with Adam", goalType: "count", targetValue: 4, xpReward: 150 },

  // SOCIAL
  { category: "social", title: "12 non-work hangouts (1/month)", goalType: "count", targetValue: 12, xpReward: 150 },
  { category: "social", title: "Make 1 climbing friend", goalType: "binary", targetValue: 1, xpReward: 100 },
  { category: "social", title: "Attend 1 climbing event", goalType: "binary", targetValue: 1, xpReward: 100 },

  // FINANCIAL
  { category: "financial", title: "Save up for ring", goalType: "binary", targetValue: 1, xpReward: 300 },

  // BUCKET LIST
  { category: "bucket_list", title: "12 bucket list items", goalType: "count", targetValue: 12, linkedDreamScrollCategory: "experience", xpReward: 400 },
];

async function seed2026Goals() {
  const db = getDb();
  const year = "2026";
  const userId = 1; // Default user ID

  console.log(`Seeding ${goals2026.length} goals for ${year}...`);

  let position = 0;
  let inserted = 0;
  let skipped = 0;

  for (const goal of goals2026) {
    // Check if goal already exists
    const existing = await db.select()
      .from(yearlyGoals)
      .where(
        and(
          eq(yearlyGoals.userId, userId),
          eq(yearlyGoals.year, year),
          eq(yearlyGoals.title, goal.title)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Skipping (already exists): ${goal.title}`);
      skipped++;
      position++;
      continue;
    }

    await db.insert(yearlyGoals).values({
      userId,
      year,
      title: goal.title,
      category: goal.category,
      position,
      goalType: goal.goalType,
      targetValue: goal.targetValue,
      currentValue: 0,
      linkedJourneyKey: goal.linkedJourneyKey || null,
      linkedDreamScrollCategory: goal.linkedDreamScrollCategory || null,
      subItems: goal.subItems || [],
      xpReward: goal.xpReward,
      completed: false,
      rewardClaimed: false,
    });

    console.log(`  Inserted: ${goal.title}`);
    inserted++;
    position++;
  }

  console.log(`\nDone! Inserted ${inserted} goals, skipped ${skipped} existing goals.`);
  process.exit(0);
}

seed2026Goals().catch((err) => {
  console.error("Error seeding goals:", err);
  process.exit(1);
});

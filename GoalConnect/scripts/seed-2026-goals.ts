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
  {
    category: "residency",
    title: "Complete de Lahunta",
    goalType: "compound",
    targetValue: 26,
    xpReward: 500,
    subItems: [
      { id: randomUUID(), title: "Week 1: pp. 1-23 (Ch 1 + Ch 2)", completed: false },
      { id: randomUUID(), title: "Week 2: pp. 24-46 (Ch 2 + Ch 3)", completed: false },
      { id: randomUUID(), title: "Week 3: pp. 47-69 (Ch 3)", completed: false },
      { id: randomUUID(), title: "Week 4: pp. 70-92 (Ch 3 + Ch 4)", completed: false },
      { id: randomUUID(), title: "Week 5: pp. 93-115 (Ch 4 + Ch 5)", completed: false },
      { id: randomUUID(), title: "Week 6: pp. 116-138 (Ch 5)", completed: false },
      { id: randomUUID(), title: "Week 7: pp. 139-161 (Ch 5)", completed: false },
      { id: randomUUID(), title: "Week 8: pp. 162-184 (Ch 5 + Ch 6)", completed: false },
      { id: randomUUID(), title: "Week 9: pp. 185-207 (Ch 6 + Ch 7)", completed: false },
      { id: randomUUID(), title: "Week 10: pp. 208-229 (Ch 7)", completed: false },
      { id: randomUUID(), title: "Week 11: pp. 246-268 (Ch 9 + Ch 10)", completed: false },
      { id: randomUUID(), title: "Week 12: pp. 269-291 (Ch 10)", completed: false },
      { id: randomUUID(), title: "Week 13: pp. 292-314 (Ch 10 + Ch 11)", completed: false },
      { id: randomUUID(), title: "Week 14: pp. 315-337 (Ch 11)", completed: false },
      { id: randomUUID(), title: "Week 15: pp. 338-360 (Ch 11 + Ch 12)", completed: false },
      { id: randomUUID(), title: "Week 16: pp. 361-383 (Ch 12 + Ch 13)", completed: false },
      { id: randomUUID(), title: "Week 17: pp. 384-406 (Ch 13)", completed: false },
      { id: randomUUID(), title: "Week 18: pp. 407-429 (Ch 13 + Ch 14)", completed: false },
      { id: randomUUID(), title: "Week 19: pp. 430-452 (Ch 14)", completed: false },
      { id: randomUUID(), title: "Week 20: pp. 453-475 (Ch 14-17)", completed: false },
      { id: randomUUID(), title: "Week 21: pp. 476-498 (Ch 17 + Ch 18)", completed: false },
      { id: randomUUID(), title: "Week 22: pp. 499-521 (Ch 18-20)", completed: false },
      { id: randomUUID(), title: "Week 23: pp. 522-544 (Ch 20 + Ch 21)", completed: false },
      { id: randomUUID(), title: "Week 24: pp. 545-567 (Ch 21 + Ch 22)", completed: false },
      { id: randomUUID(), title: "Week 25: pp. 568-590 (Ch 22)", completed: false },
      { id: randomUUID(), title: "Week 26: pp. 591-621 (Ch 22)", completed: false },
    ]
  },
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

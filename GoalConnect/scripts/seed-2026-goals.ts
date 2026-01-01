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
      // Real de Lahunta TOC: 22 chapters, ~570 pages, ~22 pages/week
      { id: randomUUID(), title: "Week 1: pp. 1-22 (Ch 1-2: Introduction, Neuroanatomy Atlas)", completed: false },
      { id: randomUUID(), title: "Week 2: pp. 23-44 (Ch 2: Neuroanatomy Atlas cont.)", completed: false },
      { id: randomUUID(), title: "Week 3: pp. 45-66 (Ch 3: Development of Nervous System)", completed: false },
      { id: randomUUID(), title: "Week 4: pp. 67-88 (Ch 3-4: Development, CSF/Hydrocephalus)", completed: false },
      { id: randomUUID(), title: "Week 5: pp. 89-110 (Ch 4-5: CSF, LMN Spinal Nerve)", completed: false },
      { id: randomUUID(), title: "Week 6: pp. 111-132 (Ch 5: LMN Spinal Nerve, GSE)", completed: false },
      { id: randomUUID(), title: "Week 7: pp. 133-154 (Ch 5: LMN Spinal Nerve cont.)", completed: false },
      { id: randomUUID(), title: "Week 8: pp. 155-176 (Ch 5-6: LMN Spinal, LMN Cranial Nerve)", completed: false },
      { id: randomUUID(), title: "Week 9: pp. 177-198 (Ch 6: LMN Cranial Nerve, GSE)", completed: false },
      { id: randomUUID(), title: "Week 10: pp. 199-224 (Ch 6-7: LMN Cranial, LMN GVE)", completed: false },
      { id: randomUUID(), title: "Week 11: pp. 225-250 (Ch 7-9: LMN GVE, UMN, General Sensory)", completed: false },
      { id: randomUUID(), title: "Week 12: pp. 251-276 (Ch 9-10: General Sensory, Small Animal Spinal Cord)", completed: false },
      { id: randomUUID(), title: "Week 13: pp. 277-302 (Ch 10: Small Animal Spinal Cord Disease)", completed: false },
      { id: randomUUID(), title: "Week 14: pp. 303-328 (Ch 10-11: Small Animal, Large Animal Spinal Cord)", completed: false },
      { id: randomUUID(), title: "Week 15: pp. 329-354 (Ch 11-12: Large Animal Spinal Cord, Vestibular)", completed: false },
      { id: randomUUID(), title: "Week 16: pp. 355-380 (Ch 12-13: Vestibular, Cerebellum)", completed: false },
      { id: randomUUID(), title: "Week 17: pp. 381-406 (Ch 13: Cerebellum cont.)", completed: false },
      { id: randomUUID(), title: "Week 18: pp. 407-432 (Ch 13-14: Cerebellum, Visual System)", completed: false },
      { id: randomUUID(), title: "Week 19: pp. 433-458 (Ch 14-15: Visual System, Auditory)", completed: false },
      { id: randomUUID(), title: "Week 20: pp. 459-484 (Ch 15-18: Auditory, Visceral Afferent, Limbic, Seizures)", completed: false },
      { id: randomUUID(), title: "Week 21: pp. 485-510 (Ch 18-19: Seizures/Narcolepsy, Diencephalon)", completed: false },
      { id: randomUUID(), title: "Week 22: pp. 511-536 (Ch 19-21: Diencephalon, Involuntary Contractions, Neuro Exam)", completed: false },
      { id: randomUUID(), title: "Week 23: pp. 537-560 (Ch 21-22: Neurologic Exam, Case Descriptions)", completed: false },
      { id: randomUUID(), title: "Week 24: pp. 561-584 (Ch 22: Case Descriptions cont.)", completed: false },
      { id: randomUUID(), title: "Week 25: pp. 585-608 (Ch 22: Case Descriptions cont.)", completed: false },
      { id: randomUUID(), title: "Week 26: pp. 609-end (Ch 22: Case Descriptions, Review)", completed: false },
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

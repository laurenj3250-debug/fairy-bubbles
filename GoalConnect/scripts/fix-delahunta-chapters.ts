import { getDb } from "../server/db";
import { yearlyGoals } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const correctSubItems = [
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
];

async function fixDeLahuntaChapters() {
  const db = getDb();
  const userId = 1;
  const year = "2026";
  const title = "Complete de Lahunta";

  console.log("Finding de Lahunta goal...");

  const existing = await db.select()
    .from(yearlyGoals)
    .where(
      and(
        eq(yearlyGoals.userId, userId),
        eq(yearlyGoals.year, year),
        eq(yearlyGoals.title, title)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    console.log("Goal not found! Run seed-2026-goals.ts first.");
    process.exit(1);
  }

  const goal = existing[0];
  console.log(`Found goal ID ${goal.id}, updating subItems...`);

  await db.update(yearlyGoals)
    .set({ subItems: correctSubItems })
    .where(eq(yearlyGoals.id, goal.id));

  console.log("Done! Updated de Lahunta with correct chapter titles.");
  process.exit(0);
}

fixDeLahuntaChapters().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

import { getDb } from "../server/db";
import { yearlyGoals } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const correctSubItems = [
  // Real de Lahunta TOC: 22 chapters, book ends ~570 pages
  // ~22 pages/week for 26 weeks
  { id: randomUUID(), title: "Week 1: pp. 1-22 (Ch 1-2: Introduction, Neuroanatomy Atlas)", completed: false },
  { id: randomUUID(), title: "Week 2: pp. 23-44 (Ch 2: Neuroanatomy Atlas)", completed: false },
  { id: randomUUID(), title: "Week 3: pp. 45-66 (Ch 3: Development/Malformations)", completed: false },
  { id: randomUUID(), title: "Week 4: pp. 67-88 (Ch 3-4: Development, CSF/Hydrocephalus)", completed: false },
  { id: randomUUID(), title: "Week 5: pp. 89-110 (Ch 4-5: CSF, LMN Spinal Nerve)", completed: false },
  { id: randomUUID(), title: "Week 6: pp. 111-132 (Ch 5: LMN Spinal Nerve GSE)", completed: false },
  { id: randomUUID(), title: "Week 7: pp. 133-154 (Ch 5: LMN Spinal Nerve)", completed: false },
  { id: randomUUID(), title: "Week 8: pp. 155-176 (Ch 5-6: LMN Spinal, LMN Cranial)", completed: false },
  { id: randomUUID(), title: "Week 9: pp. 177-198 (Ch 6: LMN Cranial Nerve GSE)", completed: false },
  { id: randomUUID(), title: "Week 10: pp. 199-220 (Ch 6-7: LMN Cranial, LMN GVE)", completed: false },
  { id: randomUUID(), title: "Week 11: pp. 221-242 (Ch 7-8: LMN GVE, Upper Motor Neuron)", completed: false },
  { id: randomUUID(), title: "Week 12: pp. 243-266 (Ch 8-9: UMN, General Sensory)", completed: false },
  { id: randomUUID(), title: "Week 13: pp. 267-288 (Ch 10: Small Animal Spinal Cord)", completed: false },
  { id: randomUUID(), title: "Week 14: pp. 289-311 (Ch 10: Small Animal Spinal Cord)", completed: false },
  { id: randomUUID(), title: "Week 15: pp. 312-334 (Ch 11: Large Animal Spinal Cord)", completed: false },
  { id: randomUUID(), title: "Week 16: pp. 335-356 (Ch 11-12: Large Animal, Vestibular)", completed: false },
  { id: randomUUID(), title: "Week 17: pp. 357-378 (Ch 12-13: Vestibular, Cerebellum)", completed: false },
  { id: randomUUID(), title: "Week 18: pp. 379-400 (Ch 13: Cerebellum)", completed: false },
  { id: randomUUID(), title: "Week 19: pp. 401-422 (Ch 13-14: Cerebellum, Visual)", completed: false },
  { id: randomUUID(), title: "Week 20: pp. 423-444 (Ch 14: Visual System)", completed: false },
  { id: randomUUID(), title: "Week 21: pp. 445-466 (Ch 14-16: Visual, Auditory, Visceral Afferent)", completed: false },
  { id: randomUUID(), title: "Week 22: pp. 467-488 (Ch 16-18: Visceral, Limbic, Seizures)", completed: false },
  { id: randomUUID(), title: "Week 23: pp. 489-510 (Ch 18-19: Seizures, Diencephalon)", completed: false },
  { id: randomUUID(), title: "Week 24: pp. 511-532 (Ch 19-21: Diencephalon, Contractions, Neuro Exam)", completed: false },
  { id: randomUUID(), title: "Week 25: pp. 533-554 (Ch 21-22: Neuro Exam, Cases)", completed: false },
  { id: randomUUID(), title: "Week 26: pp. 555-end (Ch 22: Case Descriptions)", completed: false },
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

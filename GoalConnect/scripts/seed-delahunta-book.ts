import { getDb } from "../server/db";
import { studyBooks, studyChapters } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const DELAHUNTA_CHAPTERS = [
  { title: "Introduction", pageStart: 1, pageEnd: 5 },
  { title: "Neuroanatomy Gross Description and Atlas", pageStart: 6, pageEnd: 44 },
  { title: "Development of the Nervous System: Malformations", pageStart: 45, pageEnd: 78 },
  { title: "Cerebrospinal Fluid and Hydrocephalus", pageStart: 79, pageEnd: 105 },
  { title: "Lower Motor Neuron: Spinal Nerve, GSE", pageStart: 106, pageEnd: 165 },
  { title: "Lower Motor Neuron: GSE, Cranial Nerve", pageStart: 166, pageEnd: 202 },
  { title: "Lower Motor Neuron: GVE", pageStart: 203, pageEnd: 229 },
  { title: "Upper Motor Neuron", pageStart: 230, pageEnd: 245 },
  { title: "General Sensory Systems: GP and GSA", pageStart: 246, pageEnd: 266 },
  { title: "Small Animal Spinal Cord Disease", pageStart: 267, pageEnd: 311 },
  { title: "Large Animal Spinal Cord Disease", pageStart: 312, pageEnd: 344 },
  { title: "Vestibular System: Special Proprioception", pageStart: 345, pageEnd: 373 },
  { title: "Cerebellum", pageStart: 374, pageEnd: 413 },
  { title: "Visual System", pageStart: 414, pageEnd: 456 },
  { title: "Auditory System: Special Somatic Afferent", pageStart: 457, pageEnd: 464 },
  { title: "Visceral Afferent Systems", pageStart: 465, pageEnd: 470 },
  { title: "Nonolfactory Rhinencephalon: Limbic System", pageStart: 471, pageEnd: 477 },
  { title: "Seizure Disorders and Narcolepsy", pageStart: 478, pageEnd: 503 },
  { title: "Diencephalon", pageStart: 504, pageEnd: 514 },
  { title: "Uncontrolled Involuntary Skeletal Muscle Contractions", pageStart: 515, pageEnd: 530 },
  { title: "The Neurologic Examination", pageStart: 531, pageEnd: 546 },
  { title: "Case Descriptions", pageStart: 547, pageEnd: 570 },
];

async function seedDeLahuntaBook() {
  const db = getDb();
  const userId = 1;

  // Check if book already exists
  const existing = await db.select()
    .from(studyBooks)
    .where(and(
      eq(studyBooks.userId, userId),
      eq(studyBooks.title, "de Lahunta")
    ))
    .limit(1);

  if (existing.length > 0) {
    console.log("de Lahunta book already exists, skipping...");
    console.log(`Existing book ID: ${existing[0].id}`);
    process.exit(0);
  }

  // Create book
  const [book] = await db.insert(studyBooks).values({
    userId,
    title: "de Lahunta",
    abbreviation: "dL",
    position: 0,
  }).returning();

  console.log(`Created book: ${book.title} (ID: ${book.id})`);

  // Create chapters
  for (let i = 0; i < DELAHUNTA_CHAPTERS.length; i++) {
    const ch = DELAHUNTA_CHAPTERS[i];
    await db.insert(studyChapters).values({
      userId,
      bookId: book.id,
      title: ch.title,
      position: i,
      pageStart: ch.pageStart,
      pageEnd: ch.pageEnd,
      imagesCompleted: false,
      cardsCompleted: false,
    });
    console.log(`  Created chapter ${i + 1}: ${ch.title} (pp. ${ch.pageStart}-${ch.pageEnd})`);
  }

  console.log(`\nDone! Created de Lahunta with ${DELAHUNTA_CHAPTERS.length} chapters.`);
  console.log(`Book ID: ${book.id} (use this to link yearly goal)`);
  process.exit(0);
}

seedDeLahuntaBook().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

# de Lahunta Integration + Yearly Goals Grid Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate de Lahunta chapter tracking with study planner and redesign yearly goals to compact 3-column grid.

**Architecture:** Add linkedBookId to yearly_goals schema, seed de Lahunta as book with 22 chapters in study_planner, compute yearly goal progress from study_chapters completion, and create new CompactGoalGrid UI components.

**Tech Stack:** Drizzle ORM, PostgreSQL, React, TailwindCSS, TanStack Query

---

## Task 1: Add linked_book_id Column to yearly_goals Schema

**Files:**
- Modify: `shared/schema.ts:1260-1280`
- Create: `db/migrations/0XXX_add_linked_book_id_to_yearly_goals.sql`

**Step 1: Update schema.ts**

Add to yearlyGoals table definition:

```typescript
// In shared/schema.ts, find yearlyGoals table (~line 1260)
// Add after linkedDreamScrollCategory:
linkedBookId: integer("linked_book_id").references(() => studyBooks.id),
```

**Step 2: Create migration file**

```sql
-- db/migrations/0XXX_add_linked_book_id_to_yearly_goals.sql
ALTER TABLE yearly_goals ADD COLUMN linked_book_id INTEGER REFERENCES study_books(id);

COMMENT ON COLUMN yearly_goals.linked_book_id IS 'Links goal to study_books for computed progress';
```

**Step 3: Run migration**

```bash
DATABASE_URL="..." NODE_TLS_REJECT_UNAUTHORIZED=0 npm run db:push
```

**Step 4: Verify column exists**

```bash
DATABASE_URL="..." psql -c "\d yearly_goals" | grep linked_book_id
```
Expected: `linked_book_id | integer | | | `

**Step 5: Commit**

```bash
git add shared/schema.ts db/migrations/
git commit -m "feat(schema): add linked_book_id to yearly_goals"
```

---

## Task 2: Seed de Lahunta Book + 22 Chapters

**Files:**
- Create: `scripts/seed-delahunta-book.ts`

**Step 1: Create seed script**

```typescript
// scripts/seed-delahunta-book.ts
import { getDb } from "../server/db";
import { studyBooks, studyChapters } from "@shared/schema";
import { eq } from "drizzle-orm";

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
    .where(eq(studyBooks.title, "de Lahunta"))
    .limit(1);

  if (existing.length > 0) {
    console.log("de Lahunta book already exists, skipping...");
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
      imagesCompleted: false,
      cardsCompleted: false,
    });
    console.log(`  Created chapter ${i + 1}: ${ch.title}`);
  }

  console.log(`\nDone! Created de Lahunta with ${DELAHUNTA_CHAPTERS.length} chapters.`);
  console.log(`Book ID: ${book.id} (use this to link yearly goal)`);
  process.exit(0);
}

seedDeLahuntaBook().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
```

**Step 2: Run seed script**

```bash
DATABASE_URL="postgres://..." NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/seed-delahunta-book.ts
```

Expected output:
```
Created book: de Lahunta (ID: X)
  Created chapter 1: Introduction
  ...
Done! Created de Lahunta with 22 chapters.
Book ID: X (use this to link yearly goal)
```

**Step 3: Commit**

```bash
git add scripts/seed-delahunta-book.ts
git commit -m "feat(study): seed de Lahunta book with 22 chapters"
```

---

## Task 3: Add pageStart/pageEnd to study_chapters Schema

**Files:**
- Modify: `shared/schema.ts:1082-1093`

**Step 1: Update schema**

```typescript
// In shared/schema.ts, find studyChapters table
// Add after position:
pageStart: integer("page_start"),
pageEnd: integer("page_end"),
```

**Step 2: Run migration**

```bash
DATABASE_URL="..." NODE_TLS_REJECT_UNAUTHORIZED=0 npm run db:push
```

**Step 3: Update seed script to include page numbers**

Update the insert in `seed-delahunta-book.ts`:

```typescript
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
```

**Step 4: Commit**

```bash
git add shared/schema.ts scripts/seed-delahunta-book.ts
git commit -m "feat(schema): add page_start/page_end to study_chapters"
```

---

## Task 4: Link Yearly Goal to de Lahunta Book

**Files:**
- Create: `scripts/link-delahunta-yearly-goal.ts`

**Step 1: Create linking script**

```typescript
// scripts/link-delahunta-yearly-goal.ts
import { getDb } from "../server/db";
import { yearlyGoals, studyBooks } from "@shared/schema";
import { eq, and } from "drizzle-orm";

async function linkDeLahuntaGoal() {
  const db = getDb();
  const userId = 1;
  const year = "2026";

  // Find de Lahunta book
  const [book] = await db.select()
    .from(studyBooks)
    .where(and(
      eq(studyBooks.userId, userId),
      eq(studyBooks.title, "de Lahunta")
    ))
    .limit(1);

  if (!book) {
    console.error("de Lahunta book not found! Run seed-delahunta-book.ts first.");
    process.exit(1);
  }

  // Find yearly goal
  const [goal] = await db.select()
    .from(yearlyGoals)
    .where(and(
      eq(yearlyGoals.userId, userId),
      eq(yearlyGoals.year, year),
      eq(yearlyGoals.title, "Complete de Lahunta")
    ))
    .limit(1);

  if (!goal) {
    console.error("Yearly goal 'Complete de Lahunta' not found for 2026!");
    process.exit(1);
  }

  // Update goal: link to book, update targetValue, clear old subItems
  await db.update(yearlyGoals)
    .set({
      linkedBookId: book.id,
      targetValue: 22,
      subItems: [], // Clear old 26-week subItems
      currentValue: 0, // Reset progress (will be computed)
    })
    .where(eq(yearlyGoals.id, goal.id));

  console.log(`Linked yearly goal (ID: ${goal.id}) to de Lahunta book (ID: ${book.id})`);
  console.log("Progress will now be computed from study_chapters.");
  process.exit(0);
}

linkDeLahuntaGoal().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
```

**Step 2: Run linking script**

```bash
DATABASE_URL="..." NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/link-delahunta-yearly-goal.ts
```

**Step 3: Commit**

```bash
git add scripts/link-delahunta-yearly-goal.ts
git commit -m "feat(goals): link de Lahunta yearly goal to study book"
```

---

## Task 5: Update Yearly Goals API to Compute Progress from study_chapters

**Files:**
- Modify: `server/routes/yearly-goals.ts` (or wherever GET /api/yearly-goals is)

**Step 1: Find the GET endpoint**

```bash
grep -rn "yearly-goals" server/routes/ --include="*.ts" | head -20
```

**Step 2: Add logic to compute progress for linked books**

In the GET handler, after fetching goals:

```typescript
// For goals with linkedBookId, compute progress from study_chapters
for (const goal of goals) {
  if (goal.linkedBookId) {
    const chapters = await db.select()
      .from(studyChapters)
      .where(eq(studyChapters.bookId, goal.linkedBookId))
      .orderBy(studyChapters.position);

    const completedCount = chapters.filter(ch =>
      ch.imagesCompleted || ch.cardsCompleted // Consider "complete" if either step done
    ).length;

    // Override computed values
    goal.currentValue = completedCount;
    goal.targetValue = chapters.length;
    goal.subItems = chapters.map((ch, i) => ({
      id: `ch-${ch.id}`,
      title: `${i + 1}. ${ch.title}`,
      completed: ch.imagesCompleted || ch.cardsCompleted,
      pageStart: ch.pageStart,
      pageEnd: ch.pageEnd,
      pageCount: ch.pageEnd && ch.pageStart ? ch.pageEnd - ch.pageStart + 1 : null,
    }));
  }
}
```

**Step 3: Test API response**

```bash
curl -s http://localhost:5000/api/yearly-goals?year=2026 | jq '.[] | select(.title == "Complete de Lahunta")'
```

Expected: Goal with computed subItems from study_chapters

**Step 4: Commit**

```bash
git add server/routes/
git commit -m "feat(api): compute yearly goal progress from linked study book"
```

---

## Task 6: Create CompactGoalCard Component

**Files:**
- Create: `client/src/components/yearly-goals/CompactGoalCard.tsx`

**Step 1: Create component**

```tsx
// client/src/components/yearly-goals/CompactGoalCard.tsx
import { Check, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { getCategoryStyle } from "./categoryStyles";

interface CompactGoalCardProps {
  goal: YearlyGoalWithProgress;
  onClick?: () => void;
}

export function CompactGoalCard({ goal, onClick }: CompactGoalCardProps) {
  const style = getCategoryStyle(goal.category);
  const CategoryIcon = style.icon;
  const isComplete = goal.isCompleted;

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl text-left transition-all w-full",
        "bg-white/5 hover:bg-white/10 border border-white/10",
        isComplete && "bg-emerald-500/10 border-emerald-500/30",
        !isComplete && goal.progressPercent > 0 && "border-amber-500/30"
      )}
    >
      {/* Header: Icon + Title */}
      <div className="flex items-start gap-2 mb-2">
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0",
          style.iconBg
        )}>
          {isComplete ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <CategoryIcon className={cn("w-3.5 h-3.5", style.accentColor)} />
          )}
        </div>
        <span className={cn(
          "text-xs font-medium line-clamp-2 leading-tight",
          isComplete ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
        )}>
          {goal.title}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isComplete ? "bg-emerald-400" : "bg-peach-400"
          )}
          style={{ width: `${goal.progressPercent}%` }}
        />
      </div>

      {/* Footer: Progress + XP */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[var(--text-muted)]">
          {goal.computedValue}/{goal.targetValue}
        </span>
        <span className={cn("flex items-center gap-0.5", style.accentColor)}>
          <Trophy className="w-2.5 h-2.5" />
          {goal.xpReward}
        </span>
      </div>
    </button>
  );
}
```

**Step 2: Export from index**

```typescript
// client/src/components/yearly-goals/index.ts
export { CompactGoalCard } from "./CompactGoalCard";
```

**Step 3: Commit**

```bash
git add client/src/components/yearly-goals/
git commit -m "feat(ui): add CompactGoalCard component"
```

---

## Task 7: Create CompactGoalGrid Component

**Files:**
- Create: `client/src/components/yearly-goals/CompactGoalGrid.tsx`

**Step 1: Create grid component**

```tsx
// client/src/components/yearly-goals/CompactGoalGrid.tsx
import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { CompactGoalCard } from "./CompactGoalCard";

interface CompactGoalGridProps {
  goals: YearlyGoalWithProgress[];
  onGoalClick?: (goalId: number) => void;
}

export function CompactGoalGrid({ goals, onGoalClick }: CompactGoalGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {goals.map((goal) => (
        <CompactGoalCard
          key={goal.id}
          goal={goal}
          onClick={() => onGoalClick?.(goal.id)}
        />
      ))}
    </div>
  );
}
```

**Step 2: Export from index**

```typescript
// client/src/components/yearly-goals/index.ts
export { CompactGoalGrid } from "./CompactGoalGrid";
```

**Step 3: Commit**

```bash
git add client/src/components/yearly-goals/
git commit -m "feat(ui): add CompactGoalGrid component"
```

---

## Task 8: Update IcyDash to Use Compact Grid

**Files:**
- Modify: `client/src/pages/IcyDash.tsx`

**Step 1: Import new component**

```typescript
import { CompactGoalGrid } from "@/components/yearly-goals";
```

**Step 2: Replace YearlyCategory mapping with CompactGoalGrid**

Find the yearly goals section (~line 945) and replace:

```tsx
{/* Old code - remove this */}
{yearlyCategories.map((category) => (
  <YearlyCategory ... />
))}

{/* New code */}
<CompactGoalGrid
  goals={yearlyGoals}
  onGoalClick={(goalId) => {
    // Navigate to goals page or open detail modal
    window.location.href = `/goals#goal-${goalId}`;
  }}
/>
```

**Step 3: Test in browser**

```bash
npm run dev
# Open http://localhost:5000 and check IcyDash
```

**Step 4: Commit**

```bash
git add client/src/pages/IcyDash.tsx
git commit -m "feat(icydash): use compact goal grid"
```

---

## Task 9: Update /goals Page to Use Compact Grid

**Files:**
- Modify: `client/src/pages/Goals.tsx` or `client/src/pages/YearlyGoals.tsx`

**Step 1: Find the goals page**

```bash
ls client/src/pages/ | grep -i goal
```

**Step 2: Import and use CompactGoalGrid**

Similar to IcyDash, replace the category-based rendering with the grid.

**Step 3: Add category filter tabs (optional enhancement)**

```tsx
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

const filteredGoals = selectedCategory
  ? yearlyGoals.filter(g => g.category === selectedCategory)
  : yearlyGoals;

// Category tabs
<div className="flex gap-2 mb-4 overflow-x-auto">
  <button onClick={() => setSelectedCategory(null)}>All</button>
  {yearlyCategories.map(cat => (
    <button key={cat} onClick={() => setSelectedCategory(cat)}>
      {categoryLabels[cat]}
    </button>
  ))}
</div>

<CompactGoalGrid goals={filteredGoals} />
```

**Step 4: Commit**

```bash
git add client/src/pages/
git commit -m "feat(goals): use compact goal grid on goals page"
```

---

## Task 10: Add Chapter Detail View for Compound Goals

**Files:**
- Create: `client/src/components/yearly-goals/ChapterSubItemCard.tsx`
- Modify: `client/src/components/yearly-goals/CompactGoalCard.tsx`

**Step 1: Create chapter sub-item card**

```tsx
// client/src/components/yearly-goals/ChapterSubItemCard.tsx
import { Check, Circle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterSubItem {
  id: string;
  title: string;
  completed: boolean;
  pageStart?: number;
  pageEnd?: number;
  pageCount?: number;
}

interface ChapterSubItemCardProps {
  chapter: ChapterSubItem;
  onClick?: () => void;
}

export function ChapterSubItemCard({ chapter, onClick }: ChapterSubItemCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg text-left w-full transition-all",
        "bg-white/5 hover:bg-white/10 border border-white/10",
        chapter.completed && "bg-emerald-500/10 border-emerald-500/30"
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn(
          "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
          chapter.completed ? "bg-emerald-500/20" : "bg-white/10"
        )}>
          {chapter.completed ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <Circle className="w-3 h-3 text-[var(--text-muted)]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs font-medium truncate",
            chapter.completed && "line-through text-[var(--text-muted)]"
          )}>
            {chapter.title}
          </p>
          {chapter.pageStart && chapter.pageEnd && (
            <p className="text-[10px] text-[var(--text-muted)]">
              pp. {chapter.pageStart}-{chapter.pageEnd} ({chapter.pageCount}p)
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/yearly-goals/
git commit -m "feat(ui): add ChapterSubItemCard for compound goals"
```

---

## Task 11: TypeScript Check + Final Testing

**Step 1: Run type check**

```bash
npm run check
```

Fix any type errors.

**Step 2: Test full flow**

1. Open study planner, find de Lahunta book
2. Mark a chapter complete
3. Check yearly goals - should show updated progress
4. Verify grid layout on IcyDash
5. Verify grid layout on /goals page

**Step 3: Final commit**

```bash
git add .
git commit -m "feat: complete de Lahunta integration + compact goal grid"
```

---

## Success Checklist

- [ ] `linked_book_id` column exists in yearly_goals
- [ ] de Lahunta book exists in study_books with 22 chapters
- [ ] Yearly goal linked to book
- [ ] API returns computed progress from study_chapters
- [ ] CompactGoalCard renders correctly
- [ ] CompactGoalGrid shows 3 columns on desktop
- [ ] IcyDash uses compact grid
- [ ] /goals page uses compact grid
- [ ] Chapter cards show page counts
- [ ] Completing chapter in study planner updates yearly goal

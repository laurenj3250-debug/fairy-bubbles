# Roast Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Fix all 9 issues identified in the code roast - 2 critical, 5 important, 2 minor.

**Architecture:** Direct fixes to existing files. No new architecture needed - just cleaning up bugs and adding missing error handling.

**Tech Stack:** React 18, TypeScript, TanStack Query, Express

**Production Checklist:**
- [x] Centralized config (no new magic numbers)
- [ ] Error handling for API failures (Tasks 3, 4)
- [x] Loading states already exist
- [ ] Toast notifications complete (Task 5)
- [x] Mobile-friendly (existing)
- [x] Type safety maintained

---

## Phase 1: Critical Fixes

### Task 1.1: Remove Study Planner Backend Remnants

**Files:**
- Modify: `server/routes/yearly-goals.ts:230-259` (remove linkedBookId progress computation)
- Modify: `server/routes/yearly-goals.ts:669-739` (remove study chapter toggle handling)

**Problem:** Backend still references deleted Study Planner feature. Code queries `studyChapters` table and sets `sourceLabel = "Study Planner"`.

**Solution:** Remove the `linkedBookId` handling blocks entirely. Any existing goals with `linkedBookId` will be treated as manual goals with their current `manualValue`.

**Step 1: Remove the linkedBookId progress computation (lines 230-259)**

Find and delete this entire block:
```typescript
// Study book integration - compute progress from study_chapters
if (goal.linkedBookId) {
  source = "auto";
  sourceLabel = "Study Planner";
  // ... all the way to the closing brace before line 261
}
```

**Step 2: Remove the study chapter toggle handling (lines 669-739)**

Find the block starting with:
```typescript
// Handle book-linked goals - toggle study chapter completion
if (goal.linkedBookId && subItemId.startsWith("ch-")) {
```

Delete this entire if-block (including the closing brace and return statement).

**Step 3: Remove the studyChapters import at the top of the file**

Find line 22: `studyChapters,` and remove it from the imports.

**Step 4: Verify**
```bash
npm run check
```
Expected: No TypeScript errors related to studyChapters

**Step 5: Commit**
```bash
git add server/routes/yearly-goals.ts
git commit -m "fix(backend): remove Study Planner remnants from yearly-goals"
```

---

### Task 1.2: Fix ForestBackground SSR/Hydration Bug

**Files:**
- Modify: `client/src/components/ForestBackground.tsx:8-12`

**Problem:** `useIsMobile()` returns `undefined` initially, causing `!!undefined = false`. This means mobile users see 35 particles flash before re-rendering to 10.

**Solution:** Default to mobile-friendly values until hydration completes (mobile-first approach).

**Step 1: Update the particle count logic**

Change from:
```typescript
const isMobile = useIsMobile();

// Reduce particle count on mobile for better performance
const starCount = isMobile ? 10 : 35;
const snowflakeCount = isMobile ? 6 : 20;
```

To:
```typescript
const isMobile = useIsMobile();

// Default to mobile-friendly counts until hydration completes (prevents flash)
// useIsMobile returns false initially, so we use mobile defaults as baseline
const starCount = isMobile === false ? 35 : 10;  // Desktop only if explicitly false after hydration
const snowflakeCount = isMobile === false ? 20 : 6;
```

**Wait - this won't work because useIsMobile coerces to boolean with `!!`.**

**Better solution:** Check the hook itself. The issue is `!!isMobile` returns `false` for `undefined`.

Actually, let's fix this properly by checking if we're on the server or initial render:

```typescript
const isMobile = useIsMobile();

// Reduce particle count on mobile for better performance
// Start with mobile-friendly defaults to prevent flash during hydration
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

// Until mounted, use mobile-friendly defaults to prevent hydration mismatch
const starCount = !mounted || isMobile ? 10 : 35;
const snowflakeCount = !mounted || isMobile ? 6 : 20;
```

**Step 2: Add the missing imports**

Add `useState, useEffect` to the React import if not present.

**Step 3: Verify**
```bash
npm run check
```

**Step 4: Commit**
```bash
git add client/src/components/ForestBackground.tsx
git commit -m "fix(ui): prevent particle count flash during hydration"
```

---

## Phase 2: Important Fixes

### Task 2.1: Add Error State to RecentAdventuresWidget

**Files:**
- Modify: `client/src/components/dashboard/RecentAdventuresWidget.tsx:14, 36-51`

**Step 1: Destructure error from the hook**

Change line 14 from:
```typescript
const { adventures, isLoading } = useAdventures({ year: currentYear, limit: 4 });
```

To:
```typescript
const { adventures, isLoading, error } = useAdventures({ year: currentYear, limit: 4 });
```

**Step 2: Add error state handling after the loading check**

After the `if (isLoading)` block (around line 34), add:

```typescript
if (error) {
  return (
    <div className="glass-card frost-accent p-3">
      <div className="flex items-center gap-2 mb-3">
        <Mountain className="w-4 h-4 text-red-400" />
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Recent Adventures
        </span>
      </div>
      <div className="text-center py-4 text-sm text-red-400">
        Failed to load adventures
      </div>
    </div>
  );
}
```

**Step 3: Verify & Commit**
```bash
npm run check
git add client/src/components/dashboard/RecentAdventuresWidget.tsx
git commit -m "fix(widget): add error state to RecentAdventuresWidget"
```

---

### Task 2.2: Add Error State to TimelineTab

**Files:**
- Modify: `client/src/pages/Adventures.tsx:496-535`

**Step 1: Destructure error from the hook**

Around line 496, change:
```typescript
const {
  adventures,
  isLoading,
  updateAdventure,
  deleteAdventure,
  isUpdating,
} = useAdventures({ year, limit: 100 });
```

To:
```typescript
const {
  adventures,
  isLoading,
  error,
  updateAdventure,
  deleteAdventure,
  isUpdating,
} = useAdventures({ year, limit: 100 });
```

**Step 2: Add error state after the loading check**

After the `if (isLoading)` block (around line 535), add:

```typescript
if (error) {
  return (
    <div className="glass-card frost-accent p-12 text-center">
      <Mountain className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
        Failed to load adventures
      </h3>
      <p className="text-sm text-[var(--text-muted)]">
        {error instanceof Error ? error.message : "Please try again later"}
      </p>
    </div>
  );
}
```

**Step 3: Verify & Commit**
```bash
npm run check
git add client/src/pages/Adventures.tsx
git commit -m "fix(timeline): add error state to TimelineTab"
```

---

### Task 2.3: Fix Incomplete Toast in TimelineTab Delete

**Files:**
- Modify: `client/src/pages/Adventures.tsx:523-525`

**Step 1: Add description to the error toast**

Change:
```typescript
} catch (error) {
  toast({ title: "Error", variant: "destructive" });
}
```

To:
```typescript
} catch (error) {
  toast({
    title: "Error",
    description: error instanceof Error ? error.message : "Failed to delete adventure",
    variant: "destructive",
  });
}
```

**Step 2: Commit**
```bash
git add client/src/pages/Adventures.tsx
git commit -m "fix(toast): add description to TimelineTab delete error"
```

---

### Task 2.4: Remove "// REMOVED:" Comment Tombstones

**Files to clean:**
- `client/src/components/dashboard/YearlyGoalsSection.tsx` (3 comments)
- `client/src/components/yearly-goals/CompactGoalGrid.tsx` (3 comments)
- `client/src/components/yearly-goals/CompactGoalCard.tsx` (2 comments)
- `client/src/pages/IcyDash.tsx` (5 comments)
- `server/routes.ts` (2 comments)

**Step 1: Remove all lines containing `// REMOVED:`**

In each file, delete the entire line containing `// REMOVED:` comments. These are tombstones, not documentation.

**Step 2: Verify & Commit**
```bash
npm run check
git add -A
git commit -m "chore: remove tombstone comments from codebase"
```

---

### Task 2.5: Add "Add Adventure" Button to Timeline

**Files:**
- Modify: `client/src/pages/Adventures.tsx` (TimelineTab function)

**Problem:** Timeline view has no way to add new adventures - users must switch tabs.

**Step 1: Add state and handlers for the modal**

In `TimelineTab`, add after the existing state declarations:
```typescript
const [showAddModal, setShowAddModal] = useState(false);
```

**Step 2: Add createAdventure to the hook destructuring**

```typescript
const {
  adventures,
  isLoading,
  error,
  createAdventure,  // ADD THIS
  updateAdventure,
  deleteAdventure,
  isCreating,       // ADD THIS
  isUpdating,
} = useAdventures({ year, limit: 100 });
```

**Step 3: Add handleCreate function**

After `handleDelete`, add:
```typescript
const handleCreate = async (input: AdventureInput) => {
  try {
    await createAdventure(input);
    setShowAddModal(false);
    toast({ title: "Adventure added!" });
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to add adventure",
      variant: "destructive",
    });
  }
};
```

**Step 4: Add header with "Add Adventure" button before AdventureTimeline**

Replace the return statement to include a header:
```typescript
return (
  <>
    {/* Stats header with Add button */}
    <div className="glass-card frost-accent p-4 flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="text-lg font-bold text-[var(--text-primary)]">
            Memory Lane
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {adventures.length} adventures
          </div>
        </div>
      </div>
      <button
        onClick={() => setShowAddModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Adventure
      </button>
    </div>

    <AdventureTimeline
      adventures={adventures}
      onEdit={setEditingAdventure}
      onDelete={handleDelete}
    />

    {/* Add Modal */}
    {showAddModal && (
      <AdventureModal
        adventure={null}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreate}
        isSubmitting={isCreating}
      />
    )}

    {/* Edit Modal */}
    {editingAdventure && (
      <AdventureModal
        adventure={editingAdventure}
        onClose={() => setEditingAdventure(null)}
        onSubmit={(input) => handleUpdate({ ...input, id: editingAdventure.id })}
        isSubmitting={isUpdating}
      />
    )}
  </>
);
```

**Step 5: Import Plus icon** (already imported at top of file, verify)

**Step 6: Verify & Commit**
```bash
npm run check
git add client/src/pages/Adventures.tsx
git commit -m "feat(timeline): add 'Add Adventure' button to Memory Lane"
```

---

## Phase 3: Minor Fixes

### Task 3.1: Remove Unused isLast Prop from TimelineEntry

**Files:**
- Modify: `client/src/components/adventures/AdventureTimeline.tsx:178-189`

**Step 1: Remove isLast from TimelineEntryProps interface**

Change:
```typescript
interface TimelineEntryProps {
  adventure: Adventure;
  onEdit?: (adventure: Adventure) => void;
  onDelete?: (id: number) => void;
  isLast: boolean;
}
```

To:
```typescript
interface TimelineEntryProps {
  adventure: Adventure;
  onEdit?: (adventure: Adventure) => void;
  onDelete?: (id: number) => void;
}
```

**Step 2: Remove isLast from destructuring in TimelineEntry**

Change:
```typescript
function TimelineEntry({
  adventure,
  onEdit,
  onDelete,
  isLast,
}: TimelineEntryProps) {
```

To:
```typescript
function TimelineEntry({
  adventure,
  onEdit,
  onDelete,
}: TimelineEntryProps) {
```

**Step 3: Remove isLast prop from TimelineEntry usage in TimelineMonth**

Around line 165, change:
```typescript
<TimelineEntry
  key={adventure.id}
  adventure={adventure}
  onEdit={onEdit}
  onDelete={onDelete}
  isLast={index === adventures.length - 1}
/>
```

To:
```typescript
<TimelineEntry
  key={adventure.id}
  adventure={adventure}
  onEdit={onEdit}
  onDelete={onDelete}
/>
```

**Step 4: Verify & Commit**
```bash
npm run check
git add client/src/components/adventures/AdventureTimeline.tsx
git commit -m "chore: remove unused isLast prop from TimelineEntry"
```

---

### Task 3.2: Add thumbPath Fallback to AdventureTimeline

**Files:**
- Modify: `client/src/components/adventures/AdventureTimeline.tsx:207`

**Problem:** Timeline uses `photoPath` but should fallback to `thumbPath` if full photo not available.

**Step 1: Update the image source logic**

Change:
```typescript
{adventure.photoPath ? (
  <img
    src={adventure.photoPath}
```

To:
```typescript
{(adventure.photoPath || adventure.thumbPath) ? (
  <img
    src={adventure.photoPath || adventure.thumbPath}
```

**Step 2: Verify & Commit**
```bash
npm run check
git add client/src/components/adventures/AdventureTimeline.tsx
git commit -m "fix(timeline): fallback to thumbPath if photoPath missing"
```

---

## Final Verification

After all tasks complete:

```bash
# Full type check
npm run check

# Build verification
npm run build

# Show all commits from this fix session
git log --oneline -15
```

**Expected:** 10 commits total (9 fixes + build verification passes)

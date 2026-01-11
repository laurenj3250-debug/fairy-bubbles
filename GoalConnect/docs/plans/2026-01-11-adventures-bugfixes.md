# Adventures + Birding Feature: Bug Fixes & Improvements

**Date:** 2026-01-11
**Status:** Planning
**Priority:** Critical bugs first, then high, then medium

## Issues Summary

| Priority | Issue | Impact |
|----------|-------|--------|
| CRITICAL | Route ordering conflict | Dates endpoint broken |
| CRITICAL | Mobile touch actions inaccessible | Feature unusable on mobile |
| CRITICAL | Multer auth race condition | Potential orphaned files |
| CRITICAL | Memory leak from Object URLs | Browser memory grows |
| HIGH | No error feedback on mutations | Users don't know if it failed |
| HIGH | Orphaned files on DB failure | Disk fills up |
| HIGH | parseInt NaN not handled | 500 errors instead of 400 |
| HIGH | Windows path compatibility | Breaks on Windows |
| MEDIUM | No pagination for birds | Slow with many species |
| MEDIUM | Double-click race condition | Duplicate entries |
| MEDIUM | Search not debounced | Too many API calls |
| MEDIUM | Year filter hardcoded | Can't see past years |
| MEDIUM | Species case sensitivity | Duplicates possible |

---

## Phase 1: Critical Fixes

### 1.1 Route Ordering (CRITICAL)

**Problem:** `/api/adventures/:id` matches before `/api/adventures/dates/:year`

**Files:** `server/routes/adventures.ts`

**Fix:** Reorder routes so specific paths come before parameterized paths:
```
BEFORE: GET /:id, GET /dates/:year
AFTER:  GET /dates/:year, GET /count/:year, GET /:id
```

**Changes:**
1. Move `GET /api/adventures/dates/:year` BEFORE `GET /api/adventures/:id`
2. Move `GET /api/birds/count/:year` BEFORE `GET /api/birds/:id`

**Lines to move:**
- Lines 213-232 → Move before line 234
- Lines 419-438 → Move before line 440

---

### 1.2 Mobile Touch Actions (CRITICAL)

**Problem:** Edit/Delete buttons only show on hover, invisible on touch devices

**Files:** `client/src/pages/Adventures.tsx`

**Fix:** Replace hover-based actions with always-visible or tap-to-reveal pattern

**Option A: Always visible actions (Recommended)**
- Show edit/delete icons in corner with semi-transparent background
- Smaller icons that don't obscure photo

**Option B: Long-press to reveal**
- Requires more complex touch handling

**Changes:**
1. Remove `onMouseEnter`/`onMouseLeave` state management
2. Always render action buttons
3. Style with `opacity-0 group-hover:opacity-100 md:opacity-0` (visible on mobile, hover on desktop)
4. Add touch-friendly hit targets (min 44px)

**AdventureCard changes (~lines 200-272):**
```tsx
// Remove useState for showActions
// Replace conditional render with always-visible + CSS

<div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
```

**BirdCard changes (~lines 573-645):** Same pattern

---

### 1.3 Memory Leak - Object URLs (CRITICAL)

**Problem:** `URL.createObjectURL()` never cleaned up

**Files:** `client/src/pages/Adventures.tsx`

**Fix:** Use `useEffect` cleanup to revoke URLs

**Changes in AdventureModal (~line 275):**
```tsx
const [preview, setPreview] = useState<string | null>(adventure?.thumbPath || null);
const [localPreview, setLocalPreview] = useState<string | null>(null);

// Cleanup effect
useEffect(() => {
  return () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }
  };
}, [localPreview]);

const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Revoke old URL before creating new one
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }
    const newUrl = URL.createObjectURL(file);
    setLocalPreview(newUrl);
    setPreview(newUrl);
    setPhoto(file);
  }
};
```

**Same changes in BirdModal (~line 648)**

---

### 1.4 Multer Auth + Orphaned Files (CRITICAL)

**Problem:**
1. Auth called inside multer callback (race condition)
2. Files saved before DB insert, not cleaned up on failure

**Files:** `server/routes/adventures.ts`

**Fix:** Wrap operations in try/catch with cleanup

**Changes:**

**A. Add cleanup helper:**
```typescript
function cleanupUploadedFile(file?: Express.Multer.File) {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
    // Also try to delete thumbnail if it exists
    const thumbPath = file.path.replace(/(\.[^.]+)$/, '_thumb$1');
    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }
  }
}
```

**B. Wrap POST /api/adventures (~lines 254-292):**
```typescript
app.post(
  "/api/adventures",
  upload.single("photo"),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const parsed = createAdventureSchema.safeParse(req.body);
    if (!parsed.success) {
      cleanupUploadedFile(req.file);  // Clean up on validation failure
      return res.status(400).json({ error: parsed.error.errors[0].message });
    }

    try {
      // ... existing logic ...
      const [adventure] = await db.insert(...)
      res.status(201).json(adventure);
    } catch (error) {
      cleanupUploadedFile(req.file);  // Clean up on DB failure
      throw error;  // Re-throw for error handler
    }
  })
);
```

**C. Same pattern for:**
- PUT /api/adventures/:id
- POST /api/birds
- PUT /api/birds/:id

---

## Phase 2: High Severity Fixes

### 2.1 Error Feedback on Mutations (HIGH)

**Problem:** No user feedback when create/update/delete fails

**Files:** `client/src/pages/Adventures.tsx`

**Fix:** Add try/catch with toast notifications

**Dependencies:** Check if toast system exists in project

**Changes:**

**A. Add error handling to handlers:**
```tsx
const handleCreate = async (input: AdventureInput) => {
  try {
    await createAdventure(input);
    setShowModal(false);
    // toast.success("Adventure added!");
  } catch (error) {
    // toast.error(error.message || "Failed to add adventure");
    console.error(error);
    // Don't close modal on error
  }
};
```

**B. Same pattern for:**
- `handleUpdate` in AdventuresTab
- `handleDelete` in AdventuresTab
- `handleCreate` in BirdsTab
- `handleUpdate` in BirdsTab
- `handleDelete` in BirdsTab

**C. Check for existing toast implementation:**
```bash
grep -r "toast" client/src/components --include="*.tsx" | head -5
```

---

### 2.2 parseInt NaN Handling (HIGH)

**Problem:** `parseInt("abc")` returns NaN, query fails silently

**Files:** `server/routes/adventures.ts`

**Fix:** Add ID validation helper

**Changes:**

**A. Add validation helper after line 16:**
```typescript
function parseId(idStr: string): number | null {
  const id = parseInt(idStr, 10);
  return isNaN(id) || id < 1 ? null : id;
}
```

**B. Update all routes using parseInt:**
```typescript
// Before
const id = parseInt(req.params.id);

// After
const id = parseId(req.params.id);
if (id === null) {
  return res.status(400).json({ error: "Invalid ID" });
}
```

**Routes to update:**
- GET /api/adventures/:id (line 239)
- PUT /api/adventures/:id (line 300)
- DELETE /api/adventures/:id (line 347)
- GET /api/birds/:id (line 445)
- PUT /api/birds/:id (line 528)
- DELETE /api/birds/:id (line 600)

---

### 2.3 Windows Path Compatibility (HIGH)

**Problem:** Hardcoded forward slashes fail on Windows

**Files:** `server/routes/adventures.ts`

**Fix:** Use path.sep or normalize paths

**Changes to toUrlPath function (~line 94):**
```typescript
function toUrlPath(filePath: string): string {
  // Normalize to forward slashes for URLs
  const normalized = filePath.replace(/\\/g, '/');

  const publicIndex = normalized.indexOf("/public/");
  if (publicIndex !== -1) {
    return normalized.substring(publicIndex + "/public".length);
  }
  const uploadsIndex = normalized.indexOf("/uploads/");
  if (uploadsIndex !== -1) {
    return normalized.substring(uploadsIndex);
  }
  return normalized;
}
```

---

## Phase 3: Medium Severity Fixes

### 3.1 Birds Pagination (MEDIUM)

**Problem:** Birds endpoint loads ALL species at once

**Files:** `server/routes/adventures.ts`, `client/src/hooks/useBirds.ts`, `client/src/pages/Adventures.tsx`

**Changes:**

**A. Backend - Add pagination to GET /api/birds (~line 375):**
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 50;
const offset = (page - 1) * limit;

// Add .limit(limit).offset(offset) to query
// Add count query for total
// Return { birds, pagination: { page, limit, total, totalPages } }
```

**B. Frontend hook - Add pagination params:**
```typescript
export interface UseBirdsOptions {
  sort?: BirdSort;
  search?: string;
  year?: string;
  page?: number;
  limit?: number;
}
```

**C. Frontend UI - Add load more or pagination controls**

---

### 3.2 Search Debounce (MEDIUM)

**Problem:** Every keystroke = API call

**Files:** `client/src/pages/Adventures.tsx`

**Fix:** Add debounced search

**Changes in BirdsTab (~line 425):**
```tsx
import { useDebouncedValue } from "@/hooks/useDebouncedValue"; // or implement

const [searchInput, setSearchInput] = useState("");
const debouncedSearch = useDebouncedValue(searchInput, 300);

const { birds, ... } = useBirds({
  sort,
  search: debouncedSearch || undefined
});

// In JSX:
<input
  value={searchInput}
  onChange={(e) => setSearchInput(e.target.value)}
  ...
/>
```

**May need to create hook if not exists:**
```typescript
// hooks/useDebouncedValue.ts
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

### 3.3 Year Filter UI (MEDIUM)

**Problem:** Can't view adventures from past years

**Files:** `client/src/pages/Adventures.tsx`

**Fix:** Add year selector dropdown

**Changes:**

**A. Add year state to Adventures component:**
```tsx
const currentYear = new Date().getFullYear();
const [selectedYear, setSelectedYear] = useState(currentYear.toString());
const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);
```

**B. Add year selector in header:**
```tsx
<select
  value={selectedYear}
  onChange={(e) => setSelectedYear(e.target.value)}
  className="..."
>
  {yearOptions.map(y => (
    <option key={y} value={y}>{y}</option>
  ))}
</select>
```

**C. Pass selectedYear to AdventuresTab and BirdsTab**

---

### 3.4 Species Case Insensitivity (MEDIUM)

**Problem:** "Northern Cardinal" vs "northern cardinal" = duplicates

**Files:** `server/routes/adventures.ts`

**Fix:** Normalize species name before comparison

**Changes:**

**A. Add normalize helper:**
```typescript
function normalizeSpeciesName(name: string): string {
  // Title case: "northern cardinal" -> "Northern Cardinal"
  return name.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
```

**B. Update POST /api/birds (~line 477):**
```typescript
const normalizedName = normalizeSpeciesName(speciesName);

// Check for duplicate with normalized name
const [existing] = await db
  .select()
  .from(birdSightings)
  .where(
    and(
      eq(birdSightings.userId, userId),
      sql`LOWER(${birdSightings.speciesName}) = LOWER(${normalizedName})`
    )
  );

// Insert with normalized name
await db.insert(birdSightings).values({
  ...
  speciesName: normalizedName,
  ...
});
```

**C. Same for PUT /api/birds/:id duplicate check**

---

### 3.5 Double-Click Prevention (MEDIUM)

**Problem:** Spam clicking can create duplicates

**Fix:** Disable button while mutation is pending

**Already partially implemented** with `isCreating`/`isUpdating` but need to also disable the "Add" button:

**Changes in AdventuresTab (~line 138):**
```tsx
<button
  onClick={() => setShowModal(true)}
  disabled={isCreating || isUpdating}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
```

**Same for BirdsTab (~line 508)**

---

## Phase 4: UX Improvements

### 4.1 Modal Backdrop Click to Close

**Files:** `client/src/pages/Adventures.tsx`

**Changes in AdventureModal and BirdModal:**
```tsx
<div
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
  onClick={onClose}  // Add this
>
  <div
    className="glass-card frost-accent w-full max-w-md p-6 space-y-4"
    onClick={(e) => e.stopPropagation()}  // Prevent close when clicking modal content
  >
```

---

### 4.2 Keyboard Navigation (Escape to Close)

**Changes in AdventureModal and BirdModal:**
```tsx
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [onClose]);
```

---

## Implementation Order

| Order | Phase | Task | Est. Lines Changed |
|-------|-------|------|-------------------|
| 1 | 1.1 | Route ordering | ~20 lines moved |
| 2 | 1.2 | Mobile touch actions | ~30 lines |
| 3 | 1.3 | Memory leak fix | ~40 lines |
| 4 | 1.4 | File cleanup on failure | ~50 lines |
| 5 | 2.1 | Error feedback | ~40 lines |
| 6 | 2.2 | parseInt validation | ~30 lines |
| 7 | 2.3 | Windows paths | ~10 lines |
| 8 | 3.2 | Search debounce | ~30 lines |
| 9 | 3.3 | Year filter | ~40 lines |
| 10 | 3.4 | Species normalization | ~20 lines |
| 11 | 3.5 | Double-click prevention | ~10 lines |
| 12 | 4.1 | Backdrop click | ~10 lines |
| 13 | 4.2 | Escape key | ~20 lines |
| 14 | 3.1 | Birds pagination | ~80 lines |

**Total estimated: ~430 lines changed**

---

## Testing Checklist

After implementation, verify:

- [ ] `/api/adventures/dates/2026` returns dates (not 404)
- [ ] `/api/birds/count/2026` returns count (not 404)
- [ ] Mobile: can tap to see edit/delete buttons
- [ ] Creating adventure with photo, then immediately closing browser - no memory growth
- [ ] Upload photo, DB insert fails (simulate) - photo file deleted
- [ ] Failed mutation shows error to user
- [ ] `/api/adventures/abc` returns 400, not 500
- [ ] Works on Windows (if testable)
- [ ] Search "cardinal" while typing fast - only 1-2 API calls
- [ ] Can switch years and see past adventures
- [ ] "northern cardinal" and "Northern Cardinal" treated as same
- [ ] Click backdrop to close modal
- [ ] Press Escape to close modal

---

## Out of Scope (Future)

- Activity autocomplete (plan feature)
- Link bird to adventure UI (plan feature)
- Loading skeletons (polish)
- Proper delete confirmation dialog (polish)
- Server-side MIME type validation (security hardening)
- Index optimization for LIKE queries (performance)

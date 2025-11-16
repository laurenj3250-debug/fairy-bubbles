# Common VetHub Issues and Solutions

## Issue 1: Field Name Mismatches (Most Common!)

### Symptoms
- 400 Bad Request errors
- Error message: "Task title is required" or similar
- Frontend sends data but API rejects it

### Root Cause
Frontend and API use different field names:
- Frontend sends: `{ name: "Task title" }`
- API expects: `{ title: "Task title" }`

### Solution Pattern
```typescript
// In API route (route.ts):
// Accept BOTH field names for compatibility
const taskTitle = body.title || body.name;
if (!taskTitle || typeof taskTitle !== 'string') {
  return NextResponse.json(
    { error: 'Task title or name is required' },
    { status: 400 }
  );
}
```

### How to Detect
1. Check browser Network tab → Request payload
2. Read API route code → Check validation
3. Compare field names

### Common Mismatches
- `title` ↔ `name`
- `patientId` ↔ `id` 
- `description` ↔ `notes`
- `demographics.name` ↔ `name`

---

## Issue 2: DATABASE_URL Configuration

### Symptoms
- PrismaClientInitializationError
- "Error opening a TLS connection"
- "URL must start with postgresql://"
- Database timeouts

### Root Cause
Using wrong DATABASE_URL for environment:
- **Local dev needs**: Public Railway URL (`shinkansen.proxy.rlwy.net`)
- **Railway needs**: Internal URL (`postgres.railway.internal`)

### Solution
**`.env.local` (local dev):**
```
DATABASE_URL="postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:40506/railway?sslmode=require"
```

**Railway environment variables:**
```
DATABASE_URL="postgresql://postgres:PASSWORD@postgres.railway.internal:5432/railway"
```

### How to Fix
1. Check which environment you're in
2. Update `.env.local` for local dev
3. Restart dev server: `npm run dev`
4. Test: `curl http://localhost:3000/api/patients`

---

## Issue 3: UnifiedPatient vs Patient Type Mismatch

### Symptoms
- TypeScript errors about missing properties
- `demographics.name` is undefined
- Data displays as "[object Object]"

### Root Cause
VetHub uses `UnifiedPatient` (combines VetRadar + local patients) but code expects `Patient`:
```typescript
// UnifiedPatient structure:
{
  id: string,
  source: 'local' | 'vetradar',
  demographics: {
    name: string,
    age: string,
    breed: string
  },
  // ... other fields
}

// Old Patient structure:
{
  id: string,
  name: string,  // Direct property!
  age: string,
  breed: string
}
```

### Solution Pattern
```typescript
// WRONG:
<div>{patient.name}</div>

// CORRECT:
<div>{patient.demographics?.name || patient.name || 'Unknown'}</div>
```

### How to Fix
1. Search for: `patient.name`, `patient.age`, `patient.breed`
2. Replace with: `patient.demographics?.name`, etc.
3. Add fallbacks for backwards compatibility

---

## Issue 4: Missing API Routes (404 Errors)

### Symptoms
- 404 errors in browser console
- "Failed to load resource: 404"
- Features not working

### Root Cause
API route doesn't exist or isn't exported correctly.

### How to Detect
```bash
# Check if route exists
ls -la src/app/api/tasks/patients/[id]/tasks/route.ts

# Check exports
grep "export async function" src/app/api/tasks/patients/[id]/tasks/route.ts
```

### Solution
Create the route file with proper Next.js structure:
```typescript
// src/app/api/tasks/patients/[id]/tasks/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Implementation
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Implementation
}
```

---

## Issue 5: React Hydration Error (#418)

### Symptoms
- Error: "Minified React error #418"
- Page loads but has console errors

### Root Cause
Usually a **side effect** of other errors (failed API calls, missing data).

### Solution
1. Fix the underlying API/database errors first
2. Check for mismatched HTML between server/client
3. Verify all data fetching happens consistently

### Not Usually the Root Problem
This error often appears alongside other issues. Fix those first and this will likely resolve.

---

## Issue 6: Sticker PDF Generation Errors

### Symptoms
- PDFs don't download
- Print dialog doesn't open
- "Failed to generate" errors

### Root Cause
- Missing patient data (stickerData field)
- Incorrect function calls
- Browser popup blockers

### Solution
```typescript
// Check patient has sticker data
const patientsWithStickers = patients.filter(
  p => (p.stickerData?.bigLabelCount ?? 0) > 0
);

// Call consolidated functions
await printConsolidatedBigLabels(patientsWithStickers);
await printConsolidatedTinyLabels(activePatients); // Always 4 per patient
```

---

## Debugging Workflow

For ANY issue:

1. **Read the actual error** - Don't skip the details
2. **Find the code** - Grep for the endpoint/function
3. **Verify field names** - Check both sides match
4. **Test the fix** - curl + browser before committing
5. **Check logs** - Server console shows the real errors

**DO NOT:**
- Assume the fix works
- Skip testing
- Commit without verification
- Ignore server logs

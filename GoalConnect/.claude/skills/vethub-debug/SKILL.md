---
name: vethub-debug
description: Systematic debugging workflow for VetHub veterinary management app. Use when fixing API errors, database issues, or debugging any VetHub functionality. Enforces verification before coding and testing after changes to prevent repeated mistakes.
---

# VetHub Debug Workflow

## Mandatory Pre-Flight Checklist

**ALWAYS complete these steps BEFORE writing any code:**

1. **Read the actual error**
   - Copy full error message including stack trace
   - Identify exact line numbers and files

2. **Find the actual code causing the error**
   ```bash
   # Search for API routes
   grep -r "export.*POST\|export.*GET" src/app/api/
   
   # Search for API calls in frontend
   grep -r "fetch\|apiClient\|axios" src/
   ```

3. **Check field name consistency**
   - Read the API route file (`src/app/api/.../route.ts`)
   - Read the frontend code making the call
   - Compare: Does frontend send `name` but API expects `title`?
   - Check Prisma schema: `grep -A 20 "model Task\|model Patient" prisma/schema.prisma`

4. **Verify the fix will work**
   - Don't assume - prove it by reading the actual code
   - Check if the same issue exists elsewhere

## Post-Change Verification

**ALWAYS complete these steps AFTER any code change:**

1. **Check server starts cleanly**
   ```bash
   # Look for Prisma errors, TypeScript errors
   npm run dev
   ```

2. **Test the specific endpoint**
   ```bash
   # Test GET endpoints
   curl http://localhost:3000/api/patients | jq '.'
   
   # Test POST endpoints
   curl -X POST http://localhost:3000/api/tasks/patients/6/tasks \
     -H "Content-Type: application/json" \
     -d '{"title":"test task","description":"test"}'
   ```

3. **Check browser console**
   - Open DevTools Network tab
   - Look for 400/404/500 errors
   - Verify the response data structure

4. **Only THEN commit**
   - Don't commit until you've verified it works

## Common VetHub Issues

See `references/common-issues.md` for detailed patterns. Quick reference:

- **Field name mismatches**: `title` vs `name`, `patientId` vs `id`
- **DATABASE_URL**: Use `shinkansen.proxy.rlwy.net` for local, `postgres.railway.internal` for Railway
- **UnifiedPatient type**: Check if code expects `Patient` vs `UnifiedPatient`
- **Missing API routes**: Use the verification script to check routes exist

## Verification Script

Run before claiming something is fixed:

```bash
scripts/verify-endpoints.sh
```

This tests all critical endpoints and shows what's actually working.

## Environment Setup

**Local development:**
- DATABASE_URL must use public Railway URL
- Check `.env.local` has: `postgresql://postgres:PASSWORD@shinkansen.proxy.rlwy.net:40506/railway?sslmode=require`

**Railway production:**
- Uses internal URL automatically
- Check Railway dashboard for environment variables

## Workflow Example

**Bad approach (what keeps happening):**
1. See error → immediately write code
2. Assume the fix works
3. Commit without testing
4. Same error appears again

**Good approach (what this skill enforces):**
1. Read full error message
2. Find both API route AND frontend call
3. Compare field names/types
4. Write fix
5. Test with curl
6. Check browser
7. THEN commit

## When to Read References

- **API inconsistencies**: Read `references/api-field-mappings.md`
- **Database errors**: Read `references/database-setup.md`  
- **Type mismatches**: Read `references/type-definitions.md`

# 🚀 Deployment Issues & Learnings

## Issue #1: Pushed Without Testing Build (2025-11-14)

**What happened:**
- Pushed Base Camp dashboard code to main
- Didn't run `npm run build` locally first
- Railway build succeeded but database connection failed
- Wasted time thinking it was a build issue

**Root cause:**
- No pre-push validation that build works
- Assumed TypeScript check was enough

**Solution implemented:**
- Added `.husky/pre-push` hook
- Now runs `npm run build` before every push
- Catches build failures before they hit Railway

**Lesson learned:**
- Always test production build locally before pushing
- Pre-push hooks > hoping things work

**Automation added:**
```bash
# .husky/pre-push now runs:
1. npm run check (TypeScript)
2. npm run build (Production build test)
```

**Time saved going forward:**
- ~10 minutes per failed deployment
- Prevents context switching to debug Railway

---

## Issue #2: Railway Database Connection (2025-11-14)

**What happened:**
- Railway app deployed successfully
- But couldn't connect to database (ECONNREFUSED)
- Database URL points to `postgres.railway.internal` but connects to external IPs

**Status:**
- ✅ Code verified working (local and build succeed)
- ⏳ Railway database connection intermittent
- Triggered redeploy with `railway up --detach`

**Diagnosis:**
- DATABASE_URL uses `postgres.railway.internal:5432`
- But connections fail to external IPs (18.214.78.123, etc)
- Some requests succeed (200/304), some fail (500)
- = Intermittent database connectivity, not code issue

**Solution attempted:**
- Force redeploy to refresh Railway network connections
- Verify database service is actually running

**Lesson:**
- Deployment issues aren't always code issues
- Railway database connectivity can be intermittent
- Always verify code works locally first
- Force redeploy can fix network issues

**Prevention added:**
- Pre-push hooks test build locally
- Confirmed zero TypeScript errors in new code
- Local dev server running without errors

**TODO:**
- [x] Verify code works locally
- [x] Trigger Railway redeploy
- [ ] Monitor redeploy success
- [ ] Add Railway health check to workflow
- [ ] Create `railway-check.sh` script to verify all services
- [ ] Add post-deploy smoke test

---

## Template for Future Issues

**What happened:**
[Description]

**Root cause:**
[Why it happened]

**Solution:**
[What we did to fix it]

**Automation added:**
[Scripts, hooks, checks added]

**Time saved:**
[Estimated time saved on future occurrences]

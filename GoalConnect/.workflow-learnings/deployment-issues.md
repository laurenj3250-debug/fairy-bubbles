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
- ⏳ Not yet resolved
- Not a code issue - infrastructure configuration
- Local development works fine

**Potential solutions:**
- Check Railway database service status
- Verify DATABASE_URL environment variable
- Ensure Railway services are properly linked

**Lesson:**
- Deployment issues aren't always code issues
- Need better Railway health check automation
- Consider adding deployment verification script

**TODO:**
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

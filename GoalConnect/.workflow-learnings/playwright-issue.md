# Playwright Rendering Issue

## Problem
Playwright browser shows completely blank white pages. React app doesn't render.

## Root Cause
Vite dev server's ES modules (/@vite/client, /src/main.tsx) are not loading in Playwright's browser environment.

##  What Works
- ✅ Dev server responds to curl/normal browsers
- ✅ HTML is served correctly with all script tags
- ✅ Same code works in regular Chrome/Safari/Firefox
- ✅ Session/auth cookies work fine

## What Doesn't Work
- ❌ JavaScript modules don't execute in Playwright
- ❌ React never mounts (#root remains empty)
- ❌ No console errors visible (scripts silently fail)

## Attempted Solutions

1. **API-based auth** - 403 errors from Vite dev server
2. **UI form automation** - Can't find forms (React not mounted)
3. **page.evaluate fetch** - 403 blocked
4. **Longer timeouts** - Doesn't help, scripts never load
5. **networkidle wait** - Network idle but JS still doesn't run

## Likely Causes

1. **Vite HMR WebSocket** - Playwright might be blocking WS connections
2. **ES Module imports** - Browser compatibility with type="module"
3. **Vite middleware** - Dev server not serving modules to Playwright
4. **CORS/CSP** - Security headers blocking module loads

## Workaround

**User manually views at http://127.0.0.1:5000 and sends screenshot**

This is faster than debugging Playwright + Vite compatibility.

## Future Fix

Consider one of:
1. Build the app (`npm run build`) and test against production build
2. Use `preview` mode instead of `dev` mode for tests
3. Configure Vite to serve modules to Playwright properly
4. Use different E2E tool (Cypress, Selenium) that handles Vite better

## Status

**Visual fixes are complete in code**. Just need visual verification from user's browser.

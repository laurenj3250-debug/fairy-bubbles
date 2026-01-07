# Product Roast Checklist

Systematic checklist for finding everything wrong with an app. Use during Phase 2 of the Product Roast workshop.

## How to Use This Checklist

1. Go through each section systematically
2. Document every issue found with:
   - **What**: Specific description
   - **Where**: File:line (code) or Screen > Element (UX)
   - **Why it matters**: User impact
   - **Severity**: 🔥 (minor) / 🔥🔥 (moderate) / 🔥🔥🔥 (critical)
3. Don't skip sections - exhaustive beats fast
4. Screenshots are valuable evidence

---

## 1. Broken Functionality 🔧

### API & Data Issues
- [ ] API calls returning errors (check network tab)
- [ ] Missing error handling (what happens when API fails?)
- [ ] Loading states missing or broken
- [ ] Data not persisting after refresh
- [ ] Stale data displayed (not updating)
- [ ] Race conditions (actions happening out of order)
- [ ] Missing optimistic updates (UI lag after action)

### Auth Issues
- [ ] Login flow broken or confusing
- [ ] Session expiration not handled gracefully
- [ ] Protected routes accessible without auth
- [ ] Password reset flow working
- [ ] OAuth flows completing successfully
- [ ] Remember me / persistent login working

### Form Issues
- [ ] Validation not working or inconsistent
- [ ] Submit buttons clickable in invalid state
- [ ] Error messages missing or unhelpful
- [ ] Success feedback missing
- [ ] Form reset after submission issues
- [ ] Tab order broken
- [ ] Required fields not marked

### Navigation Issues
- [ ] Broken links (404 errors)
- [ ] Back button behavior unexpected
- [ ] Deep links not working
- [ ] Browser history polluted
- [ ] Redirect loops
- [ ] Lost state on navigation

### State Management Issues
- [ ] UI not updating after actions
- [ ] Conflicting state between components
- [ ] State persistence issues
- [ ] Undo/redo not working (if applicable)

---

## 2. UX Friction 🚧

### Unnecessary Steps
- [ ] Multi-step flows that could be single step
- [ ] Confirmation dialogs that aren't needed
- [ ] Required fields that shouldn't be required
- [ ] Forced account creation before value
- [ ] Tutorials that can't be skipped

### Cognitive Load
- [ ] Too many choices presented at once
- [ ] Information overload on single screen
- [ ] Unclear hierarchy (what's important?)
- [ ] Missing defaults (forcing decisions)
- [ ] Jargon or unclear language
- [ ] Actions that require memory vs. recognition

### Missing Shortcuts
- [ ] No keyboard shortcuts for power users
- [ ] No bulk/batch actions
- [ ] No quick add/create functionality
- [ ] No command palette (Cmd+K)
- [ ] No recently used / favorites
- [ ] No smart defaults based on history

### Feedback Issues
- [ ] Actions with no visual feedback
- [ ] Loading states that don't indicate progress
- [ ] Success/error messages that disappear too fast
- [ ] No empty states (just blank screen)
- [ ] No inline validation (only on submit)
- [ ] Confusing error messages

### Flow Problems
- [ ] Dead ends (nowhere to go next)
- [ ] Forced linear flows that should allow jumping
- [ ] Easy to make mistakes, hard to recover
- [ ] Important actions too easy (no friction for destructive actions)
- [ ] Trivial actions too hard (friction for common actions)

---

## 3. Visual Design 👁️

### Consistency Issues
- [ ] Inconsistent spacing (random padding/margins)
- [ ] Inconsistent border radius (4px here, 8px there)
- [ ] Inconsistent colors (shades of gray that don't match)
- [ ] Inconsistent typography (font sizes/weights)
- [ ] Inconsistent button styles
- [ ] Inconsistent icon styles (outline vs filled, different sets)

### Hierarchy Problems
- [ ] Everything looks equally important
- [ ] Primary action not obvious
- [ ] Related items not visually grouped
- [ ] Headers don't stand out from content
- [ ] Poor use of whitespace

### Color Issues
- [ ] Insufficient contrast (WCAG fail)
- [ ] Too many colors (rainbow chaos)
- [ ] Colors that clash
- [ ] Semantic colors misused (red for non-errors)
- [ ] Brand colors not applied consistently

### Typography Issues
- [ ] Line length too long (>80 chars)
- [ ] Line height too tight or loose
- [ ] Font sizes too small (<14px body)
- [ ] Too many font weights
- [ ] Poor font pairing
- [ ] Text hard to read on backgrounds

### Layout Issues
- [ ] Content touching edges (no padding)
- [ ] Inconsistent alignment
- [ ] Poor use of available space
- [ ] Layout breaks at certain widths
- [ ] Scroll containers nested awkwardly

### Polish Issues
- [ ] No animations/transitions (feels static)
- [ ] Janky animations (stuttering)
- [ ] Hover states missing or inconsistent
- [ ] Focus states missing or ugly
- [ ] Images not optimized (huge file sizes)

---

## 4. Responsive & Mobile 📱

### Breakpoint Issues
- [ ] Layout breaks at 375px (iPhone SE)
- [ ] Layout breaks at 390px (iPhone 14)
- [ ] Layout breaks at 768px (iPad)
- [ ] Layout breaks at 1024px (small laptop)
- [ ] Content overflow causing horizontal scroll

### Mobile-Specific Issues
- [ ] Touch targets too small (<44px)
- [ ] Important actions outside thumb zone
- [ ] Hover-dependent interactions (can't trigger on touch)
- [ ] Pinch/zoom disabled unnecessarily
- [ ] Keyboard covering input fields
- [ ] Form inputs not using correct keyboard type

### Responsive UX Issues
- [ ] Desktop-only features with no mobile alternative
- [ ] Mobile gets stripped down experience unfairly
- [ ] Navigation pattern unsuitable for mobile
- [ ] Tables that don't work on mobile
- [ ] Modal/dialog sizing issues on mobile

---

## 5. Performance 🚀

### Load Time Issues
- [ ] First contentful paint > 1.5s
- [ ] Time to interactive > 3s
- [ ] Large bundle size (check with DevTools)
- [ ] Images not lazy loaded
- [ ] Fonts blocking render
- [ ] Too many HTTP requests

### Runtime Performance
- [ ] UI feels sluggish/laggy
- [ ] Scroll performance issues (jank)
- [ ] Memory leaks (grows over time)
- [ ] Unnecessary re-renders (React DevTools)
- [ ] Long tasks blocking main thread

### Data Fetching Issues
- [ ] Waterfall requests (sequential when could be parallel)
- [ ] No caching (refetching unchanged data)
- [ ] Over-fetching (requesting more than needed)
- [ ] Under-fetching (too many requests)
- [ ] No pagination for large lists

---

## 6. Accessibility ♿

### Keyboard Navigation
- [ ] Can't tab through all interactive elements
- [ ] Tab order doesn't match visual order
- [ ] Focus not visible
- [ ] Focus trap in modals not working
- [ ] Keyboard shortcuts conflict with assistive tech

### Screen Reader Issues
- [ ] Images missing alt text
- [ ] Form inputs missing labels
- [ ] Buttons missing accessible names
- [ ] Heading hierarchy broken (h1 → h3 skip)
- [ ] ARIA attributes missing or misused
- [ ] Dynamic content not announced

### Visual Accessibility
- [ ] Color contrast fails WCAG AA (4.5:1 text, 3:1 UI)
- [ ] Information conveyed only by color
- [ ] Text not resizable (fixed px)
- [ ] Motion without reduce-motion respect
- [ ] Flashing content (seizure risk)

### Interaction Accessibility
- [ ] Time limits with no extension
- [ ] Auto-playing media without controls
- [ ] Drag-only interactions with no alternative
- [ ] Hover-only information

---

## 7. Code Quality 🔨

### Architecture Issues
- [ ] No clear separation of concerns
- [ ] Business logic in UI components
- [ ] Circular dependencies
- [ ] God components (>500 lines)
- [ ] Prop drilling hell (>3 levels)

### TypeScript Issues
- [ ] `any` types used
- [ ] Missing type definitions
- [ ] Inconsistent type patterns
- [ ] No types for API responses
- [ ] Type assertions (`as`) overused

### Code Smell Detection
- [ ] Duplicated code
- [ ] Magic numbers/strings
- [ ] Deep nesting (>3 levels)
- [ ] Long functions (>50 lines)
- [ ] Comments explaining bad code (vs. fixing it)

### Technical Debt Markers
- [ ] TODO/FIXME/HACK comments
- [ ] Commented out code
- [ ] console.log statements
- [ ] Debugger statements
- [ ] Disabled ESLint rules

### Testing Issues
- [ ] No tests
- [ ] Flaky tests
- [ ] Tests that test implementation, not behavior
- [ ] Missing critical path tests
- [ ] No E2E tests

### Dependency Issues
- [ ] Outdated dependencies
- [ ] Unused dependencies
- [ ] Multiple versions of same package
- [ ] No lock file
- [ ] Security vulnerabilities (npm audit)

---

## 8. Security 🔒

### Input Handling
- [ ] SQL injection possible
- [ ] XSS vulnerabilities
- [ ] CSRF protection missing
- [ ] Command injection possible
- [ ] File upload not validated

### Authentication
- [ ] Passwords not hashed properly
- [ ] Session tokens in URL
- [ ] No rate limiting on login
- [ ] Password requirements too weak
- [ ] No account lockout after failed attempts

### Data Exposure
- [ ] Sensitive data in console logs
- [ ] API keys in client code
- [ ] PII exposed in API responses
- [ ] Debug info in production
- [ ] Source maps in production

### Configuration
- [ ] HTTPS not enforced
- [ ] Cookies missing Secure/HttpOnly flags
- [ ] CORS too permissive
- [ ] Missing security headers

---

## 9. Content & Copy 📝

### Clarity Issues
- [ ] Vague or confusing labels
- [ ] Inconsistent terminology
- [ ] Technical jargon for non-technical users
- [ ] Ambiguous button text ("Submit" vs "Save Changes")
- [ ] Missing context (what does this mean?)

### Error Messages
- [ ] Generic errors ("Something went wrong")
- [ ] Technical errors shown to users
- [ ] No guidance on how to fix
- [ ] Blaming tone ("You entered...")

### Empty States
- [ ] No explanation of why empty
- [ ] No guidance on how to add content
- [ ] Depressing/discouraging ("Nothing here")
- [ ] No illustration or visual interest

### Microcopy
- [ ] Form labels unclear
- [ ] Placeholder text as labels (accessibility issue)
- [ ] Help text missing where needed
- [ ] Success messages generic or missing

---

## 10. Missing Table Stakes 🎯

### What Competitors Have
- [ ] Feature X that all competitors have
- [ ] Integration that users expect
- [ ] Export functionality
- [ ] Search functionality
- [ ] Sort/filter functionality

### Basic Expectations
- [ ] Onboarding flow
- [ ] Settings/preferences
- [ ] Account management
- [ ] Help/documentation
- [ ] Feedback mechanism

### Quality of Life
- [ ] Undo/redo capability
- [ ] Auto-save
- [ ] Offline support (if appropriate)
- [ ] Data export
- [ ] Notification preferences

---

## 11. App-Specific: Habit Trackers 📅

### Habit Visualization
- [ ] No visual representation of consistency
- [ ] Calendar view missing
- [ ] Streaks not prominently displayed
- [ ] No progress graphs/charts
- [ ] Can't see historical data easily

### Logging Experience
- [ ] More than 1 tap to log
- [ ] Confirmation required to log
- [ ] Can't quick-log from notification
- [ ] No widget for quick access
- [ ] Time/date editing cumbersome

### Streak Mechanics
- [ ] Streak breaks with no recovery option
- [ ] No "streak freeze" capability
- [ ] Break feels punishing, not recoverable
- [ ] No "fresh start" framing after break
- [ ] All-or-nothing thinking encouraged

### Motivation Features
- [ ] No celebration on completion
- [ ] Achievements feel meaningless
- [ ] No variable rewards (same experience every time)
- [ ] No social accountability option
- [ ] No reminders/nudges

### Onboarding
- [ ] Starts with forms, not action
- [ ] Too many habits encouraged initially
- [ ] No guidance on "good" habits
- [ ] First completion not celebrated

---

## 12. App-Specific: Clinical Apps 🏥

### Information Density
- [ ] Too dense (overwhelming)
- [ ] Too sparse (requires clicking)
- [ ] Critical info not at glance
- [ ] Status indicators unclear

### Workflow Efficiency
- [ ] Common actions buried in menus
- [ ] No keyboard shortcuts
- [ ] Excessive clicks for routine tasks
- [ ] Copy/paste not supported where needed
- [ ] Templates not available

### Error Prevention
- [ ] Easy to select wrong patient
- [ ] Dangerous actions not confirmed
- [ ] No audit trail
- [ ] No undo for mistakes
- [ ] Unclear what's been saved

### Shift Considerations
- [ ] No dark mode (night shift)
- [ ] Font too small for quick reading
- [ ] Not usable standing up
- [ ] Sessions timeout too quickly
- [ ] No handoff features

---

## Roast Summary Template

After completing checklist, summarize:

```markdown
## Roast Summary

### Critical Issues 🔥🔥🔥 (Fix Immediately)
1. [Issue] - [Impact] - [Location]
2. ...

### Moderate Issues 🔥🔥 (Fix This Sprint)
1. [Issue] - [Impact] - [Location]
2. ...

### Minor Issues 🔥 (Backlog)
1. [Issue] - [Impact] - [Location]
2. ...

### Statistics
- Critical: X issues
- Moderate: X issues
- Minor: X issues
- Total: X issues

### Top Pain Points
1. [Biggest problem]
2. [Second biggest]
3. [Third biggest]
```

---

## Quick Commands for Automated Checks

```bash
# TypeScript errors
npx tsc --noEmit

# ESLint issues
npx eslint . --ext .ts,.tsx

# Outdated dependencies
npm outdated

# Security vulnerabilities
npm audit

# Unused dependencies
npx depcheck

# Bundle size analysis
npx vite-bundle-visualizer

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Find TODOs/FIXMEs
grep -r "TODO\|FIXME\|HACK\|XXX" --include="*.ts" --include="*.tsx" src/

# Find console.logs
grep -r "console.log" --include="*.ts" --include="*.tsx" src/

# Find any types
grep -r ": any" --include="*.ts" --include="*.tsx" src/

# Large files
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | sort -n | tail -20
```

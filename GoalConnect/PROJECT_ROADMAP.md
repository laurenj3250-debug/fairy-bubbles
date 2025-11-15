# GoalConnect (Mountain Habit) - Project Roadmap

## 🎨 Core Design Principles

### Theme-Dependent Color System
**CRITICAL PRINCIPLE:** All color schemes MUST be dependent on the selected mountain theme background.

- **DO NOT** use individual rainbow colors per category (mind, foundation, adventure, training)
- **DO** derive all colors from the active mountain theme (El Capitan, Mt. Toubkal, Mt. Whitney)
- **DO** use CSS custom properties set by `useMountainTheme` hook:
  - `--hold-tint`: Primary color tint from theme
  - `--hold-glow`: Glow/accent color from theme
  - `--particle-color`: Particle effect color from theme
  - `--particle-type`: Particle type (chalk/dust/snow) from theme

### Visual Style Requirements
- **Beautiful over minimal**: Design should be "climby, beautiful, dopamine-spiky" - something users want to look at
- **Glass climbing holds**: Habits in Today's Pitch use glassmorphism with theme-tinted holds
- **Pastel timeline cards**: To-do list items use soft, theme-adapted pastel cards (separate from habits)
- **Theme consistency**: Every visual element derives color from the mountain theme, creating a cohesive experience

### Implementation Pattern
```css
/* CORRECT - Theme-adaptive */
background: radial-gradient(circle, hsl(var(--hold-glow) / 0.4), transparent);
border: 2px solid hsl(var(--hold-tint) / 0.5);

/* INCORRECT - Hardcoded colors */
background: radial-gradient(circle, rgba(255, 100, 50, 0.4), transparent);
border: 2px solid hsl(28, 85%, 48%);
```

## Current Status (November 2024)

### ✅ Completed
- Core habit tracking functionality
- Mountain climbing themed dashboard
- Authentication system (username/password + GitHub OAuth)
- PostgreSQL database with Supabase
- Railway deployment (production ready)
- Playwright testing infrastructure
- Visual dashboard components
- Week overview and streak tracking
- Goal management system
- Dream scroll (future goals) feature

### 🚧 In Progress
- Playwright browser teardown performance (Mac compatibility issue)
- API error handling (500 error on `/api/habits/streak`)

## Next Steps - Priority Order

### 1. **Fix Critical Issues** (Immediate)
Priority: 🔴 HIGH

- [ ] Fix `/api/habits/streak` 500 error
- [ ] Optimize Playwright teardown performance
- [ ] Verify all tests pass on Railway deployment
- [ ] Check mobile responsiveness of dashboard

**Why:** These are blocking issues that affect core functionality and testing.

**Estimated Time:** 2-4 hours

### 2. **UI/UX Polish** (Short-term)
Priority: 🟡 MEDIUM

- [ ] Improve loading states across all components
- [ ] Add skeleton loaders for async data
- [ ] Polish animations and transitions
- [ ] Ensure consistent spacing and typography
- [ ] Add empty states for all data views
- [ ] Mobile optimization (touch targets, navigation)
- [ ] Dark mode refinements

**Why:** Better user experience leads to higher engagement and retention.

**Estimated Time:** 1-2 weeks

**Use:** `/design-workflow` command to implement these changes

### 3. **Core Feature Enhancements** (Medium-term)
Priority: 🟡 MEDIUM

#### Habit Tracking Improvements
- [ ] Add habit categories/tags
- [ ] Bulk habit operations (complete multiple at once)
- [ ] Habit streaks with freeze days
- [ ] Habit analytics (completion rates, patterns)
- [ ] Customizable habit icons

#### Goal System
- [ ] Goal progress tracking with milestones
- [ ] Goal templates (common climbing goals)
- [ ] Goal dependencies (unlock system)
- [ ] Visual goal timeline

#### Gamification
- [ ] Achievement/badge system
- [ ] Leveling system based on consistency
- [ ] Expedition events (special challenges)
- [ ] Leaderboards (optional, privacy-aware)

**Estimated Time:** 3-4 weeks

### 4. **Social Features** (Long-term)
Priority: 🟢 LOW

- [ ] Share progress with friends
- [ ] Climbing partner matching
- [ ] Public achievement sharing
- [ ] Community challenges
- [ ] Motivational messages/quotes

**Why:** Social accountability increases habit adherence.

**Estimated Time:** 2-3 weeks

### 5. **Data & Analytics** (Long-term)
Priority: 🟢 LOW

- [ ] Advanced analytics dashboard
- [ ] Habit correlation analysis
- [ ] Export data (CSV, PDF reports)
- [ ] Calendar view of all activities
- [ ] Year-in-review summary
- [ ] Predictive insights (ML-based)

**Estimated Time:** 3-4 weeks

### 6. **Technical Improvements** (Ongoing)
Priority: 🟡 MEDIUM

#### Performance
- [ ] Optimize database queries
- [ ] Add Redis caching layer
- [ ] Implement query pagination
- [ ] Add service worker for offline support
- [ ] Optimize bundle size

#### Testing
- [ ] Increase test coverage to 80%+
- [ ] Add integration tests for all API endpoints
- [ ] Add E2E tests for critical user flows
- [ ] Set up CI/CD pipeline with automated testing
- [ ] Add performance testing

#### Code Quality
- [ ] Refactor large components
- [ ] Extract shared logic into hooks
- [ ] Document complex business logic
- [ ] Add JSDoc comments to all components
- [ ] Set up ESLint + Prettier rules

**Estimated Time:** Ongoing

### 7. **Mobile App** (Future)
Priority: 🔵 FUTURE

- [ ] React Native mobile app
- [ ] Push notifications for habit reminders
- [ ] Widget support (iOS/Android)
- [ ] Offline-first architecture
- [ ] Geolocation for outdoor activities

**Estimated Time:** 2-3 months

## Recommended Next Session Plan

### Session 1: Critical Fixes (2-4 hours)
1. Fix the `/api/habits/streak` API error
2. Investigate and resolve Playwright teardown issue
3. Run full test suite and verify all pass
4. Check mobile responsiveness

### Session 2: UI Polish Phase 1 (4-6 hours)
1. Use `/design-workflow` to implement loading states
2. Add skeleton loaders for all async components
3. Improve empty states
4. Polish animations and transitions
5. Take before/after screenshots

### Session 3: UI Polish Phase 2 (4-6 hours)
1. Mobile optimization pass
2. Touch target improvements
3. Navigation improvements
4. Dark mode polish
5. Accessibility audit

### Session 4: Feature Enhancement (6-8 hours)
1. Add habit categories
2. Implement bulk operations
3. Enhanced streak tracking with freeze days
4. Habit analytics dashboard

## Using the Design Workflow Agent

For any UI/UX work, invoke the design workflow agent:

```bash
/design-workflow
```

Then provide:
- Description of what you want to change
- Screenshots or mockups (if available)
- Specific pages/components to modify

The agent will:
1. Plan the implementation
2. Make the changes
3. Take screenshots for verification
4. Test responsiveness
5. Document the changes

## Success Metrics

Track these to measure progress:

- **User Engagement**
  - Daily active users
  - Habit completion rate
  - Session duration
  - Feature usage rates

- **Technical Quality**
  - Test coverage percentage
  - Performance scores (Lighthouse)
  - Error rates in production
  - API response times

- **User Satisfaction**
  - User feedback/ratings
  - Feature requests
  - Bug reports
  - Retention rate

## Notes

- Prioritize user-facing improvements over internal refactoring
- Keep the mountain climbing theme consistent
- Test all changes on Railway before considering them complete
- Document design decisions for future reference
- Get user feedback early and often

---

**Last Updated:** November 15, 2024
**Version:** 1.0
**Status:** Active Development

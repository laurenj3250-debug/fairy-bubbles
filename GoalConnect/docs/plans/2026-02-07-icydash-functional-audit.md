# IcyDash Functional Audit Plan

**Date:** 2026-02-07
**Focus:** What's NOT loggable/interactable from IcyDash that should be
**Priority:** Function over form

---

## Dashboard Inventory

IcyDash has **13 widgets/sections**. Here's what each one does and what's broken:

### HEADER BAR
| Widget | Type | Can You Log/Act? | Issues |
|--------|------|-------------------|--------|
| GlowingOrbHabits | Interactive | Toggle today's habits via orb click | Works |
| Points display (pts) | Popover | View-only — shows weekly breakdown | **P1: No link to rewards page, no way to see full history** |
| Streak display | Display | None | Display only — OK |
| ResidencyCountdownWidget | Display | None | Display only — OK |

### MAIN GRID (Left: 2-col)
| Widget | Type | Can You Log/Act? | Issues |
|--------|------|-------------------|--------|
| LuxuryHabitGrid ("This Week") | Interactive | Toggle habits for any day this week, view detail on name click | Works |

### MAIN GRID (Right: 1-col sidebar)
| Widget | Type | Can You Log/Act? | Issues |
|--------|------|-------------------|--------|
| MediaWidget | Link-only | Navigate to /media | **P2: Can't quick-add book/media from dash** |
| RecentAdventuresWidget | Link-only | Navigate to /adventures | **P2: Can't quick-log adventure from dash** |
| MilestoneDonutWidget | Link-only | Navigate to /goals?view=monthly | Display-only — acceptable |
| NextRewardWidget | Link-only | Navigate to /rewards | **P1: Can't redeem reward from dash even when affordable** |

### FULL-WIDTH ROWS
| Widget | Type | Can You Log/Act? | Issues |
|--------|------|-------------------|--------|
| CurrentExpeditionWidget | Link-only | Navigate to /expedition-missions | Display-only — acceptable |
| WeeklyMonthlyGoalsWidget | Interactive | +1 increment, add goal via dialog | Works |
| YearlyGoalsSection | Interactive | Toggle, increment, claim reward, log outdoor day | Works |

---

## Critical Functional Gaps (The Audit Checklist)

### P0: BROKEN — Things that should work but don't

1. **Points system has dual XP tracks that don't sync**
   - `userPoints` table (habit/goal/todo XP, used for reward shop)
   - `playerClimbingStats.totalXp` (climbing game XP, separate system)
   - Header shows `userPoints.available` but level/grade uses climbing XP
   - **Impact:** Confusing — are you level 3 or have 450pts? Which is real?

2. **Combo system exists in schema but has zero integration**
   - `userComboStats` table created, CRUD in db-storage.ts
   - No route handlers, no client components reference it
   - Dead code taking up schema space

3. **Daily Quest system exists in schema but has zero implementation**
   - `dailyQuests` and `userDailyQuests` tables exist
   - No endpoints, no UI, no quest logic

### P1: POINTS ("ppts") SPECIFIC ISSUES

4. **PointsBreakdownPopover is read-only with no escape hatches**
   - Shows weekly XP breakdown + next reward — great
   - No "View all transactions" link
   - No "Go to Rewards" link
   - No "Redeem" button even when you can afford the next reward
   - **Fix:** Add footer links: "View History" → /rewards, "Redeem" CTA if affordable

5. **NextRewardWidget has no quick-redeem**
   - Shows progress toward cheapest reward
   - Click navigates to /rewards page
   - **Fix:** Add inline "Redeem" button when points >= cost

6. **Points NOT awarded for some actions that should give XP**
   - Habit toggle: Works (5/10/15 XP by difficulty + streak multiplier)
   - Goal progress: Works (milestone-based, urgency/priority multipliers)
   - Todo completion: Works (5/10/15 XP by difficulty)
   - Daily bonus: Works (5/10/15 XP by activity streak)
   - **Missing:** Adventure logging gives NO XP
   - **Missing:** Media logging gives NO XP
   - **Missing:** Expedition completion doesn't feed into userPoints (separate system)
   - **Missing:** Weekly goal completion gives no XP (only yearly goals have xpReward)

7. **Alpine gear purchase doesn't deduct points**
   - db-storage.ts line 896: `// TODO: Check if player has enough coins/points and deduct`
   - Gear is "free" — breaks gamification economy

8. **Reward redemption uses transaction type `costume_purchase`**
   - Misleading name from old pet system
   - Should be `reward_redeem` or similar

### P2: DASHBOARD LOGGING GAPS

9. **Can't quick-log adventure from IcyDash**
   - RecentAdventuresWidget is display-only
   - YearlyGoalsSection HAS outdoor day logging (quick + full dialog)
   - But the sidebar widget itself has no "+" button
   - **Fix:** Add "+" icon button on RecentAdventuresWidget header

10. **Can't quick-add media from IcyDash**
    - MediaWidget shows currently reading/watching
    - No way to mark as finished or add new from dashboard
    - **Fix:** Add "+" icon button + "Finish" action on current items

11. **Can't manage todos from IcyDash**
    - No todo widget on dashboard at all
    - Todos give XP when completed but aren't visible on IcyDash
    - **Fix:** Consider adding a compact todo widget, or at minimum a "X todos due today" indicator

### P3: NICE-TO-HAVE / POLISH

12. **Expedition widget can't progress from dash**
    - Shows current mission but must navigate away to interact
    - Low priority — expeditions are complex flows

13. **No XP animation/feedback on the header pts counter**
    - Habit toggle shows toast "+X XP" but the pts number in header doesn't animate
    - Would feel more satisfying with a count-up animation

14. **Pet system being deprecated but still in schema**
    - `virtualPets` table still exists
    - Pet XP uses simple log count, not actual earned points
    - Should be removed or migrated to use points system

---

## Audit Execution Order

**Phase 1: Points System Fix** (P0 + P1 items 4-8)
- Consolidate or clarify the dual XP system
- Add links/CTAs to PointsBreakdownPopover
- Add quick-redeem to NextRewardWidget
- Award XP for adventure logging
- Fix gear purchase deduction
- Clean up transaction type naming

**Phase 2: Dashboard Logging** (P2 items 9-11)
- Add "+" to RecentAdventuresWidget
- Add quick-actions to MediaWidget
- Consider todo visibility on dash

**Phase 3: Polish** (P3 items 12-14)
- XP count animation
- Dead schema cleanup (combo, daily quests, pets)

---

## Files to Touch (Estimated)

### Phase 1
- `client/src/components/dashboard/PointsBreakdownPopover.tsx` — add links + redeem CTA
- `client/src/components/dashboard/NextRewardWidget.tsx` — add inline redeem
- `server/routes/adventures.ts` or `server/routes.ts` — award XP on adventure create
- `server/db-storage.ts` — fix gear purchase deduction
- `shared/schema.ts` — potentially update transaction type enum

### Phase 2
- `client/src/components/dashboard/RecentAdventuresWidget.tsx` — add "+" button
- `client/src/components/MediaWidget.tsx` — add quick actions
- `client/src/pages/IcyDash.tsx` — wire up new interactions

### Phase 3
- `client/src/pages/IcyDash.tsx` — XP animation on header
- `shared/schema.ts` — dead code cleanup

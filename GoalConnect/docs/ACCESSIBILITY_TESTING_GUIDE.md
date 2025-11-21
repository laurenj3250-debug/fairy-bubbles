# GoalConnect Accessibility Testing Guide

## Quick Reference

This guide provides step-by-step instructions for testing the accessibility improvements made to GoalConnect.

---

## 1. Keyboard Navigation Testing

### Setup
- Close or unplug your mouse
- Use only keyboard for all interactions

### Test Scenarios

#### A. Basic Navigation
1. **Open the app** in browser
2. **Press Tab repeatedly**
   - ✅ Focus moves through all interactive elements
   - ✅ Focus indicator is clearly visible
   - ✅ Tab order is logical (top to bottom, left to right)
3. **Press Shift+Tab**
   - ✅ Focus moves backward through elements

#### B. Bottom Navigation
1. **Navigate to bottom nav** (Tab until you reach it)
2. **Press Enter or Space** on each nav item
   - ✅ Navigates to corresponding page
   - ✅ Active page is clearly indicated

#### C. Habit Pitches (Base Camp)
1. **Navigate to Base Camp** (/)
2. **Tab to habit pitch cards**
3. **Press Space or Enter** on a pitch
   - ✅ Toggles habit completion
   - ✅ Visual feedback shows state change
   - ✅ Celebration animation plays (if completing all habits)

#### D. Task Management (Todos Page)
1. **Navigate to Todos** (/todos)
2. **Test keyboard shortcuts**:
   - **Cmd/Ctrl+K**: Opens quick add modal
   - **?**: Opens keyboard shortcuts help
   - **Arrow Down/Up**: Navigate between tasks
   - **Space**: Toggle task completion
   - **Enter or E**: Edit focused task
   - **Delete or Backspace**: Delete focused task (with confirmation)

3. **Manual Sort Mode**:
   - Enable manual sort toggle
   - Use keyboard to drag tasks (built-in @dnd-kit support)

#### E. Forms and Modals
1. **Open any modal** (e.g., New Task)
2. **Tab through form fields**
   - ✅ All inputs are reachable
   - ✅ Focus stays within modal
3. **Press Escape**
   - ✅ Modal closes
   - ✅ Focus returns to trigger element

### Pass/Fail Criteria
- ✅ **Pass**: Can access all features without a mouse
- ❌ **Fail**: Any interactive element cannot be reached or activated via keyboard

---

## 2. Screen Reader Testing

### Tools
- **macOS**: VoiceOver (Cmd+F5)
- **Windows**: NVDA (free) or JAWS
- **Chrome**: ChromeVox extension

### Setup (VoiceOver on Mac)
1. Press **Cmd+F5** to enable VoiceOver
2. Use **Control+Option** (VO keys) + Arrow keys to navigate
3. Press **VO+A** to start reading
4. Press **Control** to stop reading

### Test Scenarios

#### A. Page Structure
1. **Open Base Camp** (/)
2. **Press VO+U** (Web Rotor)
3. **Navigate to Headings**
   - ✅ Logical heading hierarchy
   - ✅ Page structure is clear

#### B. Habit Pitches
1. **Navigate to habit cards**
2. **Listen to announcements**
   - Expected: "Morning Meditation, 5.9 Moderate, completed, 5 day streak, button"
   - ✅ All relevant information announced
   - ✅ Button role announced

#### C. Task List
1. **Navigate to Todos** (/todos)
2. **Navigate through tasks**
   - Expected: "Mark task complete: Buy groceries, checkbox, not checked"
   - ✅ Task title announced
   - ✅ Completion state clear
   - ✅ Due date and metadata announced

3. **Navigate to action buttons**
   - Expected: "Edit task: Buy groceries, button"
   - Expected: "Delete task: Buy groceries, button"
   - ✅ Action purpose is clear

#### D. Loading States
1. **Refresh a page** while VoiceOver is active
2. **Listen for loading announcement**
   - Expected: "Loading base camp" or "Loading tasks"
   - ✅ Loading state announced
   - ✅ Uses polite announcement (doesn't interrupt)

#### E. Navigation
1. **Navigate to bottom nav**
2. **Listen to each nav item**
   - Expected: "Navigate to Today, button, current page"
   - ✅ Destination is clear
   - ✅ Current page indicated

### Pass/Fail Criteria
- ✅ **Pass**: All interactive elements announce their purpose and state
- ❌ **Fail**: Any element is unlabeled or announces incorrectly

---

## 3. Offline Functionality Testing

### Test Scenarios

#### A. Service Worker Registration
1. **Open DevTools** (F12)
2. **Navigate to Application tab**
3. **Check Service Workers section**
   - ✅ Service worker is registered
   - ✅ Status is "activated and running"

#### B. Offline Mode
1. **Use the app normally** for a few minutes
2. **Open DevTools** > Network tab
3. **Toggle "Offline" checkbox**
4. **Observe offline indicator**
   - ✅ Red badge appears: "You're Offline"
   - ✅ Badge is clearly visible
5. **Try to navigate pages**
   - ✅ Static pages load from cache
   - ✅ Previously viewed content is available
6. **Try to complete a habit or task**
   - ✅ Action is cached (if implemented)
   - ⚠️ Or shows helpful error message

#### C. Return Online
1. **While offline, toggle "Offline" off**
2. **Observe online indicator**
   - ✅ Green badge appears: "Back Online"
   - ✅ Badge auto-dismisses after 3 seconds
3. **Refresh the page**
   - ✅ Fresh data loads

### Pass/Fail Criteria
- ✅ **Pass**: App shows clear offline status and cached content loads
- ❌ **Fail**: No offline indicator or app completely breaks offline

---

## 4. Automated Testing

### Lighthouse Audit
1. **Open DevTools** (F12)
2. **Navigate to Lighthouse tab**
3. **Select "Accessibility" category**
4. **Click "Analyze page load"**
5. **Review results**
   - ✅ Target: 90+ score
   - ✅ No critical issues

### axe DevTools
1. **Install axe DevTools** extension
2. **Open extension** on each major page
3. **Run automated scan**
4. **Review issues**
   - ✅ Fix all critical issues
   - ✅ Fix serious issues
   - ⚠️ Review moderate issues

### WAVE Extension
1. **Install WAVE** extension
2. **Open extension** on key pages
3. **Review visual indicators**
   - Red: Errors (must fix)
   - Yellow: Warnings (should review)
   - Green: Features (accessibility features detected)

---

## 5. Visual Testing

### Zoom Testing
1. **Set browser zoom to 200%**
2. **Navigate through app**
   - ✅ All content is readable
   - ✅ No horizontal scrolling (except where intended)
   - ✅ Interactions still work

### Color Contrast
1. **Use browser DevTools** color picker
2. **Check text against backgrounds**
   - ✅ Normal text: 4.5:1 ratio
   - ✅ Large text (18pt+): 3:1 ratio
3. **Use online tools**:
   - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Color Blindness Simulation
1. **Install color blindness simulator** extension
2. **Test with different types**:
   - Protanopia (red-blind)
   - Deuteranopia (green-blind)
   - Tritanopia (blue-blind)
3. **Verify**:
   - ✅ Information isn't conveyed by color alone
   - ✅ Interactive elements remain distinguishable

---

## 6. Mobile Testing

### Touch Targets
1. **Open app on mobile device** or mobile emulator
2. **Check interactive elements**
   - ✅ Minimum size: 44x44 pixels
   - ✅ Adequate spacing between targets
   - ✅ Easy to tap without mistakes

### Swipe Gestures
1. **Test drag-and-drop** on mobile
   - ✅ Works with touch
   - ✅ Has keyboard alternative

---

## 7. Common Issues Checklist

### ❌ Issues to Watch For
- [ ] Form inputs without labels
- [ ] Buttons without accessible names
- [ ] Images without alt text
- [ ] Clickable divs without role="button"
- [ ] Missing focus indicators
- [ ] Insufficient color contrast
- [ ] Keyboard traps (can't Tab out)
- [ ] Auto-playing media
- [ ] Time-limited content without controls
- [ ] Content that flashes more than 3 times/second

### ✅ Good Practices to Verify
- [x] All interactive elements have accessible names
- [x] Semantic HTML used (button, nav, main, etc.)
- [x] ARIA used only when necessary
- [x] Focus indicators are visible
- [x] Keyboard shortcuts documented
- [x] Loading states are accessible
- [x] Error messages are descriptive

---

## 8. Browser Testing

Test accessibility in multiple browsers:
- Chrome/Edge (Chromium)
- Firefox
- Safari (especially for VoiceOver)

### Browser-Specific Tests
- **Safari + VoiceOver**: Primary screen reader test
- **Chrome + NVDA**: Windows screen reader test
- **Firefox**: Tab order and keyboard nav
- **Edge**: High contrast mode (Windows)

---

## 9. Testing Schedule

### Pre-Release Checklist
- [ ] Lighthouse accessibility audit (90+ score)
- [ ] axe DevTools scan (no critical issues)
- [ ] Keyboard navigation test (all pages)
- [ ] Screen reader test (critical user flows)
- [ ] Offline functionality test
- [ ] Zoom test (200%)
- [ ] Mobile touch target test

### Regression Testing
Run after each major update:
- [ ] Keyboard navigation on modified pages
- [ ] Screen reader test on modified components
- [ ] Automated tools (Lighthouse, axe)

---

## 10. Reporting Issues

When reporting accessibility issues, include:
1. **Issue type**: Keyboard, screen reader, contrast, etc.
2. **Component**: Which part of the app
3. **Steps to reproduce**
4. **Expected behavior**
5. **Actual behavior**
6. **Severity**: Critical, High, Medium, Low
7. **Browser/OS/Assistive technology** used

### Example Issue Report
```markdown
## Missing ARIA Label on Search Button

**Type**: Screen Reader
**Component**: Header search
**Severity**: High

**Steps**:
1. Enable VoiceOver
2. Navigate to search button in header
3. Activate button

**Expected**: "Search tasks, button"
**Actual**: "Button" (no label)

**Browser**: Safari 16.1, macOS 13.0, VoiceOver
```

---

## 11. Resources

### Official Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Extension](https://wave.webaim.org/extension/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Screen Readers
- [VoiceOver Guide (macOS)](https://support.apple.com/guide/voiceover/welcome/mac)
- [NVDA (Windows, free)](https://www.nvaccess.org/)
- [JAWS (Windows, paid)](https://www.freedomscientific.com/products/software/jaws/)

### Learning Resources
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

---

## Questions?

For accessibility questions or issues, contact:
- Development Team
- UX Team
- Accessibility Specialist (Agent 5)

**Remember**: Accessibility is not a feature, it's a fundamental requirement. Every user deserves equal access to GoalConnect.

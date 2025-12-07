# F2: Research Summary

## Key Findings from UI Pattern Research

### 1. Best Minimal Dashboard Layouts
- **F & Z Pattern Navigation**: Critical info at top, details below
- **60-30-10 Color Rule**: 60% neutral, 30% secondary, 10% accent
- **Nothing without purpose**: Linear/Things 3 philosophy - every element earns its place
- **Breathing room**: Whitespace as active design element

### 2. Week View Best Practices (from Things 3, Amie, Cron)
- Daily columns for week overview
- Tasks integrated directly into calendar (no context-switching)
- Today visually highlighted with glow/color
- Drag-and-drop rescheduling
- "Today" quick-return button
- Smooth scrollable navigation

### 3. ADHD-Friendly Design Patterns
- **Default to "today's tasks"** (not all tasks)
- **3-5 key tasks per day max**
- **Color-coding** for priority/project (sparingly)
- **Time-blocking** visual format
- **Task breakdown** (subtasks for complex items)
- **Hide empty sections** automatically
- **Celebrate small wins** (rewards system)

### 4. Auto-Hiding Widgets
- Only render if data.length > 0
- CSS grid/flexbox to reflow remaining widgets
- Smooth transitions when widgets appear/disappear
- "Hide empty sections" toggle in settings

### 5. Color & Spacing (8px Base)
```
Spacing: 4px, 8px, 16px, 24px, 32px, 48px
Accent colors (10% only):
  - Green (#10B981) = done
  - Blue (#3B82F6) = in progress
  - Orange (#F97316) = urgent
  - Red (#EF4444) = overdue
```

---

## Codebase Analysis Results

### Existing Components to Reuse
1. **Tabs** (`/components/ui/tabs.tsx`) - Ready for Week/Month switching
2. **Card System** - Glassmorphic: `bg-card/40 backdrop-blur-sm`
3. **Badge** - For status/counts
4. **SortableTaskList** - Drag/drop, keyboard nav, accessibility
5. **Progress patterns** - ProgressRing, progress bars

### Design Tokens (from index.css)
```css
--primary: 25 95% 58%      /* Sunset orange/gold */
--secondary: 200 85% 55%   /* Sky blue */
--accent: 160 80% 50%      /* Teal/green */
--background: 45 30% 12%   /* Deep warm charcoal */
--card: 40 20% 18%         /* Rich warm dark */
```

### Typography
- Headings: Fraunces
- Body: Inter
- Min 16px body font

---

## Sources
- [Dashboard Design Patterns](https://dashboarddesignpatterns.github.io/patterns.html)
- [Things 3 Review](https://thedigitalprojectmanager.com/tools/things-3-review/)
- [Todoist ADHD Hacks](https://baizaar.tools/todoist-adhd-hacks/)
- [Notion ADHD Templates](https://gridfiti.com/notion-adhd-templates/)
- [ADHD Weekly Planner Design](https://blog.planwiz.app/adhd-weekly-planner-design-template-for-task-management/)
- [Calendar UI Examples](https://www.eleken.co/blog-posts/calendar-ui)

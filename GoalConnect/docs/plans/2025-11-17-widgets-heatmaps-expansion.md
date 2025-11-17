# Widgets & Heatmaps Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive widgets and heatmaps for todos, expeditions, points, combo/streaks, and daily quests to visualize all major data sources in the GoalConnect app.

**Architecture:** Build 8 new React components following existing patterns (HeatmapGrid, TanStack Query hooks, mountain-themed styling). Each widget/heatmap will be self-contained, responsive, and integrate with the dashboard.

**Tech Stack:** React 18.3.1, TypeScript, TailwindCSS, TanStack React Query, Recharts, Radix UI

---

## Data Sources Available (Not Yet Visualized)

Based on schema analysis:
1. **Todos** - Task completion tracking (todos table)
2. **Point Transactions** - Points earned/spent over time (pointTransactions table)
3. **Player Expeditions** - Expedition progress and summits (playerExpeditions, playerClimbingStats)
4. **User Combo Stats** - Streaks and combos (userComboStats)
5. **Daily Quests** - Quest completion tracking (userDailyQuests, dailyQuests)
6. **Habit Mood/Energy** - Mood and energy tracking from habit logs (habitLogs.mood, habitLogs.energyLevel)
7. **Virtual Pet** - Pet happiness/health over time (virtualPets)
8. **Climbing Energy** - Energy levels from expedition system (playerClimbingStats.currentEnergy)

---

## Task 1: TodoCompletionHeatmap Component

**Goal:** Visualize todo completions over time with a GitHub-style heatmap

**Files:**
- Create: `client/src/components/TodoCompletionHeatmap.tsx`

**Step 1: Create the component file**

```tsx
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";

interface TodoHeatmapData {
  date: string;
  completed: number;
  total: number;
}

export default function TodoCompletionHeatmap() {
  const { data: todos } = useQuery({
    queryKey: ["/api/todos"],
  });

  // Process data into heatmap format
  const heatmapData: TodoHeatmapData[] = [];
  const days = 90; // Last 90 days

  for (let i = days - 1; i >= 0; i--) {
    const date = format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd");
    const completedOnDate = todos?.filter(
      (t: any) => t.completedAt && t.completedAt.startsWith(date)
    ).length || 0;

    heatmapData.push({
      date,
      completed: completedOnDate,
      total: completedOnDate, // Can expand to show created vs completed
    });
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl">
      <h3 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <span className="text-2xl">✓</span>
        Todo Completion Heatmap
      </h3>

      <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
        {heatmapData.map((day) => {
          const intensity = Math.min(day.completed / 5, 1); // Max 5 todos = full intensity
          const bgColor = intensity === 0
            ? "bg-slate-800/50"
            : `bg-emerald-500/${Math.floor(intensity * 100)}`;

          return (
            <div
              key={day.date}
              className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${bgColor} hover:ring-2 hover:ring-emerald-400/50 transition-all cursor-pointer`}
              title={`${day.date}: ${day.completed} todos completed`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>Last 90 days</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-slate-800/50 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-500/30 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-500/60 rounded-sm" />
            <div className="w-3 h-3 bg-emerald-500/100 rounded-sm" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/TodoCompletionHeatmap.tsx
git commit -m "feat: add TodoCompletionHeatmap component"
```

---

## Task 2: PointsEarnedHeatmap Component

**Goal:** Visualize point earnings and spending over time

**Files:**
- Create: `client/src/components/PointsEarnedHeatmap.tsx`

**Step 1: Create the component file**

```tsx
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays, parseISO } from "date-fns";

interface PointDayData {
  date: string;
  earned: number;
  spent: number;
  net: number;
}

export default function PointsEarnedHeatmap() {
  const { data: transactions } = useQuery<any[]>({
    queryKey: ["/api/points/transactions"],
  });

  // Process data into daily aggregates
  const dailyData: Record<string, PointDayData> = {};
  const days = 90;

  // Initialize all days
  for (let i = days - 1; i >= 0; i--) {
    const date = format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd");
    dailyData[date] = { date, earned: 0, spent: 0, net: 0 };
  }

  // Aggregate transactions
  transactions?.forEach((tx: any) => {
    const date = format(parseISO(tx.createdAt), "yyyy-MM-dd");
    if (dailyData[date]) {
      if (tx.amount > 0) {
        dailyData[date].earned += tx.amount;
      } else {
        dailyData[date].spent += Math.abs(tx.amount);
      }
      dailyData[date].net += tx.amount;
    }
  });

  const heatmapData = Object.values(dailyData);
  const maxEarned = Math.max(...heatmapData.map(d => d.earned), 1);

  return (
    <div className="bg-gradient-to-br from-amber-950/40 to-amber-900/20 backdrop-blur-sm rounded-xl p-6 border border-amber-700/30 shadow-xl">
      <h3 className="text-xl font-semibold text-amber-100 mb-4 flex items-center gap-2">
        <span className="text-2xl">💰</span>
        Points Earned Heatmap
      </h3>

      <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
        {heatmapData.map((day) => {
          const intensity = Math.min(day.earned / (maxEarned * 0.5), 1);
          const bgColor = intensity === 0
            ? "bg-slate-800/50"
            : `bg-amber-500`;
          const opacity = Math.floor(intensity * 100);

          return (
            <div
              key={day.date}
              className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${bgColor}/${opacity || 20} hover:ring-2 hover:ring-amber-400/50 transition-all cursor-pointer relative group`}
              title={`${day.date}: +${day.earned} earned, -${day.spent} spent, net: ${day.net}`}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-amber-200/70">
        <span>Last 90 days</span>
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-slate-800/50 rounded-sm" />
            <div className="w-3 h-3 bg-amber-500/30 rounded-sm" />
            <div className="w-3 h-3 bg-amber-500/60 rounded-sm" />
            <div className="w-3 h-3 bg-amber-500/100 rounded-sm" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-emerald-400">
            {heatmapData.reduce((sum, d) => sum + d.earned, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Total Earned</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-rose-400">
            {heatmapData.reduce((sum, d) => sum + d.spent, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Total Spent</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-amber-400">
            {heatmapData.reduce((sum, d) => sum + d.net, 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">Net Gain</div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/PointsEarnedHeatmap.tsx
git commit -m "feat: add PointsEarnedHeatmap with earned/spent visualization"
```

---

## Task 3: StreakComboWidget Component

**Goal:** Display current combo, daily high score, and streak visualization

**Files:**
- Create: `client/src/components/StreakComboWidget.tsx`

**Step 1: Create the component file**

```tsx
import { useQuery } from "@tanstack/react-query";
import { differenceInMinutes, parseISO } from "date-fns";

export default function StreakComboWidget() {
  const { data: comboStats } = useQuery<any>({
    queryKey: ["/api/combo-stats"],
  });

  const { data: habitLogs } = useQuery<any[]>({
    queryKey: ["/api/habit-logs"],
  });

  // Calculate current streak from habit logs
  const calculateStreak = () => {
    if (!habitLogs || habitLogs.length === 0) return 0;

    const sortedLogs = habitLogs
      .filter((log: any) => log.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();

    for (const log of sortedLogs) {
      const logDate = new Date(log.date);
      const daysDiff = Math.floor((currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= streak + 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();
  const currentCombo = comboStats?.currentCombo || 0;
  const dailyHighScore = comboStats?.dailyHighScore || 0;

  // Check if combo is active (within 4 hours)
  const comboActive = comboStats?.comboExpiresAt &&
    differenceInMinutes(parseISO(comboStats.comboExpiresAt), new Date()) > 0;

  return (
    <div className="bg-gradient-to-br from-purple-950/40 to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-purple-700/30 shadow-xl">
      <h3 className="text-xl font-semibold text-purple-100 mb-4 flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        Streaks & Combos
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current Combo */}
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className={`text-4xl font-bold mb-1 ${comboActive ? 'text-orange-400 animate-pulse' : 'text-slate-400'}`}>
            {currentCombo}x
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Current Combo</div>
          {comboActive && (
            <div className="mt-2 text-xs text-orange-400">
              ⏱ {Math.floor(differenceInMinutes(parseISO(comboStats.comboExpiresAt), new Date()) / 60)}h {differenceInMinutes(parseISO(comboStats.comboExpiresAt), new Date()) % 60}m left
            </div>
          )}
        </div>

        {/* Daily High Score */}
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <div className="text-4xl font-bold text-yellow-400 mb-1">
            {dailyHighScore}x
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wider">Today's Best</div>
        </div>
      </div>

      {/* Current Streak */}
      <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-300 mb-1">Current Streak</div>
            <div className="text-3xl font-bold text-orange-400">
              {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
            </div>
          </div>
          <div className="text-5xl">🔥</div>
        </div>

        {/* Streak visualization */}
        <div className="mt-4 flex gap-1">
          {[...Array(Math.min(currentStreak, 30))].map((_, i) => (
            <div
              key={i}
              className="h-2 flex-1 bg-gradient-to-t from-orange-600 to-orange-400 rounded-full"
              style={{ maxWidth: '8px' }}
            />
          ))}
          {currentStreak > 30 && (
            <div className="text-xs text-slate-400 ml-2">+{currentStreak - 30} more</div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/StreakComboWidget.tsx
git commit -m "feat: add StreakComboWidget with combo timer and streak visualization"
```

---

## Task 4: DailyQuestsWidget Component

**Goal:** Display today's daily quests with progress bars

**Files:**
- Create: `client/src/components/DailyQuestsWidget.tsx`

**Step 1: Create the component file**

```tsx
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

export default function DailyQuestsWidget() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: userQuests } = useQuery<any[]>({
    queryKey: ["/api/daily-quests/today"],
  });

  if (!userQuests || userQuests.length === 0) {
    return (
      <div className="bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-700/30 shadow-xl">
        <h3 className="text-xl font-semibold text-cyan-100 mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Daily Quests
        </h3>
        <p className="text-slate-400 text-sm">No quests available today</p>
      </div>
    );
  }

  const completedCount = userQuests.filter((q: any) => q.completed).length;
  const claimedCount = userQuests.filter((q: any) => q.claimed).length;

  return (
    <div className="bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 backdrop-blur-sm rounded-xl p-6 border border-cyan-700/30 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-cyan-100 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          Daily Quests
        </h3>
        <span className="text-sm text-cyan-300 bg-cyan-900/50 px-3 py-1 rounded-full">
          {completedCount}/{userQuests.length} Complete
        </span>
      </div>

      <div className="space-y-3">
        {userQuests.map((quest: any) => {
          const progress = Math.min((quest.progress / quest.targetValue) * 100, 100);
          const isComplete = quest.completed;
          const isClaimed = quest.claimed;

          return (
            <div
              key={quest.id}
              className={`bg-slate-800/50 rounded-lg p-4 border transition-all ${
                isComplete
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className={`font-medium mb-1 ${isComplete ? 'text-emerald-300' : 'text-slate-200'}`}>
                    {quest.title}
                  </h4>
                  {quest.description && (
                    <p className="text-xs text-slate-400">{quest.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-amber-400 text-sm font-medium">
                    +{quest.rewardTokens}
                  </span>
                  {isClaimed && (
                    <span className="text-emerald-400">✓</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Progress value={progress} className="flex-1 h-2" />
                <span className="text-sm text-slate-400 min-w-[4rem] text-right">
                  {quest.progress}/{quest.targetValue}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {completedCount > 0 && claimedCount < completedCount && (
        <div className="mt-4 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-lg text-center">
          <p className="text-emerald-300 text-sm">
            🎉 {completedCount - claimedCount} quest{completedCount - claimedCount !== 1 ? 's' : ''} ready to claim!
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/DailyQuestsWidget.tsx
git commit -m "feat: add DailyQuestsWidget with progress tracking"
```

---

## Task 5: ExpeditionProgressWidget Component

**Goal:** Display current expedition progress and climbing stats

**Files:**
- Create: `client/src/components/ExpeditionProgressWidget.tsx`

**Step 1: Create the component file**

```tsx
import { useQuery } from "@tanstack/react-query";
import { Battery, Mountain, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ExpeditionProgressWidget() {
  const { data: climbingStats } = useQuery<any>({
    queryKey: ["/api/climbing-stats"],
  });

  const { data: activeExpeditions } = useQuery<any[]>({
    queryKey: ["/api/expeditions/active"],
  });

  const activeExpedition = activeExpeditions?.[0];
  const energyPercent = climbingStats
    ? (climbingStats.currentEnergy / climbingStats.maxEnergy) * 100
    : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 shadow-xl">
      <h3 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <Mountain className="w-5 h-5 text-blue-400" />
        Expedition Status
      </h3>

      {/* Climbing Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {climbingStats?.climbingLevel || 1}
          </div>
          <div className="text-xs text-slate-400">Level</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {climbingStats?.summitsReached || 0}
          </div>
          <div className="text-xs text-slate-400">Summits</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {climbingStats?.totalElevationClimbed
              ? `${(climbingStats.totalElevationClimbed / 1000).toFixed(1)}k`
              : '0'}
          </div>
          <div className="text-xs text-slate-400">Elevation (m)</div>
        </div>
      </div>

      {/* Energy Bar */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Battery className="w-4 h-4 text-green-400" />
            <span>Energy</span>
          </div>
          <span className="text-sm font-medium text-slate-200">
            {climbingStats?.currentEnergy || 0} / {climbingStats?.maxEnergy || 100}
          </span>
        </div>
        <Progress value={energyPercent} className="h-3" />
      </div>

      {/* Active Expedition */}
      {activeExpedition ? (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h4 className="font-semibold text-blue-300">Active Climb</h4>
          </div>

          <p className="text-sm text-slate-200 mb-2">{activeExpedition.routeName}</p>

          <div className="flex items-center gap-3 mb-2">
            <Progress value={activeExpedition.currentProgress} className="flex-1 h-2" />
            <span className="text-sm text-slate-400">{activeExpedition.currentProgress}%</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-slate-400">
              Day: <span className="text-slate-200 font-medium">{activeExpedition.currentDay}</span>
            </div>
            <div className="text-slate-400">
              Altitude: <span className="text-slate-200 font-medium">{activeExpedition.currentAltitude}m</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/30 rounded-lg p-4 text-center border border-dashed border-slate-700">
          <Mountain className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No active expedition</p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/ExpeditionProgressWidget.tsx
git commit -m "feat: add ExpeditionProgressWidget with climbing stats and energy"
```

---

## Task 6: MoodEnergyHeatmap Component

**Goal:** Visualize mood and energy levels from habit logs over time

**Files:**
- Create: `client/src/components/MoodEnergyHeatmap.tsx`

**Step 1: Create the component file**

```tsx
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, subDays } from "date-fns";
import { Smile, Zap } from "lucide-react";

interface MoodEnergyData {
  date: string;
  avgMood: number;
  avgEnergy: number;
  count: number;
}

export default function MoodEnergyHeatmap() {
  const { data: habitLogs } = useQuery<any[]>({
    queryKey: ["/api/habit-logs"],
  });

  // Process data into daily averages
  const dailyData: Record<string, { moods: number[]; energies: number[] }> = {};
  const days = 90;

  for (let i = days - 1; i >= 0; i--) {
    const date = format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd");
    dailyData[date] = { moods: [], energies: [] };
  }

  habitLogs?.forEach((log: any) => {
    if (dailyData[log.date]) {
      if (log.mood) dailyData[log.date].moods.push(log.mood);
      if (log.energyLevel) dailyData[log.date].energies.push(log.energyLevel);
    }
  });

  const heatmapData: MoodEnergyData[] = Object.entries(dailyData).map(([date, data]) => ({
    date,
    avgMood: data.moods.length > 0
      ? data.moods.reduce((sum, m) => sum + m, 0) / data.moods.length
      : 0,
    avgEnergy: data.energies.length > 0
      ? data.energies.reduce((sum, e) => sum + e, 0) / data.energies.length
      : 0,
    count: data.moods.length,
  }));

  return (
    <div className="bg-gradient-to-br from-pink-950/40 to-purple-900/20 backdrop-blur-sm rounded-xl p-6 border border-pink-700/30 shadow-xl">
      <h3 className="text-xl font-semibold text-pink-100 mb-4 flex items-center gap-2">
        <Smile className="w-5 h-5 text-pink-400" />
        Mood & Energy Tracking
      </h3>

      {/* Mood Heatmap */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Smile className="w-4 h-4 text-pink-400" />
          <h4 className="text-sm font-medium text-pink-200">Mood</h4>
        </div>
        <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
          {heatmapData.map((day) => {
            const intensity = day.avgMood / 5; // 1-5 scale
            const color = intensity === 0
              ? "bg-slate-800/50"
              : intensity <= 0.4 ? "bg-red-500"
              : intensity <= 0.6 ? "bg-yellow-500"
              : "bg-emerald-500";
            const opacity = Math.floor(intensity * 100) || 20;

            return (
              <div
                key={`mood-${day.date}`}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${color}/${opacity} hover:ring-2 hover:ring-pink-400/50 transition-all cursor-pointer`}
                title={`${day.date}: Mood ${day.avgMood.toFixed(1)}/5 (${day.count} logs)`}
              />
            );
          })}
        </div>
      </div>

      {/* Energy Heatmap */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-medium text-amber-200">Energy</h4>
        </div>
        <div className="grid grid-cols-[repeat(13,1fr)] gap-1">
          {heatmapData.map((day) => {
            const intensity = day.avgEnergy / 5; // 1-5 scale
            const color = intensity === 0
              ? "bg-slate-800/50"
              : intensity <= 0.4 ? "bg-orange-500"
              : intensity <= 0.6 ? "bg-yellow-500"
              : "bg-cyan-500";
            const opacity = Math.floor(intensity * 100) || 20;

            return (
              <div
                key={`energy-${day.date}`}
                className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${color}/${opacity} hover:ring-2 hover:ring-amber-400/50 transition-all cursor-pointer`}
                title={`${day.date}: Energy ${day.avgEnergy.toFixed(1)}/5 (${day.count} logs)`}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-400 text-center">
        Last 90 days
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/MoodEnergyHeatmap.tsx
git commit -m "feat: add MoodEnergyHeatmap with dual mood/energy visualization"
```

---

## Task 7: VirtualPetStatsWidget Component

**Goal:** Display pet happiness, health, and level with mini-chart

**Files:**
- Create: `client/src/components/VirtualPetStatsWidget.tsx`

**Step 1: Create the component file**

```tsx
import { useQuery } from "@tanstack/react-query";
import { Heart, Smile, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function VirtualPetStatsWidget() {
  const { data: pet } = useQuery<any>({
    queryKey: ["/api/virtual-pet"],
  });

  if (!pet) {
    return (
      <div className="bg-gradient-to-br from-green-950/40 to-emerald-900/20 backdrop-blur-sm rounded-xl p-6 border border-green-700/30 shadow-xl">
        <h3 className="text-xl font-semibold text-green-100 mb-4">
          🌱 Your Companion
        </h3>
        <p className="text-slate-400 text-sm">No pet found</p>
      </div>
    );
  }

  const experienceToNextLevel = pet.level * 100;
  const experienceProgress = (pet.experience / experienceToNextLevel) * 100;

  return (
    <div className="bg-gradient-to-br from-green-950/40 to-emerald-900/20 backdrop-blur-sm rounded-xl p-6 border border-green-700/30 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-green-100">
          🌱 {pet.name}
        </h3>
        <span className="text-sm px-3 py-1 bg-emerald-900/50 text-emerald-300 rounded-full">
          Lv. {pet.level}
        </span>
      </div>

      {/* Pet Stats */}
      <div className="space-y-4 mb-4">
        {/* Happiness */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Smile className="w-4 h-4 text-yellow-400" />
              <span>Happiness</span>
            </div>
            <span className="text-sm font-medium text-slate-200">{pet.happiness}/100</span>
          </div>
          <Progress
            value={pet.happiness}
            className="h-2"
            indicatorClassName={pet.happiness >= 70 ? "bg-yellow-400" : pet.happiness >= 40 ? "bg-orange-400" : "bg-red-400"}
          />
        </div>

        {/* Health */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Heart className="w-4 h-4 text-red-400" />
              <span>Health</span>
            </div>
            <span className="text-sm font-medium text-slate-200">{pet.health}/100</span>
          </div>
          <Progress
            value={pet.health}
            className="h-2"
            indicatorClassName={pet.health >= 70 ? "bg-emerald-400" : pet.health >= 40 ? "bg-yellow-400" : "bg-red-400"}
          />
        </div>

        {/* Experience */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Experience</span>
            </div>
            <span className="text-sm font-medium text-slate-200">
              {pet.experience}/{experienceToNextLevel}
            </span>
          </div>
          <Progress
            value={experienceProgress}
            className="h-2"
            indicatorClassName="bg-blue-400"
          />
        </div>
      </div>

      {/* Evolution Stage */}
      <div className="bg-slate-800/50 rounded-lg p-3 text-center">
        <div className="text-lg font-medium text-emerald-300 capitalize">
          {pet.evolution}
        </div>
        <div className="text-xs text-slate-400">Evolution Stage</div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/VirtualPetStatsWidget.tsx
git commit -m "feat: add VirtualPetStatsWidget with happiness/health/experience"
```

---

## Task 8: Add All New Widgets to Dashboard

**Goal:** Import and display all new widgets on the dashboard

**Files:**
- Modify: `client/src/pages/DashboardNew.tsx`

**Step 1: Import all new components**

Add to the imports section:

```tsx
import TodoCompletionHeatmap from "@/components/TodoCompletionHeatmap";
import PointsEarnedHeatmap from "@/components/PointsEarnedHeatmap";
import StreakComboWidget from "@/components/StreakComboWidget";
import DailyQuestsWidget from "@/components/DailyQuestsWidget";
import ExpeditionProgressWidget from "@/components/ExpeditionProgressWidget";
import MoodEnergyHeatmap from "@/components/MoodEnergyHeatmap";
import VirtualPetStatsWidget from "@/components/VirtualPetStatsWidget";
```

**Step 2: Add widgets to the dashboard grid**

Find the main dashboard grid and add the new widgets:

```tsx
{/* New Widgets Section */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  <StreakComboWidget />
  <ExpeditionProgressWidget />
  <VirtualPetStatsWidget />
</div>

{/* Heatmaps Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <TodoCompletionHeatmap />
  <PointsEarnedHeatmap />
</div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <MoodEnergyHeatmap />
  <DailyQuestsWidget />
</div>
```

**Step 3: Commit**

```bash
git add client/src/pages/DashboardNew.tsx
git commit -m "feat: integrate all new widgets and heatmaps into dashboard"
```

---

## Task 9: Add API Endpoints for New Data

**Goal:** Ensure all necessary API endpoints exist for the new widgets

**Files:**
- Modify: `server/routes.ts`

**Step 1: Add combo stats endpoint**

```typescript
app.get("/api/combo-stats", async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Not authenticated");
  }

  const stats = await db.query.userComboStats.findFirst({
    where: eq(userComboStats.userId, req.user.id),
  });

  res.json(stats || {
    currentCombo: 0,
    dailyHighScore: 0,
    lastCompletionTime: null,
    comboExpiresAt: null,
  });
});
```

**Step 2: Add active expeditions endpoint**

```typescript
app.get("/api/expeditions/active", async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Not authenticated");
  }

  const expeditions = await db.query.playerExpeditions.findMany({
    where: and(
      eq(playerExpeditions.userId, req.user.id),
      eq(playerExpeditions.status, "in_progress")
    ),
    with: {
      route: {
        with: {
          mountain: true,
        },
      },
    },
    limit: 5,
  });

  res.json(expeditions);
});
```

**Step 3: Add daily quests endpoint**

```typescript
app.get("/api/daily-quests/today", async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Not authenticated");
  }

  const today = format(new Date(), "yyyy-MM-dd");

  const quests = await db.query.userDailyQuests.findMany({
    where: and(
      eq(userDailyQuests.userId, req.user.id),
      eq(userDailyQuests.questDate, today)
    ),
    with: {
      quest: true,
    },
  });

  res.json(quests.map(uq => ({
    ...uq,
    title: uq.quest.title,
    description: uq.quest.description,
    targetValue: uq.quest.targetValue,
    rewardTokens: uq.quest.rewardTokens,
  })));
});
```

**Step 4: Add climbing stats endpoint**

```typescript
app.get("/api/climbing-stats", async (req, res) => {
  if (!req.user) {
    return res.status(401).send("Not authenticated");
  }

  const stats = await db.query.playerClimbingStats.findFirst({
    where: eq(playerClimbingStats.userId, req.user.id),
  });

  res.json(stats || {
    climbingLevel: 1,
    totalExperience: 0,
    summitsReached: 0,
    totalElevationClimbed: 0,
    currentEnergy: 100,
    maxEnergy: 100,
    trainingDaysCompleted: 0,
  });
});
```

**Step 5: Commit**

```bash
git add server/routes.ts
git commit -m "feat: add API endpoints for combo stats, expeditions, quests, and climbing stats"
```

---

## Task 10: Test All Widgets and Fix Issues

**Goal:** Verify all widgets render correctly and display data

**Step 1: Start development server**

```bash
npm run dev
```

**Step 2: Navigate to dashboard and visually inspect each widget**

Check:
- All widgets render without errors
- Data displays correctly
- Responsive layout works on mobile
- Colors match mountain theme
- Hover effects work on heatmaps

**Step 3: Fix any TypeScript errors**

Run:
```bash
npm run check
```

Fix any type errors found.

**Step 4: Test with empty data**

Verify widgets handle cases where:
- No habits logged yet
- No todos completed
- No points earned
- No active expeditions
- No daily quests assigned

**Step 5: Final commit**

```bash
git add .
git commit -m "fix: address TypeScript errors and empty state handling"
```

---

## Completion Checklist

- [ ] TodoCompletionHeatmap created and working
- [ ] PointsEarnedHeatmap created and working
- [ ] StreakComboWidget created and working
- [ ] DailyQuestsWidget created and working
- [ ] ExpeditionProgressWidget created and working
- [ ] MoodEnergyHeatmap created and working
- [ ] VirtualPetStatsWidget created and working
- [ ] All widgets integrated into dashboard
- [ ] API endpoints added and tested
- [ ] All TypeScript errors resolved
- [ ] Empty states handled gracefully
- [ ] Responsive design verified
- [ ] Mountain theme colors consistent

---

## Next Steps After Completion

1. **Use finishing-a-development-branch skill** to push changes and create PR
2. Run `/design-review` to verify UI/UX consistency
3. Run `/code-review` before merging
4. Consider adding:
   - Weekly summary email widget
   - Goal category breakdown chart
   - Mountain background selector widget
   - Gear inventory widget
   - Weather forecast widget for expeditions

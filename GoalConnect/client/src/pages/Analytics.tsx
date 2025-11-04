import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/DashboardHeader";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Calendar as CalendarIcon, Trophy, Flame, Target } from "lucide-react";
import * as Icons from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateStreak } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function Analytics() {
  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs/all"],
    queryFn: async () => {
      if (habits.length === 0) return [];
      const logsPromises = habits.map(h =>
        fetch(`/api/habit-logs?habitId=${h.id}`).then(res => res.json())
      );
      const logsArrays = await Promise.all(logsPromises);
      return logsArrays.flat();
    },
    enabled: habits.length > 0,
  });

  // Calculate all completion dates
  const allCompletionDates = useMemo(() => {
    return allLogs
      .filter(log => log.completed)
      .map(log => log.date);
  }, [allLogs]);

  // Calculate per-habit analytics
  const habitAnalytics = useMemo(() => {
    return habits.map(habit => {
      const habitLogs = allLogs.filter(log => log.habitId === habit.id && log.completed);
      const dates = habitLogs.map(log => log.date);
      const totalCompletions = habitLogs.length;
      const currentStreak = calculateStreak(dates);

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = [...dates].sort();

      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      // Calculate completion rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      const recentLogs = habitLogs.filter(log => log.date >= thirtyDaysAgoStr);
      const completionRate = Math.round((recentLogs.length / 30) * 100);

      return {
        habit,
        totalCompletions,
        currentStreak,
        longestStreak,
        completionRate,
        completionDates: dates,
      };
    }).sort((a, b) => b.totalCompletions - a.totalCompletions);
  }, [habits, allLogs]);

  // Calculate best/worst days
  const dayAnalysis = useMemo(() => {
    const dayCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    allLogs.filter(log => log.completed).forEach(log => {
      const date = new Date(log.date);
      const dayOfWeek = date.getDay();
      dayCount[dayOfWeek]++;
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = Object.entries(dayCount).map(([day, count]) => ({
      day: days[parseInt(day)],
      count,
      dayIndex: parseInt(day),
    }));

    const sorted = [...dayData].sort((a, b) => b.count - a.count);

    return {
      dayData,
      bestDay: sorted[0],
      worstDay: sorted[sorted.length - 1],
    };
  }, [allLogs]);

  // Calculate total stats
  const totalStats = useMemo(() => {
    const totalCompletions = allLogs.filter(log => log.completed).length;

    // Check milestone achievements
    const milestones = [
      { value: 1000, label: "1000 Completions", icon: "🏆", unlocked: totalCompletions >= 1000 },
      { value: 500, label: "500 Completions", icon: "💎", unlocked: totalCompletions >= 500 },
      { value: 100, label: "100 Completions", icon: "⭐", unlocked: totalCompletions >= 100 },
      { value: 50, label: "50 Completions", icon: "🎯", unlocked: totalCompletions >= 50 },
    ];

    const unlockedMilestones = milestones.filter(m => m.unlocked);
    const nextMilestone = milestones.find(m => !m.unlocked);

    return {
      totalCompletions,
      totalHabits: habits.length,
      unlockedMilestones,
      nextMilestone,
    };
  }, [allLogs, habits]);

  if (habitsLoading || logsLoading) {
    return (
      <div className="min-h-screen pb-20">
        <DashboardHeader />
        <main className="max-w-7xl mx-auto p-4 space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Deep insights into your habit journey
            </p>
          </div>
        </div>

        {/* Total Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold">{totalStats.totalCompletions}</div>
              <p className="text-sm text-muted-foreground">Total Completions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold">{totalStats.totalHabits}</div>
              <p className="text-sm text-muted-foreground">Active Habits</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-3xl font-bold">
                {Math.max(...habitAnalytics.map(h => h.currentStreak), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Best Current Streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-3xl font-bold">
                {Math.max(...habitAnalytics.map(h => h.longestStreak), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Longest Ever Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Milestones */}
        {totalStats.unlockedMilestones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Milestones Achieved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {totalStats.unlockedMilestones.map((milestone, idx) => (
                  <Badge key={idx} variant="secondary" className="text-base px-4 py-2">
                    {milestone.icon} {milestone.label}
                  </Badge>
                ))}
              </div>
              {totalStats.nextMilestone && (
                <p className="text-sm text-muted-foreground mt-4">
                  Next milestone: {totalStats.nextMilestone.icon} {totalStats.nextMilestone.label}
                  ({totalStats.totalCompletions}/{totalStats.nextMilestone.value})
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Overall Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Year Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your habit completion activity over the past year
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <HabitHeatmap completionDates={allCompletionDates} weeksToShow={52} />
            </div>
          </CardContent>
        </Card>

        {/* Best/Worst Days */}
        <Card>
          <CardHeader>
            <CardTitle>Day of Week Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="text-center p-6 rounded-lg bg-green-500/10 border-2 border-green-500/20">
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {dayAnalysis.bestDay.day}
                </div>
                <p className="text-sm text-muted-foreground mb-1">Your Best Day</p>
                <p className="text-2xl font-semibold">{dayAnalysis.bestDay.count} completions</p>
              </div>

              <div className="text-center p-6 rounded-lg bg-orange-500/10 border-2 border-orange-500/20">
                <div className="text-5xl font-bold text-orange-600 mb-2">
                  {dayAnalysis.worstDay.day}
                </div>
                <p className="text-sm text-muted-foreground mb-1">Needs Improvement</p>
                <p className="text-2xl font-semibold">{dayAnalysis.worstDay.count} completions</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="space-y-3">
              {dayAnalysis.dayData.map(({ day, count }) => {
                const maxCount = Math.max(...dayAnalysis.dayData.map(d => d.count));
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-12 text-sm font-medium">{day}</div>
                    <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500 flex items-center justify-end pr-3"
                        style={{ width: `${percentage}%` }}
                      >
                        {count > 0 && (
                          <span className="text-sm font-semibold text-primary-foreground">
                            {count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Per-Habit Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Habit Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {habitAnalytics.map(({ habit, totalCompletions, currentStreak, longestStreak, completionRate, completionDates }) => {
              const IconComponent = (Icons as any)[habit.icon] || Icons.Target;

              return (
                <div key={habit.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-lg"
                        style={{ backgroundColor: `${habit.color}20`, color: habit.color }}
                      >
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{habit.title}</h3>
                        <p className="text-sm text-muted-foreground">{habit.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{totalCompletions}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{currentStreak}</div>
                      <div className="text-xs text-muted-foreground">Current Streak</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{longestStreak}</div>
                      <div className="text-xs text-muted-foreground">Longest Streak</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-2xl font-bold">{completionRate}%</div>
                      <div className="text-xs text-muted-foreground">30-Day Rate</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <HabitHeatmap completionDates={completionDates} weeksToShow={26} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

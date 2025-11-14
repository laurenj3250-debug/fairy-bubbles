import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, Target, Flame, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog, Goal } from "@shared/schema";
import { useMemo } from "react";

export function MonthlyReport() {
  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
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

  const monthStats = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthStart = firstDay.toISOString().split('T')[0];
    const monthEnd = lastDay.toISOString().split('T')[0];
    const monthName = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Filter this month's logs
    const monthLogs = allLogs.filter(
      log => log.completed && log.date >= monthStart && log.date <= monthEnd
    );

    // Perfect days (all habits completed)
    const dateCompletions: Record<string, number> = {};
    monthLogs.forEach(log => {
      dateCompletions[log.date] = (dateCompletions[log.date] || 0) + 1;
    });

    const perfectDays = Object.values(dateCompletions).filter(count => count === habits.length).length;

    // Goals progress
    const goalsThisMonth = goals.filter(goal => {
      return goal.deadline >= monthStart && goal.deadline <= monthEnd;
    });

    const goalsCompleted = goalsThisMonth.filter(goal => {
      const progress = (goal.currentValue / goal.targetValue) * 100;
      return progress >= 100;
    }).length;

    // Most consistent habit
    const habitStats = habits.map(habit => {
      const completions = monthLogs.filter(log => log.habitId === habit.id).length;
      return { habit, completions };
    }).sort((a, b) => b.completions - a.completions);

    const mostConsistent = habitStats[0];

    // Calculate improvement from last month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
    const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];

    const lastMonthLogs = allLogs.filter(
      log => log.completed && log.date >= lastMonthStartStr && log.date <= lastMonthEndStr
    );

    const improvement = monthLogs.length - lastMonthLogs.length;
    const improvementPercent = lastMonthLogs.length > 0
      ? Math.round(((monthLogs.length - lastMonthLogs.length) / lastMonthLogs.length) * 100)
      : 0;

    // Calculate days active
    const uniqueDates = new Set(monthLogs.map(log => log.date));
    const daysActive = uniqueDates.size;

    return {
      monthName,
      totalCompletions: monthLogs.length,
      perfectDays,
      goalsCompleted,
      goalsTotal: goalsThisMonth.length,
      mostConsistent,
      improvement,
      improvementPercent,
      daysActive,
      daysInMonth: lastDay.getDate(),
    };
  }, [habits, allLogs, goals]);

  if (habits.length === 0) return null;

  return (
    <Card className="bg-card/40 backdrop-blur-sm border-2 border-card-border rounded-3xl shadow-lg topo-pattern">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Monthly Report
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
            {monthStats.monthName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400">{monthStats.totalCompletions}</div>
            <div className="text-xs text-muted-foreground">Total Completions</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400">{monthStats.perfectDays}</div>
            <div className="text-xs text-muted-foreground">Perfect Days</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400">{monthStats.daysActive}</div>
            <div className="text-xs text-muted-foreground">Days Active</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400">
              {Math.round((monthStats.daysActive / monthStats.daysInMonth) * 100)}%
            </div>
            <div className="text-xs text-muted-foreground">Activity Rate</div>
          </div>
        </div>

        {/* Month over Month Improvement */}
        {monthStats.improvement !== 0 && (
          <div className={`p-4 rounded-lg border ${
            monthStats.improvement > 0
              ? 'bg-green-500/10 border-green-500/20'
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${
                  monthStats.improvement > 0 ? 'text-green-500' : 'text-red-500'
                }`} />
                <span className="font-semibold">Month-over-Month</span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  monthStats.improvement > 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {monthStats.improvement > 0 ? '+' : ''}{monthStats.improvementPercent}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.abs(monthStats.improvement)} {monthStats.improvement > 0 ? 'more' : 'fewer'} completions
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Most Consistent Habit */}
        {monthStats.mostConsistent && monthStats.mostConsistent.completions > 0 && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-yellow-500" />
              <div className="flex-1">
                <div className="font-semibold text-yellow-300">Most Consistent</div>
                <div className="text-sm text-muted-foreground">
                  {monthStats.mostConsistent.habit.title} - {monthStats.mostConsistent.completions} times
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goals Summary */}
        {monthStats.goalsTotal > 0 && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">Goals This Month</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-400">
                  {monthStats.goalsCompleted}/{monthStats.goalsTotal}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>
        )}

        {/* Motivational Summary */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="font-semibold mb-1">
            {monthStats.totalCompletions >= 200
              ? "Legendary Performance!"
              : monthStats.totalCompletions >= 100
              ? "Outstanding Month!"
              : monthStats.totalCompletions >= 50
              ? "Solid Progress!"
              : "Building Momentum!"}
          </p>
          <p className="text-sm text-muted-foreground">
            {monthStats.perfectDays > 0
              ? `You had ${monthStats.perfectDays} perfect day${monthStats.perfectDays !== 1 ? 's' : ''}! 🌟`
              : "Keep pushing for your first perfect day!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

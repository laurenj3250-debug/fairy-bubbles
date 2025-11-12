import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy, Target, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog, Goal } from "@shared/schema";
import { useMemo } from "react";
import { calculateStreak } from "@/lib/utils";

export function WeeklyReport() {
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

  const weekStats = useMemo(() => {
    // Get this week's dates (Monday - Sunday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const weekStart = monday.toISOString().split('T')[0];
    const weekEnd = new Date(monday);
    weekEnd.setDate(monday.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Filter this week's logs
    const weekLogs = allLogs.filter(
      log => log.completed && log.date >= weekStart && log.date <= weekEndStr
    );

    // Calculate completions per habit
    const habitCompletions = habits.map(habit => {
      const completions = weekLogs.filter(log => log.habitId === habit.id).length;
      const target = habit.targetPerWeek || 7;
      return {
        habit,
        completions,
        target,
        percentage: Math.round((completions / target) * 100),
      };
    });

    const topPerformers = habitCompletions
      .filter(h => h.completions > 0)
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    const needsImprovement = habitCompletions
      .filter(h => h.target && h.completions < h.target)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3);

    // Goals completed this week
    const goalsCompleted = goals.filter(goal => {
      const progress = (goal.currentValue / goal.targetValue) * 100;
      return progress >= 100;
    }).length;

    // Calculate total completion rate
    const totalPossible = habits.length * 7; // Assuming daily tracking
    const totalCompleted = weekLogs.length;
    const overallRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      weekStart: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalCompletions: weekLogs.length,
      overallRate,
      topPerformers,
      needsImprovement,
      goalsCompleted,
    };
  }, [habits, allLogs, goals]);

  if (habits.length === 0) return null;

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-2 border-card-border rounded-3xl shadow-lg topo-pattern">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Weekly Report
          </CardTitle>
          <Badge variant="secondary">
            {weekStats.weekStart} - {weekStats.weekEnd}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-3xl font-bold text-primary">{weekStats.totalCompletions}</div>
            <div className="text-sm text-muted-foreground">Total Completions</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="text-3xl font-bold text-primary">{weekStats.overallRate}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
        </div>

        {/* Top Performers */}
        {weekStats.topPerformers.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
              <TrendingUp className="w-4 h-4" />
              Top Performers
            </h3>
            <div className="space-y-2">
              {weekStats.topPerformers.map(({ habit, completions, target, percentage }) => (
                <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <span className="font-medium">{habit.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completions}/{target}
                    </span>
                    <Badge className="bg-green-600">{percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Needs Improvement */}
        {weekStats.needsImprovement.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
              <TrendingDown className="w-4 h-4" />
              Focus Areas
            </h3>
            <div className="space-y-2">
              {weekStats.needsImprovement.map(({ habit, completions, target, percentage }) => (
                <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <span className="font-medium">{habit.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {completions}/{target}
                    </span>
                    <Badge className="bg-orange-600">{percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals Update */}
        {weekStats.goalsCompleted > 0 && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-600">
              <Target className="w-5 h-5" />
              <span className="font-semibold">
                {weekStats.goalsCompleted} goal{weekStats.goalsCompleted !== 1 ? 's' : ''} completed!
              </span>
            </div>
          </div>
        )}

        {/* Motivational Message */}
        <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
          <p className="text-sm font-medium">
            {weekStats.overallRate >= 80
              ? "🌟 Outstanding week! You're crushing it!"
              : weekStats.overallRate >= 60
              ? "💪 Great progress! Keep up the momentum!"
              : weekStats.overallRate >= 40
              ? "📈 You're building consistency! Stay focused!"
              : "🎯 New week, new opportunities! You've got this!"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Target, CheckCircle2, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog, Goal } from "@shared/schema";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

export function WeekAtAGlance() {
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

  // Get current week start (Monday) and end (Sunday)
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  }, []);

  // Filter goals due this week
  const weeklyGoals = useMemo(() => {
    return goals.filter(goal => {
      const deadline = goal.deadline;
      return deadline >= weekDates.start && deadline <= weekDates.end;
    });
  }, [goals, weekDates]);

  // Calculate habit progress for this week
  const habitProgress = useMemo(() => {
    return habits.map(habit => {
      const weekLogs = allLogs.filter(
        log => log.habitId === habit.id && log.date >= weekDates.start && log.date <= weekDates.end && log.completed
      );
      const current = weekLogs.length;
      const target = habit.targetPerWeek || null;

      return {
        id: habit.id,
        title: habit.title,
        current,
        target,
        needsAttention: target ? current < target : false,
        onTrack: target ? current >= target : current > 0,
      };
    });
  }, [habits, allLogs, weekDates]);

  const needsAttention = habitProgress.filter(h => h.needsAttention);
  const onTrack = habitProgress.filter(h => h.onTrack);

  if (habits.length === 0 && goals.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/40 backdrop-blur-sm border-2 border-card-border rounded-3xl shadow-lg topo-pattern">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-white font-bold" style={{ fontFamily: "'Comfortaa', cursive" }}>
          <Calendar className="w-5 h-5 text-yellow-400" />
          Week at a Glance
        </CardTitle>
        <Link href="/planner">
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
            View Planner
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goals Due This Week */}
        {weeklyGoals.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                Upcoming Goals
              </h3>
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30">
                {weeklyGoals.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {weeklyGoals.slice(0, 2).map(goal => {
                const daysLeft = Math.ceil(
                  (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={goal.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/90 truncate flex-1">{goal.title}</span>
                    <span className="text-xs text-white/70 ml-2">
                      {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                    </span>
                  </div>
                );
              })}
              {weeklyGoals.length > 2 && (
                <p className="text-xs text-white/60">+{weeklyGoals.length - 2} more</p>
              )}
            </div>
          </div>
        )}

        {/* Habit Targets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Need Attention */}
          {needsAttention.length > 0 && (
            <div className="bg-orange-500/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-orange-400/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-white">Needs Attention</h3>
              </div>
              <div className="space-y-1">
                {needsAttention.slice(0, 2).map(habit => (
                  <div key={habit.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/90 truncate flex-1">{habit.title}</span>
                    <span className="text-xs text-orange-300 ml-2 font-medium">
                      {habit.current}/{habit.target}
                    </span>
                  </div>
                ))}
                {needsAttention.length > 2 && (
                  <p className="text-xs text-white/60">+{needsAttention.length - 2} more</p>
                )}
              </div>
            </div>
          )}

          {/* On Track */}
          {onTrack.length > 0 && (
            <div className="bg-green-500/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-green-400/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-white">On Track</h3>
              </div>
              <div className="space-y-1">
                {onTrack.slice(0, 2).map(habit => (
                  <div key={habit.id} className="flex items-center justify-between text-sm">
                    <span className="text-white/90 truncate flex-1">{habit.title}</span>
                    {habit.target && (
                      <span className="text-xs text-green-300 ml-2 font-medium">
                        {habit.current}/{habit.target} ✓
                      </span>
                    )}
                  </div>
                ))}
                {onTrack.length > 2 && (
                  <p className="text-xs text-white/60">+{onTrack.length - 2} more</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Empty state if no data */}
        {weeklyGoals.length === 0 && needsAttention.length === 0 && onTrack.length === 0 && (
          <div className="text-center py-6 text-white/60 text-sm">
            No goals or habit targets set for this week
          </div>
        )}
      </CardContent>
    </Card>
  );
}

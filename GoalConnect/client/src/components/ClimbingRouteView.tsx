import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Pitch } from "./Pitch";
import { format } from "date-fns";
import type { Habit, HabitLog } from "@shared/schema";

interface ClimbingRouteViewProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  date?: string;
}

/**
 * ClimbingRouteView - Displays today's habits as a vertical climbing route
 * Each habit is a "pitch" that needs to be climbed to summit the day
 */
export function ClimbingRouteView({ habits, habitLogs, date }: ClimbingRouteViewProps) {
  const queryClient = useQueryClient();
  const today = date || format(new Date(), "yyyy-MM-dd");

  // Toggle habit completion mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ habitId, completed }: { habitId: number; completed: boolean }) => {
      const response = await fetch(`/api/habit-logs/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: today }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to toggle habit");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/habit-logs/${today}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
    },
  });

  // Build pitch data with completion status and streaks
  const pitches = useMemo(() => {
    return habits.map((habit) => {
      const log = habitLogs.find((l) => l.habitId === habit.id);
      const completed = log?.completed || false;

      // Calculate streak for this habit (simple version - can be enhanced)
      const habitStreakLogs = habitLogs.filter((l) => l.habitId === habit.id && l.completed);
      const streak = habitStreakLogs.length; // Simplified - should calculate consecutive days

      return {
        habit,
        completed,
        streak,
      };
    });
  }, [habits, habitLogs]);

  const handlePitchClick = (habitId: number, currentCompleted: boolean) => {
    toggleMutation.mutate({ habitId, completed: !currentCompleted });
  };

  // Calculate completion stats
  const completedCount = pitches.filter((p) => p.completed).length;
  const totalCount = pitches.length;
  const isFullySummitted = completedCount === totalCount && totalCount > 0;

  return (
    <div className="climbing-route-view">
      {/* Route Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{format(new Date(today), "EEEE, MMMM d")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Today's Route • {totalCount} {totalCount === 1 ? "pitch" : "pitches"} to summit
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="text-right">
          <div className="text-4xl font-black text-[hsl(var(--accent))]">
            {completedCount}/{totalCount}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Completed</div>
        </div>
      </div>

      {/* Climbing Route with vertical rope line */}
      <div className="relative pl-10">
        {/* Vertical rope line */}
        <div
          className="absolute left-5 top-0 bottom-0 w-1 opacity-30"
          style={{
            background: "linear-gradient(to bottom, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--primary)) 100%)",
          }}
        />

        {/* Pitches */}
        <div className="space-y-2">
          {pitches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No habits scheduled for today</p>
              <a
                href="/habits"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Habit
              </a>
            </div>
          ) : (
            pitches.map((pitch, index) => (
              <Pitch
                key={pitch.habit.id}
                habit={pitch.habit}
                completed={pitch.completed}
                streak={pitch.streak}
                onClick={() => handlePitchClick(pitch.habit.id, pitch.completed)}
                index={index}
              />
            ))
          )}
        </div>

        {/* Summit Goal */}
        {totalCount > 0 && (
          <div
            className={`mt-8 p-6 rounded-xl border-2 border-dashed text-center transition-all ${
              isFullySummitted
                ? "border-success bg-success/10 animate-celebration"
                : "border-[hsl(var(--accent))]/40 bg-[hsl(var(--accent))]/5"
            }`}
          >
            <div className="text-5xl mb-3">{isFullySummitted ? "🎉" : "🏔️"}</div>
            <div className="text-xl font-bold mb-2 text-foreground">
              {isFullySummitted ? "SUMMIT REACHED!" : "SUMMIT TODAY'S ROUTE"}
            </div>
            <p className="text-sm text-muted-foreground">
              {isFullySummitted
                ? "Outstanding! All pitches sent today. 🧗"
                : `Complete all ${totalCount} ${totalCount === 1 ? "pitch" : "pitches"} to send today's route`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

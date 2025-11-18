import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { motion } from "framer-motion";
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
      <div className="relative">
        {/* Vertical rope line - braided effect */}
        {pitches.length > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-1 ml-1">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: "repeating-linear-gradient(0deg, hsl(var(--primary)) 0px, hsl(var(--accent)) 20px, hsl(var(--primary)) 40px)",
                boxShadow: "0 0 10px rgba(0,0,0,0.2)"
              }}
            />
            <div
              className="absolute inset-0 opacity-10 blur-sm"
              style={{
                background: "linear-gradient(to bottom, hsl(var(--primary)), hsl(var(--accent)))",
              }}
            />
          </div>
        )}

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-8 p-8 rounded-2xl text-center transition-all relative overflow-hidden ${
              isFullySummitted
                ? "bg-gradient-to-br from-success/20 via-success/10 to-success/5 border-2 border-success"
                : "bg-gradient-to-br from-[hsl(var(--accent))]/10 to-[hsl(var(--accent))]/5 border-2 border-dashed border-[hsl(var(--accent))]/30"
            }`}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute top-0 left-0 w-32 h-32 bg-[hsl(var(--accent))] rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-[hsl(var(--primary))] rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <motion.div
                className="text-6xl mb-4"
                animate={isFullySummitted ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                {isFullySummitted ? "🎉" : "🏔️"}
              </motion.div>
              <div className={`text-2xl font-black mb-3 ${isFullySummitted ? "text-success" : "text-foreground"}`}>
                {isFullySummitted ? "SUMMIT REACHED!" : "SUMMIT TODAY'S ROUTE"}
              </div>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isFullySummitted
                  ? "Outstanding climb! All pitches sent today. You're crushing it! 🧗‍♂️"
                  : `Complete all ${totalCount} ${totalCount === 1 ? "pitch" : "pitches"} to send today's route and reach the summit`}
              </p>

              {isFullySummitted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success font-semibold"
                >
                  <span>🏆</span>
                  <span>Route Sent!</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

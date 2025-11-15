import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardContent } from "@/components/ui/GlassCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import type { HabitLog, Todo, Goal, GoalUpdate } from "@shared/schema";

interface WeekOverviewCardProps {
  habitLogs: HabitLog[];
  todos: Todo[];
  goals: Goal[];
  goalUpdates?: GoalUpdate[];
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

/**
 * WeekOverviewCard - Shows weekly activity overview
 *
 * Features:
 * - M-S horizontal strip with completion dots
 * - Click to open detailed modal with all goals, tasks, habits per day
 * - Today highlighted in theme color
 */
export function WeekOverviewCard({
  habitLogs,
  todos,
  goals,
  goalUpdates
}: WeekOverviewCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  // Calculate completion for each day
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const isToday = isSameDay(date, today);

    // Count completed habits for this day
    const completedHabits = habitLogs.filter(
      log => log.date === dateStr && log.completed
    ).length;

    // Count completed todos for this day
    const completedTodos = todos.filter(
      todo => todo.completedAt && format(new Date(todo.completedAt), "yyyy-MM-dd") === dateStr
    ).length;

    // Count goal updates for this day
    const dayGoalUpdates = goalUpdates?.filter(
      update => update.date === dateStr
    ).length || 0;

    const totalActivity = completedHabits + completedTodos + dayGoalUpdates;

    return {
      date,
      dateStr,
      dayLabel: DAYS[i],
      isToday,
      completedHabits,
      completedTodos,
      dayGoalUpdates,
      totalActivity,
      completionPercentage: Math.min(100, (totalActivity / 5) * 100) // Rough estimate
    };
  });

  const handleDayClick = (index: number) => {
    setSelectedDayIndex(index);
    setIsModalOpen(true);
  };

  const selectedDay = selectedDayIndex !== null ? weekData[selectedDayIndex] : null;

  return (
    <>
      <GlassCard className="h-full">
        <GlassCardHeader>
          <GlassCardTitle>Weekly Overview</GlassCardTitle>
        </GlassCardHeader>

        <GlassCardContent className="space-y-4">
          {/* Week Strip */}
          <div className="flex items-center justify-between gap-2">
            {weekData.map((day, index) => (
              <button
                key={day.dateStr}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayClick(index);
                }}
                aria-label={`${day.dayLabel}, ${day.totalActivity} activities`}
                className="flex-1 flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-white/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              >
                {/* Day Label */}
                <span className={cn(
                  "text-xs font-semibold",
                  day.isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {day.dayLabel}
                </span>

                {/* Activity Indicator */}
                <div className={cn(
                  "w-full h-12 rounded-lg border-2 transition-all relative overflow-hidden",
                  day.isToday
                    ? "border-primary bg-primary/10"
                    : day.totalActivity > 0
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/30 bg-muted/30"
                )}>
                  {/* Fill based on completion */}
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary/30 transition-all duration-300"
                    style={{ height: `${day.completionPercentage}%` }}
                  />

                  {/* Activity count */}
                  {day.totalActivity > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-foreground/70">
                        {day.totalActivity}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Summary */}
          <div className="text-center text-xs text-muted-foreground">
            {weekData.filter(d => d.totalActivity > 0).length}/7 days logged
          </div>
        </GlassCardContent>
      </GlassCard>

      {/* Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDay
                ? `${format(selectedDay.date, "EEEE, MMM d")}`
                : "Week Overview"
              }
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedDay ? (
              // Single Day View
              <>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Habits Completed</h4>
                  <p className="text-2xl font-bold text-primary">{selectedDay.completedHabits}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Tasks Completed</h4>
                  <p className="text-2xl font-bold text-primary">{selectedDay.completedTodos}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">Goal Progress Updates</h4>
                  <p className="text-2xl font-bold text-primary">{selectedDay.dayGoalUpdates}</p>
                </div>
              </>
            ) : (
              // Full Week View
              <div className="grid grid-cols-7 gap-2">
                {weekData.map((day) => (
                  <div
                    key={day.dateStr}
                    className={cn(
                      "p-3 rounded-lg border text-center",
                      day.isToday ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <div className="text-xs font-semibold mb-2">{day.dayLabel}</div>
                    <div className="text-lg font-bold">{day.totalActivity}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {day.totalActivity > 0 ? "active" : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

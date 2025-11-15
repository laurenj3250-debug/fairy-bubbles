import { useQuery, useMutation } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { useState, useMemo, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GraniteTexture } from "./GraniteTexture";
import { DayPickerModal } from "./DayPickerModal";
import { useParticleSystem, type ParticleType } from "@/utils/particles";
import { motion } from "framer-motion";

interface TodaysPitchEnhancedProps {
  className?: string;
  selectedDate?: string;
}

interface HabitWithCompletion extends Habit {
  completed: boolean;
}

const CATEGORY_LABELS = {
  mind: "MIND",
  foundation: "FOUNDATION",
  adventure: "ADVENTURE",
  training: "TRAINING",
} as const;

// Organic hold shapes - varied border-radius patterns
const HOLD_SHAPES = [
  "50% 40% 45% 55% / 55% 45% 40% 50%",
  "45% 55% 50% 40% / 40% 50% 55% 45%",
  "55% 45% 40% 50% / 50% 40% 55% 45%",
  "40% 50% 55% 45% / 45% 55% 40% 50%",
  "50% 45% 55% 40% / 55% 40% 45% 50%",
];

function getEffortIcon(effort: string): string {
  switch (effort) {
    case "heavy":
      return "⚫";
    case "medium":
      return "●";
    case "light":
      return "○";
    default:
      return "●";
  }
}

export function TodaysPitchEnhanced({ className, selectedDate }: TodaysPitchEnhancedProps) {
  const { toast } = useToast();
  const today = selectedDate || new Date().toISOString().split("T")[0];
  const [schedulingHabit, setSchedulingHabit] = useState<Habit | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleSystem = useParticleSystem(canvasRef);

  const { data: habits = [], isLoading: habitsLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: todayLogs = [], isLoading: logsLoading } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId }: { habitId: number }) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: today,
      });
    },
    onMutate: async ({ habitId }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/habit-logs", today] });
      const previousLogs = queryClient.getQueryData<HabitLog[]>(["/api/habit-logs", today]);

      queryClient.setQueryData<HabitLog[]>(["/api/habit-logs", today], (old = []) => {
        const existingLog = old.find((log) => log.habitId === habitId);
        if (existingLog) {
          return old.map((log) =>
            log.habitId === habitId ? { ...log, completed: !log.completed } : log
          );
        } else {
          return [
            ...old,
            {
              id: Date.now(),
              habitId,
              userId: 1,
              date: today,
              completed: true,
              note: null,
            } as HabitLog,
          ];
        }
      });

      return { previousLogs };
    },
    onSuccess: (data: any) => {
      if (data.rewardDetails) {
        const { coinsEarned, habitTitle } = data.rewardDetails;
        toast({
          title: `+${coinsEarned} tokens!`,
          description: `Route sent - "${habitTitle}"`,
          duration: 2000,
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(["/api/habit-logs", today], context.previousLogs);
      }
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", today] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/points"] });
    },
  });

  const scheduleHabitMutation = useMutation({
    mutationFn: async ({ habitId, scheduledDay }: { habitId: number; scheduledDay: string | null }) => {
      return await apiRequest(`/api/habits/${habitId}/schedule`, "PATCH", { scheduledDay });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setSchedulingHabit(null);
    },
  });

  const habitsWithCompletion = useMemo(() => {
    return habits.map((habit) => {
      const log = todayLogs.find((l) => l.habitId === habit.id);
      return { ...habit, completed: log?.completed || false };
    });
  }, [habits, todayLogs]);

  const groupedHabits = useMemo(() => {
    const groups: Record<string, HabitWithCompletion[]> = {
      mind: [],
      foundation: [],
      adventure: [],
      training: [],
    };

    habitsWithCompletion.forEach((habit) => {
      const category = habit.category || "training";

      if (category === "adventure") {
        if (habit.scheduledDay === today) {
          groups[category].push(habit);
        }
      } else {
        groups[category].push(habit);
      }
    });

    return groups;
  }, [habitsWithCompletion, today]);

  const handleToggle = (habitId: number, event: React.MouseEvent) => {
    const wasCompleted = habitsWithCompletion.find((h) => h.id === habitId)?.completed;

    // If completing (not uncompleting), emit particles
    if (!wasCompleted && particleSystem && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Get particle type and color from theme
      const particleType = (document.documentElement.getAttribute('data-particle-type') || 'chalk') as ParticleType;
      const particleColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--particle-color')
        .trim() || '28 70% 65%';

      // Convert HSL to RGB for particle color
      const rgbColor = `hsl(${particleColor})`;

      particleSystem.emit({
        type: particleType,
        x,
        y,
        count: 15,
      });
    }

    toggleHabitMutation.mutate({ habitId });
  };

  const hasAdventureUnscheduled = useMemo(() => {
    return habits.some((h) => h.category === "adventure" && !h.scheduledDay);
  }, [habits]);

  const adventureHabit = useMemo(() => {
    return habits.find((h) => h.category === "adventure" && !h.scheduledDay);
  }, [habits]);

  const dateLabel = useMemo(() => {
    const date = new Date(today + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }, [today]);

  if (habitsLoading || logsLoading) {
    return (
      <div className={cn("relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg overflow-hidden", className)}>
        <GraniteTexture />
        <div className="animate-pulse space-y-4 relative z-10">
          <div className="h-8 bg-muted/30 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/20 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalHabits = habitsWithCompletion.filter(h =>
    h.category !== "adventure" || h.scheduledDay === today
  ).length;
  const completedHabits = habitsWithCompletion.filter((h) =>
    h.completed && (h.category !== "adventure" || h.scheduledDay === today)
  ).length;

  // Check if empty
  const isEmpty = totalHabits === 0;

  return (
    <>
      <div className={cn("relative bg-card/40 backdrop-blur-sm border border-card-border rounded-2xl p-6 shadow-lg overflow-hidden", className)}>
        {/* Granite texture overlay */}
        <GraniteTexture />

        {/* Header */}
        <div className="mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            Today's Pitch
            <span className="text-sm font-normal text-muted-foreground">
              {dateLabel}
            </span>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {completedHabits}/{totalHabits} complete
          </p>
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="text-center py-12 relative z-10">
            <p className="text-muted-foreground text-lg mb-2">
              Basecamp quiet. Bolt your core habits.
            </p>
            <button
              onClick={() => window.location.href = "/habits"}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-all border border-primary/30"
            >
              <Plus className="w-4 h-4" />
              Add a core habit
            </button>
          </div>
        )}

        {/* Particle canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-20"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Habits grouped by category - Climbing Holds */}
        {!isEmpty && (
          <div className="space-y-6 relative z-10">
            {Object.entries(groupedHabits).map(([category, categoryHabits]) => {
              if (categoryHabits.length === 0) return null;

              const categoryKey = category as keyof typeof CATEGORY_LABELS;

              return (
                <div key={category}>
                  {/* Category header */}
                  <div className="mb-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {CATEGORY_LABELS[categoryKey]}
                    </h3>
                  </div>

                  {/* Category habits - Glass climbing holds */}
                  <div className="space-y-3">
                    {categoryHabits.map((habit, index) => {
                      const holdShape = HOLD_SHAPES[index % HOLD_SHAPES.length];

                      return (
                        <motion.div
                          key={habit.id}
                          className={cn(
                            "climbing-hold relative cursor-pointer",
                            "p-5 min-h-[100px]",
                            habit.completed && "completed"
                          )}
                          style={{
                            borderRadius: holdShape,
                          } as React.CSSProperties}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => handleToggle(habit.id, e)}
                        >
                          {/* Hold bolt at top */}
                          <div className="hold-bolt" />

                          <div className="flex items-center gap-4">
                            {/* Completion indicator */}
                            <div
                              className={cn(
                                "w-14 h-14 rounded-full border-3 transition-all font-bold text-2xl flex items-center justify-center flex-shrink-0",
                                habit.completed
                                  ? "bg-gradient-to-br from-white/30 to-white/10 border-white/50 text-white shadow-lg"
                                  : "border-white/20 hover:border-white/40 text-white/60"
                              )}
                            >
                              {habit.completed ? "✓" : ""}
                            </div>

                            {/* Habit info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-foreground font-bold text-lg drop-shadow-sm">
                                {habit.title}
                              </div>
                              <div className="text-sm text-foreground/80 mt-1 flex items-center gap-2">
                                <span>{habit.icon}</span>
                                <span>{CATEGORY_LABELS[categoryKey]}</span>
                              </div>
                            </div>

                            {/* Grade + Effort */}
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="text-sm font-bold text-foreground bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30">
                                {habit.grade || "5.9"}
                              </span>
                              <span className="text-xl text-foreground/90" title={`${habit.effort || "medium"} effort`}>
                                {getEffortIcon(habit.effort || "medium")}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Adventure CTA if unscheduled */}
            {hasAdventureUnscheduled && adventureHabit && (
              <div className="relative z-10">
                <div className="mb-3">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    ADVENTURE
                  </h3>
                </div>
                <button
                  onClick={() => setSchedulingHabit(adventureHabit)}
                  className="w-full p-4 rounded-xl bg-primary/20 border border-primary/40 hover:bg-primary/30 transition-all text-left flex items-center justify-between"
                >
                  <div>
                    <div className="text-foreground font-semibold text-base">
                      {adventureHabit.title}
                    </div>
                    <div className="text-sm text-primary mt-1">
                      Adventure day not scheduled - Choose Adventure Day
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Day Picker Modal */}
      {schedulingHabit && (
        <DayPickerModal
          open={!!schedulingHabit}
          onOpenChange={(open) => !open && setSchedulingHabit(null)}
          currentScheduledDay={schedulingHabit.scheduledDay || null}
          onSelectDay={(date) => scheduleHabitMutation.mutate({ habitId: schedulingHabit.id, scheduledDay: date })}
          onClearSchedule={() => scheduleHabitMutation.mutate({ habitId: schedulingHabit.id, scheduledDay: null })}
          habitTitle={schedulingHabit.title}
        />
      )}
    </>
  );
}

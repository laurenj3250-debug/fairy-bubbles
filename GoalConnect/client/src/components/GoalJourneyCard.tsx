import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Target, Link as LinkIcon, CheckCircle, AlertCircle, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { Goal, Habit, HabitLog } from "@shared/schema";
import { getToday } from "@/lib/utils";

interface GoalJourneyCardProps {
  goal: Goal;
}

export function GoalJourneyCard({ goal }: GoalJourneyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const today = getToday();

  // Fetch all habits to find linked ones
  const { data: allHabits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  // Fetch today's logs to show completion status
  const { data: todayLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs", today],
  });

  const linkedHabits = allHabits.filter(habit => habit.linkedGoalId === goal.id);

  const toggleHabitMutation = useMutation({
    mutationFn: async (habitId: number) => {
      return await apiRequest("/api/habit-logs/toggle", "POST", {
        habitId,
        date: today,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits-with-data"] });
    },
  });

  const handleQuickPlusOne = async () => {
    setIsAddingProgress(true);
    try {
      await apiRequest("/api/goal-updates", "POST", {
        goalId: goal.id,
        userId: goal.userId,
        value: 1,
        date: today,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setIsAddingProgress(false);
    } catch (error) {
      setIsAddingProgress(false);
      alert("Failed to add progress");
    }
  };

  const isHabitCompletedToday = (habitId: number) => {
    return todayLogs.some(log => log.habitId === habitId && log.completed);
  };

  const percentage = Math.round((goal.currentValue / goal.targetValue) * 100);
  const daysLeft = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate if on track (simple version - need X per day)
  const progressNeeded = goal.targetValue - goal.currentValue;
  const rateNeeded = progressNeeded / Math.max(daysLeft, 1);
  const onTrack = rateNeeded <= 1 || percentage >= 75; // On track if < 1 per day needed or >75% done

  let urgencyColor = "from-blue-500 to-cyan-500";
  let textColor = "text-blue-200";
  let borderColor = "border-blue-400/30";

  if (percentage >= 100) {
    urgencyColor = "from-green-500 to-emerald-500";
    textColor = "text-green-200";
    borderColor = "border-green-400/30";
  } else if (!onTrack || daysLeft <= 7) {
    urgencyColor = "from-cyan-500 to-teal-500";
    textColor = "text-cyan-200";
    borderColor = "border-cyan-400/30";
  } else if (daysLeft <= 1) {
    urgencyColor = "from-slate-500 to-cyan-500";
    textColor = "text-slate-200";
    borderColor = "border-slate-400/30";
  }

  return (
    <div className={`glass-card rounded-2xl p-4 relative overflow-hidden transition-all duration-300 ${percentage >= 100 ? 'alpine-glow' : ''}`}>
      {/* Gradient accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(to right, ${urgencyColor})`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-cyan-300" />
              <h3
                className="text-lg font-bold text-white"
                style={{
                  fontFamily: "'Comfortaa', cursive",
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                }}
              >
                {goal.title}
              </h3>
            </div>

            {/* Progress */}
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-white/80 text-sm font-medium">
                  {goal.currentValue}/{goal.targetValue} {goal.unit}
                </span>
                <span className="text-white/80 text-sm font-bold">
                  {percentage}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                    background: `linear-gradient(to right, ${urgencyColor})`,
                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)'
                  }}
                />
              </div>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-1.5 mb-2">
              {percentage >= 100 ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 text-xs font-semibold">
                    Complete! 🎉
                  </span>
                </>
              ) : onTrack ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400 text-xs font-medium">
                    On track • {daysLeft}d left
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400 text-xs font-medium">
                    Need {Math.ceil(rateNeeded)}/day • {daysLeft}d left
                  </span>
                </>
              )}
            </div>

            {goal.description && (
              <p className="text-xs text-white/60 mb-2 line-clamp-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
                {goal.description}
              </p>
            )}
          </div>

          {/* Quick +1 Button */}
          {percentage < 100 && (
            <button
              onClick={handleQuickPlusOne}
              disabled={isAddingProgress}
              className="px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all border-2 bg-green-500/30 border-green-400/50 text-green-200 hover:bg-green-500/40 hover:scale-105 disabled:opacity-50 text-sm"
              style={{ fontFamily: "'Quicksand', sans-serif" }}
            >
              {isAddingProgress ? "..." : `+1`}
              <PlusCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Linked Habits Section */}
        {linkedHabits.length > 0 && (
          <div className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between mb-2 text-left"
            >
              <h4 className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5" />
                Habits ({linkedHabits.length})
              </h4>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/50" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/50" />
              )}
            </button>

            {isExpanded && (
              <div className="space-y-1.5">
                {linkedHabits.map(habit => {
                  const completedToday = isHabitCompletedToday(habit.id);
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-sm border border-white/20"
                          style={{
                            background: habit.color,
                          }}
                        >
                          {habit.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-medium text-white">
                            {habit.title}
                          </div>
                          <div className="text-xs text-white/40">
                            {habit.cadence === 'daily' ? 'Daily' : `${habit.targetPerWeek}x/wk`}
                          </div>
                        </div>
                      </div>

                      {/* Quick complete button */}
                      <button
                        onClick={() => toggleHabitMutation.mutate(habit.id)}
                        disabled={toggleHabitMutation.isPending}
                        className={`w-8 h-8 rounded-md border-2 transition-all text-sm ${
                          completedToday
                            ? 'bg-green-500/30 border-green-400/50 text-green-200'
                            : 'border-white/30 hover:border-green-400 hover:bg-green-500/20 text-white/70'
                        }`}
                      >
                        {completedToday ? '✓' : '○'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {linkedHabits.length === 0 && (
          <div className="mt-3 p-3 bg-white/5 rounded-lg border-2 border-dashed border-white/20 text-center">
            <p className="text-xs text-white/60 mb-1">
              No habits linked yet
            </p>
            <p className="text-xs text-white/40">
              Link habits to track progress!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

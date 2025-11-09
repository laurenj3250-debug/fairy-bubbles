import { useState } from "react";
import { Target, Calendar, TrendingUp, AlertCircle, CheckCircle, PlusCircle } from "lucide-react";
import type { Goal } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getToday } from "@/lib/utils";

interface GoalBadgeProps {
  goal: Goal;
  onClick?: () => void;
}

export function GoalBadge({ goal, onClick }: GoalBadgeProps) {
  const [isAddingProgress, setIsAddingProgress] = useState(false);
  const today = getToday();

  const percentage = Math.round((goal.currentValue / goal.targetValue) * 100);
  const daysLeft = Math.ceil(
    (new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const progressNeeded = goal.targetValue - goal.currentValue;
  const rateNeeded = progressNeeded / Math.max(daysLeft, 1);
  const onTrack = rateNeeded <= 1 || percentage >= 75;

  // Color based on status
  let bgColor = "from-blue-500/30 to-cyan-500/30";
  let borderColor = "border-blue-400/50";
  let textColor = "text-blue-200";
  let gradientId = "gradient-blue";
  let gradientColors = { start: "#3b82f6", end: "#06b6d4" }; // blue-500 to cyan-500

  if (percentage >= 100) {
    bgColor = "from-green-500/30 to-emerald-500/30";
    borderColor = "border-green-400/50";
    textColor = "text-green-200";
    gradientId = "gradient-green";
    gradientColors = { start: "#22c55e", end: "#10b981" }; // green-500 to emerald-500
  } else if (!onTrack || daysLeft <= 7) {
    bgColor = "from-cyan-500/30 to-teal-500/30";
    borderColor = "border-cyan-400/50";
    textColor = "text-cyan-200";
    gradientId = "gradient-cyan";
    gradientColors = { start: "#06b6d4", end: "#14b8a6" }; // cyan-500 to teal-500
  } else if (daysLeft <= 1) {
    bgColor = "from-slate-500/30 to-cyan-500/30";
    borderColor = "border-slate-400/50";
    textColor = "text-slate-200";
    gradientId = "gradient-slate";
    gradientColors = { start: "#64748b", end: "#06b6d4" }; // slate-500 to cyan-500
  }

  const handleQuickPlusOne = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Calculate circle properties for the progress ring
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all hover:scale-105",
        "bg-gradient-to-br border-2",
        bgColor,
        borderColor,
        percentage >= 100 && "alpine-glow"
      )}
    >
      {/* Circular Progress */}
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="absolute inset-0 transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn("text-2xl font-bold", textColor)}>
            {percentage}%
          </div>
          <div className="text-xs text-white/60">
            {goal.currentValue}/{goal.targetValue}
          </div>
        </div>
      </div>

      {/* Goal Title */}
      <div className="text-center max-w-full">
        <h4
          className="text-sm font-bold text-white line-clamp-2 mb-1"
          style={{ fontFamily: "'Comfortaa', cursive" }}
        >
          {goal.title}
        </h4>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-1">
          {percentage >= 100 ? (
            <CheckCircle className="w-3 h-3 text-green-400" />
          ) : !onTrack ? (
            <AlertCircle className="w-3 h-3 text-cyan-400" />
          ) : (
            <CheckCircle className="w-3 h-3 text-blue-400" />
          )}
          <span className={cn("text-xs", textColor)}>
            {percentage >= 100 ? "Done!" : `${daysLeft}d left`}
          </span>
        </div>
      </div>

      {/* Quick +1 button */}
      {percentage < 100 && (
        <button
          onClick={handleQuickPlusOne}
          disabled={isAddingProgress}
          className={cn(
            "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all",
            "bg-green-500/40 border border-green-400/60 hover:bg-green-500/60 hover:scale-110",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          title="Add +1 progress"
        >
          {isAddingProgress ? (
            <span className="text-xs text-white">...</span>
          ) : (
            <PlusCircle className="w-4 h-4 text-green-200" />
          )}
        </button>
      )}
    </div>
  );
}

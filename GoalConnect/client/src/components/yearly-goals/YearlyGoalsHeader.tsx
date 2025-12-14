import { ChevronLeft, ChevronRight, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { GoalProgressBar } from "./GoalProgressBar";

interface YearlyGoalsHeaderProps {
  year: string;
  onYearChange: (year: string) => void;
  stats: {
    totalGoals: number;
    completedGoals: number;
    completionPercent: number;
    avgProgress: number;
  };
}

export function YearlyGoalsHeader({
  year,
  onYearChange,
  stats,
}: YearlyGoalsHeaderProps) {
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year);

  const goToPreviousYear = () => onYearChange((yearNum - 1).toString());
  const goToNextYear = () => onYearChange((yearNum + 1).toString());

  return (
    <div className="mb-6">
      {/* Year selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-peach-400">
            <Target className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Yearly Goals</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousYear}
            className="p-2 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold text-stone-200 min-w-[80px] text-center">
            {year}
          </span>
          <button
            onClick={goToNextYear}
            className={cn(
              "p-2 rounded-lg transition-colors",
              yearNum >= currentYear + 1
                ? "text-stone-600 cursor-not-allowed"
                : "hover:bg-stone-800 text-stone-400 hover:text-stone-200"
            )}
            disabled={yearNum >= currentYear + 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-stone-900/50 rounded-xl border border-stone-800 p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
            Total Goals
          </div>
          <div className="text-2xl font-bold text-stone-200">
            {stats.totalGoals}
          </div>
        </div>

        <div className="bg-stone-900/50 rounded-xl border border-stone-800 p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
            Completed
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats.completedGoals}
          </div>
        </div>

        <div className="bg-stone-900/50 rounded-xl border border-stone-800 p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
            Completion
          </div>
          <div className="text-2xl font-bold text-stone-200">
            {stats.completionPercent}%
          </div>
        </div>

        <div className="bg-stone-900/50 rounded-xl border border-stone-800 p-4">
          <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">
            Avg Progress
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {stats.avgProgress}%
          </div>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mt-4 bg-stone-900/50 rounded-xl border border-stone-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-stone-400">Overall Progress</span>
          <span className="text-sm font-medium text-stone-300">
            {stats.completedGoals}/{stats.totalGoals} goals
          </span>
        </div>
        <GoalProgressBar
          value={stats.completedGoals}
          max={stats.totalGoals || 1}
          className="h-3"
        />
      </div>
    </div>
  );
}

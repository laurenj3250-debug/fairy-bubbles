import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearlyGoalsHeaderProps {
  year: string;
  onYearChange: (year: string) => void;
  onAddGoal?: () => void;
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
  onAddGoal,
  stats,
}: YearlyGoalsHeaderProps) {
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year);

  const goToPreviousYear = () => onYearChange((yearNum - 1).toString());
  const goToNextYear = () => onYearChange((yearNum + 1).toString());

  const inProgress = stats.totalGoals - stats.completedGoals;

  return (
    <div className="mb-6 space-y-5">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="logo-text tracking-wider text-2xl">YEARLY GOALS</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Your aspirations for the year
          </p>
        </div>

        {/* Right side: Add button + Year selector */}
        <div className="flex items-center gap-2">
          {onAddGoal && (
            <button
              onClick={onAddGoal}
              data-testid="add-yearly-goal-page"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[rgba(225,164,92,0.35)] text-[var(--sd-text-accent)] text-sm font-medium transition-colors hover:bg-[rgba(225,164,92,0.1)]"
              style={{
                background: "linear-gradient(145deg, rgba(255,210,140,0.12), rgba(200,131,73,0.18))",
              }}
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          )}
        <div className="sd-shell !p-1 flex items-center gap-1">
          <button
            onClick={goToPreviousYear}
            className="p-2 rounded-lg hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-heading font-medium text-[var(--text-primary)] min-w-[72px] text-center tabular-nums">
            {year}
          </span>
          <button
            onClick={goToNextYear}
            className={cn(
              "p-2 rounded-lg transition-colors",
              yearNum >= currentYear + 1
                ? "text-[var(--text-muted)]/40 cursor-not-allowed"
                : "hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
            disabled={yearNum >= currentYear + 1}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        </div>
      </header>

      {/* Stats Overview - matching Goals page pattern */}
      <div className="grid grid-cols-3 gap-4">
        <div className="sd-shell p-4 text-center">
          <div className="text-3xl font-bold text-[var(--sd-text-accent)]">{stats.completedGoals}</div>
          <div className="text-sm text-[var(--text-muted)]">Completed</div>
        </div>
        <div className="sd-shell p-4 text-center">
          <div className="text-3xl font-bold text-[var(--sd-text-primary)]">{inProgress}</div>
          <div className="text-sm text-[var(--text-muted)]">In Progress</div>
        </div>
        <div className="sd-shell p-4 text-center">
          <div className="text-3xl font-bold text-[var(--sd-text-primary)]">{stats.totalGoals}</div>
          <div className="text-sm text-[var(--text-muted)]">Total</div>
        </div>
      </div>
    </div>
  );
}

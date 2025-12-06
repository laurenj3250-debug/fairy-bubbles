import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyTrend {
  weekStart: string;
  tasksCompleted: number;
  tasksPossible: number;
}

interface StudyTrendsChartProps {
  weeklyTrends: WeeklyTrend[];
}

export function StudyTrendsChart({ weeklyTrends }: StudyTrendsChartProps) {
  if (!weeklyTrends || weeklyTrends.length === 0) {
    return (
      <div className="glass-card p-4">
        <span className="font-heading text-sm text-forest-cream">Weekly Progress</span>
        <div className="mt-4 text-center text-[var(--text-muted)] text-sm py-8">
          Complete some tasks to see your trends!
        </div>
      </div>
    );
  }

  const maxCompleted = Math.max(...weeklyTrends.map((w) => w.tasksCompleted), 1);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-heading text-sm text-forest-cream">Weekly Progress</span>
        <span className="text-xs text-[var(--text-muted)]">Last 4 weeks</span>
      </div>

      <div className="flex items-end gap-2 h-24">
        {weeklyTrends.map((week, index) => {
          const heightPercent = (week.tasksCompleted / maxCompleted) * 100;
          const isCurrentWeek = index === weeklyTrends.length - 1;
          const weekLabel = format(new Date(week.weekStart), "M/d");

          return (
            <div
              key={week.weekStart}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="text-[10px] text-[var(--text-muted)]">
                {week.tasksCompleted}
              </div>
              <div
                className="relative w-full rounded-t-md transition-all"
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-t-md",
                    isCurrentWeek
                      ? "bg-gradient-to-t from-forest-coral/40 to-forest-coral/20"
                      : "bg-gradient-to-t from-white/15 to-white/5"
                  )}
                />
              </div>
              <div
                className={cn(
                  "text-[10px] mt-1",
                  isCurrentWeek ? "text-forest-coral" : "text-[var(--text-muted)]"
                )}
              >
                {weekLabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task type breakdown for current week */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">This week</span>
          <span className="text-forest-cream font-medium">
            {weeklyTrends[weeklyTrends.length - 1]?.tasksCompleted ?? 0} tasks
          </span>
        </div>
      </div>
    </div>
  );
}

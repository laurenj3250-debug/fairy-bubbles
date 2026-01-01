/**
 * MilestoneDonutWidget
 * Animated donut chart showing monthly milestone completion rate
 */

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { useGoalCalendar } from "@/hooks/useGoalCalendar";

export function MilestoneDonutWidget() {
  const currentMonth = new Date();
  const { consolidatedGoals, isLoading } = useGoalCalendar(currentMonth);

  // Calculate totals from consolidated goals
  const stats = useMemo(() => {
    let totalMilestones = 0;
    let totalMet = 0;
    let onTrack = 0;
    let behind = 0;

    consolidatedGoals.forEach((goal) => {
      totalMilestones += goal.milestonesThisMonth;
      totalMet += goal.milestonesMet;

      // Count goals that are on track vs behind
      if (goal.milestonesMet >= goal.milestonesThisMonth) {
        onTrack++;
      } else if (goal.milestonesMet < goal.milestonesThisMonth * 0.5) {
        behind++;
      } else {
        onTrack++;
      }
    });

    const percentage = totalMilestones > 0
      ? Math.round((totalMet / totalMilestones) * 100)
      : 0;

    return { totalMilestones, totalMet, percentage, onTrack, behind };
  }, [consolidatedGoals]);

  // Donut chart data
  const chartData = [
    { name: "Completed", value: stats.totalMet },
    { name: "Remaining", value: Math.max(0, stats.totalMilestones - stats.totalMet) },
  ];

  // Gradient colors for the filled portion
  const COLORS = ["url(#donutGradient)", "rgba(255,255,255,0.08)"];

  if (isLoading) {
    return (
      <div className="glass-card frost-accent min-h-[200px] flex flex-col">
        <span className="card-title">Monthly Milestones</span>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-[120px] h-[120px] rounded-full bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card frost-accent min-h-[200px] flex flex-col">
      <span className="card-title">Monthly Milestones</span>

      <div className="flex-1 flex flex-col items-center justify-center -mt-2">
        {/* Donut Chart */}
        <div className="relative w-[130px] h-[130px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <linearGradient id="donutGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
              </defs>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={58}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index]}
                    stroke="none"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-heading font-bold text-peach-400">
              {stats.percentage}%
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {stats.totalMet} / {stats.totalMilestones}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]/60">
              milestones
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[var(--text-muted)]">{stats.onTrack} on track</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-[var(--text-muted)]">{stats.behind} behind</span>
          </div>
        </div>
      </div>

      {/* Month label */}
      <div className="text-center text-[10px] text-[var(--text-muted)]/50 -mt-1 pb-1">
        {format(currentMonth, "MMMM yyyy")}
      </div>
    </div>
  );
}

/**
 * MilestoneDonutWidget
 * Animated donut chart showing monthly milestone completion rate
 */

import { useId, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { useGoalCalendar } from "@/hooks/useGoalCalendar";
import { Link } from "wouter";

export function MilestoneDonutWidget() {
  const gradientId = useId();
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

      // On-track: completed all milestones OR completed 50%+ of milestones
      // Behind: completed less than 50% of milestones
      if (goal.milestonesMet >= goal.milestonesThisMonth * 0.5) {
        onTrack++;
      } else {
        behind++;
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

  // Gradient colors for the filled portion (using unique ID to prevent collision)
  const COLORS = [`url(#${gradientId})`, "rgba(255,255,255,0.08)"];

  if (isLoading) {
    return (
      <div className="glass-card frost-accent py-4 flex flex-col items-center">
        <div className="w-[100px] h-[100px] rounded-full bg-white/5 animate-pulse" />
      </div>
    );
  }

  return (
    <Link href="/goals?view=monthly" className="block">
    <div className="glass-card frost-accent py-4 flex flex-col items-center cursor-pointer hover:border-white/20 transition-colors">
      {/* Compact donut with inline label */}
      <div className="relative w-[110px] h-[110px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d4936a" />
                <stop offset="100%" stopColor="#f0c9ae" />
              </linearGradient>
            </defs>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={36}
              outerRadius={48}
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

        {/* Center Text - compact */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-heading font-bold" style={{ color: '#e4a880' }}>
            {stats.percentage}%
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            {stats.totalMet}/{stats.totalMilestones}
          </span>
        </div>
      </div>

      {/* Compact label */}
      <div className="text-[10px] text-[var(--text-muted)] mt-2">
        {format(currentMonth, "MMM")} milestones
      </div>
    </div>
    </Link>
  );
}

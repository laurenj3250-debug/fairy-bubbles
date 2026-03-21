import { useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, getISOWeek, getYear } from "date-fns";
import { SundownCard } from "./SundownCard";
import type { Goal } from "@shared/schema";

const CIRCLE_R = 17;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

function ProgressRing({ pct }: { pct: number }) {
  const offset = CIRCUMFERENCE * (1 - pct / 100);
  return (
    <div
      style={{
        width: 52, height: 52, minWidth: 52, borderRadius: "50%",
        background: "rgba(30,18,12,0.7)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg width={42} height={42} viewBox="0 0 42 42">
        <circle cx={21} cy={21} r={CIRCLE_R} fill="none" stroke="rgba(60,40,30,0.4)" strokeWidth={4} />
        <circle cx={21} cy={21} r={CIRCLE_R} fill="none" stroke="var(--sd-accent-mid, #D08A4F)" strokeWidth={4}
          strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
          transform="rotate(-90 21 21)" />
        <text x={21} y={21} textAnchor="middle" dominantBaseline="central"
          style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: 13, fontWeight: 700, fill: "var(--sd-text-accent)" }}>
          {pct}%
        </text>
      </svg>
    </div>
  );
}

function GoalModule({ title, current, target }: { title: string; current: number; target: number }) {
  const pct = target > 0 ? Math.round((current / target) * 100) : 0;
  return (
    <div style={{ background: "var(--sd-goal-shell, rgba(52,28,32,0.6))", borderRadius: 14, padding: 2, height: "100%" }}>
      <div style={{
        background: "var(--sd-goal-face, rgba(85,48,50,0.4))",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        borderRadius: 12, padding: 12, display: "flex", alignItems: "center", gap: 10,
        borderTop: "1px solid rgba(255,200,140,0.08)",
        height: "100%", boxSizing: "border-box",
      }}>
        <ProgressRing pct={Math.min(100, pct)} />
        <div style={{ minWidth: 0 }}>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: "var(--sd-text-primary)", lineHeight: 1.2 }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: "var(--sd-text-muted)", marginTop: 2 }}>
            {current}/{target} complete
          </div>
        </div>
      </div>
    </div>
  );
}

export function SundownGoalsCard() {
  const now = new Date();
  const currentWeek = `${getYear(now)}-W${String(getISOWeek(now)).padStart(2, "0")}`;

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Auto-generate weekly goals on mount
  const hasGenerated = useRef(false);
  useEffect(() => {
    if (hasGenerated.current) return;
    hasGenerated.current = true;
    apiRequest("/api/goals/generate-weekly", "POST", { week: currentWeek })
      .then(() => queryClient.invalidateQueries({ queryKey: ["/api/goals"] }))
      .catch(() => {});
  }, [currentWeek]);

  const weeklyGoals = useMemo(
    () => goals.filter(g => g.week === currentWeek && !g.archived).slice(0, 4),
    [goals, currentWeek],
  );

  const badge = (
    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--sd-text-accent)", background: "rgba(200,131,73,0.15)", padding: "3px 10px", borderRadius: 10 }}>
      This Week
    </span>
  );

  return (
    <SundownCard title="Weekly Goals" headerRight={badge}>
      {weeklyGoals.length === 0 ? (
        <div style={{ padding: "20px 0", fontSize: 13, color: "var(--sd-text-muted)", textAlign: "center" }}>
          No weekly goals yet
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: weeklyGoals.length <= 1 ? "1fr" : "1fr 1fr",
          gap: 10,
          gridAutoRows: "1fr",
        }}>
          {weeklyGoals.map(g => (
            <GoalModule key={g.id} title={g.title} current={g.currentValue} target={g.targetValue} />
          ))}
        </div>
      )}
    </SundownCard>
  );
}

import { useState, useMemo } from "react";
import { YEARLY_GOAL_CATEGORY_ORDER, YEARLY_GOAL_CATEGORY_LABELS } from "@shared/schema";

interface SundownYearlyGoalsProps {
  goals: Array<{
    id: number;
    title: string;
    current: number;
    target: number;
    category?: string;
  }>;
}

const SMALL_R = 11;
const SMALL_CIRCUMFERENCE = 2 * Math.PI * SMALL_R;

function SmallProgressRing({ pct }: { pct: number }) {
  const offset = SMALL_CIRCUMFERENCE * (1 - pct / 100);
  return (
    <div
      style={{
        width: 36, height: 36, minWidth: 36, borderRadius: "50%",
        background: "rgba(30,18,12,0.7)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg width={28} height={28} viewBox="0 0 28 28">
        <circle cx={14} cy={14} r={SMALL_R} fill="none" stroke="rgba(60,40,30,0.4)" strokeWidth={3} />
        <circle cx={14} cy={14} r={SMALL_R} fill="none" stroke="var(--sd-accent-mid, #D08A4F)" strokeWidth={3}
          strokeLinecap="round" strokeDasharray={SMALL_CIRCUMFERENCE} strokeDashoffset={offset}
          transform="rotate(-90 14 14)" />
      </svg>
    </div>
  );
}

export function SundownYearlyGoals({ goals }: SundownYearlyGoalsProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_COUNT = 5;

  // Build tabs from actual categories that have goals
  const activeTabs = useMemo(() => {
    const cats = new Set(goals.map(g => g.category || "uncategorized"));
    const tabs: Array<{ key: string; label: string; count: number }> = [
      { key: "all", label: "All", count: goals.length },
    ];
    for (const cat of YEARLY_GOAL_CATEGORY_ORDER) {
      if (cats.has(cat)) {
        tabs.push({
          key: cat,
          label: YEARLY_GOAL_CATEGORY_LABELS[cat] || cat,
          count: goals.filter(g => g.category === cat).length,
        });
      }
    }
    return tabs;
  }, [goals]);

  const filtered = activeCategory === "all"
    ? goals
    : goals.filter(g => g.category === activeCategory);

  return (
    <>
      {/* Category tabs — only show categories that have goals */}
      <div style={{ display: "flex", gap: 5, marginBottom: 14, flexWrap: "wrap" }}>
        {activeTabs.map((tab) => {
          const isActive = activeCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              style={{
                fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
                padding: "8px 12px", minHeight: 44, borderRadius: 12, border: "none", cursor: "pointer",
                background: isActive ? "rgba(200,131,73,0.2)" : "rgba(18,10,14,0.4)",
                color: isActive ? "var(--sd-text-accent)" : "var(--sd-text-muted)",
              }}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Goal list */}
      <div style={{ overflowX: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "16px 0", fontSize: 15, color: "var(--sd-text-muted)", textAlign: "center" }}>
            No goals in this category
          </div>
        ) : (
          <>
            {(expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT)).map((g, i, arr) => {
              const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0;
              return (
                <div
                  key={g.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                    borderBottom: i < arr.length - 1 ? "1px solid rgba(255,200,140,0.04)" : "none",
                  }}
                >
                  <SmallProgressRing pct={Math.min(100, pct)} />
                  <span style={{ fontSize: 15, fontWeight: 500, color: "var(--sd-text-primary)", flex: 1 }}>
                    {g.title}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--sd-text-muted)", flexShrink: 0 }}>
                    {g.current}/{g.target}
                  </span>
                </div>
              );
            })}
            {!expanded && filtered.length > COLLAPSED_COUNT && (
              <button
                onClick={() => setExpanded(true)}
                style={{
                  display: "block", width: "100%", padding: "12px 0", marginTop: 4,
                  fontSize: 13, fontWeight: 600, color: "var(--sd-text-accent)",
                  background: "none", border: "none", cursor: "pointer",
                  minHeight: 44,
                }}
              >
                Show all {filtered.length} goals
              </button>
            )}
            {expanded && filtered.length > COLLAPSED_COUNT && (
              <button
                onClick={() => setExpanded(false)}
                style={{
                  display: "block", width: "100%", padding: "12px 0", marginTop: 4,
                  fontSize: 13, fontWeight: 600, color: "var(--sd-text-muted)",
                  background: "none", border: "none", cursor: "pointer",
                  minHeight: 44,
                }}
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

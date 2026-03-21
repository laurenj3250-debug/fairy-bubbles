import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SundownCard } from "./SundownCard";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SundownHabitCardProps {
  habits: Array<{ id: number; name: string; icon?: string }>;
  habitLogs: Array<{ habitId: number; date: string; completed: boolean }>;
  weekDates: string[]; // 7 date strings for the week
  todayIndex: number; // 0-6
  onToggle: (habitId: number, date: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Progress Ring SVG                                                   */
/* ------------------------------------------------------------------ */

function ProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  const left = total - completed;

  return (
    <div className="flex items-center gap-2">
      <svg width={42} height={42} viewBox="0 0 42 42">
        {/* background track */}
        <circle
          cx={21}
          cy={21}
          r={r}
          fill="none"
          stroke="rgba(225,164,92,0.12)"
          strokeWidth={4}
        />
        {/* fill track */}
        <circle
          cx={21}
          cy={21}
          r={r}
          fill="none"
          stroke="var(--sd-accent-mid, #D08A4F)"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 21 21)"
        />
        {/* percentage text */}
        <text
          x={21}
          y={21}
          textAnchor="middle"
          dominantBaseline="central"
          fill="rgba(240,222,199,0.8)"
          fontSize={11}
          fontWeight={600}
        >
          {pct}%
        </text>
      </svg>
      <span
        style={{
          fontSize: 12,
          color: "rgba(225,164,92,0.7)",
          whiteSpace: "nowrap",
        }}
      >
        {left} left
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Default icon fallback                                              */
/* ------------------------------------------------------------------ */

const DEFAULT_ICON = "\u2B50"; // star

/* ------------------------------------------------------------------ */
/*  SundownHabitCard                                                    */
/* ------------------------------------------------------------------ */

export function SundownHabitCard({
  habits,
  habitLogs,
  weekDates,
  todayIndex,
  onToggle,
}: SundownHabitCardProps) {
  // Build a quick lookup: "habitId:date" -> completed
  const logMap = new Map<string, boolean>();
  for (const log of habitLogs) {
    if (log.completed) {
      logMap.set(`${log.habitId}:${log.date}`, true);
    }
  }

  // Today's stats
  const todayDate = weekDates[todayIndex];
  const todayCompleted = habits.filter((h) =>
    logMap.get(`${h.id}:${todayDate}`),
  ).length;

  // Day labels from actual dates
  const dayLabels = weekDates.map((d) => format(new Date(d), "EEEEEE")[0]);

  return (
    <SundownCard
      title="This Week"
      headerRight={
        <ProgressRing completed={todayCompleted} total={habits.length} />
      }
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "110px repeat(7, 1fr)",
          columnGap: 4,
          rowGap: 8,
          alignItems: "center",
        }}
      >
        {/* ---- Header row ---- */}
        <div /> {/* empty top-left cell */}
        {dayLabels.map((label, i) => (
          <div
            key={i}
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              textAlign: "center",
              color:
                i === todayIndex
                  ? "rgba(225,164,92,0.7)"
                  : "rgba(169,130,106,0.55)",
              fontWeight: i === todayIndex ? 700 : 500,
            }}
          >
            {label}
          </div>
        ))}

        {/* ---- Habit rows ---- */}
        {habits.map((habit) => (
          <React.Fragment key={habit.id}>
            {/* Habit name */}
            <div
              style={{
                fontSize: 12,
                color: "rgba(240,222,199,0.7)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ marginRight: 5 }}>
                {habit.icon || DEFAULT_ICON}
              </span>
              {habit.name}
            </div>

            {/* 7 day cells */}
            {weekDates.map((date, i) => {
              const done = !!logMap.get(`${habit.id}:${date}`);
              const isToday = i === todayIndex;
              const isFuture = i > todayIndex;

              let bg: string;
              let shadow: string;
              let content: string;
              let contentColor: string;

              if (done) {
                bg = "rgba(160,100,55,0.55)";
                shadow = isToday
                  ? "inset 0 0 0 2px rgba(225,164,92,0.5), 0 2px 4px rgba(0,0,0,0.18)"
                  : "0 2px 4px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,228,195,0.14)";
                content = "\u2713";
                contentColor = "rgba(240,222,199,0.8)";
              } else {
                bg = "rgba(15,10,8,0.6)";
                shadow = isToday
                  ? "inset 0 0 0 2px rgba(225,164,92,0.5), inset 0 3px 5px rgba(0,0,0,0.2)"
                  : "inset 0 3px 5px rgba(0,0,0,0.3)";
                content = "";
                contentColor = "transparent";
              }

              return (
                <button
                  key={`${habit.id}-${date}`}
                  data-testid="habit-cell"
                  aria-label={`${done ? 'Uncheck' : 'Check'} ${habit.name} for ${format(new Date(date), 'EEEE')}`}
                  onClick={() => onToggle(habit.id, date)}
                  className={cn("flex items-center justify-center transition-transform active:scale-90")}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: "none",
                    cursor: isFuture ? "default" : "pointer",
                    background: bg,
                    boxShadow: shadow,
                    color: contentColor,
                    fontSize: 16,
                    fontWeight: 700,
                    opacity: isFuture ? 0.3 : 1,
                    justifySelf: "center",
                    padding: 0,
                    transition: "transform 0.1s, box-shadow 0.1s",
                  }}
                >
                  {content}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </SundownCard>
  );
}

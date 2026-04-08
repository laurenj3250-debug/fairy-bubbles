import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { SundownStardustTrail } from "./SundownStardustTrail";
import { HabitIcon } from "./sundown-icons";
import { EmptyState } from "@/components/EmptyState";

interface Habit {
  id: number;
  name: string;
  icon?: string;
}

interface HabitLog {
  habitId: number;
  date: string;
  completed: boolean;
}

interface EnrichedHabit extends Habit {
  streak: number;
}

interface SundownHabitsTabProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  weekDates: string[];
  todayIndex: number;
  onToggle: (habitId: number, date: string) => void;
  completionPct: number;
}

type ViewMode = 'today' | 'week' | 'rings';

export function SundownHabitsTab({
  habits,
  habitLogs,
  weekDates,
  todayIndex,
  onToggle,
  completionPct,
}: SundownHabitsTabProps) {
  const [view, setView] = useState<ViewMode>('today');

  const { data: enrichedHabits = [] } = useQuery<EnrichedHabit[]>({
    queryKey: ["/api/habits-with-data"],
  });

  // Build streak map from enriched data
  const streakMap = new Map<number, number>();
  for (const h of enrichedHabits) {
    streakMap.set(h.id, h.streak);
  }

  // Build log map for completion checks
  const logMap = new Map<string, boolean>();
  for (const log of habitLogs) {
    logMap.set(`${log.habitId}:${log.date}`, log.completed);
  }

  const todayDate = weekDates[todayIndex] || '';

  // Count today's completions
  const todayDoneCount = habits.filter(
    (h) => logMap.get(`${h.id}:${todayDate}`) === true
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* View switcher */}
      <div className="sd-habits-view-switcher">
        <span className="sd-habits-view-title" style={{ color: 'var(--sd-text-primary)' }}>
          Habits
        </span>
        <div className="sd-habits-view-pills">
          {(['today', 'week', 'rings'] as ViewMode[]).map((v) => (
            <button
              key={v}
              className={`sd-habits-view-pill${view === v ? ' active' : ''}`}
              onClick={() => setView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <span className="sd-habits-view-count">
          {todayDoneCount}/{habits.length}
        </span>
      </div>

      {/* Today view */}
      {view === 'today' && (
        <TodayView
          habits={habits}
          logMap={logMap}
          streakMap={streakMap}
          todayDate={todayDate}
          onToggle={onToggle}
        />
      )}

      {/* Week view */}
      {view === 'week' && (
        <SundownStardustTrail
          habits={habits}
          habitLogs={habitLogs}
          weekDates={weekDates}
          todayIndex={todayIndex}
          onToggle={onToggle}
        />
      )}

      {/* Rings view */}
      {view === 'rings' && (
        <RingsView
          habits={habits}
          logMap={logMap}
          streakMap={streakMap}
          weekDates={weekDates}
        />
      )}
    </div>
  );
}

/* ===== TODAY VIEW ===== */

function TodayView({
  habits,
  logMap,
  streakMap,
  todayDate,
  onToggle,
}: {
  habits: Habit[];
  logMap: Map<string, boolean>;
  streakMap: Map<number, number>;
  todayDate: string;
  onToggle: (habitId: number, date: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {habits.length === 0 && (
        <EmptyState
          icon={Flame}
          title="No habits yet"
          description="Add your first habit to start building streaks and earning XP."
        />
      )}
      {habits.map((habit) => {
        const isDone = logMap.get(`${habit.id}:${todayDate}`) === true;
        const streak = streakMap.get(habit.id) ?? 0;

        const toggleStyles: React.CSSProperties = {
          width: 44,
          height: 44,
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          flexShrink: 0,
          transition: 'all 0.2s',
          ...(isDone
            ? {
                background: 'linear-gradient(145deg, rgba(255,210,140,0.35), rgba(200,131,73,0.45))',
                boxShadow: '0 0 12px rgba(225,164,92,0.35), 0 0 24px rgba(225,164,92,0.15), inset 0 1px 2px rgba(255,240,200,0.2)',
                color: 'rgba(30,15,10,0.9)',
                border: '1px solid rgba(255,200,140,0.2)',
              }
            : {
                background: 'rgba(15,10,8,0.6)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35)',
                color: 'transparent',
                border: '1px solid rgba(255,200,140,0.05)',
              }),
        };

        return (
          <div
            key={habit.id}
            style={{
              background: 'var(--sd-shell-bg)',
              borderRadius: 18,
              padding: 3,
              boxShadow: isDone ? '0 0 16px rgba(225,164,92,0.1)' : 'none',
              transition: 'box-shadow 0.3s',
            }}
          >
            <div
              style={{
                background: 'var(--sd-face-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 16,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                borderTop: '1px solid rgba(255,200,140,0.08)',
              }}
            >
              <button onClick={() => onToggle(habit.id, todayDate)} style={toggleStyles}>
                {isDone ? '✓' : ''}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <HabitIcon icon={habit.icon} />
                  <span style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: isDone ? 'var(--sd-text-muted)' : 'var(--sd-text-primary)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    textDecorationColor: 'rgba(225,164,92,0.3)',
                    transition: 'all 0.2s',
                  }}>
                    {habit.name}
                  </span>
                </div>
                {streak > 0 && !isDone && (
                  <div style={{ fontSize: 11, color: 'rgba(225,164,92,0.6)' }}>
                    {streak}d streak at risk
                  </div>
                )}
                {isDone && (
                  <div style={{ fontSize: 11, color: 'var(--sd-text-muted)' }}>
                    Done today
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: streak > 0 ? 20 : 14,
                    fontWeight: 700,
                    color: streak > 0 ? 'var(--sd-text-accent)' : 'var(--sd-text-muted)',
                  }}
                >
                  {streak > 0 ? `${streak}d` : '--'}
                </div>
                {streak > 0 && (
                  <div style={{ fontSize: 9, color: 'var(--sd-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    streak
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ===== RINGS VIEW ===== */

function RingsView({
  habits,
  logMap,
  streakMap,
  weekDates,
}: {
  habits: Habit[];
  logMap: Map<string, boolean>;
  streakMap: Map<number, number>;
  weekDates: string[];
}) {
  const CIRCUMFERENCE = 2 * Math.PI * 33; // ~207.3

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {habits.map((habit) => {
        const streak = streakMap.get(habit.id) ?? 0;
        const doneCount = weekDates.filter(
          (d) => logMap.get(`${habit.id}:${d}`) === true
        ).length;
        const pct = weekDates.length > 0 ? doneCount / weekDates.length : 0;
        const offset = CIRCUMFERENCE * (1 - pct);

        return (
          <div
            key={habit.id}
            style={{
              background: 'var(--sd-shell-bg)',
              borderRadius: 18,
              padding: 3,
            }}
          >
            <div
              style={{
                background: 'var(--sd-face-bg)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 16,
                padding: '16px 8px 12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                borderTop: '1px solid rgba(255,200,140,0.08)',
              }}
            >
              {/* SVG Ring */}
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg viewBox="0 0 80 80" width={80} height={80}>
                  {/* Track */}
                  <circle
                    cx={40}
                    cy={40}
                    r={33}
                    fill="none"
                    stroke="rgba(15,10,8,0.6)"
                    strokeWidth={5}
                  />
                  {/* Progress */}
                  <circle
                    cx={40}
                    cy={40}
                    r={33}
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth={5}
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={offset}
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c47a20" />
                      <stop offset="100%" stopColor="#E1A45C" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center icon */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HabitIcon icon={habit.icon} size={22} />
                </div>
              </div>

              {/* Name */}
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: 'var(--sd-text-primary)',
                  textAlign: 'center',
                  lineHeight: 1.3,
                  fontFamily: "'Cormorant Garamond', serif",
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {habit.name}
              </div>

              {/* Streak */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'Cormorant Garamond', serif",
                  color: streak > 0 ? 'var(--sd-text-accent)' : 'var(--sd-text-muted)',
                }}
              >
                {streak > 0 ? `${streak}d` : '--'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

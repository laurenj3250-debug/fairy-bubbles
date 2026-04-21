import React, { useState, useMemo } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { resolveIcon } from './sundown-icons';

interface SundownStardustTrailProps {
  habits: Array<{ id: number; name: string; icon?: string; cadence?: string | null; targetPerWeek?: number | null }>;
  habitLogs: Array<{ habitId: number; date: string; completed: boolean }>;
  weekDates: string[];
  todayIndex: number;
  onToggle: (habitId: number, date: string) => void;
}

const MAX_WEEKS_BACK = 12;

export function SundownStardustTrail({
  habits,
  habitLogs,
  weekDates: propWeekDates,
  todayIndex: propTodayIndex,
  onToggle,
}: SundownStardustTrailProps) {
  // weekOffset: 0 = this week, -1 = last week, -2 = two weeks ago, ...
  const [weekOffset, setWeekOffset] = useState(0);

  const { weekDates, todayIndex, weekLabel } = useMemo(() => {
    if (weekOffset === 0) {
      return {
        weekDates: propWeekDates,
        todayIndex: propTodayIndex,
        weekLabel: 'This week',
      };
    }
    const thisWeekStart = parseISO(propWeekDates[0] + 'T12:00:00');
    const offsetStart = addDays(thisWeekStart, weekOffset * 7);
    const dates = [0, 1, 2, 3, 4, 5, 6].map(i => format(addDays(offsetStart, i), 'yyyy-MM-dd'));
    const startLabel = format(parseISO(dates[0] + 'T12:00:00'), 'MMM d');
    const endLabel = format(parseISO(dates[6] + 'T12:00:00'), 'MMM d');
    return { weekDates: dates, todayIndex: -1, weekLabel: `${startLabel} – ${endLabel}` };
  }, [weekOffset, propWeekDates, propTodayIndex]);

  // Build lookup: "habitId:date" -> completed
  const logMap = new Map<string, boolean>();
  for (const log of habitLogs) {
    if (log.completed) {
      logMap.set(`${log.habitId}:${log.date}`, true);
    }
  }

  // Today's stats (only meaningful on current week)
  const todayDate = weekDates[todayIndex] ?? '';
  const todayCompleted = habits.filter((h) =>
    logMap.get(`${h.id}:${todayDate}`),
  ).length;

  // Day labels from actual dates
  const dayLabels = weekDates.map((d) => format(new Date(d + 'T12:00:00'), 'EEEEEE')[0]);

  const goBack = () => setWeekOffset(o => Math.max(-MAX_WEEKS_BACK, o - 1));
  const goForward = () => setWeekOffset(o => Math.min(0, o + 1));
  const atCurrentWeek = weekOffset === 0;
  const atOldest = weekOffset <= -MAX_WEEKS_BACK;

  return (
    <div className="sd-shell" style={{ animationDelay: '0.5s' }}>
      <div className="sd-face">
        <div className="sd-card-hdr">
          <div className="sd-week-nav">
            <button
              type="button"
              className="sd-week-nav-btn"
              onClick={goBack}
              disabled={atOldest}
              aria-label="Previous week"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="sd-card-title sd-week-label">{weekLabel}</span>
            <button
              type="button"
              className="sd-week-nav-btn"
              onClick={goForward}
              disabled={atCurrentWeek}
              aria-label="Next week"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {atCurrentWeek && (
            <span className="sd-badge">{todayCompleted}/{habits.length} Today</span>
          )}
        </div>
        <div className="sd-tray">
          <div className="sd-habit-grid">
            {/* Header row: empty cell + day labels */}
            <div />
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className={`sd-day-hdr${i === todayIndex ? ' today' : ''}`}
              >
                {label}
              </div>
            ))}

            {/* Habit rows */}
            {habits.map((habit) => {
              const isWeekly = habit.cadence === 'weekly' && (habit.targetPerWeek ?? 7) < 7;
              const target = isWeekly ? (habit.targetPerWeek ?? 1) : 7;
              const weekDoneCount = weekDates.filter(
                (d) => logMap.get(`${habit.id}:${d}`),
              ).length;
              const targetMet = weekDoneCount >= target;

              return (
                <React.Fragment key={habit.id}>
                  <div className={`sd-habit-label${targetMet && isWeekly ? ' weekly-met' : ''}`}>
                    <svg className="sd-habit-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      {resolveIcon(habit.icon).map((el, i) => {
                        if (el.type === 'path') return <path key={i} d={el.d} />;
                        if (el.type === 'circle') return <circle key={i} cx={el.cx} cy={el.cy} r={el.r} />;
                        if (el.type === 'rect') return <rect key={i} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} />;
                        if (el.type === 'polygon') return <polygon key={i} points={el.points} />;
                        return null;
                      })}
                    </svg>
                    <span className="sd-habit-label-text">
                      <span className="sd-habit-name">{habit.name}</span>
                      {isWeekly && (
                        <span className="sd-habit-weekly-progress">
                          {targetMet ? `${weekDoneCount}/${target} done this week` : `${weekDoneCount}/${target} this week`}
                        </span>
                      )}
                    </span>
                  </div>

                  {weekDates.map((date, i) => {
                    const done = !!logMap.get(`${habit.id}:${date}`);
                    const isCurrentWeek = todayIndex >= 0;
                    const isToday = isCurrentWeek && i === todayIndex;
                    const isFuture = isCurrentWeek && i > todayIndex;

                    const classes = [
                      'sd-star-dot',
                      done ? 'done' : 'empty',
                      isToday ? 'today-ring' : '',
                      isFuture && !done ? 'future' : '',
                      isWeekly && targetMet && done ? 'weekly-met' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <button
                        key={`${habit.id}-${date}`}
                        className={classes}
                        style={{
                          animationDelay: done
                            ? `${(i * 0.15 + habits.indexOf(habit) * 0.05).toFixed(2)}s`
                            : undefined,
                        }}
                        onClick={() => onToggle(habit.id, date)}
                        aria-label={`${done ? 'Uncheck' : 'Check'} ${habit.name} for ${format(new Date(date + 'T12:00:00'), 'EEEE')}`}
                      >
                        {done ? '✓' : ''}
                      </button>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

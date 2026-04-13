import React from 'react';
import { format } from 'date-fns';
import { resolveIcon } from './sundown-icons';

interface SundownStardustTrailProps {
  habits: Array<{ id: number; name: string; icon?: string; cadence?: string | null; targetPerWeek?: number | null }>;
  habitLogs: Array<{ habitId: number; date: string; completed: boolean }>;
  weekDates: string[];
  todayIndex: number;
  onToggle: (habitId: number, date: string) => void;
}

export function SundownStardustTrail({
  habits,
  habitLogs,
  weekDates,
  todayIndex,
  onToggle,
}: SundownStardustTrailProps) {
  // Build lookup: "habitId:date" -> completed
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
  const dayLabels = weekDates.map((d) => format(new Date(d + 'T12:00:00'), 'EEEEEE')[0]);

  return (
    <div className="sd-shell" style={{ animationDelay: '0.5s' }}>
      <div className="sd-face">
        <div className="sd-card-hdr">
          <span className="sd-card-title">This Week</span>
          <span className="sd-badge">{todayCompleted}/{habits.length} Today</span>
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
                    {habit.name}
                  </div>

                  {isWeekly ? (
                    /* Weekly habit: clean bar spanning all 7 columns */
                    <button
                      className={`sd-weekly-bar${targetMet ? ' met' : ''}`}
                      style={{ gridColumn: '2 / -1' }}
                      onClick={() => onToggle(habit.id, weekDates[todayIndex])}
                    >
                      <span className="sd-weekly-bar-fill" style={{ width: `${Math.min(100, (weekDoneCount / target) * 100)}%` }} />
                      <span className="sd-weekly-bar-left">
                        {targetMet ? `✓ done this week` : `${weekDoneCount} of ${target} this week`}
                      </span>
                      <span className="sd-weekly-bar-right">
                        {weekDoneCount}/{target}
                      </span>
                    </button>
                  ) : (
                    /* Daily habit: normal 7-dot grid */
                    weekDates.map((date, i) => {
                      const done = !!logMap.get(`${habit.id}:${date}`);
                      const isToday = i === todayIndex;
                      const isFuture = i > todayIndex;

                      const classes = [
                        'sd-star-dot',
                        done ? 'done' : 'empty',
                        isToday ? 'today-ring' : '',
                        isFuture && !done ? 'future' : '',
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
                    })
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

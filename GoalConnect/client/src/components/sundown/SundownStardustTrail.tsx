import React from 'react';
import { format } from 'date-fns';

const ICON_PATHS: Record<string, string[]> = {
  '📋': ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 012-2h2a2 2 0 012 2', 'M9 12l2 2 4-4'],
  '🏋': ['M6 4v6a6 6 0 0012 0V4'],
  '🏋️': ['M6 4v6a6 6 0 0012 0V4'],
  '🎧': ['M3 18v-6a9 9 0 0118 0v6', 'M21 19a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3a1 1 0 011-1h2v4z', 'M3 19a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H3v4z'],
  '🌙': ['M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z'],
  '📚': ['M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z', 'M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z'],
  '📄': ['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'],
  '💧': ['M12 2.69l5.66 5.66a8 8 0 11-11.31 0z'],
  '🇩🇪': ['M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z', 'M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z'],
  'default': ['M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', 'M9 5a2 2 0 012-2h2a2 2 0 012 2'],
};

interface SundownStardustTrailProps {
  habits: Array<{ id: number; name: string; icon?: string }>;
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
            {habits.map((habit) => (
              <React.Fragment key={habit.id}>
                <div className="sd-habit-label">
                  <svg className="sd-habit-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {(ICON_PATHS[habit.icon || ''] || ICON_PATHS['default']).map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                  </svg>
                  {habit.name}
                </div>

                {weekDates.map((date, i) => {
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
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { format } from 'date-fns';

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
                  <span>{habit.icon || '⭐'}</span>
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
                    />
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

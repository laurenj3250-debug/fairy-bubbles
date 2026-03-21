import { useState, useMemo } from 'react';

interface GoalData {
  id: number;
  title: string;
  current: number;
  target: number;
  category: string;
}

interface SundownMonthlyGoalsProps {
  goals: GoalData[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getGlowClass(pct: number, isComplete: boolean): string {
  if (isComplete) return 'completed';
  if (pct >= 70) return 'glow-high';
  if (pct >= 30) return 'glow-moderate';
  return 'glow-dim';
}

export function SundownMonthlyGoals({ goals }: SundownMonthlyGoalsProps) {
  const currentMonth = new Date().getMonth(); // 0-indexed
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const completedCount = goals.filter((g) => g.current >= g.target).length;

  // For now, show all goals for any selected month
  // (monthly goal filtering can be added when backend supports it)
  const displayGoals = useMemo(() => goals, [goals]);

  return (
    <div className="sd-full-width">
      <div className="sd-shell" style={{ animationDelay: '2s' }}>
        <div className="sd-face">
          <div className="sd-card-hdr">
            <span className="sd-card-title">Goals</span>
            <span className="sd-badge">
              {completedCount}/{goals.length} Complete
            </span>
          </div>

          {/* Month tabs */}
          <div className="sd-month-tabs">
            {MONTHS.map((month, i) => {
              let className = 'sd-month-tab';
              if (i === selectedMonth) className += ' active';
              else if (i < currentMonth) className += ' past';
              else if (i > currentMonth) className += ' future';
              return (
                <button
                  key={month}
                  className={className}
                  onClick={() => setSelectedMonth(i)}
                >
                  {month}
                </button>
              );
            })}
          </div>

          {/* Goals grid */}
          <div className="sd-goals-grid">
            {displayGoals.map((goal) => {
              const pct =
                goal.target > 0
                  ? Math.round((goal.current / goal.target) * 100)
                  : 0;
              const isComplete = goal.current >= goal.target;
              const glowClass = getGlowClass(pct, isComplete);

              return (
                <div
                  key={goal.id}
                  className={`sd-goal-tile ${glowClass}`}
                >
                  <div className="sd-goal-tile-inner">
                    <div className="sd-goal-tile-name">{goal.title}</div>
                    <div className="sd-goal-tile-fraction">
                      {isComplete
                        ? 'Complete'
                        : `${goal.current} / ${goal.target} (${pct}%)`}
                    </div>
                    <div className="sd-goal-tile-bar">
                      <div
                        className="sd-goal-tile-fill"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          opacity: isComplete ? 0.4 : 1,
                        }}
                      />
                    </div>
                    {isComplete && (
                      <div className="sd-completed-check">
                        <svg viewBox="0 0 24 24">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {goals.length > 6 && (
            <button className="sd-show-all-btn">Show All Months</button>
          )}
        </div>
      </div>
    </div>
  );
}

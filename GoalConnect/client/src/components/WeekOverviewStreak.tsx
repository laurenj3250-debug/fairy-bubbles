import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { Flame } from "lucide-react";

interface HabitLog {
  date: string;
  completionRate: number;
}

/**
 * WeekOverviewStreak - Shows week at a glance + streak counter
 *
 * Combines two important metrics in one clean section:
 * 1. This week's completion pattern
 * 2. Current streak (motivating!)
 */
export function WeekOverviewStreak() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  // Fetch week data
  const { data: weekData = [] } = useQuery<HabitLog[]>({
    queryKey: ['/api/habits/week', format(weekStart, 'yyyy-MM-dd')],
  });

  // Fetch streak data
  const { data: streakData } = useQuery<{ currentStreak: number; longestStreak: number }>({
    queryKey: ['/api/habits/streak'],
  });

  const currentStreak = streakData?.currentStreak || 0;
  const longestStreak = streakData?.longestStreak || 0;

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Week Overview */}
      <div className="glass-card interactive-glow p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">This Week</h2>

        <div className="week-calendar">
          {weekDays.map((date) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayData = weekData.find(d => d.date === dateStr);
            const completionRate = dayData?.completionRate || 0;
            const isToday = isSameDay(date, today);
            const isPast = date < today && !isToday;

            return (
              <div
                key={dateStr}
                className={`
                  week-day interactive-glow
                  ${completionRate === 100 ? 'week-day-completed glowing-orb' : ''}
                  ${isToday ? 'week-day-today' : ''}
                  ${!isPast && !isToday ? 'opacity-40' : ''}
                `}
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {format(date, 'EEE')}
                </div>
                <div className="text-lg font-bold text-foreground mt-1">
                  {format(date, 'd')}
                </div>
                {isPast || isToday ? (
                  <div className="text-xs font-medium text-muted-foreground mt-1">
                    {completionRate}%
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak Counter */}
      <div className="glass-card interactive-glow p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Current Streak</h2>

        <div className="flex items-center justify-center py-6">
          <div className="relative">
            {/* Flame icon background */}
            <div className="absolute -inset-4 flex items-center justify-center">
              <Flame className="w-32 h-32 text-amber-400/30" style={{ animation: 'glow-pulse 2s ease-in-out infinite' }} />
            </div>

            {/* Streak number */}
            <div className="relative text-center">
              <div className="streak-display text-glow" style={{ animation: 'glow-pulse 3s ease-in-out infinite' }}>
                {currentStreak}
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {currentStreak === 1 ? 'day' : 'days'} in a row
              </div>
            </div>
          </div>
        </div>

        {/* Longest streak */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Longest streak:</span>
            <span className="font-semibold text-foreground">{longestStreak} days</span>
          </div>
          {currentStreak === longestStreak && longestStreak > 0 && (
            <p className="text-xs text-emerald-400 mt-2 text-center">
              You're on your best streak ever! 🌟
            </p>
          )}
        </div>

        {/* Motivational message */}
        <div className="glass-card p-3 mt-4">
          <p className="text-sm text-muted-foreground text-center">
            {currentStreak === 0 && "Start your streak today!"}
            {currentStreak >= 1 && currentStreak < 7 && "Keep it going!"}
            {currentStreak >= 7 && currentStreak < 30 && "One week strong!"}
            {currentStreak >= 30 && currentStreak < 90 && "Consistency champion!"}
            {currentStreak >= 90 && currentStreak < 180 && "Three months of dedication!"}
            {currentStreak >= 180 && currentStreak < 365 && "Half a year - incredible!"}
            {currentStreak >= 365 && "Legendary dedication!"}
          </p>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Habit, HabitLog } from "@shared/schema";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { getToday, formatDateInput } from "@/lib/utils";

interface DayData {
  date: string;
  habitsCompleted: number;
  habitsTotal: number;
  completionRate: number;
  isToday: boolean;
  isFuture: boolean;
  habits: Array<{ id: number; title: string; icon: string; completed: boolean }>;
}

export function HabitCompletionCalendar() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const { data: habits = [] } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  const { data: allLogs = [] } = useQuery<HabitLog[]>({
    queryKey: ["/api/habit-logs"],
  });

  // Generate calendar days for the selected month
  const calendarDays = useMemo((): DayData[] => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const today = getToday();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: DayData[] = [];

    // Add empty days for padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      const paddingDate = new Date(year, month, -(startingDayOfWeek - i - 1));
      days.push({
        date: formatDateInput(paddingDate),
        habitsCompleted: 0,
        habitsTotal: 0,
        completionRate: 0,
        isToday: false,
        isFuture: true,
        habits: [],
      });
    }

    // Add actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateInput(date);
      const isToday = dateStr === today;
      const isFuture = date > new Date(today);

      // Get logs for this date
      const logsForDate = allLogs.filter((log) => log.date === dateStr);
      const completedLogs = logsForDate.filter((log) => log.completed);

      // Map habits to completion status
      const habitStatuses = habits.map((habit) => {
        const log = logsForDate.find((l) => l.habitId === habit.id);
        return {
          id: habit.id,
          title: habit.title,
          icon: habit.icon,
          completed: log?.completed || false,
        };
      });

      const habitsTotal = habits.length;
      const habitsCompleted = completedLogs.length;
      const completionRate = habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;

      days.push({
        date: dateStr,
        habitsCompleted,
        habitsTotal,
        completionRate,
        isToday,
        isFuture,
        habits: habitStatuses,
      });
    }

    return days;
  }, [selectedMonth, habits, allLogs]);

  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const handlePreviousMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const monthName = selectedMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const getColorForRate = (rate: number): string => {
    if (rate === 0) return "bg-foreground/5";
    if (rate < 25) return "bg-red-500/30";
    if (rate < 50) return "bg-yellow-500/40";
    if (rate < 75) return "bg-blue-500/50";
    if (rate < 100) return "bg-accent/60";
    return "bg-accent";
  };

  return (
    <div className="bg-background/40 backdrop-blur-xl rounded-3xl p-6 border border-foreground/10 shadow-xl relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at bottom left, hsl(var(--primary) / 0.3), transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />
            Completion Calendar
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-all"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>

            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-all text-sm font-medium text-foreground"
            >
              Today
            </button>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition-all"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        <div className="text-center text-lg font-bold text-foreground mb-4">{monthName}</div>

        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = new Date(day.date + "T00:00:00").getMonth() === selectedMonth.getMonth();
            const colorClass = getColorForRate(day.completionRate);

            return (
              <button
                key={idx}
                onClick={() => isCurrentMonth && !day.isFuture && setSelectedDay(day)}
                disabled={!isCurrentMonth || day.isFuture}
                className={cn(
                  "aspect-square rounded-lg border transition-all relative group",
                  isCurrentMonth
                    ? "hover:scale-105 cursor-pointer"
                    : "opacity-30 cursor-not-allowed",
                  day.isToday && "ring-2 ring-accent ring-offset-1 ring-offset-background",
                  day.isFuture && "opacity-20",
                  colorClass,
                  "border-foreground/10"
                )}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                  <div className="text-xs font-bold text-foreground">
                    {new Date(day.date + "T00:00:00").getDate()}
                  </div>
                  {isCurrentMonth && !day.isFuture && day.habitsTotal > 0 && (
                    <div className="text-[10px] text-foreground/70 mt-0.5">
                      {day.habitsCompleted}/{day.habitsTotal}
                    </div>
                  )}
                </div>

                {/* Tooltip on hover */}
                {isCurrentMonth && !day.isFuture && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                    <div className="bg-popover text-popover-foreground px-2 py-1 rounded-md text-xs whitespace-nowrap shadow-lg border border-foreground/10">
                      {day.date}: {Math.round(day.completionRate)}%
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-foreground/5 border border-foreground/10"></div>
              <div className="w-4 h-4 rounded bg-red-500/30 border border-foreground/10"></div>
              <div className="w-4 h-4 rounded bg-yellow-500/40 border border-foreground/10"></div>
              <div className="w-4 h-4 rounded bg-blue-500/50 border border-foreground/10"></div>
              <div className="w-4 h-4 rounded bg-accent/60 border border-foreground/10"></div>
              <div className="w-4 h-4 rounded bg-accent border border-foreground/10"></div>
            </div>
            <span className="text-muted-foreground">More</span>
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDay && (
          <div className="mt-6 p-4 bg-foreground/5 rounded-xl border border-foreground/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">
                {new Date(selectedDay.date + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Close
              </button>
            </div>

            <div className="mb-3">
              <div className="text-sm text-muted-foreground mb-2">
                {selectedDay.habitsCompleted} of {selectedDay.habitsTotal} habits completed (
                {Math.round(selectedDay.completionRate)}%)
              </div>
              <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${selectedDay.completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              {selectedDay.habits.map((habit) => (
                <div
                  key={habit.id}
                  className="flex items-center gap-2 text-sm p-2 rounded-lg bg-background/50"
                >
                  <div className="text-lg">{habit.icon}</div>
                  <div
                    className={cn(
                      "flex-1",
                      habit.completed ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {habit.title}
                  </div>
                  <div>
                    {habit.completed ? (
                      <span className="text-accent font-bold text-xs">✓ Sent</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

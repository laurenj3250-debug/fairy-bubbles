/**
 * GoalCalendarWidget
 * Month calendar showing goals with due dates, color-coded by status
 * Includes milestone checkpoints and deadline summary
 */

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO,
  isBefore,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalCalendar, type CalendarGoalWithStatus, type GoalStatus } from "@/hooks/useGoalCalendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// More distinct, vibrant colors for better visibility
const STATUS_COLORS: Record<GoalStatus, string> = {
  completed: "bg-emerald-400",
  "on-track": "bg-sky-400",
  "due-soon": "bg-amber-400",
  overdue: "bg-rose-500",
  behind: "bg-orange-400",
  "milestone-met": "bg-emerald-400",
  "milestone-behind": "bg-rose-400",
};

const STATUS_LABELS: Record<GoalStatus, string> = {
  completed: "Completed",
  "on-track": "On Track",
  "due-soon": "Due Soon",
  overdue: "Overdue",
  behind: "Behind Pace",
  "milestone-met": "On Pace",
  "milestone-behind": "Behind",
};

interface GoalPopoverContentProps {
  goal: CalendarGoalWithStatus;
}

function GoalPopoverContent({ goal }: GoalPopoverContentProps) {
  const isMilestone = goal.isMilestone || goal.source === "milestone";

  if (isMilestone) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[goal.status])} />
          <h4 className="font-medium text-sm text-[var(--text-primary)]">
            {goal.title} #{goal.checkpointNumber}
          </h4>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Expected: {goal.expectedValue || goal.targetValue} by {format(parseISO(goal.dueDate), "MMM d")}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          Actual: {goal.currentValue}
        </p>
        {goal.currentValue >= (goal.expectedValue || goal.targetValue) ? (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <Check className="w-3 h-3" /> On pace!
          </span>
        ) : (
          <span className="text-xs text-orange-400">
            Behind by {(goal.expectedValue || goal.targetValue) - goal.currentValue}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", STATUS_COLORS[goal.status])} />
        <div>
          <h4 className="font-medium text-sm text-[var(--text-primary)]">{goal.title}</h4>
          <p className="text-xs text-[var(--text-muted)]">
            Due: {format(parseISO(goal.dueDate), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Progress bar for count goals */}
      {goal.targetValue > 1 && (
        <div className="space-y-1">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", STATUS_COLORS[goal.status])}
              style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{goal.currentValue} / {goal.targetValue}</span>
            <span>{goal.progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          goal.status === "completed" && "bg-emerald-500/20 text-emerald-400",
          goal.status === "on-track" && "bg-sky-500/20 text-sky-400",
          goal.status === "due-soon" && "bg-yellow-500/20 text-yellow-400",
          goal.status === "overdue" && "bg-red-500/20 text-red-400",
          goal.status === "behind" && "bg-orange-500/20 text-orange-400",
        )}>
          {STATUS_LABELS[goal.status]}
        </span>
        <span className="text-xs text-[var(--text-muted)] capitalize">
          {goal.source} goal
        </span>
      </div>
    </div>
  );
}

interface DayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  goals: CalendarGoalWithStatus[];
}

function DayCell({ date, isCurrentMonth, goals }: DayCellProps) {
  const dayNumber = format(date, "d");
  const hasGoals = goals.length > 0;
  const today = isToday(date);

  // Sort goals by urgency for display priority
  const sortedGoals = useMemo(() => {
    const priorities: GoalStatus[] = ["overdue", "due-soon", "behind", "milestone-behind", "on-track", "milestone-met", "completed"];
    return [...goals].sort((a, b) => priorities.indexOf(a.status) - priorities.indexOf(b.status));
  }, [goals]);

  const cellContent = (
    <div
      className={cn(
        "h-8 w-full flex flex-col items-center justify-center rounded-md text-xs relative",
        !isCurrentMonth && "text-[var(--text-muted)]/30",
        isCurrentMonth && "text-[var(--text-primary)]",
        today && "ring-1 ring-peach-400 bg-peach-400/10",
        hasGoals && isCurrentMonth && "cursor-pointer hover:bg-white/5 transition-colors",
      )}
    >
      <span className={cn(today && "font-semibold text-peach-400")}>{dayNumber}</span>
      {hasGoals && isCurrentMonth && (
        <div className="flex items-center gap-[3px] absolute -bottom-0.5">
          {/* Show up to 3 uniform dots, sorted by urgency */}
          {sortedGoals.slice(0, 3).map((goal, idx) => (
            <div
              key={`${goal.source}-${goal.id}-${idx}`}
              className={cn("w-[5px] h-[5px] rounded-full", STATUS_COLORS[goal.status])}
            />
          ))}
          {/* Count badge for overflow */}
          {sortedGoals.length > 3 && (
            <span className="text-[7px] text-[var(--text-muted)] font-medium">+{sortedGoals.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );

  if (!hasGoals || !isCurrentMonth) {
    return cellContent;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {cellContent}
      </PopoverTrigger>
      <PopoverContent
        className="w-72 bg-[var(--bg-card)] border-white/10 p-4 max-h-80 overflow-y-auto"
        align="center"
        sideOffset={8}
      >
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            {format(date, "MMMM d")} - {goals.length} item{goals.length > 1 ? "s" : ""}
          </h3>
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalPopoverContent key={`${goal.source}-${goal.id}`} goal={goal} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function GoalCalendarWidget() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { goalsByDate, isLoading, goals, goalsThisMonth } = useGoalCalendar(currentMonth);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get calendar grid (including days from prev/next months to fill weeks)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Stats for header (exclude milestones from counts)
  const stats = useMemo(() => {
    const nonMilestones = goals.filter(g => !g.isMilestone && g.source !== "milestone");
    const total = nonMilestones.length;
    const completed = nonMilestones.filter(g => g.status === "completed").length;
    const urgent = nonMilestones.filter(g => g.status === "overdue" || g.status === "due-soon").length;
    return { total, completed, urgent };
  }, [goals]);

  return (
    <div className="glass-card frost-accent min-h-[220px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="card-title">Deadlines</span>
        <div className="flex items-center gap-1">
          <button
            onClick={goToPrevMonth}
            className="p-1 text-[var(--text-muted)] hover:text-peach-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToToday}
            className="text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors px-2 min-w-[80px] text-center"
          >
            {format(currentMonth, "MMM yyyy")}
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 text-[var(--text-muted)] hover:text-peach-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini stats */}
      {stats.total > 0 && (
        <div className="flex items-center gap-3 mb-2 text-[10px]">
          <span className="text-[var(--text-muted)]">
            <span className="text-emerald-400 font-medium">{stats.completed}</span>/{stats.total} done
          </span>
          {stats.urgent > 0 && (
            <span className="text-yellow-400">
              {stats.urgent} urgent
            </span>
          )}
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex-1">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div key={i} className="h-5 flex items-center justify-center text-[9px] text-[var(--text-muted)] uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-8 bg-white/5 animate-pulse rounded-md" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayGoals = goalsByDate.get(dateStr) || [];
              return (
                <DayCell
                  key={dateStr}
                  date={date}
                  isCurrentMonth={isSameMonth(date, currentMonth)}
                  goals={dayGoals}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Deadline Summary - Simple list */}
      {!isLoading && goalsThisMonth && goalsThisMonth.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <h4 className="text-[10px] font-medium text-[var(--text-muted)] uppercase mb-2">
            Due This Month
          </h4>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {goalsThisMonth.slice(0, 5).map((goal) => {
              const isOverdue = isBefore(parseISO(goal.dueDate), new Date());
              const isDueSoon = !isOverdue && goal.status === "due-soon";

              return (
                <div key={`summary-${goal.source}-${goal.id}`} className="flex items-center justify-between text-xs">
                  <span className={cn(
                    "truncate max-w-[140px]",
                    goal.completed || goal.status === "completed"
                      ? "text-emerald-400 line-through"
                      : isOverdue
                        ? "text-red-400"
                        : isDueSoon
                          ? "text-yellow-400"
                          : "text-[var(--text-primary)]"
                  )}>
                    {goal.title}
                  </span>
                  <span className={cn(
                    "text-[10px] ml-2",
                    isOverdue ? "text-red-400" : "text-[var(--text-muted)]"
                  )}>
                    {format(parseISO(goal.dueDate), "MMM d")}
                  </span>
                </div>
              );
            })}
            {goalsThisMonth.length > 5 && (
              <div className="text-[10px] text-[var(--text-muted)]">
                +{goalsThisMonth.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && goals.length === 0 && (
        <div className="text-center py-2 text-[10px] text-[var(--text-muted)]">
          No goals with due dates this month
        </div>
      )}
    </div>
  );
}

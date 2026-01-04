/**
 * TodayFocusCard
 * The first thing users see - "What do I do RIGHT NOW?"
 */

import { format } from 'date-fns';
import { CheckCircle2, Circle, Target, Flame, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

interface HabitSummary {
  completed: number;
  total: number;
}

interface GoalDeadline {
  id: number;
  title: string;
  dueDate: string;
  isOverdue: boolean;
}

interface TodayFocusCardProps {
  date: Date;
  habits: HabitSummary;
  topStreak: number;
  urgentGoals: GoalDeadline[];
  onHabitClick: () => void;
}

export function TodayFocusCard({
  date,
  habits,
  topStreak,
  urgentGoals,
  onHabitClick,
}: TodayFocusCardProps) {
  const allHabitsDone = habits.total > 0 && habits.completed === habits.total;
  const habitProgress = habits.total > 0
    ? Math.round((habits.completed / habits.total) * 100)
    : 0;

  return (
    <div className="glass-card frost-accent">
      {/* Header with date */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-[var(--text-primary)]">
            Today's Focus
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {format(date, 'EEEE, MMMM d')}
          </p>
        </div>
        {topStreak > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">{topStreak}</span>
          </div>
        )}
      </div>

      {/* Habit Progress - Main CTA */}
      <button
        onClick={onHabitClick}
        className={cn(
          "w-full p-4 rounded-xl mb-3 transition-all text-left group",
          "border border-white/10 hover:border-peach-400/30",
          allHabitsDone
            ? "bg-emerald-500/10"
            : "bg-white/5 hover:bg-white/10"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {allHabitsDone ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            ) : (
              <div className="relative">
                <Circle className="w-6 h-6 text-[var(--text-muted)]" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-peach-400"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${habitProgress}%, 0 ${habitProgress}%)`
                  }}
                />
              </div>
            )}
            <div>
              <p className={cn(
                "font-medium",
                allHabitsDone ? "text-emerald-400" : "text-[var(--text-primary)]"
              )}>
                {allHabitsDone ? "All habits complete!" : "Daily Habits"}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                {habits.completed}/{habits.total} done
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-peach-400 transition-colors" />
        </div>

        {/* Progress bar */}
        {!allHabitsDone && (
          <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-peach-400 rounded-full transition-all"
              style={{ width: `${habitProgress}%` }}
            />
          </div>
        )}
      </button>

      {/* Urgent Goals */}
      {urgentGoals.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
            Upcoming Deadlines
          </p>
          {urgentGoals.slice(0, 2).map(goal => (
            <Link key={goal.id} href="/goals">
              <div className={cn(
                "flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer",
                "bg-white/5 hover:bg-white/10",
                goal.isOverdue && "border-l-2 border-rose-400"
              )}>
                <Target className={cn(
                  "w-4 h-4 flex-shrink-0",
                  goal.isOverdue ? "text-rose-400" : "text-[var(--text-muted)]"
                )} />
                <span className="text-sm truncate flex-1">{goal.title}</span>
                <span className={cn(
                  "text-xs",
                  goal.isOverdue ? "text-rose-400" : "text-[var(--text-muted)]"
                )}>
                  {format(new Date(goal.dueDate), 'MMM d')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

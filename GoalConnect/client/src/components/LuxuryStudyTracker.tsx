import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';

interface StudyTask {
  id: number;
  title: string;
  completed: boolean;
}

interface LuxuryStudyTrackerProps {
  tasks: StudyTask[];
  onToggle?: (id: number) => void;
  onStartSession?: () => void;
  className?: string;
}

export function LuxuryStudyTracker({
  tasks,
  onToggle,
  onStartSession,
  className,
}: LuxuryStudyTrackerProps) {
  const isEmpty = tasks.length === 0;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className={cn("flex flex-col h-full w-full", className)}>
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="empty-display">No study tasks</span>
          <span className="font-body text-xs text-[var(--text-muted)] mt-2">
            Add tasks with "study" or "learn" in the title
          </span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-xs text-[var(--text-muted)] mb-2">
            {completedCount}/{tasks.length} complete
          </div>
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => onToggle?.(task.id)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg text-left transition-all",
                task.completed ? "opacity-50" : "hover:bg-white/5"
              )}
            >
              {task.completed ? (
                <CheckCircle2 className="w-4 h-4 text-peach-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              )}
              <span className={cn(
                "font-body text-xs truncate",
                task.completed && "line-through text-[var(--text-muted)]"
              )}>
                {task.title}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Start button */}
      <button
        onClick={onStartSession}
        className={cn(
          "w-full py-3 rounded-2xl font-heading text-sm tracking-wide transition-all mt-4",
          "bg-peach-400 text-ice-deep",
          "shadow-[0_4px_20px_rgba(228,168,128,0.3)]",
          "hover:shadow-[0_6px_28px_rgba(228,168,128,0.4)]",
          "hover:translate-y-[-1px]",
          "active:translate-y-0"
        )}
      >
        Go to Study
      </button>
    </div>
  );
}

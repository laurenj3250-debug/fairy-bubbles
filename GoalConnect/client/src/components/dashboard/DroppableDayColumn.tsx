import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { DraggableScheduleTask } from './DraggableScheduleTask';
import { CheckCircle2, Circle } from 'lucide-react';
import type { Todo } from '@shared/schema';

export interface StudyTaskItem {
  id: string;
  title: string;
  completed: boolean;
  taskType: string;
}

interface DroppableDayColumnProps {
  dayIndex: number;
  dayName: string;
  date: string;
  isToday: boolean;
  todos: Todo[];
  studyTasks?: StudyTaskItem[];
  onToggle: (id: number) => void;
  onUpdate: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  onStudyToggle?: (taskType: string) => void;
  isAddingDay: number | null;
  inlineAddTitle: string;
  setInlineAddTitle: (value: string) => void;
  setInlineAddDay: (day: number | null) => void;
  onSubmitAdd: (dueDate: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

export function DroppableDayColumn({
  dayIndex,
  dayName,
  date,
  isToday,
  todos,
  studyTasks = [],
  onToggle,
  onUpdate,
  onDelete,
  onAdd,
  onStudyToggle,
  isAddingDay,
  inlineAddTitle,
  setInlineAddTitle,
  setInlineAddDay,
  onSubmitAdd,
  isCreating,
  isUpdating,
  isDeleting,
}: DroppableDayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dayIndex}`,
    data: { date, dayIndex },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl p-2 min-h-[100px] text-center transition-all",
        isToday
          ? "bg-peach-400/10 border border-peach-400/30"
          : "bg-white/5 border border-transparent",
        isOver && "ring-2 ring-peach-400/50 bg-peach-400/5"
      )}
    >
      {/* Day label */}
      <div className={cn(
        "font-heading-sc tracking-wide mb-2 text-[0.65rem]",
        isToday ? "text-peach-400" : "text-[var(--text-muted)]"
      )}>
        {isToday ? `${dayName} ·` : dayName}
      </div>

      <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {todos.slice(0, 4).map(todo => (
            <DraggableScheduleTask
              key={todo.id}
              id={todo.id}
              title={todo.title}
              completed={todo.completed}
              onToggle={() => onToggle(todo.id)}
              onUpdate={(title) => onUpdate(todo.id, title)}
              onDelete={() => onDelete(todo.id)}
              isUpdating={isUpdating}
              isDeleting={isDeleting}
            />
          ))}

          {/* Inline add form */}
          {todos.length < 4 && (
            isAddingDay === dayIndex ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inlineAddTitle.trim() && !isCreating) {
                    onSubmitAdd(date);
                  }
                }}
                className="flex gap-1"
              >
                <input
                  type="text"
                  value={inlineAddTitle}
                  onChange={(e) => setInlineAddTitle(e.target.value)}
                  placeholder="Task..."
                  autoFocus
                  maxLength={500}
                  disabled={isCreating}
                  onBlur={() => {
                    if (!inlineAddTitle.trim() && !isCreating) {
                      setInlineAddDay(null);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape' && !isCreating) {
                      setInlineAddTitle('');
                      setInlineAddDay(null);
                    }
                  }}
                  className={cn(
                    "flex-1 text-[0.6rem] p-1 rounded bg-white/10 border border-white/20 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-peach-400/50",
                    isCreating && "opacity-50"
                  )}
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={onAdd}
                disabled={isCreating}
                className="w-full text-center font-body text-[0.55rem] p-1 rounded text-[var(--text-muted)] hover:bg-white/5 transition-colors opacity-50 hover:opacity-100"
              >
                + add
              </button>
            )
          )}

          {/* Study Tasks Section */}
          {studyTasks.length > 0 && (
            <div className="mt-2 pt-2 border-t border-purple-400/20">
              {studyTasks.map(task => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onStudyToggle?.(task.taskType)}
                  className={cn(
                    "w-full flex items-center gap-1 p-1 rounded text-[0.55rem] text-left transition-all",
                    task.completed ? "opacity-50" : "hover:bg-purple-400/10"
                  )}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-3 h-3 text-purple-400 shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-purple-400/50 shrink-0" />
                  )}
                  <span className={cn(
                    "font-body truncate text-purple-300",
                    task.completed && "line-through text-purple-400/50"
                  )}>
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

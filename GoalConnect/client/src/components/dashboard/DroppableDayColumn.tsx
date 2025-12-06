import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { DraggableScheduleTask } from './DraggableScheduleTask';
import type { Todo } from '@shared/schema';

interface DroppableDayColumnProps {
  dayIndex: number;
  dayName: string;
  date: string;
  isToday: boolean;
  todos: Todo[];
  onToggle: (id: number) => void;
  onUpdate: (id: number, title: string) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
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
  onToggle,
  onUpdate,
  onDelete,
  onAdd,
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
        </div>
      </SortableContext>
    </div>
  );
}

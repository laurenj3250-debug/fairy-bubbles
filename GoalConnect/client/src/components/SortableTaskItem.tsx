import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, Edit, Trash2, CheckCircle, Circle, CheckCircle2, Repeat } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Todo, Project, Label } from '@shared/schema';
import { getTaskGrade } from '@/lib/climbingRanks';
import { useState } from 'react';
import type { RecurrencePattern } from '../../../shared/lib/recurrenceEngine';
import { patternToString } from '../../../shared/lib/recurrenceEngine';
import { format, parseISO } from 'date-fns';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoWithMetadata extends Todo {
  project: Project | null;
  labels: Label[];
}

interface SortableTaskItemProps {
  todo: TodoWithMetadata;
  isDraggable: boolean;
  onToggle: (id: number) => void;
  onToggleSubtask: (todoId: number, subtaskId: string) => void;
  onEdit: (todo: TodoWithMetadata) => void;
  onDelete: (id: number) => void;
  isFadingOut: boolean;
  isToggling: boolean;
  isDeletingDisabled: boolean;
}

const getPriorityColor = (priority: number) => {
  switch (priority) {
    case 1: return '#ef4444'; // Red
    case 2: return '#f97316'; // Orange
    case 3: return '#3b82f6'; // Blue
    default: return '#6b7280'; // Gray
  }
};

export function SortableTaskItem({
  todo,
  isDraggable,
  onToggle,
  onToggleSubtask,
  onEdit,
  onDelete,
  isFadingOut,
  isToggling,
  isDeletingDisabled,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;

    // Parse date as YYYY-MM-DD in local timezone (avoid UTC shift)
    const [year, month, day] = dueDate.split('-').map(Number);
    const due = new Date(year, month - 1, day);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: "text-muted-foreground" };
    } else if (diffDays === 0) {
      return { text: "Due today", color: "text-primary" };
    } else if (diffDays === 1) {
      return { text: "Due tomorrow", color: "text-[hsl(var(--accent))]" };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: "text-primary" };
    } else {
      return { text: due.toLocaleDateString(), color: "text-muted-foreground" };
    }
  };

  const dueDateInfo = formatDueDate(todo.dueDate);
  const gradeInfo = getTaskGrade(todo.difficulty);
  const subtasks: Subtask[] = JSON.parse(todo.subtasks || "[]");
  const completedSubtasks = subtasks.filter(st => st.completed).length;

  // Parse recurrence pattern
  const recurringPattern: RecurrencePattern | null = todo.recurringPattern
    ? JSON.parse(todo.recurringPattern)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-background/40 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg p-4 transition-all relative overflow-hidden",
        isFadingOut && "animate-fade-out",
        todo.completed && !isFadingOut && "opacity-60",
        isDragging && "shadow-2xl z-50"
      )}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, hsl(var(--accent) / 0.2), transparent 70%)`
        }}
      />
      <div className="relative z-10 flex items-start gap-4">
        {/* Drag Handle */}
        {isDraggable && (
          <button
            {...attributes}
            {...listeners}
            className="mt-1 flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-foreground/5 rounded transition-colors"
            style={{ color: 'hsl(var(--foreground) / 0.4)' }}
            title="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={() => onToggle(todo.id)}
          disabled={isToggling}
          className="mt-1 flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all text-white"
          style={{
            background: todo.completed ? 'hsl(var(--accent))' : 'transparent',
            borderColor: todo.completed ? 'hsl(var(--accent) / 0.8)' : 'hsl(var(--foreground) / 0.2)'
          }}
          onMouseEnter={(e) => {
            if (!todo.completed) {
              e.currentTarget.style.borderColor = 'hsl(var(--primary))';
              e.currentTarget.style.background = 'hsl(var(--primary) / 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!todo.completed) {
              e.currentTarget.style.borderColor = 'hsl(var(--foreground) / 0.2)';
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {todo.completed && <CheckCircle className="w-5 h-5" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "text-foreground font-semibold mb-1",
              todo.completed && "line-through opacity-60"
            )}
          >
            {todo.title}
          </h3>

          {/* Subtasks */}
          {subtasks.length > 0 && (
            <div className="mt-2 mb-2 space-y-1">
              {subtasks.map((subtask) => (
                <button
                  key={subtask.id}
                  onClick={() => onToggleSubtask(todo.id, subtask.id)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
                >
                  {subtask.completed ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
                  ) : (
                    <Circle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className={cn(subtask.completed && "line-through opacity-60")}>
                    {subtask.title}
                  </span>
                </button>
              ))}
              {subtasks.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {completedSubtasks}/{subtasks.length} completed
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* Recurring Indicator */}
            {recurringPattern && (
              <Badge className="border-0" style={{
                background: 'hsl(var(--primary) / 0.15)',
                color: 'hsl(var(--primary))'
              }} title={patternToString(recurringPattern)}>
                <Repeat className="w-3 h-3 mr-1" />
                {patternToString(recurringPattern).split(' ')[0]}
              </Badge>
            )}

            {/* Next Recurrence Date */}
            {recurringPattern && todo.nextRecurrence && (
              <Badge className="border-0" style={{
                background: 'hsl(var(--accent) / 0.15)',
                color: 'hsl(var(--accent))'
              }}>
                Next: {format(parseISO(todo.nextRecurrence), 'MMM d')}
              </Badge>
            )}

            {dueDateInfo && (
              <Badge className="border-0" style={{
                background: 'hsl(var(--foreground) / 0.08)',
                color: 'hsl(var(--foreground))'
              }}>
                <Calendar className="w-3 h-3 mr-1" />
                <span className={dueDateInfo.color}>{dueDateInfo.text}</span>
              </Badge>
            )}
            {todo.difficulty && (
              <Badge className="border-0" style={{
                background: 'hsl(var(--accent) / 0.2)',
                color: 'hsl(var(--accent))'
              }}>
                {gradeInfo.label} • {gradeInfo.points} tokens
              </Badge>
            )}
            {/* Project Badge */}
            {todo.project && (
              <Badge
                className="border-0"
                style={{
                  background: `${todo.project.color}15`,
                  color: todo.project.color,
                }}
              >
                {todo.project.icon} {todo.project.name}
              </Badge>
            )}
            {/* Priority Badge */}
            {todo.priority && todo.priority < 4 && (
              <Badge
                className="border-0"
                style={{
                  background: getPriorityColor(todo.priority) + '20',
                  color: getPriorityColor(todo.priority),
                }}
              >
                P{todo.priority}
              </Badge>
            )}
            {/* Label Badges */}
            {todo.labels?.map((label) => (
              <Badge
                key={label.id}
                className="border-0"
                style={{
                  background: `${label.color}15`,
                  color: label.color,
                }}
              >
                #{label.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex gap-1">
          {/* Edit button */}
          <button
            onClick={() => onEdit(todo)}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-all"
            style={{ color: 'hsl(var(--primary))' }}
            title="Edit task"
          >
            <Edit className="w-4 h-4" />
          </button>

          {/* Delete button */}
          <button
            onClick={() => {
              if (confirm("Delete this task?")) {
                onDelete(todo.id);
              }
            }}
            disabled={isDeletingDisabled}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-all"
            style={{ color: 'hsl(var(--foreground) / 0.5)' }}
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

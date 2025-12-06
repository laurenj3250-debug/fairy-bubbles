import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Circle, Pencil, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableScheduleTaskProps {
  id: number;
  title: string;
  completed: boolean;
  onToggle: () => void;
  onUpdate: (title: string) => void;
  onDelete: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function DraggableScheduleTask({
  id,
  title,
  completed,
  onToggle,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: DraggableScheduleTaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    // Update editValue when title changes (after successful save)
    setEditValue(title);
  }, [title]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onUpdate(trimmed);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setEditValue(title);
            setIsEditing(false);
          }
        }}
        className="w-full text-[0.65rem] p-1 rounded bg-white/20 border border-peach-400/50 text-[var(--text-primary)] focus:outline-none"
        maxLength={500}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 p-1 rounded bg-ice-card/50 transition-all",
        isDragging && "opacity-50 shadow-lg",
        isDeleting && "opacity-30"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="touch-none opacity-0 group-hover:opacity-50 group-focus-within:opacity-50 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0"
      >
        {completed ? (
          <Check className="w-3 h-3 text-peach-400" />
        ) : (
          <Circle className="w-3 h-3 text-[var(--text-muted)]" />
        )}
      </button>

      {/* Title - click to edit */}
      <span
        onClick={() => setIsEditing(true)}
        className={cn(
          "flex-1 text-[0.65rem] truncate cursor-text hover:text-peach-400",
          completed && "line-through opacity-50"
        )}
      >
        {title}
      </span>

      {/* Action icons */}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="p-0.5 hover:text-peach-400"
          title="Edit"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          className="p-0.5 hover:text-red-400"
          title="Delete"
        >
          <Trash2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
}

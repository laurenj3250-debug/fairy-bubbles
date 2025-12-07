# Dashboard Task Management v2 - Better Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Full task management on dashboard - drag tasks between days, inline edit, quick delete - works on mobile and desktop.

**Architecture:**
- Drag-drop between day columns using @dnd-kit (already installed)
- Hover/tap reveals action icons (edit pencil, trash)
- Inline text editing (click title → input → Enter to save)
- No modals, no right-click menus

**Tech Stack:** React, @dnd-kit/core, @dnd-kit/sortable, TanStack Query

---

## Design Decisions

| Problem | Solution |
|---------|----------|
| Right-click = desktop only | Visible icon buttons on hover/focus |
| Cramped columns | Small icons (16px), appear on hover only |
| Click ambiguity | Checkbox for complete, text for edit, drag handle for move |
| No drag-drop | Full @dnd-kit with droppable day columns |
| Modal overkill | Inline editing - click text, type, Enter |

---

## Task 1: Add Mutations for Update and Delete

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx`

**Step 1: Add mutations after createTodoMutation (around line 306)**

```typescript
const updateTodoMutation = useMutation({
  mutationFn: async ({ id, ...data }: { id: number; title?: string; dueDate?: string }) => {
    return await apiRequest(`/api/todos/${id}`, 'PATCH', data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
  },
  onError: (error: Error) => {
    toast({ title: "Failed to update task", description: error.message, variant: "destructive" });
  },
});

const deleteTodoMutation = useMutation({
  mutationFn: async (id: number) => {
    return await apiRequest(`/api/todos/${id}`, 'DELETE');
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
    toast({ title: "Task deleted" });
  },
  onError: (error: Error) => {
    toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
  },
});
```

**Step 2: Commit**
```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat(dashboard): add update and delete mutations"
```

---

## Task 2: Create DraggableScheduleTask Component

**Files:**
- Create: `client/src/components/dashboard/DraggableScheduleTask.tsx`

**Step 1: Create the component**

```typescript
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

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== title) {
      onUpdate(trimmed);
    }
    setIsEditing(false);
    setEditValue(title); // Reset if cancelled
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
```

**Step 2: Commit**
```bash
git add client/src/components/dashboard/DraggableScheduleTask.tsx
git commit -m "feat(dashboard): create DraggableScheduleTask component"
```

---

## Task 3: Create DroppableDayColumn Component

**Files:**
- Create: `client/src/components/dashboard/DroppableDayColumn.tsx`

**Step 1: Create the component**

```typescript
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
          ? "bg-peach-400/10 border border-peach-400/25 shadow-[0_0_15px_rgba(228,168,128,0.1)]"
          : "bg-white/5",
        isOver && "ring-2 ring-peach-400/50 bg-peach-400/5"
      )}
    >
      <div className={cn(
        "font-heading-sc text-[0.6rem] tracking-wide mb-2",
        isToday ? "text-peach-400" : "text-[var(--text-muted)]"
      )}>
        {dayName}
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
```

**Step 2: Commit**
```bash
git add client/src/components/dashboard/DroppableDayColumn.tsx
git commit -m "feat(dashboard): create DroppableDayColumn component"
```

---

## Task 4: Integrate Drag-Drop into Schedule

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx`

**Step 1: Add imports**

```typescript
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { DroppableDayColumn } from '@/components/dashboard/DroppableDayColumn';
import { DraggableScheduleTask } from '@/components/dashboard/DraggableScheduleTask';
```

**Step 2: Add drag state and sensors (after other state)**

```typescript
const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
);

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveTaskId(null);

  if (!over) return;

  const taskId = active.id as number;
  const overData = over.data.current as { date: string; dayIndex: number } | undefined;

  if (overData?.date) {
    const task = todos.find(t => t.id === taskId);
    if (task && task.dueDate !== overData.date) {
      updateTodoMutation.mutate({ id: taskId, dueDate: overData.date });
    }
  }
};

const activeTask = activeTaskId ? todos.find(t => t.id === activeTaskId) : null;
```

**Step 3: Replace schedule grid with DndContext wrapper**

Replace the entire schedule section (around lines 600-700) with:

```typescript
{/* === SCHEDULE === */}
<div className="glass-card p-5">
  <div className="flex items-center justify-between mb-4">
    <span className="card-title">Schedule</span>
  </div>

  <DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragStart={(e) => setActiveTaskId(e.active.id as number)}
    onDragEnd={handleDragEnd}
    onDragCancel={() => setActiveTaskId(null)}
  >
    <div className="grid grid-cols-7 gap-2">
      {week.dayNames.map((day, i) => (
        <DroppableDayColumn
          key={`${day}-${i}`}
          dayIndex={i}
          dayName={day}
          date={week.dates[i]}
          isToday={i === week.todayIndex}
          todos={todosByDay[i] || []}
          onToggle={handleToggleTodo}
          onUpdate={(id, title) => updateTodoMutation.mutate({ id, title })}
          onDelete={(id) => deleteTodoMutation.mutate(id)}
          onAdd={() => setInlineAddDay(i)}
          isAddingDay={inlineAddDay}
          inlineAddTitle={inlineAddTitle}
          setInlineAddTitle={setInlineAddTitle}
          setInlineAddDay={setInlineAddDay}
          onSubmitAdd={(dueDate) => {
            createTodoMutation.mutate({ title: inlineAddTitle.trim(), dueDate });
          }}
          isCreating={createTodoMutation.isPending}
          isUpdating={updateTodoMutation.isPending}
          isDeleting={deleteTodoMutation.isPending}
        />
      ))}
    </div>

    {/* Drag overlay for visual feedback */}
    <DragOverlay>
      {activeTask && (
        <div className="bg-ice-card/90 p-1 rounded shadow-lg text-[0.65rem] border border-peach-400/50">
          {activeTask.title}
        </div>
      )}
    </DragOverlay>
  </DndContext>
</div>
```

**Step 4: Commit**
```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat(dashboard): integrate drag-drop schedule"
```

---

## Task 5: Polish and Test

**Files:**
- Modify: `client/src/components/dashboard/DraggableScheduleTask.tsx` (if needed)
- Modify: `client/src/pages/DashboardV4.tsx` (if needed)

**Step 1: Test all interactions**

- [ ] Drag task from Monday to Friday - task moves
- [ ] Click checkbox - toggles completion
- [ ] Click title text - inline edit appears
- [ ] Type new title, press Enter - saves
- [ ] Press Escape - cancels edit
- [ ] Click pencil icon - inline edit appears
- [ ] Click trash icon - deletes task
- [ ] Click "+ add" - inline form appears
- [ ] Mobile: touch and hold drag handle - can drag
- [ ] Mobile: tap checkbox - toggles
- [ ] Mobile: tap title - edit mode

**Step 2: Fix any issues found**

**Step 3: Final commit**
```bash
git add -A
git commit -m "feat(dashboard): complete task management with drag-drop"
```

---

## Summary

| Task | What |
|------|------|
| 1 | Add update/delete mutations |
| 2 | DraggableScheduleTask component |
| 3 | DroppableDayColumn component |
| 4 | Integrate into dashboard |
| 5 | Polish and test |

**5 tasks** - lean, no modals, mobile-friendly, real drag-drop.

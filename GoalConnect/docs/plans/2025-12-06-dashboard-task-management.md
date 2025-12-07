# Dashboard Full Task Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete task management to the dashboard schedule - edit, delete, move between days - so users never need to leave the dashboard for task operations.

**Architecture:** Add a context menu (right-click/long-press) on each task with Edit, Delete, Move options. Reuse existing `TodoDialogEnhanced` for editing. Use existing API endpoints (`PATCH`, `DELETE`). Keep the compact schedule design - no drag-drop (save that for /todos page).

**Tech Stack:** React, TanStack Query, Radix UI DropdownMenu, existing TodoDialogEnhanced component

---

## Overview of Changes

| Feature | Implementation |
|---------|---------------|
| Edit task | Context menu → Opens TodoDialogEnhanced |
| Delete task | Context menu → Confirmation → DELETE API |
| Move to day | Context menu → Day submenu → PATCH dueDate |
| Visual feedback | Loading states, animations |

---

## Task 1: Add State for Edit Dialog and Selected Task

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx:115-120` (state declarations)

**Step 1: Add imports for TodoDialogEnhanced**

Find the imports section (around line 1-20) and add:

```typescript
import { TodoDialogEnhanced } from '@/components/TodoDialogEnhanced';
```

**Step 2: Add state for edit dialog**

After the existing state declarations (around line 118), add:

```typescript
// Task management state
const [editDialogOpen, setEditDialogOpen] = useState(false);
const [selectedTask, setSelectedTask] = useState<TodoWithMetadata | null>(null);
```

**Step 3: Commit**

```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat(dashboard): add state for task edit dialog"
```

---

## Task 2: Add Delete Mutation

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx:285-306` (mutations section)

**Step 1: Add delete mutation after createTodoMutation**

```typescript
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
git commit -m "feat(dashboard): add delete task mutation"
```

---

## Task 3: Add Move Task Mutation

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx` (after delete mutation)

**Step 1: Add move/update mutation**

```typescript
const updateTodoMutation = useMutation({
  mutationFn: async ({ id, dueDate }: { id: number; dueDate: string }) => {
    return await apiRequest(`/api/todos/${id}`, 'PATCH', { dueDate });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/todos-with-metadata'] });
    toast({ title: "Task moved" });
  },
  onError: (error: Error) => {
    toast({ title: "Failed to move task", description: error.message, variant: "destructive" });
  },
});
```

**Step 2: Commit**

```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat(dashboard): add move task mutation"
```

---

## Task 4: Create Task Context Menu Component

**Files:**
- Create: `client/src/components/dashboard/ScheduleTaskMenu.tsx`

**Step 1: Create the component file**

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Todo } from '@shared/schema';

interface ScheduleTaskMenuProps {
  task: Todo;
  dayNames: string[];
  dates: string[];
  currentDayIndex: number;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (newDate: string) => void;
  isDeleting?: boolean;
  isMoving?: boolean;
  children: React.ReactNode;
}

export function ScheduleTaskMenu({
  task,
  dayNames,
  dates,
  currentDayIndex,
  onEdit,
  onDelete,
  onMove,
  isDeleting,
  isMoving,
  children,
}: ScheduleTaskMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="w-4 h-4 mr-2" />
          Edit task
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isMoving}>
            <ArrowRight className="w-4 h-4 mr-2" />
            Move to...
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {dayNames.map((day, i) => (
              <DropdownMenuItem
                key={i}
                disabled={i === currentDayIndex || isMoving}
                onClick={() => onMove(dates[i])}
              >
                <Calendar className="w-4 h-4 mr-2" />
                {day}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onDelete}
          disabled={isDeleting}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/dashboard/ScheduleTaskMenu.tsx
git commit -m "feat(dashboard): create ScheduleTaskMenu component"
```

---

## Task 5: Integrate Context Menu into Schedule

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx:620-635` (task buttons in schedule)

**Step 1: Import the new component**

Add to imports:
```typescript
import { ScheduleTaskMenu } from '@/components/dashboard/ScheduleTaskMenu';
```

**Step 2: Replace task button with menu-wrapped version**

Find this code (around line 623-634):
```typescript
{dayTodos.slice(0, 4).map(todo => (
  <button
    type="button"
    key={todo.id}
    onClick={() => handleToggleTodo(todo.id)}
    className={cn(
      "w-full text-left font-body text-[0.65rem] p-1 rounded bg-ice-card/50 cursor-pointer truncate hover:bg-peach-400/10 transition-colors",
      todo.completed && "opacity-50 line-through"
    )}
  >
    {todo.title}
  </button>
))}
```

Replace with:
```typescript
{dayTodos.slice(0, 4).map(todo => (
  <ScheduleTaskMenu
    key={todo.id}
    task={todo}
    dayNames={week.dayNames}
    dates={week.dates}
    currentDayIndex={i}
    onEdit={() => {
      setSelectedTask(todo);
      setEditDialogOpen(true);
    }}
    onDelete={() => deleteTodoMutation.mutate(todo.id)}
    onMove={(newDate) => updateTodoMutation.mutate({ id: todo.id, dueDate: newDate })}
    isDeleting={deleteTodoMutation.isPending}
    isMoving={updateTodoMutation.isPending}
  >
    <button
      type="button"
      onClick={() => handleToggleTodo(todo.id)}
      className={cn(
        "w-full text-left font-body text-[0.65rem] p-1 rounded bg-ice-card/50 cursor-pointer truncate hover:bg-peach-400/10 transition-colors",
        todo.completed && "opacity-50 line-through"
      )}
    >
      {todo.title}
    </button>
  </ScheduleTaskMenu>
))}
```

**Step 3: Commit**

```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat(dashboard): integrate task context menu into schedule"
```

---

## Task 6: Add Edit Dialog to Dashboard

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx` (end of component, before closing `</div>`)

**Step 1: Add the TodoDialogEnhanced component**

Before the final closing `</div>` of the component (around line 700), add:

```typescript
      {/* Task Edit Dialog */}
      <TodoDialogEnhanced
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) setSelectedTask(null);
        }}
        editTodo={selectedTask}
      />
```

**Step 2: Commit**

```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat(dashboard): add task edit dialog"
```

---

## Task 7: Add Delete Confirmation

**Files:**
- Modify: `client/src/components/dashboard/ScheduleTaskMenu.tsx`

**Step 1: Add AlertDialog for delete confirmation**

Update the component to include confirmation:

```typescript
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
```

Add state and dialog:
```typescript
export function ScheduleTaskMenu({ ... }) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        {/* ... existing menu ... */}
        <DropdownMenuItem
          onClick={() => setDeleteConfirmOpen(true)}
          disabled={isDeleting}
          className="text-red-500 focus:text-red-500"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenu>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              "{task.title}" will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/dashboard/ScheduleTaskMenu.tsx
git commit -m "feat(dashboard): add delete confirmation dialog"
```

---

## Task 8: Visual Polish and UX

**Files:**
- Modify: `client/src/pages/DashboardV4.tsx`

**Step 1: Add visual indicator that tasks are interactive**

Add a subtle hover hint showing right-click is available. Update the task button:

```typescript
<button
  type="button"
  onClick={() => handleToggleTodo(todo.id)}
  onContextMenu={(e) => e.preventDefault()} // Handled by dropdown
  className={cn(
    "w-full text-left font-body text-[0.65rem] p-1 rounded bg-ice-card/50 cursor-pointer truncate transition-colors group",
    "hover:bg-peach-400/10 hover:ring-1 hover:ring-peach-400/20",
    todo.completed && "opacity-50 line-through"
  )}
  title="Click to toggle • Right-click for options"
>
  {todo.title}
</button>
```

**Step 2: Commit**

```bash
git add client/src/pages/DashboardV4.tsx
git commit -m "feat(dashboard): add visual polish to task interactions"
```

---

## Testing Checklist

After all tasks complete, manually verify:

- [ ] Right-click on a task shows Edit, Move to..., Delete options
- [ ] Edit opens the full TodoDialogEnhanced with all fields
- [ ] Saving edits updates the task and refreshes the schedule
- [ ] Move to... shows all 7 days, current day is disabled
- [ ] Moving a task updates it in the correct day column
- [ ] Delete shows confirmation dialog
- [ ] Confirming delete removes the task
- [ ] Loading states shown during mutations
- [ ] Left-click still toggles task completion
- [ ] Inline "+ add" still works for creating tasks
- [ ] All existing dashboard functionality still works

---

## Summary

| Task | Feature |
|------|---------|
| 1 | State for edit dialog |
| 2 | Delete mutation |
| 3 | Move mutation |
| 4 | ScheduleTaskMenu component |
| 5 | Integrate menu into schedule |
| 6 | Add edit dialog |
| 7 | Delete confirmation |
| 8 | Visual polish |

**Total: 8 tasks**

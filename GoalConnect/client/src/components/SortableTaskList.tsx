import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { SortableTaskItem } from './SortableTaskItem';
import type { Todo, Project, Label } from '@shared/schema';

interface TodoWithMetadata extends Todo {
  project: Project | null;
  labels: Label[];
}

interface SortableTaskListProps {
  todos: TodoWithMetadata[];
  isDraggable: boolean;
  onReorder: (activeId: number, overId: number) => void;
  onToggle: (id: number) => void;
  onToggleSubtask: (todoId: number, subtaskId: string) => void;
  onEdit: (todo: TodoWithMetadata) => void;
  onDelete: (id: number) => void;
  fadingOutTodos: Set<number>;
  isToggling: boolean;
  isDeletingDisabled: boolean;
}

export function SortableTaskList({
  todos,
  isDraggable,
  onReorder,
  onToggle,
  onToggleSubtask,
  onEdit,
  onDelete,
  fadingOutTodos,
  isToggling,
  isDeletingDisabled,
}: SortableTaskListProps) {
  const [activeId, setActiveId] = useState<number | null>(null);

  // Configure sensors for mouse, touch, and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch (allows scrolling)
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onReorder(active.id as number, over.id as number);
    }

    setActiveId(null);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTodo = activeId ? todos.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {todos.map((todo) => (
            <SortableTaskItem
              key={todo.id}
              todo={todo}
              isDraggable={isDraggable}
              onToggle={onToggle}
              onToggleSubtask={onToggleSubtask}
              onEdit={onEdit}
              onDelete={onDelete}
              isFadingOut={fadingOutTodos.has(todo.id)}
              isToggling={isToggling}
              isDeletingDisabled={isDeletingDisabled}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay - Shows a copy of the item being dragged */}
      <DragOverlay>
        {activeTodo ? (
          <div className="opacity-90">
            <SortableTaskItem
              todo={activeTodo}
              isDraggable={false}
              onToggle={() => {}}
              onToggleSubtask={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              isFadingOut={false}
              isToggling={false}
              isDeletingDisabled={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

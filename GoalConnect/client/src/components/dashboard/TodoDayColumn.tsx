import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import type { Todo, Project } from '@shared/schema';

interface TodoWithMetadata extends Todo {
  project?: Project | null;
  labels?: Array<{ id: number; name: string; color: string }>;
}

interface TodoDayColumnProps {
  dayName: string;
  date: string;
  todos: TodoWithMetadata[];
  isToday: boolean;
  isMobile?: boolean;
  onToggleTodo: (todoId: number) => void;
  onAddTodo?: (title: string, date: string) => void;
}

export function TodoDayColumn({
  dayName,
  date,
  todos,
  isToday,
  isMobile = false,
  onToggleTodo,
  onAddTodo,
}: TodoDayColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const dayOfMonth = new Date(date).getDate();

  const handleSubmit = () => {
    if (newTodoText.trim() && onAddTodo) {
      onAddTodo(newTodoText.trim(), date);
      setNewTodoText('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setNewTodoText('');
      setIsAdding(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl p-3",
        isMobile ? "min-w-[140px] flex-shrink-0" : "min-h-[120px]",
        isToday
          ? "bg-primary/10 border-2 border-primary"
          : "bg-muted/30 border border-border"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={cn(
          "text-xs font-semibold",
          isToday ? "text-primary" : "text-muted-foreground"
        )}>
          {dayName} {isMobile && dayOfMonth}
        </p>
        {onAddTodo && (
          <button
            onClick={() => setIsAdding(true)}
            className={cn(
              "w-5 h-5 rounded flex items-center justify-center text-xs",
              "bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
            )}
          >
            +
          </button>
        )}
      </div>

      {/* Quick add input */}
      {isAdding && (
        <div className="mb-2">
          <input
            type="text"
            autoFocus
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!newTodoText.trim()) {
                setIsAdding(false);
              }
            }}
            placeholder="New task..."
            className={cn(
              "w-full px-2 py-1.5 rounded-lg text-xs",
              "bg-card border border-primary",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-1 focus:ring-primary"
            )}
          />
        </div>
      )}

      {todos.map(todo => (
        <motion.div
          key={todo.id}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "flex items-start gap-2 p-2 mb-2 rounded-lg transition-all",
            todo.completed ? "bg-success/10 opacity-60" : "bg-card",
            todo.projectId ? "border border-dashed border-secondary/50" : "border border-border"
          )}
        >
          <button
            onClick={() => !todo.completed && onToggleTodo(todo.id)}
            className={cn(
              "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] mt-0.5 cursor-pointer",
              todo.completed
                ? "bg-success text-white"
                : "border-2 border-muted-foreground hover:border-primary"
            )}
          >
            {todo.completed && '✓'}
          </button>
          <Link href="/todos" className="flex-1">
            <span className={cn(
              "text-xs leading-tight hover:text-primary transition-colors cursor-pointer",
              todo.completed && "line-through text-muted-foreground"
            )}>
              {todo.title}
            </span>
          </Link>
        </motion.div>
      ))}

      {todos.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Rest day 🧘
        </p>
      )}
    </div>
  );
}

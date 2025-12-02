import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
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
}

export function TodoDayColumn({
  dayName,
  date,
  todos,
  isToday,
  isMobile = false,
  onToggleTodo,
}: TodoDayColumnProps) {
  const dayOfMonth = new Date(date).getDate();

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
      <p className={cn(
        "text-xs font-semibold text-center mb-3",
        isToday ? "text-primary" : "text-muted-foreground"
      )}>
        {dayName} {isMobile && dayOfMonth}
      </p>

      {todos.map(todo => (
        <motion.div
          key={todo.id}
          whileTap={{ scale: 0.98 }}
          onClick={() => !todo.completed && onToggleTodo(todo.id)}
          className={cn(
            "flex items-start gap-2 p-2 mb-2 rounded-lg cursor-pointer transition-all",
            todo.completed ? "bg-success/10 opacity-60" : "bg-card",
            todo.projectId ? "border border-dashed border-secondary/50" : "border border-border"
          )}
        >
          <div className={cn(
            "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[10px] mt-0.5",
            todo.completed
              ? "bg-success text-white"
              : "border-2 border-muted-foreground"
          )}>
            {todo.completed && '✓'}
          </div>
          <span className={cn(
            "text-xs leading-tight",
            todo.completed && "line-through text-muted-foreground"
          )}>
            {todo.title}
          </span>
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

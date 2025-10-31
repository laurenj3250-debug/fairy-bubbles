import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";

interface HabitToggleRowProps {
  title: string;
  icon: string;
  color: string;
  completed: boolean;
  onToggle: () => void;
  onLongPress?: () => void;
  className?: string;
}

export function HabitToggleRow({
  title,
  icon,
  color,
  completed,
  onToggle,
  onLongPress,
  className,
}: HabitToggleRowProps) {
  const IconComponent = (Icons as any)[icon] || Icons.Sparkles;
  
  let pressTimer: NodeJS.Timeout | null = null;

  const handlePressStart = () => {
    pressTimer = setTimeout(() => {
      onLongPress?.();
    }, 500);
  };

  const handlePressEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  return (
    <button
      onClick={onToggle}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      className={cn(
        "flex items-center gap-3 w-full min-h-14 px-4 py-3 rounded-2xl transition-all border-2",
        completed 
          ? "bg-muted border-muted" 
          : "bg-card border-transparent hover-elevate active-elevate-2",
        className
      )}
      data-testid={`habit-toggle-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {/* Circular Checkbox - Left Side */}
      <div
        className={cn(
          "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-all flex-shrink-0",
          completed
            ? "bg-primary border-primary"
            : "border-muted-foreground/30 hover:border-primary/50"
        )}
        data-testid={`habit-toggle-check-${completed ? "completed" : "incomplete"}`}
      >
        {completed && <Check className="w-4 h-4 text-primary-foreground stroke-[3]" />}
      </div>

      {/* Habit Icon */}
      <div
        className="flex items-center justify-center w-6 h-6 flex-shrink-0"
        style={{ color: color }}
      >
        <IconComponent className="w-5 h-5" />
      </div>
      
      {/* Habit Title */}
      <span className={cn(
        "flex-1 text-left text-base font-medium transition-colors",
        completed && "text-muted-foreground line-through decoration-2"
      )}>
        {title}
      </span>
    </button>
  );
}

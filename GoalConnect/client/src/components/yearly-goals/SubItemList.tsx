import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalSubItem } from "@shared/schema";
import { CategoryStyle } from "./categoryStyles";

interface SubItemListProps {
  subItems: YearlyGoalSubItem[];
  onToggle: (subItemId: string) => void;
  categoryStyle?: CategoryStyle;
  disabled?: boolean;
}

export function SubItemList({ subItems, onToggle, categoryStyle, disabled }: SubItemListProps) {
  return (
    <div className="space-y-1">
      {subItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onToggle(item.id)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2.5 w-full text-left px-2 py-1.5 rounded-lg transition-all",
            "hover:bg-white/[0.03]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ring-1",
              item.completed
                ? "bg-emerald-500/20 text-emerald-400 ring-emerald-500/30"
                : "bg-white/5 text-[var(--text-muted)] ring-white/10"
            )}
          >
            {item.completed ? (
              <Check className="w-3 h-3" />
            ) : (
              <Circle className="w-2.5 h-2.5" />
            )}
          </div>
          <span
            className={cn(
              "text-sm font-body transition-colors",
              item.completed ? "text-[var(--text-muted)] line-through" : "text-[var(--text-secondary)]"
            )}
          >
            {item.title}
          </span>
        </button>
      ))}
    </div>
  );
}

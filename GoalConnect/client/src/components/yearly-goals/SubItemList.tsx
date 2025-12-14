import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { YearlyGoalSubItem } from "@shared/schema";

interface SubItemListProps {
  subItems: YearlyGoalSubItem[];
  onToggle: (subItemId: string) => void;
  disabled?: boolean;
}

export function SubItemList({ subItems, onToggle, disabled }: SubItemListProps) {
  return (
    <div className="ml-4 sm:ml-8 mt-2 space-y-1.5">
      {subItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onToggle(item.id)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md transition-colors",
            "hover:bg-stone-800/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors",
              item.completed
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-stone-700 text-stone-500"
            )}
          >
            {item.completed ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
          </div>
          <span
            className={cn(
              "text-sm transition-colors",
              item.completed ? "text-stone-500 line-through" : "text-stone-300"
            )}
          >
            {item.title}
          </span>
        </button>
      ))}
    </div>
  );
}

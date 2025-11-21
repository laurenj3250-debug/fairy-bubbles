import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityPickerProps {
  priority: number; // 1-4 (1=P1/urgent, 4=P4/low)
  onChange: (priority: number) => void;
  className?: string;
}

const PRIORITIES = [
  {
    value: 1,
    label: "P1",
    name: "Urgent",
    color: "#ef4444",
    description: "Critical, must do today",
  },
  {
    value: 2,
    label: "P2",
    name: "High",
    color: "#f97316",
    description: "Important, do soon",
  },
  {
    value: 3,
    label: "P3",
    name: "Medium",
    color: "#3b82f6",
    description: "Normal priority",
  },
  {
    value: 4,
    label: "P4",
    name: "Low",
    color: "#6b7280",
    description: "Nice to have",
  },
];

export function PriorityPicker({ priority, onChange, className }: PriorityPickerProps) {
  const currentPriority = PRIORITIES.find((p) => p.value === priority) || PRIORITIES[3];

  return (
    <div className={cn("", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {PRIORITIES.map((p) => {
          const isSelected = p.value === priority;
          return (
            <button
              key={p.value}
              onClick={() => onChange(p.value)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:scale-105",
                isSelected && "ring-2 shadow-lg"
              )}
              style={{
                background: isSelected ? `${p.color}20` : `${p.color}10`,
                borderColor: `${p.color}${isSelected ? "60" : "30"}`,
                color: p.color,
              }}
              title={p.description}
            >
              <Flag
                className="w-4 h-4"
                fill={isSelected ? p.color : "transparent"}
              />
              <span className="font-semibold text-sm">{p.label}</span>
              <span className="text-xs opacity-80">{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-2 text-xs text-foreground/50">
        Tip: Press 1-4 to quickly set priority
      </div>
    </div>
  );
}

// Helper function to get priority info
export function getPriorityInfo(priority: number) {
  return PRIORITIES.find((p) => p.value === priority) || PRIORITIES[3];
}

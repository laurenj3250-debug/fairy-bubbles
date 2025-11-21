import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Label } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tag, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LabelPickerProps {
  taskId?: number;
  selectedLabelIds: number[];
  onLabelsChange: (labelIds: number[]) => void;
  className?: string;
}

export function LabelPicker({ taskId, selectedLabelIds, onLabelsChange, className }: LabelPickerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#gray");

  const { data: labels = [] } = useQuery<Label[]>({
    queryKey: ["/api/labels"],
  });

  const createLabelMutation = useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      return await apiRequest("/api/labels", "POST", data);
    },
    onSuccess: (newLabel: Label) => {
      queryClient.invalidateQueries({ queryKey: ["/api/labels"] });
      onLabelsChange([...selectedLabelIds, newLabel.id]);
      setIsCreating(false);
      setNewLabelName("");
    },
  });

  const toggleLabel = (labelId: number) => {
    if (selectedLabelIds.includes(labelId)) {
      onLabelsChange(selectedLabelIds.filter((id) => id !== labelId));
    } else {
      onLabelsChange([...selectedLabelIds, labelId]);
    }
  };

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return;
    createLabelMutation.mutate({
      name: newLabelName.trim(),
      color: selectedColor,
    });
  };

  const labelColors = [
    { name: "Gray", value: "#6b7280" },
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Yellow", value: "#eab308" },
    { name: "Green", value: "#22c55e" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#a855f7" },
    { name: "Pink", value: "#ec4899" },
  ];

  const selectedLabels = labels.filter((label) => selectedLabelIds.includes(label.id));

  return (
    <div className={cn("relative", className)}>
      {/* Selected Labels Display */}
      {selectedLabels.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {selectedLabels.map((label) => (
            <button
              key={label.id}
              onClick={() => toggleLabel(label.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105"
              style={{
                background: `${label.color}20`,
                color: label.color,
                border: `1px solid ${label.color}40`,
              }}
            >
              <Tag className="w-3 h-3" />
              {label.name}
              <X className="w-3 h-3 ml-0.5" />
            </button>
          ))}
        </div>
      )}

      {/* Label List */}
      <div className="flex flex-wrap gap-2">
        {labels.map((label) => {
          const isSelected = selectedLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              onClick={() => toggleLabel(label.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:scale-105",
                isSelected && "ring-2"
              )}
              style={{
                background: isSelected ? `${label.color}30` : `${label.color}15`,
                color: label.color,
                border: `1px solid ${label.color}${isSelected ? "60" : "30"}`,
              }}
            >
              <Tag className="w-3 h-3" />
              {label.name}
            </button>
          );
        })}

        {/* Create New Label */}
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-dashed border-foreground/20 hover:border-foreground/40 transition-all text-foreground/60 hover:text-foreground text-xs"
          >
            <Plus className="w-3 h-3" />
            New Label
          </button>
        )}
      </div>

      {/* Create Label Form */}
      {isCreating && (
        <div className="mt-4 p-4 rounded-xl bg-background/60 border border-foreground/10 shadow-lg">
          <h3 className="text-sm font-semibold text-foreground mb-3">Create New Label</h3>

          <input
            type="text"
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateLabel();
              if (e.key === "Escape") setIsCreating(false);
            }}
            placeholder="Label name..."
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-foreground/20 bg-background/80 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary mb-3"
          />

          <div className="mb-3">
            <label className="text-xs text-foreground/60 mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {labelColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all hover:scale-110",
                    selectedColor === color.value && "ring-2 ring-offset-2 ring-foreground/40"
                  )}
                  style={{ background: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateLabel}
              disabled={!newLabelName.trim() || createLabelMutation.isPending}
              size="sm"
              className="flex-1"
            >
              Create
            </Button>
            <Button onClick={() => setIsCreating(false)} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

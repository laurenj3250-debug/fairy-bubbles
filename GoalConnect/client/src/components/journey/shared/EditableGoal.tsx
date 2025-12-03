import { useState } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";

interface EditableGoalProps {
  value: number;
  unit: string;
  goalKey: string;
  onUpdate: (goalKey: string, value: number) => Promise<void>;
  isUpdating: boolean;
}

export function EditableGoal({ value, unit, goalKey, onUpdate, isUpdating }: EditableGoalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());

  const handleSave = async () => {
    const newValue = parseInt(editValue);
    if (!isNaN(newValue) && newValue > 0) {
      await onUpdate(goalKey, newValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-20 px-2 py-0.5 text-sm bg-background/50 border border-border rounded"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />
        <span className="text-xs text-muted-foreground">{unit}</span>
        {isUpdating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <button onClick={handleSave} className="p-0.5 hover:bg-emerald-500/20 rounded transition-colors">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button onClick={handleCancel} className="p-0.5 hover:bg-red-500/20 rounded transition-colors">
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-1 hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors"
    >
      <span>{value.toLocaleString()} {unit}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Brain, BookOpen, FileText, Video, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TASK_CONFIG, type StudyTaskType } from "@shared/types/study";

interface ScheduleSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: Array<{ dayOfWeek: number; tasks: string[] }> | undefined;
  onSave: (config: Array<{ dayOfWeek: number; tasks: string[] }>) => void;
  onReset: () => void;
  isSaving?: boolean;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TASK_TYPES: StudyTaskType[] = [
  "remnote_review",
  "email_cases",
  "chapter",
  "mri_lecture",
  "papers",
];

const TaskIcon: Record<StudyTaskType, typeof Brain> = {
  remnote_review: Brain,
  email_cases: FileText,
  chapter: BookOpen,
  mri_lecture: Video,
  papers: FileText,
};

export function ScheduleSettingsModal({
  open,
  onOpenChange,
  config,
  onSave,
  onReset,
  isSaving,
}: ScheduleSettingsModalProps) {
  // Local state for editing
  const [localConfig, setLocalConfig] = useState<Record<number, Set<string>>>({});

  // Initialize local config when modal opens or config changes
  useEffect(() => {
    if (config) {
      const newLocalConfig: Record<number, Set<string>> = {};
      for (let i = 0; i <= 6; i++) {
        newLocalConfig[i] = new Set();
      }
      config.forEach((day) => {
        newLocalConfig[day.dayOfWeek] = new Set(day.tasks);
      });
      setLocalConfig(newLocalConfig);
    }
  }, [config, open]);

  const toggleTask = (day: number, taskType: string) => {
    setLocalConfig((prev) => {
      const newConfig = { ...prev };
      const dayTasks = new Set(newConfig[day] || []);
      if (dayTasks.has(taskType)) {
        dayTasks.delete(taskType);
      } else {
        dayTasks.add(taskType);
      }
      newConfig[day] = dayTasks;
      return newConfig;
    });
  };

  const handleSave = () => {
    const configArray = Object.entries(localConfig).map(([day, tasks]) => ({
      dayOfWeek: parseInt(day),
      tasks: Array.from(tasks),
    }));
    onSave(configArray);
    onOpenChange(false);
  };

  const handleReset = () => {
    onReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[rgba(13,24,21,0.95)] border border-white/10 backdrop-blur-xl max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-forest-cream font-heading text-xl">
            Configure Weekly Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Select which tasks should appear on each day of the week.
          </p>

          {/* Task Grid */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-2 px-2 text-[var(--text-muted)] text-xs font-normal w-32">
                    Task
                  </th>
                  {DAY_LABELS.map((day, i) => (
                    <th
                      key={i}
                      className="text-center py-2 px-2 text-xs font-normal text-[var(--text-muted)]"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TASK_TYPES.map((taskType) => {
                  const taskConfig = TASK_CONFIG[taskType];
                  const IconComponent = TaskIcon[taskType];
                  return (
                    <tr key={taskType} className="border-t border-white/5">
                      <td className="py-3 px-2">
                        <div
                          className={cn(
                            "flex items-center gap-2",
                            taskConfig.color
                          )}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span className="text-sm">{taskConfig.label}</span>
                        </div>
                      </td>
                      {DAY_LABELS.map((_, dayIndex) => {
                        const isActive = localConfig[dayIndex]?.has(taskType);
                        return (
                          <td key={dayIndex} className="text-center py-3 px-2">
                            <button
                              onClick={() => toggleTask(dayIndex, taskType)}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto",
                                isActive
                                  ? "bg-forest-coral/20 text-forest-coral"
                                  : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
                              )}
                            >
                              {isActive && <Check className="w-4 h-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-muted)] hover:text-forest-cream transition-colors rounded-lg hover:bg-white/5"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-forest-cream transition-colors rounded-lg hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                style={{
                  background: "rgba(212, 165, 154, 0.15)",
                  border: "1px solid rgba(212, 165, 154, 0.3)",
                  color: "#d4a59a",
                }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

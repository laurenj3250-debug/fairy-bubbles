import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Video,
  Check,
  Brain,
  Settings2,
  RotateCcw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay } from "date-fns";
import {
  TASK_CONFIG,
  DEFAULT_WEEKLY_SCHEDULE,
  type StudyTaskType,
  type StudyBook,
  type StudyPaper,
  type StudyMriLecture,
} from "@shared/types/study";
import { TaskLinkingPopover } from "./TaskLinkingPopover";

interface ScheduleConfig {
  dayOfWeek: number;
  tasks: string[];
}

interface WeeklyScheduleGridProps {
  currentWeekStart: Date;
  weekOffset: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  isTaskCompleted: (date: string, taskType: StudyTaskType) => boolean;
  onToggleTask: (params: {
    date: string;
    taskType: StudyTaskType;
    linkedItemId?: number;
    linkedItemType?: string;
  }) => void;
  scheduleConfig?: ScheduleConfig[];
  onOpenSettings?: () => void;
  books?: StudyBook[];
  papers?: StudyPaper[];
  lectures?: StudyMriLecture[];
  onResetWeek?: (weekStart: string, weekEnd: string) => void;
}

// Icon mapping for task types
const TaskIcon: Record<StudyTaskType, typeof Brain> = {
  remnote_review: Brain,
  email_cases: FileText,
  chapter: BookOpen,
  mri_lecture: Video,
  papers: FileText,
};

// Color mapping for completed states
const CompletedColors: Record<StudyTaskType, string> = {
  remnote_review: "bg-purple-500/20 text-purple-400",
  email_cases: "bg-blue-500/20 text-blue-400",
  chapter: "bg-emerald-500/20 text-emerald-400",
  mri_lecture: "bg-pink-500/20 text-pink-400",
  papers: "bg-amber-500/20 text-amber-400",
};

export function WeeklyScheduleGrid({
  currentWeekStart,
  weekOffset,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  isTaskCompleted,
  onToggleTask,
  scheduleConfig,
  onOpenSettings,
  books = [],
  papers = [],
  lectures = [],
  onResetWeek,
}: WeeklyScheduleGridProps) {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  // Generate week days using config if available, otherwise fall back to defaults
  const weekDays = DEFAULT_WEEKLY_SCHEDULE.map((day) => {
    const date = addDays(currentWeekStart, day.day);
    // Use config if available, otherwise use default tasks
    const configForDay = scheduleConfig?.find((c) => c.dayOfWeek === day.day);
    const tasks = configForDay ? configForDay.tasks : day.tasks;
    return {
      ...day,
      tasks,
      date,
      dateStr: format(date, "yyyy-MM-dd"),
      isToday: isSameDay(date, new Date()),
    };
  });

  // Render a task row
  const renderTaskRow = (taskType: StudyTaskType) => {
    const config = TASK_CONFIG[taskType];
    const IconComponent = TaskIcon[taskType];

    return (
      <tr key={taskType} className="border-t border-white/5">
        <td className="py-3 px-2">
          <div className={cn("flex items-center gap-2", config.color)}>
            <IconComponent className="w-4 h-4" />
            <span className="text-sm">{config.label}</span>
          </div>
        </td>
        {weekDays.map((day) => {
          const showTask = day.tasks.includes(taskType);
          const completed = isTaskCompleted(day.dateStr, taskType);

          const handleComplete = (linkedItemId?: number, linkedItemType?: string) => {
            onToggleTask({ date: day.dateStr, taskType, linkedItemId, linkedItemType });
          };

          const TaskButton = (
            <button
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all mx-auto cursor-pointer",
                completed
                  ? CompletedColors[taskType]
                  : "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
              )}
            >
              {completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-current opacity-30" />
              )}
            </button>
          );

          return (
            <td key={day.day} className="text-center py-3 px-2">
              {showTask ? (
                <TaskLinkingPopover
                  taskType={taskType}
                  isCompleted={completed}
                  books={books}
                  papers={papers}
                  lectures={lectures}
                  onComplete={handleComplete}
                >
                  {TaskButton}
                </TaskLinkingPopover>
              ) : (
                <div className="w-8 h-8 mx-auto" />
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  // All task types in display order
  const taskTypes: StudyTaskType[] = [
    "remnote_review",
    "email_cases",
    "chapter",
    "mri_lecture",
    "papers",
  ];

  return (
    <div className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-heading text-lg text-forest-cream">This Week</span>
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 text-[var(--text-muted)] hover:text-forest-cream transition-colors rounded-lg hover:bg-white/5"
              title="Configure schedule"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          )}
          {onResetWeek && (
            <button
              onClick={() => setResetDialogOpen(true)}
              className="p-1.5 text-[var(--text-muted)] hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              title="Reset week"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPreviousWeek}
            className="p-2 text-[var(--text-muted)] hover:text-forest-cream transition-colors rounded-lg hover:bg-white/5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onCurrentWeek}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              weekOffset === 0
                ? "text-forest-coral bg-forest-coral/10"
                : "text-[var(--text-muted)] hover:text-forest-cream hover:bg-white/5"
            )}
          >
            {format(currentWeekStart, "MMM d")} –{" "}
            {format(addDays(currentWeekStart, 6), "MMM d")}
          </button>
          <button
            onClick={onNextWeek}
            className="p-2 text-[var(--text-muted)] hover:text-forest-cream transition-colors rounded-lg hover:bg-white/5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 text-[var(--text-muted)] text-xs font-normal w-32">
                Task
              </th>
              {weekDays.map((day) => (
                <th
                  key={day.day}
                  className={cn(
                    "text-center py-2 px-2 text-xs font-normal w-16",
                    day.isToday ? "text-forest-coral" : "text-[var(--text-muted)]"
                  )}
                >
                  <div>{day.label}</div>
                  <div
                    className={cn(
                      "text-[10px]",
                      day.isToday ? "text-forest-coral/80" : "text-[var(--text-muted)]/60"
                    )}
                  >
                    {format(day.date, "M/d")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{taskTypes.map(renderTaskRow)}</tbody>
        </table>
      </div>

      {/* Reset Week Confirmation Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="bg-[rgba(13,24,21,0.98)] border border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-forest-cream font-heading">
              Reset This Week?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--text-muted)]">
              This will clear all completed tasks for the week of{" "}
              {format(currentWeekStart, "MMM d")} –{" "}
              {format(addDays(currentWeekStart, 6), "MMM d")}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-forest-cream hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
              onClick={() => {
                const weekEndDate = addDays(currentWeekStart, 6);
                onResetWeek?.(
                  format(currentWeekStart, "yyyy-MM-dd"),
                  format(weekEndDate, "yyyy-MM-dd")
                );
              }}
            >
              Reset Week
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

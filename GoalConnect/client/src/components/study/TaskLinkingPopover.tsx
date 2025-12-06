import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, BookOpen, FileText, Video, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StudyTaskType, StudyBook, StudyPaper, StudyMriLecture } from "@shared/types/study";

interface TaskLinkingPopoverProps {
  taskType: StudyTaskType;
  isCompleted: boolean;
  books: StudyBook[];
  papers: StudyPaper[];
  lectures: StudyMriLecture[];
  onComplete: (linkedItemId?: number, linkedItemType?: string) => void;
  children: React.ReactNode;
}

// Task types that support linking
const LINKABLE_TASK_TYPES: StudyTaskType[] = ["chapter", "papers", "mri_lecture"];

export function TaskLinkingPopover({
  taskType,
  isCompleted,
  books,
  papers,
  lectures,
  onComplete,
  children,
}: TaskLinkingPopoverProps) {
  const [open, setOpen] = useState(false);

  // If task is already completed or doesn't support linking, just toggle
  if (isCompleted || !LINKABLE_TASK_TYPES.includes(taskType)) {
    return (
      <div onClick={() => onComplete()}>
        {children}
      </div>
    );
  }

  // Get items based on task type
  const getItems = () => {
    switch (taskType) {
      case "chapter":
        // Flatten chapters from all books
        return books.flatMap((book) =>
          book.chapters.map((chapter) => ({
            id: chapter.id,
            type: "chapter" as const,
            label: `${book.abbreviation || book.title} - ${chapter.title}`,
            completed: chapter.imagesCompleted && chapter.cardsCompleted,
          }))
        );
      case "papers":
        return papers.map((paper) => ({
          id: paper.id,
          type: "paper" as const,
          label: paper.title,
          completed: paper.completed,
        }));
      case "mri_lecture":
        return lectures.map((lecture) => ({
          id: lecture.id,
          type: "mri_lecture" as const,
          label: lecture.title,
          completed: lecture.completed,
        }));
      default:
        return [];
    }
  };

  const items = getItems();
  const Icon = taskType === "chapter" ? BookOpen : taskType === "papers" ? FileText : Video;

  const handleSelect = (itemId: number, itemType: string) => {
    onComplete(itemId, itemType);
    setOpen(false);
  };

  const handleSkip = () => {
    onComplete(); // Complete without linking
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 bg-[rgba(13,24,21,0.98)] border border-white/10 backdrop-blur-xl"
        align="start"
        sideOffset={5}
      >
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-forest-cream">
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">Link to item</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-[var(--text-muted)] hover:text-forest-cream rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Select which item you worked on
          </p>
        </div>

        <div className="max-h-48 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-4 text-center text-[var(--text-muted)] text-sm">
              No items yet. Add some first!
            </div>
          ) : (
            <div className="py-1">
              {items.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelect(item.id, item.type)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors",
                    item.completed
                      ? "text-[var(--text-muted)]"
                      : "text-forest-cream hover:bg-white/5"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0",
                      item.completed
                        ? "border-emerald-500/50 bg-emerald-500/20"
                        : "border-white/20"
                    )}
                  >
                    {item.completed && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-white/5">
          <button
            onClick={handleSkip}
            className="w-full px-3 py-2 text-xs text-[var(--text-muted)] hover:text-forest-cream hover:bg-white/5 rounded transition-colors text-center"
          >
            Complete without linking
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

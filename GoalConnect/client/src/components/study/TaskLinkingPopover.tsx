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

export function TaskLinkingPopover({
  onComplete,
  children,
}: TaskLinkingPopoverProps) {
  // Simple toggle - no popup required
  // Linking happens automatically when completing items from the lists below
  return (
    <div onClick={() => onComplete()}>
      {children}
    </div>
  );
}

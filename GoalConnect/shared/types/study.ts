// Study Planner Type Definitions
// Shared between client and server

export interface StudyBook {
  id: number;
  userId: number;
  title: string;
  abbreviation: string | null;
  position: number;
  createdAt: string;
  chapters: StudyChapter[];
}

export interface StudyChapter {
  id: number;
  userId: number;
  bookId: number;
  title: string;
  imagesCompleted: boolean;
  imagesCompletedAt: string | null;
  cardsCompleted: boolean;
  cardsCompletedAt: string | null;
  position: number;
  createdAt: string;
}

export interface StudyPaper {
  id: number;
  userId: number;
  title: string;
  url: string | null;
  completed: boolean;
  completedAt: string | null;
  position: number;
  createdAt: string;
}

export interface StudyMriLecture {
  id: number;
  userId: number;
  title: string;
  url: string | null;
  completed: boolean;
  completedAt: string | null;
  position: number;
  createdAt: string;
}

export interface StudyScheduleLog {
  id: number;
  userId: number;
  date: string;
  taskType: StudyTaskType;
  completed: boolean;
  linkedItemId: number | null;
  linkedItemType: string | null;
  notes: string | null;
  createdAt: string;
}

export interface WeekData {
  weekStart: string;
  weekEnd: string;
  logs: StudyScheduleLog[];
}

export interface StudyStats {
  chapters: {
    total: number;
    imagesCompleted: number;
    cardsCompleted: number;
    fullyCompleted: number;
  };
  papers: {
    total: number;
    completed: number;
  };
  mriLectures: {
    total: number;
    completed: number;
  };
  remnoteReviews: {
    totalDays: number;
  };
}

// Enhanced stats for Phase 5
export interface EnhancedStudyStats extends StudyStats {
  streaks: {
    remnoteCurrentStreak: number;
    remnoteLongestStreak: number;
    lastMissedDate: string | null;
  };
  weeklyTrends: Array<{
    weekStart: string;
    tasksCompleted: number;
    tasksPossible: number;
  }>;
  completionByType: Record<string, { completed: number; total: number }>;
}

// Task types
export type StudyTaskType =
  | "remnote_review"
  | "email_cases"
  | "chapter"
  | "mri_lecture"
  | "papers";

// Task configuration for weekly schedule
export interface StudyTaskConfig {
  taskType: StudyTaskType;
  label: string;
  color: string;
  icon: string; // Lucide icon name
}

// Weekly schedule day configuration
export interface WeeklyScheduleDay {
  day: number; // 0=Sun, 6=Sat
  label: string;
  tasks: StudyTaskType[];
}

// Default task configuration
export const TASK_CONFIG: Record<StudyTaskType, StudyTaskConfig> = {
  remnote_review: { taskType: "remnote_review", label: "RemNote Review", color: "text-purple-400", icon: "Brain" },
  email_cases: { taskType: "email_cases", label: "Email Cases", color: "text-blue-400", icon: "FileText" },
  chapter: { taskType: "chapter", label: "Chapter Work", color: "text-emerald-400", icon: "BookOpen" },
  mri_lecture: { taskType: "mri_lecture", label: "MRI Lecture", color: "text-pink-400", icon: "Video" },
  papers: { taskType: "papers", label: "Papers", color: "text-amber-400", icon: "FileText" },
};

// Default weekly schedule (can be overridden by user config)
export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleDay[] = [
  { day: 0, label: "Sun", tasks: ["remnote_review", "email_cases"] },
  { day: 1, label: "Mon", tasks: ["remnote_review"] },
  { day: 2, label: "Tue", tasks: ["remnote_review"] },
  { day: 3, label: "Wed", tasks: ["remnote_review"] },
  { day: 4, label: "Thu", tasks: ["remnote_review"] },
  { day: 5, label: "Fri", tasks: ["remnote_review", "chapter"] },
  { day: 6, label: "Sat", tasks: ["remnote_review", "mri_lecture", "papers"] },
];

import { useState } from "react";
import { useStudyPlanner } from "@/hooks/useStudyPlanner";
import { ForestBackground } from "@/components/ForestBackground";
import { Link } from "wouter";
import {
  StudyStatsBar,
  WeeklyScheduleGrid,
  BooksList,
  PapersList,
  MriLecturesList,
  ScheduleSettingsModal,
  StudyStreakCard,
  StudyTrendsChart,
} from "@/components/study";

export default function StudyPlanner() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Use the study planner hook
  const {
    currentWeekStart,
    books,
    papers,
    lectures,
    stats,
    scheduleConfig,
    toggleSchedule,
    createBook,
    deleteBook,
    createChapter,
    deleteChapter,
    toggleImages,
    toggleCards,
    createPaper,
    togglePaper,
    deletePaper,
    createLecture,
    toggleLecture,
    deleteLecture,
    saveScheduleConfig,
    resetScheduleConfig,
    resetWeek,
    isTaskCompleted,
    isPending,
  } = useStudyPlanner({ weekOffset });

  // Week navigation
  const goToPreviousWeek = () => setWeekOffset((prev) => prev - 1);
  const goToNextWeek = () => setWeekOffset((prev) => prev + 1);
  const goToCurrentWeek = () => setWeekOffset(0);

  return (
    <div className="min-h-screen relative">
      {/* Forest background layers */}
      <ForestBackground />

      {/* Sidebar Navigation */}
      <nav className="fixed left-0 top-0 h-full w-[160px] z-20 flex flex-col justify-center pl-6">
        <div className="space-y-4">
          <Link href="/">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              dashboard
            </span>
          </Link>
          <Link href="/habits">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              habits
            </span>
          </Link>
          <Link href="/goals">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              goals
            </span>
          </Link>
          <Link href="/todos">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              todos
            </span>
          </Link>
          <Link href="/study">
            <span className="block text-peach-400 text-sm font-heading cursor-pointer">
              study
            </span>
          </Link>
          <Link href="/journey">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              journey
            </span>
          </Link>
          <Link href="/adventures">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              adventures
            </span>
          </Link>
          <Link href="/settings">
            <span className="block text-[var(--text-muted)] hover:text-peach-400 transition-colors text-sm font-heading cursor-pointer">
              settings
            </span>
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 px-5 md:px-8 pb-24 pt-8">
        <div className="max-w-[900px] ml-[188px] space-y-5">
          {/* Header */}
          <header className="flex items-center justify-between mb-6">
            <div>
              <h1 className="logo-text tracking-wider text-2xl">STUDY</h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Board Exam Study Tracking
              </p>
            </div>
          </header>

          {/* Progress Stats */}
          <StudyStatsBar stats={stats} />

          {/* Streaks & Trends */}
          <div className="grid md:grid-cols-2 gap-4">
            <StudyStreakCard
              currentStreak={stats?.streaks?.remnoteCurrentStreak ?? 0}
              longestStreak={stats?.streaks?.remnoteLongestStreak ?? 0}
              missedYesterday={stats?.streaks?.lastMissedDate !== null}
            />
            <StudyTrendsChart weeklyTrends={stats?.weeklyTrends ?? []} />
          </div>

          {/* Weekly Schedule */}
          <WeeklyScheduleGrid
            currentWeekStart={currentWeekStart}
            weekOffset={weekOffset}
            onPreviousWeek={goToPreviousWeek}
            onNextWeek={goToNextWeek}
            onCurrentWeek={goToCurrentWeek}
            isTaskCompleted={isTaskCompleted}
            onToggleTask={toggleSchedule}
            scheduleConfig={scheduleConfig?.config}
            onOpenSettings={() => setSettingsOpen(true)}
            books={books}
            papers={papers}
            lectures={lectures}
            onResetWeek={(weekStart, weekEnd) => resetWeek({ weekStart, weekEnd })}
          />

          {/* Tracking Lists */}
          <div className="grid md:grid-cols-3 gap-4">
            <BooksList
              books={books}
              onCreateBook={createBook}
              onDeleteBook={deleteBook}
              onCreateChapter={createChapter}
              onDeleteChapter={deleteChapter}
              onToggleImages={toggleImages}
              onToggleCards={toggleCards}
            />
            <PapersList
              papers={papers}
              onCreatePaper={createPaper}
              onTogglePaper={togglePaper}
              onDeletePaper={deletePaper}
            />
            <MriLecturesList
              lectures={lectures}
              onCreateLecture={createLecture}
              onToggleLecture={toggleLecture}
              onDeleteLecture={deleteLecture}
            />
          </div>
        </div>
      </div>

      {/* Schedule Settings Modal */}
      <ScheduleSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={scheduleConfig?.config}
        onSave={saveScheduleConfig}
        onReset={resetScheduleConfig}
        isSaving={isPending.saveScheduleConfig}
      />
    </div>
  );
}

import { Brain, BookOpen, FileText, Video } from "lucide-react";
import type { StudyStats } from "@shared/types/study";

interface StudyStatsBarProps {
  stats: StudyStats | undefined;
}

export function StudyStatsBar({ stats }: StudyStatsBarProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* RemNote */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-purple-400 mb-2">
          <Brain className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">RemNote</span>
        </div>
        <div className="text-2xl font-semibold text-forest-cream">
          {stats.remnoteReviews.totalDays}
        </div>
        <div className="text-xs text-[var(--text-muted)]">days reviewed</div>
      </div>

      {/* Chapters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-emerald-400 mb-2">
          <BookOpen className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">Chapters</span>
        </div>
        <div className="text-2xl font-semibold text-forest-cream">
          {stats.chapters.fullyCompleted}/{stats.chapters.total}
        </div>
        <div className="text-xs text-[var(--text-muted)]">completed</div>
      </div>

      {/* Papers */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <FileText className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">Papers</span>
        </div>
        <div className="text-2xl font-semibold text-forest-cream">
          {stats.papers.completed}/{stats.papers.total}
        </div>
        <div className="text-xs text-[var(--text-muted)]">read</div>
      </div>

      {/* MRI Lectures */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 text-pink-400 mb-2">
          <Video className="w-4 h-4" />
          <span className="text-xs uppercase tracking-wide">MRI Lectures</span>
        </div>
        <div className="text-2xl font-semibold text-forest-cream">
          {stats.mriLectures.completed}/{stats.mriLectures.total}
        </div>
        <div className="text-xs text-[var(--text-muted)]">watched</div>
      </div>
    </div>
  );
}

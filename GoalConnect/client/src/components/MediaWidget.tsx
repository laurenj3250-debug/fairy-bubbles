/**
 * MediaWidget
 * Compact widget showing currently reading/watching items
 * Links to full Media Library page
 */

import { Link } from "wouter";
import { BookOpen, Tv, Film, AudioLines, Podcast, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaLibrary, type MediaType, type MediaItem } from "@/hooks/useMediaLibrary";

// Icons for each media type
const MEDIA_ICONS: Record<MediaType, LucideIcon> = {
  book: BookOpen,
  tv_show: Tv,
  movie: Film,
  audiobook: AudioLines,
  podcast: Podcast,
};

// Type labels for display
const TYPE_LABELS: Record<MediaType, string> = {
  book: "Book",
  tv_show: "Show",
  movie: "Movie",
  audiobook: "Audio",
  podcast: "Pod",
};

// Cute genre colors for book covers
const GENRE_COLORS: Record<string, string> = {
  fiction: "from-blue-400/60 to-indigo-500/60",
  nonfiction: "from-emerald-400/60 to-teal-500/60",
  biography: "from-amber-400/60 to-orange-500/60",
  selfhelp: "from-rose-400/60 to-pink-500/60",
  default: "from-slate-400/60 to-slate-500/60",
};

export function MediaWidget() {
  const { widgetItems, widgetMode, isLoadingWidget } = useMediaLibrary();

  // Dynamic label based on what we're showing
  const headerLabel = widgetMode === "current" ? "Currently" : "Recent";

  return (
    <div className="glass-card frost-accent flex flex-col">
      {/* Header with link */}
      <div className="flex items-center justify-between mb-4">
        <span className="card-title flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-peach-400" />
          {headerLabel}
        </span>
        <Link href="/media" className="flex items-center gap-0.5 text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors">
          All
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Loading state */}
      {isLoadingWidget && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-peach-400/20 border-t-peach-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state - cuter */}
      {!isLoadingWidget && widgetItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6">
          <div className="flex gap-1 mb-3">
            {/* Cute stacked books illustration */}
            <div className="w-3 h-10 rounded-sm bg-gradient-to-b from-blue-400/40 to-blue-500/40 transform -rotate-3" />
            <div className="w-3 h-12 rounded-sm bg-gradient-to-b from-rose-400/40 to-rose-500/40" />
            <div className="w-3 h-9 rounded-sm bg-gradient-to-b from-amber-400/40 to-amber-500/40 transform rotate-2" />
          </div>
          <p className="text-xs text-[var(--text-muted)]">Nothing yet</p>
          <Link href="/media" className="text-xs text-peach-400 mt-1 hover:underline">
            + Add something
          </Link>
        </div>
      )}

      {/* Items list - cuter with book spine visualization */}
      {!isLoadingWidget && widgetItems.length > 0 && (
        <div className="space-y-3 flex-1">
          {widgetItems.slice(0, 5).map((item) => {
            const Icon = MEDIA_ICONS[item.mediaType];
            const colorClass = item.mediaType === "book"
              ? GENRE_COLORS.default
              : GENRE_COLORS.default;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 group"
              >
                {/* Book spine / media icon */}
                <div className={cn(
                  "w-2 h-10 rounded-full bg-gradient-to-b flex-shrink-0",
                  colorClass
                )} />

                {/* Title and progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate leading-tight">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Icon className="w-3 h-3 text-[var(--text-muted)]" />
                    {item.currentProgress && (
                      <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                        {item.currentProgress}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* "More" link if there are more than 5 */}
          {widgetItems.length > 5 && (
            <Link href="/media" className="block text-center text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors py-1">
              +{widgetItems.length - 5} more
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

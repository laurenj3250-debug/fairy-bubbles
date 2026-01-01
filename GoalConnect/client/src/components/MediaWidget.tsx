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

export function MediaWidget() {
  const { currentItems, isLoadingCurrent } = useMediaLibrary();

  return (
    <div className="glass-card frost-accent min-h-[200px] flex flex-col">
      {/* Header with link */}
      <div className="flex items-center justify-between mb-3">
        <span className="card-title">Currently</span>
        <Link href="/media">
          <a className="flex items-center gap-0.5 text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors">
            All
            <ChevronRight className="w-3 h-3" />
          </a>
        </Link>
      </div>

      {/* Loading state */}
      {isLoadingCurrent && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-peach-400/20 border-t-peach-400 rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!isLoadingCurrent && currentItems.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <BookOpen className="w-8 h-8 text-[var(--text-muted)]/40 mb-2" />
          <p className="text-xs text-[var(--text-muted)]">Nothing in progress</p>
          <Link href="/media">
            <a className="text-xs text-peach-400 mt-1 hover:underline">Add something</a>
          </Link>
        </div>
      )}

      {/* Items list */}
      {!isLoadingCurrent && currentItems.length > 0 && (
        <div className="space-y-2 flex-1">
          {currentItems.slice(0, 4).map((item) => {
            const Icon = MEDIA_ICONS[item.mediaType];
            return (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                {/* Type icon */}
                <div className="w-6 h-6 rounded flex items-center justify-center bg-white/5 flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </div>

                {/* Title and progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {item.title}
                  </p>
                  {item.currentProgress && (
                    <p className="text-[10px] text-[var(--text-muted)] tabular-nums">
                      {item.currentProgress}
                    </p>
                  )}
                </div>

                {/* Type label */}
                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide flex-shrink-0">
                  {TYPE_LABELS[item.mediaType]}
                </span>
              </div>
            );
          })}

          {/* "More" link if there are more than 4 */}
          {currentItems.length > 4 && (
            <Link href="/media">
              <a className="block text-center text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors py-1">
                +{currentItems.length - 4} more
              </a>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

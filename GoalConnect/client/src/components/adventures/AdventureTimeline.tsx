/**
 * AdventureTimeline Component
 * A "Memory Lane" vertical timeline view that groups adventures by month/year
 * Photo-forward design with large images and metadata overlays
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Camera,
  Mountain,
} from "lucide-react";
import type { Adventure } from "@/hooks/useAdventures";

interface AdventureTimelineProps {
  adventures: Adventure[];
  onEdit?: (adventure: Adventure) => void;
  onDelete?: (id: number) => void;
}

/**
 * Groups adventures by "Month Year" (e.g., "January 2024")
 * Returns entries sorted by date descending (most recent first)
 */
function groupAdventuresByMonth(
  adventures: Adventure[]
): [string, Adventure[]][] {
  const grouped = adventures.reduce(
    (acc, adventure) => {
      const key = format(new Date(adventure.date), "MMMM yyyy");
      if (!acc[key]) acc[key] = [];
      acc[key].push(adventure);
      return acc;
    },
    {} as Record<string, Adventure[]>
  );

  // Sort groups by date (most recent first) and sort adventures within each group
  return Object.entries(grouped)
    .sort((a, b) => {
      const dateA = new Date(a[1][0].date);
      const dateB = new Date(b[1][0].date);
      return dateB.getTime() - dateA.getTime();
    })
    .map(([month, adventures]) => [
      month,
      adventures.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    ]);
}

export function AdventureTimeline({
  adventures,
  onEdit,
  onDelete,
}: AdventureTimelineProps) {
  const groupedAdventures = useMemo(
    () => groupAdventuresByMonth(adventures),
    [adventures]
  );

  // Empty state
  if (adventures.length === 0) {
    return (
      <div className="glass-card frost-accent p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-peach-500/10 flex items-center justify-center mx-auto mb-4">
          <Mountain className="w-8 h-8 text-peach-400/50" />
        </div>
        <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
          No adventures yet
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
          Start logging your outdoor adventures to see them in this timeline
          view. Your memories will be organized by month.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {groupedAdventures.map(([month, monthAdventures], groupIndex) => (
        <TimelineMonth
          key={month}
          month={month}
          adventures={monthAdventures}
          onEdit={onEdit}
          onDelete={onDelete}
          isFirst={groupIndex === 0}
          isLast={groupIndex === groupedAdventures.length - 1}
        />
      ))}
    </div>
  );
}

interface TimelineMonthProps {
  month: string;
  adventures: Adventure[];
  onEdit?: (adventure: Adventure) => void;
  onDelete?: (id: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

function TimelineMonth({
  month,
  adventures,
  onEdit,
  onDelete,
  isFirst,
  isLast,
}: TimelineMonthProps) {
  return (
    <div className="relative">
      {/* Desktop: Side-by-side layout */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left side: Month/Year sticky header */}
        <div className="md:w-32 lg:w-40 flex-shrink-0">
          <div className="md:sticky md:top-4">
            {/* Month label */}
            <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-peach-400 md:hidden" />
                <span className="text-sm font-semibold text-peach-400">
                  {month.split(" ")[0]}
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {month.split(" ")[1]}
              </span>
            </div>
            {/* Adventure count */}
            <div className="hidden md:block mt-2 text-xs text-[var(--text-muted)]">
              {adventures.length} adventure{adventures.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Right side: Timeline line and adventure cards */}
        <div className="relative flex-1">
          {/* Connecting line */}
          <div
            className={cn(
              "absolute left-4 md:left-0 w-px bg-gradient-to-b from-peach-500/30 via-peach-500/20 to-peach-500/10",
              isFirst ? "top-4" : "top-0",
              isLast ? "bottom-4 h-auto" : "bottom-0"
            )}
          />

          {/* Adventure entries */}
          <div className="space-y-4 pl-10 md:pl-6">
            {adventures.map((adventure) => (
              <TimelineEntry
                key={adventure.id}
                adventure={adventure}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Spacing between months */}
      {!isLast && <div className="h-6 md:h-8" />}
    </div>
  );
}

interface TimelineEntryProps {
  adventure: Adventure;
  onEdit?: (adventure: Adventure) => void;
  onDelete?: (id: number) => void;
}

function TimelineEntry({
  adventure,
  onEdit,
  onDelete,
}: TimelineEntryProps) {
  return (
    <div className="relative group">
      {/* Timeline dot */}
      <div className="absolute -left-10 md:-left-6 top-4 w-3 h-3 rounded-full bg-peach-500/50 border-2 border-peach-400 shadow-[0_0_8px_rgba(251,146,60,0.3)]" />

      {/* Card */}
      <div
        className={cn(
          "glass-card frost-accent overflow-hidden",
          "transition-all duration-300",
          "hover:border-peach-500/30 hover:shadow-lg hover:shadow-peach-500/5",
          onEdit && "cursor-pointer"
        )}
        onClick={() => onEdit?.(adventure)}
      >
        {/* Photo - larger aspect ratio for timeline view */}
        <div className="relative aspect-video md:aspect-[21/9] bg-white/5">
          {(adventure.photoPath || adventure.thumbPath) ? (
            <img
              src={(adventure.photoPath || adventure.thumbPath)!}
              alt={adventure.activity}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-500/10 to-orange-500/10">
              <Camera className="w-12 h-12 text-peach-400/30" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Metadata overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Date */}
            <div className="flex items-center gap-1.5 text-xs text-white/70 mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{format(new Date(adventure.date), "EEEE, MMMM d")}</span>
            </div>

            {/* Activity title */}
            <h3 className="text-lg font-semibold text-white mb-1">
              {adventure.activity}
            </h3>

            {/* Location */}
            {adventure.location && (
              <div className="flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="w-3.5 h-3.5" />
                <span>{adventure.location}</span>
              </div>
            )}

            {/* Notes preview */}
            {adventure.notes && (
              <p className="mt-2 text-xs text-white/60 line-clamp-2">
                {adventure.notes}
              </p>
            )}
          </div>

          {/* Action buttons - visible on hover (desktop) or always (mobile) */}
          <div
            className={cn(
              "absolute top-3 right-3 flex gap-2",
              "opacity-100 md:opacity-0 md:group-hover:opacity-100",
              "transition-opacity duration-200"
            )}
          >
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(adventure);
                }}
                className="p-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white/80 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Edit adventure"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(adventure.id);
                }}
                className="p-2.5 bg-black/50 hover:bg-red-500/70 backdrop-blur-sm rounded-lg text-white/80 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Delete adventure"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdventureTimeline;

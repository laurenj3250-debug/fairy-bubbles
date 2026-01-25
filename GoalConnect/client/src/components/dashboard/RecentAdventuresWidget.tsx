/**
 * RecentAdventuresWidget
 * Compact widget showing 3-4 most recent adventure photos for IcyDash sidebar
 */

import { useAdventures } from "@/hooks/useAdventures";
import { Link } from "wouter";
import { Mountain, MapPin, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentAdventuresWidget() {
  const currentYear = new Date().getFullYear().toString();
  const { adventures, isLoading, error } = useAdventures({ year: currentYear, limit: 4 });

  if (isLoading) {
    return (
      <div className="glass-card frost-accent p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-peach-400" />
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Recent Adventures
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card frost-accent p-3">
        <div className="flex items-center gap-2 mb-3">
          <Mountain className="w-4 h-4 text-red-400" />
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Recent Adventures
          </span>
        </div>
        <div className="text-center py-4 text-sm text-red-400">
          Failed to load adventures
        </div>
      </div>
    );
  }

  if (adventures.length === 0) {
    return (
      <div className="glass-card frost-accent p-3">
        <div className="flex items-center gap-2 mb-3">
          <Mountain className="w-4 h-4 text-peach-400" />
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Recent Adventures
          </span>
        </div>
        <Link href="/adventures">
          <div className="text-center py-4 text-sm text-[var(--text-muted)] hover:text-peach-400 cursor-pointer transition-colors">
            Log your first adventure →
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card frost-accent p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-peach-400" />
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Recent Adventures
          </span>
        </div>
        <Link href="/adventures">
          <span className="text-xs text-peach-400 hover:underline cursor-pointer flex items-center gap-0.5">
            View all
            <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* Photo Grid - 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        {adventures.slice(0, 4).map((adventure) => (
          <Link key={adventure.id} href="/adventures">
            <div className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 cursor-pointer">
              {adventure.thumbPath ? (
                <img
                  src={adventure.thumbPath}
                  alt={adventure.activity}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-500/10 to-orange-500/10">
                  <Mountain className="w-6 h-6 text-peach-400/50" />
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <span className="text-xs text-white font-medium truncate w-full text-center">
                  {format(new Date(adventure.date), "MMM d")}
                </span>
                {adventure.location && (
                  <span className="text-[10px] text-white/70 truncate w-full text-center flex items-center justify-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {adventure.location}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

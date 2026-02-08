/**
 * RecentAdventuresWidget
 * Compact widget showing 3-4 most recent outdoor activities (adventures + climbing days) for IcyDash sidebar
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Mountain, MapPin, ChevronRight, Snowflake, Plus } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivity {
  id: number;
  date: string;
  type: "adventure" | "climbing_day";
  activity: string;
  location: string | null;
  photoPath: string | null;
  thumbPath: string | null;
  notes: string | null;
}

interface RecentAdventuresWidgetProps {
  onLogAdventure?: () => void;
}

export function RecentAdventuresWidget({ onLogAdventure }: RecentAdventuresWidgetProps) {
  const { data: activities, isLoading, error } = useQuery<RecentActivity[]>({
    queryKey: ["/api/recent-outdoor-activities"],
    queryFn: async () => {
      const res = await fetch("/api/recent-outdoor-activities?limit=4");
      if (!res.ok) throw new Error("Failed to fetch activities");
      return res.json();
    },
  });

  // Shared header used across all states
  const header = (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Mountain className="w-4 h-4 text-peach-400" />
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Recent Adventures
        </span>
      </div>
      <div className="flex items-center gap-2">
        {onLogAdventure && (
          <button
            onClick={onLogAdventure}
            className="text-peach-400 hover:text-peach-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center -my-3"
            aria-label="Log new adventure"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
        <Link href="/adventures" className="text-xs text-peach-400 hover:underline cursor-pointer flex items-center gap-0.5">
          View all
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="glass-card frost-accent p-3">
        {header}
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
        {header}
        <div className="text-center py-4 text-sm text-red-400">
          Failed to load adventures
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="glass-card frost-accent p-3">
        {header}
        {onLogAdventure ? (
          <button
            onClick={onLogAdventure}
            className="w-full text-center py-4 text-sm text-[var(--text-muted)] hover:text-peach-400 cursor-pointer transition-colors"
          >
            Log your first adventure
          </button>
        ) : (
          <Link href="/adventures">
            <div className="text-center py-4 text-sm text-[var(--text-muted)] hover:text-peach-400 cursor-pointer transition-colors">
              Log your first adventure
            </div>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card frost-accent p-3">
      {header}

      {/* Activity Grid - 2x2 */}
      <div className="grid grid-cols-2 gap-2">
        {activities.slice(0, 4).map((activity) => (
          <Link key={`${activity.type}-${activity.id}`} href="/adventures">
            <div className="group relative aspect-square rounded-lg overflow-hidden bg-white/5 cursor-pointer">
              {activity.photoPath || activity.thumbPath ? (
                <img
                  src={activity.thumbPath || activity.photoPath || ""}
                  alt={activity.activity}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-peach-500/10 to-orange-500/10">
                  {activity.type === "climbing_day" ? (
                    <Snowflake className="w-6 h-6 text-sky-400/50" />
                  ) : (
                    <Mountain className="w-6 h-6 text-peach-400/50" />
                  )}
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                <span className="text-xs text-white font-medium truncate w-full text-center">
                  {format(new Date(activity.date), "MMM d")}
                </span>
                <span className="text-[10px] text-white/80 truncate w-full text-center mt-0.5">
                  {activity.activity}
                </span>
                {activity.location && (
                  <span className="text-[10px] text-white/70 truncate w-full text-center flex items-center justify-center gap-0.5 mt-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {activity.location}
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

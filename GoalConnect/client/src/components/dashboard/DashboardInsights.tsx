import { useState, useEffect } from "react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SummitLog } from "@/components/SummitLog";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { WeeklyRhythm } from "@/components/WeeklyRhythm";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dashboard-insights-open";
const mql = window.matchMedia("(min-width: 768px)");

function getDefaultOpen() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) return stored === "true";
  return mql.matches;
}

export function DashboardInsights() {
  const [open, setOpen] = useState(getDefaultOpen);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="glass-card frost-accent p-4">
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer">
            <span className="card-title !mb-0 !text-sm">Insights</span>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--text-muted)] transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <Link href="/analytics">
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors cursor-pointer">
              View all <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>

        {open && (
          <div className="mt-4 space-y-4">
            <SummitLog />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HabitHeatmap />
              <WeeklyRhythm />
            </div>
          </div>
        )}
      </div>
    </Collapsible>
  );
}

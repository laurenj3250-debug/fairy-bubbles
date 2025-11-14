import { DailyFocusHero } from "@/components/DailyFocusHero";
import { WeekOverviewStreak } from "@/components/WeekOverviewStreak";
import { GoalsSection } from "@/components/GoalsSection";
import { TodaysTasksPanel } from "@/components/TodaysTasksPanel";
import { DreamScrollWidget } from "@/components/DreamScrollWidget";
import { ProgressBackground } from "@/components/ProgressBackground";
import { useQuery } from "@tanstack/react-query";

/**
 * REDESIGNED WeeklyHub
 *
 * New hierarchy prioritizes daily clarity:
 * 1. Daily Focus Hero (60%) - "What do I need to do TODAY?"
 * 2. Week Overview + Streak (30%) - See patterns + motivation
 * 3. Goals (20% or less) - Collapsible, doesn't dominate
 * 4. Optional: Tasks + Journal below
 */
export default function WeeklyHub() {
  // Fetch streak for background progression
  const { data: streakData } = useQuery<{ currentStreak: number }>({
    queryKey: ['/api/habits/streak'],
  });

  const currentStreak = streakData?.currentStreak || 0;

  return (
    <ProgressBackground streakDays={currentStreak}>
      <div className="min-h-screen pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto p-4 md:p-6 section">
          {/* Hero: Daily Focus - BIGGEST section */}
          <DailyFocusHero />

          {/* Week Overview + Streak - Side by side */}
          <WeekOverviewStreak />

          {/* Active Goals - Collapsible, takes minimal space */}
          <GoalsSection />

          {/* Optional sections - Can be toggled or moved to separate views */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TodaysTasksPanel />
            <DreamScrollWidget />
          </div>

          {/* Link to full habit history */}
          <div className="card bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
            <a href="/habits" className="block text-center py-4">
              <p className="text-sm font-medium text-foreground">
                View Full Habit History
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                See detailed analytics, patterns, and past performance
              </p>
            </a>
          </div>
        </div>
      </div>
    </ProgressBackground>
  );
}

import { Link } from "wouter";
import { ForestBackground } from "@/components/ForestBackground";
import { TodayCompletionStatus } from "@/components/TodayCompletionStatus";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useStravaStats } from "@/hooks/useStravaStats";
import { useClimbingStats } from "@/hooks/useClimbingStats";
import { useLiftingStats } from "@/hooks/useLiftingStats";
import { useYearlyGoals } from "@/hooks/useYearlyGoals";
import { HabitPatternInsights } from "@/components/HabitPatternInsights";
import { HabitCompletionCalendar } from "@/components/HabitCompletionCalendar";
import { WeeklyReport } from "@/components/WeeklyReport";
import { MonthlyReport } from "@/components/MonthlyReport";
import { SummitLog } from "@/components/SummitLog";
import {
  ArrowRight,
  Mountain,
  Target,
  TrendingUp,
  Brain,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Section skeleton
// ---------------------------------------------------------------------------
function SectionSkeleton() {
  return (
    <div className="glass-card frost-accent p-4 space-y-3">
      <Skeleton className="h-4 w-32 rounded" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------
function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="glass-card frost-accent p-4 text-center">
      <p className="text-2xl font-heading text-peach-400">{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">{label}</p>
      {sub && (
        <p className="text-[10px] text-[var(--text-muted)] opacity-60 mt-0.5">
          {sub}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section header with optional detail link
// ---------------------------------------------------------------------------
function SectionHeader({
  icon: Icon,
  title,
  href,
}: {
  icon: React.ElementType;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-2 text-sm font-heading text-white/90">
        <Icon className="w-4 h-4 text-peach-400" />
        {title}
      </h2>
      {href && (
        <Link href={href}>
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-peach-400 transition-colors cursor-pointer">
            View details <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Residency / Mood section (conditional on data)
// ---------------------------------------------------------------------------
interface ResidencyAnalytics {
  totalEntries: number;
  overallMoodAvg: number;
  overallQuitRate: number;
}

function MoodSection() {
  const { data, isLoading } = useQuery<ResidencyAnalytics>({
    queryKey: ["/api/residency/analytics"],
  });

  if (isLoading) return <SectionSkeleton />;
  if (!data || data.totalEntries === 0) return null;

  return (
    <div>
      <SectionHeader icon={Brain} title="Mood" href="/residency" />
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Entries" value={data.totalEntries} />
        <StatCard
          label="Avg Mood"
          value={data.overallMoodAvg?.toFixed(1) ?? "—"}
          sub="out of 10"
        />
        <StatCard
          label="Quit Rate"
          value={`${Math.round((data.overallQuitRate ?? 0) * 100)}%`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Athletic Journey section
// ---------------------------------------------------------------------------
function AthleticSection() {
  const { stats: strava, isLoading: stravaLoading } = useStravaStats();
  const { stats: climbing, isLoading: climbingLoading } = useClimbingStats();
  const { stats: lifting, isLoading: liftingLoading } = useLiftingStats();

  const isLoading = stravaLoading || climbingLoading || liftingLoading;
  if (isLoading) return <SectionSkeleton />;

  const hasStrava = strava?.isConnected && strava.ytdMiles > 0;
  const hasClimbing = climbing?.isConnected && climbing.totalSessions > 0;
  const hasLifting = lifting && lifting.ytdWorkouts > 0;

  if (!hasStrava && !hasClimbing && !hasLifting) return null;

  return (
    <div>
      <SectionHeader icon={TrendingUp} title="Athletic Journey" href="/journey" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {hasStrava && (
          <>
            <StatCard
              label="YTD Cycling"
              value={`${strava!.ytdMiles} mi`}
              sub={`${strava!.ytdRides} rides`}
            />
            <StatCard
              label="Elevation"
              value={`${(strava!.ytdElevationFt / 1000).toFixed(1)}k ft`}
            />
          </>
        )}
        {hasClimbing && (
          <>
            <StatCard
              label="Kilter Max"
              value={climbing!.maxGrade}
              sub={`${climbing!.ytdSessions} sessions YTD`}
            />
            <StatCard
              label="Send Rate"
              value={`${Math.round(climbing!.sendRate)}%`}
              sub={`${climbing!.totalProblemsSent} sent`}
            />
          </>
        )}
        {hasLifting && (
          <StatCard
            label="Lifting"
            value={lifting!.ytdWorkouts}
            sub="workouts YTD"
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Analytics page
// ---------------------------------------------------------------------------
export default function Analytics() {
  const currentYear = new Date().getFullYear().toString();
  const { stats: yearlyStats, isLoading: yearlyLoading } =
    useYearlyGoals(currentYear);

  return (
    <div className="min-h-screen relative">
      <ForestBackground />

      {/* Main content */}
      <div className="relative z-10 px-5 md:px-8 pb-24 pt-8">
        <div className="max-w-[900px] ml-0 md:ml-[188px] space-y-6">
          {/* Header */}
          <header className="mb-2">
            <h1 className="logo-text tracking-wider text-2xl">ANALYTICS</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              All your data in one place
            </p>
          </header>

          {/* Today's Progress - full width */}
          <TodayCompletionStatus />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {yearlyLoading ? (
              <>
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </>
            ) : (
              <StatCard
                label="Yearly Goals"
                value={`${yearlyStats?.completedGoals ?? 0}/${yearlyStats?.totalGoals ?? 0}`}
                sub={
                  yearlyStats?.totalGoals
                    ? `${yearlyStats.completionPercent ?? 0}% complete`
                    : undefined
                }
              />
            )}
          </div>

          {/* Habits Section */}
          <div>
            <SectionHeader
              icon={Mountain}
              title="Habits"
              href="/habit-insights"
            />
            <div className="space-y-4">
              <HabitPatternInsights />
              <HabitCompletionCalendar />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <WeeklyReport />
                <MonthlyReport />
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div>
            <SectionHeader icon={Target} title="Goals" href="/goals" />
            <SummitLog />
          </div>

          {/* Athletic Journey */}
          <AthleticSection />

          {/* Mood (conditional) */}
          <MoodSection />
        </div>
      </div>
    </div>
  );
}

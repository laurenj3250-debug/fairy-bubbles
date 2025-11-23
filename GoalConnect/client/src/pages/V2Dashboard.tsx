import { Home, Target, ListTodo, Settings, Mountain, Calendar, BookOpen, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { GlowingOrbHabits } from "@/components/GlowingOrbHabits";
import { MountainRangeGoals } from "@/components/MountainRangeGoals";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { PeakLoreWidget } from "@/components/PeakLoreWidget";
import { WeeklyRhythm } from "@/components/WeeklyRhythm";
import { TokenCounter } from "@/components/TokenCounter";
import { TodoPanel } from "@/components/TodoPanel";
import { SummitLog } from "@/components/SummitLog";

// Get time-based greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Format today's date nicely
function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * V2Dashboard - New 3-column layout experiment
 *
 * Layout:
 * ┌──────┬─────────────────────────────────┬───────────┐
 * │      │ Header (greeting/stats)         │           │
 * │ Nav  │─────────────────────────────────│  To-Do    │
 * │      │ Habits      │ Goals             │  Panel    │
 * │ 64px │ Card        │ Card              │           │
 * │      │─────────────┴───────────────────│  320px    │
 * │      │ Widget   │ Widget   │ Widget    │           │
 * └──────┴─────────────────────────────────┴───────────┘
 */

const navItems = [
  { path: "/v2", icon: Home, label: "Home" },
  { path: "/habits", icon: Mountain, label: "Habits" },
  { path: "/goals", icon: Target, label: "Goals" },
  { path: "/todos", icon: ListTodo, label: "Tasks" },
  { path: "/journey", icon: TrendingUp, label: "Journey" },
  { path: "/summit-journal", icon: BookOpen, label: "Summit Journal" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function V2Dashboard() {
  const [location] = useLocation();

  return (
    <div className="h-screen grid grid-cols-[64px_1fr_320px] overflow-hidden">
      {/* === NAV RAIL === */}
      <nav className="glass-card rounded-none border-r border-border/50 flex flex-col items-center py-6 gap-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path;
          return (
            <Link key={path} href={path}>
              <button
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                title={label}
              >
                <Icon className="w-5 h-5" />
              </button>
            </Link>
          );
        })}
      </nav>

      {/* === CENTER CONTENT === */}
      <main className="overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="glass-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{getGreeting()}, Climber</h1>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-primary" />
                <p className="text-muted-foreground text-sm">
                  {formatDate()}
                </p>
              </div>
            </div>
            <TokenCounter />
          </div>
        </div>

        {/* Top Row: Habits + Goals */}
        <div className="grid grid-cols-2 gap-6">
          <div className="glass-card p-6 min-h-[200px]">
            <GlowingOrbHabits />
          </div>
          <div className="glass-card p-6 min-h-[200px]">
            <MountainRangeGoals />
          </div>
        </div>

        {/* Bottom Row: 3 Widgets */}
        <div className="grid grid-cols-3 gap-6">
          <div className="glass-card p-4 min-h-[160px]">
            <HabitHeatmap />
          </div>
          <div className="glass-card p-4 min-h-[160px]">
            <PeakLoreWidget />
          </div>
          <div className="glass-card p-4 min-h-[160px]">
            <WeeklyRhythm />
          </div>
        </div>

        {/* Summit Log - Monthly Accomplishments */}
        <SummitLog />
      </main>

      {/* === TO-DO PANEL === */}
      <aside className="glass-card rounded-none border-l border-border/50 p-6 overflow-y-auto">
        <TodoPanel />
      </aside>
    </div>
  );
}

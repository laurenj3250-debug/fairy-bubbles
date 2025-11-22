import { Home, Target, ListTodo, Settings, Mountain } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { GlowingOrbHabits } from "@/components/GlowingOrbHabits";
import { MountainRangeGoals } from "@/components/MountainRangeGoals";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { StreakFlames } from "@/components/StreakFlames";
import { WeeklyRhythm } from "@/components/WeeklyRhythm";

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
          <h1 className="text-2xl font-bold">Good morning, Climber</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ready to conquer today's route?
          </p>
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
            <StreakFlames />
          </div>
          <div className="glass-card p-4 min-h-[160px]">
            <WeeklyRhythm />
          </div>
        </div>
      </main>

      {/* === TO-DO PANEL === */}
      <aside className="glass-card rounded-none border-l border-border/50 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">To-Do</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <p className="text-sm">Task placeholder {i}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

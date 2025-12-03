import { Home, TrendingUp, CheckSquare, Target, Mountain, CalendarDays } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/planner", label: "Planner", icon: CalendarDays },
  { path: "/habits", label: "Habits", icon: Mountain },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/todos", label: "Tasks", icon: CheckSquare },
];

export function BottomNav() {
  const [location] = useLocation();
  
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-lg border-t border-card-border topo-pattern flex items-center justify-around z-50 safe-area-inset-bottom"
      data-testid="bottom-nav"
      role="navigation"
      aria-label="Main navigation"
    >
      {navItems.map(({ path, label, icon: Icon }) => {
        const isActive = location === path;

        return (
          <Link key={path} href={path} asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 min-w-16 transition-colors hover-elevate",
                isActive && "text-primary"
              )}
              data-testid={`nav-${label.toLowerCase()}`}
              aria-label={`Navigate to ${label}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current")} aria-hidden="true" />
              <span className={cn("text-xs", isActive && "font-semibold")}>
                {label}
              </span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}

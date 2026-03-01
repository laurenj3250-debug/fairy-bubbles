import { Home, Target, ListTodo, Settings, Mountain, BookOpen, TrendingUp, Compass, Gift, BarChart3, Sun } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageSidebar } from "@/components/PageSidebar";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/habits", icon: Mountain, label: "Habits" },
  { path: "/goals", icon: Target, label: "Goals" },
  { path: "/todos", icon: ListTodo, label: "Tasks" },
  { path: "/adventures", icon: Compass, label: "Outdoors" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/journey", icon: TrendingUp, label: "Journey" },
  { path: "/summit-journal", icon: BookOpen, label: "Summit Journal" },
  { path: "/rewards", icon: Gift, label: "Rewards" },
  { path: "/wheel", icon: Sun, label: "Wellness Wheel" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

interface MainLayoutProps {
  children: ReactNode;
  variant?: "rail" | "sidebar";
  showTodoPanel?: boolean;
  todoPanel?: ReactNode;
}

/**
 * MainLayout - Shared layout with nav rail or text sidebar for all pages
 *
 * Variants:
 * - "rail" (default): 64px icon rail | content | optional todo panel
 * - "sidebar": text sidebar (fixed-position) | content (full-width grid)
 * - Mobile: content only with bottom nav (both variants)
 */
export function MainLayout({ children, variant = "rail", showTodoPanel = false, todoPanel }: MainLayoutProps) {
  const [location] = useLocation();

  const isSidebar = variant === "sidebar";

  return (
    <div className={cn(
      "h-screen grid overflow-hidden pb-16 md:pb-0",
      isSidebar
        ? "grid-cols-1"
        : showTodoPanel
          ? "grid-cols-1 md:grid-cols-[64px_1fr] lg:grid-cols-[64px_1fr_320px]"
          : "grid-cols-1 md:grid-cols-[64px_1fr]"
    )}>
      {/* === TEXT SIDEBAR (fixed-position, doesn't affect grid) === */}
      {isSidebar && <PageSidebar />}

      {/* === NAV RAIL (hidden on mobile, only for rail variant) === */}
      {!isSidebar && (
        <nav className="hidden md:flex glass-card rounded-none border-r border-border/50 flex-col items-center py-6 gap-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            // Handle both "/" and "/v2" as home
            const isActive = location === path || (path === "/" && location === "/v2");
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
      )}

      {/* === MAIN CONTENT === */}
      <main className="overflow-y-auto">
        {children}
      </main>

      {/* === OPTIONAL TODO PANEL (hidden on mobile, rail variant only) === */}
      {!isSidebar && showTodoPanel && todoPanel && (
        <aside className="hidden lg:block glass-card rounded-none border-l border-border/50 p-6 overflow-y-auto">
          {todoPanel}
        </aside>
      )}

      {/* === BOTTOM NAV (mobile only) === */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

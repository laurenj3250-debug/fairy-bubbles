import { Home, Target, ListTodo, Settings, Mountain, BookOpen, TrendingUp, GraduationCap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";

const navItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/habits", icon: Mountain, label: "Habits" },
  { path: "/goals", icon: Target, label: "Goals" },
  { path: "/todos", icon: ListTodo, label: "Tasks" },
  { path: "/journey", icon: TrendingUp, label: "Journey" },
  { path: "/summit-journal", icon: BookOpen, label: "Summit Journal" },
  { path: "/study", icon: GraduationCap, label: "Study" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

interface MainLayoutProps {
  children: ReactNode;
  showTodoPanel?: boolean;
  todoPanel?: ReactNode;
}

/**
 * MainLayout - Shared layout with nav rail for all pages
 *
 * Layout options:
 * - Desktop: nav rail | content | optional todo panel
 * - Mobile: content only with bottom nav
 */
export function MainLayout({ children, showTodoPanel = false, todoPanel }: MainLayoutProps) {
  const [location] = useLocation();

  return (
    <div className={cn(
      "h-screen grid overflow-hidden pb-16 md:pb-0",
      showTodoPanel
        ? "grid-cols-1 md:grid-cols-[64px_1fr] lg:grid-cols-[64px_1fr_320px]"
        : "grid-cols-1 md:grid-cols-[64px_1fr]"
    )}>
      {/* === NAV RAIL (hidden on mobile) === */}
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

      {/* === MAIN CONTENT === */}
      <main className="overflow-y-auto">
        {children}
      </main>

      {/* === OPTIONAL TODO PANEL (hidden on mobile) === */}
      {showTodoPanel && todoPanel && (
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

import { Home, Heart, ShoppingBag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/pet", label: "Pet", icon: Heart },
  { path: "/shop", label: "Shop", icon: ShoppingBag },
];

export function BottomNav() {
  const [location] = useLocation();
  
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-lg border-t flex items-center justify-around z-50 safe-area-inset-bottom"
      data-testid="bottom-nav"
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
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
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

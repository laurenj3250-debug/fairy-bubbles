import { Link, useLocation } from "wouter";

const navItems = [
  { href: "/", label: "dashboard" },
  { href: "/habits", label: "habits" },
  { href: "/goals", label: "goals" },
  { href: "/todos", label: "todos" },
  { href: "/analytics", label: "analytics" },
  { href: "/journey", label: "journey" },
  { href: "/adventures", label: "adventures" },
  { href: "/settings", label: "settings" },
];

export function PageSidebar() {
  const [location] = useLocation();

  return (
    <nav className="hidden md:flex fixed left-0 top-0 h-full w-[160px] z-20 flex-col justify-center pl-6">
      <div className="space-y-4">
        {navItems.map(({ href, label }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <span
                className={`block transition-colors text-sm font-heading cursor-pointer ${
                  isActive
                    ? "text-peach-400"
                    : "text-[var(--text-muted)] hover:text-peach-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

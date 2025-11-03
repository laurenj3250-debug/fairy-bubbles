import { cn } from "@/lib/utils";

interface StreakTrailProps {
  dates: string[]; // Array of dates where habit was completed (YYYY-MM-DD)
  daysToShow?: number;
  className?: string;
}

export function StreakTrail({ dates, daysToShow = 14, className }: StreakTrailProps) {
  // Generate last N days
  const today = new Date();
  const trail = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (daysToShow - 1 - i));
    const dateString = date.toISOString().split('T')[0];
    const completed = dates.includes(dateString);
    return { date: dateString, completed };
  });

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {trail.map((day, idx) => (
        <div
          key={day.date}
          className={cn(
            "w-1.5 h-1.5 rounded-full transition-all duration-300",
            day.completed
              ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] scale-125"
              : "bg-muted-foreground/20"
          )}
          title={day.date}
        />
      ))}
    </div>
  );
}

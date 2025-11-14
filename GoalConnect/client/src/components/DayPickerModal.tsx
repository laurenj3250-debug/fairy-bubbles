import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface DayPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentScheduledDay: string | null;
  onSelectDay: (date: string) => void;
  onClearSchedule: () => void;
  habitTitle: string;
}

export function DayPickerModal({
  open,
  onOpenChange,
  currentScheduledDay,
  onSelectDay,
  onClearSchedule,
  habitTitle,
}: DayPickerModalProps) {
  // Calculate this week's days (Monday-Sunday)
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const dateString = day.toISOString().split("T")[0];
      const dayName = day.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const isToday = dateString === new Date().toISOString().split("T")[0];
      const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
      const isSelected = dateString === currentScheduledDay;

      days.push({
        date: dateString,
        dayName,
        monthDay,
        isToday,
        isPast,
        isSelected,
      });
    }

    return days;
  }, [currentScheduledDay]);

  const handleSelectDay = (date: string) => {
    onSelectDay(date);
    onOpenChange(false); // Close modal on selection
  };

  const handleClear = () => {
    onClearSchedule();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-card/40 backdrop-blur-sm border border-card-border max-w-md shadow-lg topo-pattern"
        style={{
          background: "linear-gradient(to bottom right, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))",
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold text-white"
            style={{
              fontFamily: "'Comfortaa', cursive",
              textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
            }}
          >
            Schedule Adventure
          </DialogTitle>
          <p className="text-white/70 text-sm mt-2" style={{ fontFamily: "'Quicksand', sans-serif" }}>
            {habitTitle}
          </p>
        </DialogHeader>

        {/* Day Grid */}
        <div className="space-y-2 mt-4">
          {weekDays.map((day) => (
            <button
              key={day.date}
              onClick={() => !day.isPast && handleSelectDay(day.date)}
              disabled={day.isPast}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all duration-200",
                "flex items-center justify-between",
                day.isPast
                  ? "opacity-40 cursor-not-allowed border-white/10 bg-white/5"
                  : day.isSelected
                    ? "border-green-400/60 bg-gradient-to-r from-green-500/30 to-emerald-500/30"
                    : "border-white/20 bg-gradient-to-r from-white/5 to-white/10 hover:border-white/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <div className="font-semibold text-white flex items-center gap-2">
                    {day.dayName}
                    {day.isToday && (
                      <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/60">{day.monthDay}</div>
                </div>
              </div>

              {day.isSelected && (
                <div className="flex-shrink-0 text-green-400 text-lg">✓</div>
              )}
            </button>
          ))}
        </div>

        {/* Clear Button */}
        {currentScheduledDay && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={handleClear}
              className="w-full p-3 rounded-xl border-2 border-red-400/40 bg-red-500/20 text-white hover:bg-red-500/30 transition-all"
            >
              Clear Schedule
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { TopStatusBar } from "@/components/TopStatusBar";
import { RidgeTraverseWeekCompact } from "@/components/RidgeTraverseWeekCompact";
import { TodaysPitch } from "@/components/TodaysPitch";
import { RoutesPanel } from "@/components/RoutesPanel";
import { useState } from "react";

export default function WeeklyHub() {
  const [activeDay, setActiveDay] = useState<string | null>(null);

  const handleDayClick = (date: string) => {
    setActiveDay(date);
    // Could expand this to show that day's details
    console.log("Selected day:", date);
  };

  return (
    <div className="min-h-screen bg-transparent pb-20 md:pb-0">
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* Top Status Bar */}
        <TopStatusBar />

        {/* Ridge Traverse Week */}
        <RidgeTraverseWeekCompact onDayClick={handleDayClick} />

        {/* Main Content: Today's Pitch + Routes Panel */}
        <div className="mt-4 flex flex-col lg:flex-row gap-4">
          {/* Today's Pitch - Main hero component (65% width on desktop) */}
          <div className="flex-1 lg:w-[65%]">
            <TodaysPitch />
          </div>

          {/* Routes Panel - Sidebar (30% width on desktop, 5% gap) */}
          <div className="lg:w-[30%]">
            <RoutesPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

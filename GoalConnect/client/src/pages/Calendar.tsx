import { DashboardHeader } from "@/components/DashboardHeader";
import { CalendarView } from "@/components/CalendarView";

export default function Calendar() {
  return (
    <div className="min-h-screen pb-20">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Track your habits, goals, and todos
          </p>
        </div>

        <CalendarView />
      </main>
    </div>
  );
}

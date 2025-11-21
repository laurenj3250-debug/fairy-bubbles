import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Habit } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TodayCompletionStatus } from "@/components/TodayCompletionStatus";
import { HabitPatternInsights } from "@/components/HabitPatternInsights";
import { HabitCompletionCalendar } from "@/components/HabitCompletionCalendar";
import { HabitDetailedStats } from "@/components/HabitDetailedStats";

export default function HabitInsights() {
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ["/api/habits"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-24">
        <div className="space-y-4 w-full max-w-6xl mx-auto p-6">
          <div className="h-64 bg-card/40 rounded-3xl animate-pulse"></div>
          <div className="h-96 bg-card/40 rounded-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-6xl mx-auto p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/habits">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Habits
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Habit Insights
          </h1>
          <p className="text-muted-foreground">
            Deep analytics and patterns for your climbing journey
          </p>
        </div>

        {/* Today's Status */}
        <div className="mb-8">
          <TodayCompletionStatus />
        </div>

        {/* Pattern Insights */}
        <div className="mb-8">
          <HabitPatternInsights />
        </div>

        {/* Completion Calendar */}
        <div className="mb-8">
          <HabitCompletionCalendar />
        </div>

        {/* Individual Habit Analytics */}
        {habits.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" style={{ color: "hsl(var(--accent))" }} />
              Individual Route Analytics
            </h2>

            {/* Habit Selector */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {habits.map((habit) => (
                  <button
                    key={habit.id}
                    onClick={() =>
                      setSelectedHabitId(selectedHabitId === habit.id ? null : habit.id)
                    }
                    className={`px-4 py-2 rounded-xl border transition-all flex items-center gap-2 ${
                      selectedHabitId === habit.id
                        ? "bg-accent border-accent text-accent-foreground shadow-lg scale-105"
                        : "bg-background/60 border-foreground/10 hover:border-foreground/20 hover:scale-105"
                    }`}
                  >
                    <span className="text-lg">{habit.icon}</span>
                    <span className="font-medium">{habit.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Habit Details */}
            {selectedHabitId && (
              <div className="animate-in fade-in duration-300">
                <HabitDetailedStats habitId={selectedHabitId} />
              </div>
            )}

            {!selectedHabitId && (
              <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-12 border border-foreground/10 text-center">
                <p className="text-muted-foreground text-lg">
                  👆 Select a habit above to view detailed analytics
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { Target } from "lucide-react";
import { SundownGoalsCard } from "./SundownGoalsCard";
import { SundownMonthlyGoals } from "./SundownMonthlyGoals";
import { EmptyState } from "@/components/EmptyState";
import type { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";

interface GoalData {
  id: number;
  title: string;
  current: number;
  target: number;
  category: string;
}

interface SundownGoalsTabProps {
  goals: GoalData[];
  rawGoals?: YearlyGoalWithProgress[];
}

export function SundownGoalsTab({ goals, rawGoals = [] }: SundownGoalsTabProps) {
  if (goals.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No goals yet"
        description="Set your first yearly goal to start tracking progress."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SundownGoalsCard />
      <SundownMonthlyGoals goals={goals} rawGoals={rawGoals} />
    </div>
  );
}

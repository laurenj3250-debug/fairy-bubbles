import { SundownGoalsCard } from "./SundownGoalsCard";
import { SundownMonthlyGoals } from "./SundownMonthlyGoals";

interface GoalData {
  id: number;
  title: string;
  current: number;
  target: number;
  category: string;
}

interface SundownGoalsTabProps {
  goals: GoalData[];
}

export function SundownGoalsTab({ goals }: SundownGoalsTabProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SundownGoalsCard />
      <SundownMonthlyGoals goals={goals} />
    </div>
  );
}

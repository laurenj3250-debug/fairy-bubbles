import { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";
import { CompactGoalCard } from "./CompactGoalCard";

interface CompactGoalGridProps {
  goals: YearlyGoalWithProgress[];
  onToggle?: (goalId: number) => void;
  onIncrement?: (goalId: number, amount: number) => void;
  onToggleSubItem?: (goalId: number, subItemId: string) => void;
  onClaimReward?: (goalId: number) => void;
  isToggling?: boolean;
  isIncrementing?: boolean;
  isClaimingReward?: boolean;
  onCardClick?: (goal: YearlyGoalWithProgress) => void;
  // Outdoor day logging callback - receives "quick" or "full"
  onLogOutdoorDay?: (type: "quick" | "full") => void;
}

export function CompactGoalGrid({
  goals,
  onToggle,
  onIncrement,
  onToggleSubItem,
  onClaimReward,
  isToggling,
  isIncrementing,
  isClaimingReward,
  onCardClick,
  onLogOutdoorDay,
}: CompactGoalGridProps) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {goals.map((goal) => (
        <CompactGoalCard
          key={goal.id}
          goal={goal}
          onToggle={onToggle ? () => onToggle(goal.id) : undefined}
          onIncrement={onIncrement ? (amt) => onIncrement(goal.id, amt) : undefined}
          onToggleSubItem={onToggleSubItem ? (subId) => onToggleSubItem(goal.id, subId) : undefined}
          onClaimReward={onClaimReward ? () => onClaimReward(goal.id) : undefined}
          isToggling={isToggling}
          isIncrementing={isIncrementing}
          isClaimingReward={isClaimingReward}
          onClick={onCardClick ? () => onCardClick(goal) : undefined}
          onLogOutdoorDay={onLogOutdoorDay}
        />
      ))}
    </div>
  );
}

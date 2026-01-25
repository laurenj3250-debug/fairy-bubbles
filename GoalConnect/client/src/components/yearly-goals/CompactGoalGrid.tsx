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
  // Auto goal action callbacks
  onLogClimb?: () => void;
  // REMOVED: onAddBook (Study Planner feature no longer needed)
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
  onLogClimb,
  // REMOVED: onAddBook (Study Planner feature no longer needed)
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
          onLogClimb={onLogClimb}
          // REMOVED: onAddBook (Study Planner feature no longer needed)
        />
      ))}
    </div>
  );
}

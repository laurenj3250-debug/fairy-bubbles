import type { YearlyGoalWithProgress } from "@/hooks/useYearlyGoals";

/**
 * A yearly goal is "linked" if any external source computes its value —
 * a linked habit, journey integration, dream scroll, or the server reports
 * source="auto". For linked goals, manual increment/decrement is a no-op
 * (the computed value overrides currentValue), so the UI should hide
 * increment controls but still allow edit (title/target/xpReward are
 * always user-editable) and delete (user owns their own goals).
 *
 * Note: for count goals with a link, the server reports source="manual"
 * intentionally (see computeGoalProgress) so the client still gets
 * currentValue. That's why we also check the linked* fields here.
 */
export function isGoalLinked(
  goal: Pick<
    YearlyGoalWithProgress,
    "source" | "sourceLabel" | "linkedHabitId" | "linkedJourneyKey" | "linkedDreamScrollCategory"
  >
): boolean {
  return (
    goal.source === "auto" ||
    !!goal.sourceLabel ||
    !!goal.linkedHabitId ||
    !!goal.linkedJourneyKey ||
    !!goal.linkedDreamScrollCategory
  );
}

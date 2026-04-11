import { describe, it, expect } from "vitest";
import { isGoalLinked } from "./yearlyGoalUtils";

// Shape helper — only the fields isGoalLinked reads.
function g(partial: Partial<Parameters<typeof isGoalLinked>[0]>) {
  return {
    source: "manual" as const,
    sourceLabel: undefined,
    linkedHabitId: null,
    linkedJourneyKey: null,
    linkedDreamScrollCategory: null,
    ...partial,
  };
}

describe("isGoalLinked", () => {
  it("returns false for a plain manual goal with no links", () => {
    expect(isGoalLinked(g({}))).toBe(false);
  });

  it("returns true when server reports source='auto' (binary+link case)", () => {
    expect(isGoalLinked(g({ source: "auto" }))).toBe(true);
  });

  it("returns true when server reports a sourceLabel (count+link case — e.g. goal 18)", () => {
    // This is the "2 physical books" case: source='manual' but sourceLabel
    // exists because the value comes from the books_completed journey.
    expect(isGoalLinked(g({ source: "manual", sourceLabel: "Media Library" }))).toBe(true);
  });

  it("returns true for linkedHabitId", () => {
    expect(isGoalLinked(g({ linkedHabitId: 42 }))).toBe(true);
  });

  it("returns true for linkedJourneyKey", () => {
    expect(isGoalLinked(g({ linkedJourneyKey: "outdoor_days" }))).toBe(true);
  });

  it("returns true for linkedDreamScrollCategory", () => {
    expect(isGoalLinked(g({ linkedDreamScrollCategory: "travel" }))).toBe(true);
  });

  it("does not consider linkedHabitId = 0 as linked (covers falsy edge case)", () => {
    // A linkedHabitId of 0 would be falsy via `!!` — here we document the
    // current behavior. In practice habit IDs start at 1 so this is moot.
    expect(isGoalLinked(g({ linkedHabitId: 0 }))).toBe(false);
  });
});

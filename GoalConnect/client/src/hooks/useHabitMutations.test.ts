import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import type { ReactNode } from "react";

// --- Mocks -------------------------------------------------------------------

vi.mock("@/lib/queryClient", () => ({
  apiRequest: vi.fn(),
}));

const toastMock = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock, dismiss: vi.fn(), toasts: [] }),
}));

import { apiRequest } from "@/lib/queryClient";
import {
  useHabitMutations,
  optimisticToggle,
  type ToggleInput,
  type WeekResponse,
} from "./useHabitMutations";

const apiRequestMock = apiRequest as unknown as ReturnType<typeof vi.fn>;

// --- Fixtures ----------------------------------------------------------------

const WEEK_KEY = ["/api/habits/week"] as const;

function makeWeek(): WeekResponse {
  return {
    weekStart: "2026-04-13",
    weekDates: [
      "2026-04-13",
      "2026-04-14",
      "2026-04-15",
      "2026-04-16",
      "2026-04-17",
      "2026-04-18",
      "2026-04-19",
    ],
    habits: [
      {
        // Habit shape — only the fields we touch need real values; others
        // carry safe defaults (cast via `as` below) so the test stays narrow.
        id: 1,
        userId: 42,
        title: "Climb",
        description: "",
        icon: "dumbbell",
        color: "#e1a45c",
        cadence: "daily",
        targetPerWeek: 7,
        frequencyNumerator: 1,
        frequencyDenominator: 1,
        frequencyType: "daily",
        currentScore: "0",
        scoreHistory: [],
        difficulty: "medium",
        linkedGoalId: null,
        category: "training",
        effort: "medium",
        grade: "5.9",
        scheduledDay: null,
        goalType: "binary",
        targetValue: null,
        currentValue: 0,
        targetDate: null,
        createdDate: null,
        isLocked: false,
        primaryGoalAchieved: false,
        primaryGoalAchievedDate: null,
        requiresNote: false,
        notePlaceholder: null,
        logs: [null, null, null, null, null, null, null],
      },
    ],
  };
}

function makeToggleInput(overrides: Partial<ToggleInput> = {}): ToggleInput {
  return {
    habitId: 1,
    date: "2026-04-18",
    localHour: 10,
    ...overrides,
  };
}

// --- Wrapper -----------------------------------------------------------------

function makeWrapper(client: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

function freshClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

// --- Tests -------------------------------------------------------------------

beforeEach(() => {
  apiRequestMock.mockReset();
  toastMock.mockReset();
});

describe("optimisticToggle", () => {
  it("flips empty cell to completed", () => {
    const week = makeWeek();
    const next = optimisticToggle(week, makeToggleInput());
    const idx = week.weekDates.indexOf("2026-04-18");
    expect(next?.habits[0].logs[idx]?.completed).toBe(true);
  });

  it("returns the original week if the date is not in the window", () => {
    const week = makeWeek();
    const next = optimisticToggle(
      week,
      makeToggleInput({ date: "2099-01-01" }),
    );
    expect(next).toEqual(week);
  });
});

describe("useHabitMutations — toggle", () => {
  it("fires destructive toast on mutation error", async () => {
    const client = freshClient();
    apiRequestMock.mockRejectedValueOnce(new Error("boom"));

    const { result } = renderHook(() => useHabitMutations(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.toggle.mutateAsync(makeToggleInput()).catch(() => {
        // expected — error path under test
      });
    });

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalled();
    });

    const call = toastMock.mock.calls[0][0];
    expect(call.variant).toBe("destructive");
    expect(call.title).toBe("Couldn't save that");
    expect(call.description).toContain("boom");
  });

  it("rolls back the week cache on error", async () => {
    const client = freshClient();
    const initialWeek = makeWeek();
    client.setQueryData(WEEK_KEY, initialWeek);

    apiRequestMock.mockRejectedValueOnce(new Error("nope"));

    const { result } = renderHook(() => useHabitMutations(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.toggle.mutateAsync(makeToggleInput()).catch(() => {
        // expected
      });
    });

    // Cache should be restored to the original snapshot.
    await waitFor(() => {
      const current = client.getQueryData<WeekResponse>(WEEK_KEY);
      const idx = initialWeek.weekDates.indexOf("2026-04-18");
      expect(current?.habits[0].logs[idx]).toBeNull();
    });
  });
});

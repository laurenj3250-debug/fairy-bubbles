import { describe, it, expect } from "vitest";

import {
  parseStravaActivity,
  mapStravaActivityType,
  calculatePace,
  type ParsedStravaActivity,
} from "../strava-parser";
import type { StravaActivity } from "../strava-client";

// Test fixtures
const mockRunActivity: StravaActivity = {
  id: 98765,
  name: "Morning Run",
  type: "Run",
  sport_type: "Run",
  start_date: "2025-11-20T07:30:00Z",
  start_date_local: "2025-11-19T23:30:00Z",
  timezone: "(GMT-08:00) America/Los_Angeles",
  moving_time: 3600, // 1 hour
  elapsed_time: 3900,
  distance: 10000, // 10km
  total_elevation_gain: 150,
  average_speed: 2.78, // m/s
  max_speed: 4.2,
  average_heartrate: 145,
  max_heartrate: 175,
  calories: 650,
  suffer_score: 85,
  pr_count: 2,
  achievement_count: 5,
};

const mockRideActivity: StravaActivity = {
  id: 98766,
  name: "Evening Bike Ride",
  type: "Ride",
  sport_type: "Ride",
  start_date: "2025-11-20T18:00:00Z",
  start_date_local: "2025-11-20T10:00:00Z",
  timezone: "(GMT-08:00) America/Los_Angeles",
  moving_time: 7200, // 2 hours
  elapsed_time: 7800,
  distance: 50000, // 50km
  total_elevation_gain: 500,
  average_speed: 6.94, // m/s (~25 km/h)
  max_speed: 12.5,
  average_heartrate: 135,
  max_heartrate: 165,
  calories: 1200,
};

const mockSwimActivity: StravaActivity = {
  id: 98767,
  name: "Pool Swim",
  type: "Swim",
  sport_type: "Swim",
  start_date: "2025-11-21T06:00:00Z",
  start_date_local: "2025-11-20T22:00:00Z",
  timezone: "(GMT-08:00) America/Los_Angeles",
  moving_time: 2700, // 45 min
  elapsed_time: 3000,
  distance: 2000, // 2km
  average_heartrate: 130,
  max_heartrate: 155,
  calories: 400,
};

describe("parseStravaActivity", () => {
  it("should parse a running activity correctly", () => {
    const result = parseStravaActivity(mockRunActivity, 1);

    expect(result.userId).toBe(1);
    expect(result.sourceType).toBe("strava");
    expect(result.externalId).toBe("98765");
    expect(result.workoutType).toBe("Run");
    expect(result.durationMinutes).toBe(60);
    expect(result.distanceKm).toBe("10.00");
    expect(result.heartRateAvg).toBe(145);
    expect(result.heartRateMax).toBe(175);
    expect(result.caloriesBurned).toBe(650);
  });

  it("should parse start and end times correctly", () => {
    const result = parseStravaActivity(mockRunActivity, 1);

    expect(result.startTime).toEqual(new Date("2025-11-20T07:30:00Z"));
    // End time should be start + elapsed_time
    const expectedEnd = new Date("2025-11-20T07:30:00Z");
    expectedEnd.setSeconds(expectedEnd.getSeconds() + 3900);
    expect(result.endTime).toEqual(expectedEnd);
  });

  it("should store metadata correctly", () => {
    const result = parseStravaActivity(mockRunActivity, 1);

    expect(result.metadata).toMatchObject({
      name: "Morning Run",
      sport_type: "Run",
      timezone: "(GMT-08:00) America/Los_Angeles",
      elapsed_time: 3900,
      total_elevation_gain: 150,
      average_speed: 2.78,
      max_speed: 4.2,
      suffer_score: 85,
      pr_count: 2,
      achievement_count: 5,
    });
  });

  it("should handle activities without heart rate data", () => {
    const activityWithoutHR: StravaActivity = {
      ...mockRunActivity,
      average_heartrate: undefined,
      max_heartrate: undefined,
    };

    const result = parseStravaActivity(activityWithoutHR, 1);

    expect(result.heartRateAvg).toBeUndefined();
    expect(result.heartRateMax).toBeUndefined();
  });

  it("should handle activities without distance", () => {
    const activityWithoutDistance: StravaActivity = {
      ...mockRunActivity,
      distance: 0,
    };

    const result = parseStravaActivity(activityWithoutDistance, 1);

    expect(result.distanceKm).toBe("0.00");
  });

  it("should parse cycling activity correctly", () => {
    const result = parseStravaActivity(mockRideActivity, 1);

    expect(result.workoutType).toBe("Ride");
    expect(result.distanceKm).toBe("50.00");
    expect(result.durationMinutes).toBe(120);
  });

  it("should parse swimming activity correctly", () => {
    const result = parseStravaActivity(mockSwimActivity, 1);

    expect(result.workoutType).toBe("Swim");
    expect(result.distanceKm).toBe("2.00");
    expect(result.durationMinutes).toBe(45);
  });
});

describe("mapStravaActivityType", () => {
  it("should map Run correctly", () => {
    expect(mapStravaActivityType("Run")).toBe("Run");
  });

  it("should map Ride correctly", () => {
    expect(mapStravaActivityType("Ride")).toBe("Ride");
  });

  it("should map VirtualRide to Ride", () => {
    expect(mapStravaActivityType("VirtualRide")).toBe("Ride");
  });

  it("should map TrailRun to Run", () => {
    expect(mapStravaActivityType("TrailRun")).toBe("Run");
  });

  it("should map Swim correctly", () => {
    expect(mapStravaActivityType("Swim")).toBe("Swim");
  });

  it("should map Hike correctly", () => {
    expect(mapStravaActivityType("Hike")).toBe("Hike");
  });

  it("should map Walk correctly", () => {
    expect(mapStravaActivityType("Walk")).toBe("Walk");
  });

  it("should map Yoga correctly", () => {
    expect(mapStravaActivityType("Yoga")).toBe("Yoga");
  });

  it("should map WeightTraining correctly", () => {
    expect(mapStravaActivityType("WeightTraining")).toBe("WeightTraining");
  });

  it("should pass through unknown types", () => {
    expect(mapStravaActivityType("Snowboard")).toBe("Snowboard");
  });
});

describe("calculatePace", () => {
  it("should calculate running pace correctly (min/km)", () => {
    // 10km in 60 minutes = 6 min/km
    const pace = calculatePace(10000, 3600, "Run");
    expect(pace).toBe("6:00");
  });

  it("should calculate cycling speed correctly (km/h)", () => {
    // 50km in 2 hours = 25 km/h
    const speed = calculatePace(50000, 7200, "Ride");
    expect(speed).toBe("25.0 km/h");
  });

  it("should calculate swimming pace correctly (min/100m)", () => {
    // 2000m in 45 min = 2:15 per 100m
    const pace = calculatePace(2000, 2700, "Swim");
    expect(pace).toBe("2:15");
  });

  it("should handle zero distance", () => {
    const pace = calculatePace(0, 3600, "Run");
    expect(pace).toBe("--");
  });

  it("should handle zero time", () => {
    const pace = calculatePace(10000, 0, "Run");
    expect(pace).toBe("--");
  });
});

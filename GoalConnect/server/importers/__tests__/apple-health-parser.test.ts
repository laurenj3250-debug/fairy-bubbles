import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Import the parser (will be implemented)
import {
  parseAppleHealthXML,
  parseWorkoutElement,
  generateExternalId,
  SUPPORTED_WORKOUT_TYPES,
  type ParsedWorkout,
  type AppleHealthParserOptions,
} from "../apple-health-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturesPath = path.join(__dirname, "fixtures");

describe("Apple Health XML Parser", () => {
  let sampleXML: string;
  let emptyXML: string;
  let malformedXML: string;

  beforeAll(() => {
    sampleXML = fs.readFileSync(path.join(fixturesPath, "sample-apple-health.xml"), "utf-8");
    emptyXML = fs.readFileSync(path.join(fixturesPath, "empty-apple-health.xml"), "utf-8");
    malformedXML = fs.readFileSync(path.join(fixturesPath, "malformed-apple-health.xml"), "utf-8");
  });

  describe("parseAppleHealthXML", () => {
    it("should parse valid Apple Health XML and extract workouts", async () => {
      const result = await parseAppleHealthXML(sampleXML);

      expect(result.success).toBe(true);
      expect(result.workouts).toBeDefined();
      expect(result.workouts.length).toBe(4); // 4 workouts in sample
      expect(result.errors).toEqual([]);
    });

    it("should extract climbing workout with all attributes", async () => {
      const result = await parseAppleHealthXML(sampleXML);
      const climbingWorkout = result.workouts.find(
        (w) => w.workoutType === "HKWorkoutActivityTypeClimbing"
      );

      expect(climbingWorkout).toBeDefined();
      expect(climbingWorkout!.durationMinutes).toBe(52.5);
      expect(climbingWorkout!.caloriesBurned).toBe(387.5);
      expect(climbingWorkout!.sourceName).toBe("Apple Watch");
      expect(climbingWorkout!.heartRateAvg).toBe(142);
      expect(climbingWorkout!.heartRateMin).toBe(115);
      expect(climbingWorkout!.heartRateMax).toBe(178);
    });

    it("should extract metadata correctly", async () => {
      const result = await parseAppleHealthXML(sampleXML);
      const climbingWorkout = result.workouts.find(
        (w) => w.workoutType === "HKWorkoutActivityTypeClimbing"
      );

      expect(climbingWorkout!.metadata).toBeDefined();
      expect(climbingWorkout!.metadata.isIndoor).toBe(true);
      expect(climbingWorkout!.metadata.temperature).toBe("68 degF");
    });

    it("should extract distance for running workouts", async () => {
      const result = await parseAppleHealthXML(sampleXML);
      const runningWorkout = result.workouts.find(
        (w) => w.workoutType === "HKWorkoutActivityTypeRunning"
      );

      expect(runningWorkout).toBeDefined();
      expect(runningWorkout!.distanceKm).toBe(5.2);
    });

    it("should parse dates correctly", async () => {
      const result = await parseAppleHealthXML(sampleXML);
      const climbingWorkout = result.workouts.find(
        (w) => w.workoutType === "HKWorkoutActivityTypeClimbing"
      );

      expect(climbingWorkout!.startTime).toBeInstanceOf(Date);
      expect(climbingWorkout!.endTime).toBeInstanceOf(Date);
      expect(climbingWorkout!.startTime.getTime()).toBeLessThan(
        climbingWorkout!.endTime.getTime()
      );
    });

    it("should generate unique external IDs for each workout", async () => {
      const result = await parseAppleHealthXML(sampleXML);
      const externalIds = result.workouts.map((w) => w.externalId);
      const uniqueIds = new Set(externalIds);

      expect(uniqueIds.size).toBe(externalIds.length);
    });

    it("should return empty workouts array for XML with no workouts", async () => {
      const result = await parseAppleHealthXML(emptyXML);

      expect(result.success).toBe(true);
      expect(result.workouts).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("should handle malformed XML gracefully", async () => {
      const result = await parseAppleHealthXML(malformedXML);

      // Regex-based parser is tolerant - it skips malformed elements
      // rather than failing entirely. This is desired behavior for
      // partially corrupted exports.
      expect(result.success).toBe(true);
      // The malformed workout should be skipped
      expect(result.workouts.length).toBe(0);
    });

    it("should filter by workout types when specified", async () => {
      const options: AppleHealthParserOptions = {
        workoutTypes: ["HKWorkoutActivityTypeClimbing"],
      };
      const result = await parseAppleHealthXML(sampleXML, options);

      expect(result.success).toBe(true);
      expect(result.workouts.length).toBe(1);
      expect(result.workouts[0].workoutType).toBe("HKWorkoutActivityTypeClimbing");
    });

    it("should filter by date range when specified", async () => {
      const options: AppleHealthParserOptions = {
        startDate: new Date("2025-11-19T00:00:00Z"),
        endDate: new Date("2025-11-20T23:59:59Z"),
      };
      const result = await parseAppleHealthXML(sampleXML, options);

      expect(result.success).toBe(true);
      // Should include Nov 19 and Nov 20 workouts only
      expect(result.workouts.length).toBe(2);
    });

    it("should filter by minimum duration when specified", async () => {
      const options: AppleHealthParserOptions = {
        minDurationMinutes: 40,
      };
      const result = await parseAppleHealthXML(sampleXML, options);

      // Climbing (52.5 min) and Traditional Strength (45 min) should pass
      expect(result.workouts.length).toBe(2);
      result.workouts.forEach((w) => {
        expect(w.durationMinutes).toBeGreaterThanOrEqual(40);
      });
    });
  });

  describe("generateExternalId", () => {
    it("should generate consistent ID for same workout data", () => {
      const workout1 = {
        startTime: new Date("2025-11-20T09:00:00Z"),
        endTime: new Date("2025-11-20T09:52:30Z"),
        workoutType: "HKWorkoutActivityTypeClimbing",
      };

      const id1 = generateExternalId(workout1);
      const id2 = generateExternalId(workout1);

      expect(id1).toBe(id2);
    });

    it("should generate different IDs for different workouts", () => {
      const workout1 = {
        startTime: new Date("2025-11-20T09:00:00Z"),
        endTime: new Date("2025-11-20T09:52:30Z"),
        workoutType: "HKWorkoutActivityTypeClimbing",
      };

      const workout2 = {
        startTime: new Date("2025-11-19T09:00:00Z"),
        endTime: new Date("2025-11-19T09:52:30Z"),
        workoutType: "HKWorkoutActivityTypeClimbing",
      };

      expect(generateExternalId(workout1)).not.toBe(generateExternalId(workout2));
    });
  });

  describe("SUPPORTED_WORKOUT_TYPES", () => {
    it("should include common workout types", () => {
      expect(SUPPORTED_WORKOUT_TYPES).toContain("HKWorkoutActivityTypeClimbing");
      expect(SUPPORTED_WORKOUT_TYPES).toContain("HKWorkoutActivityTypeFunctionalStrengthTraining");
      expect(SUPPORTED_WORKOUT_TYPES).toContain("HKWorkoutActivityTypeTraditionalStrengthTraining");
      expect(SUPPORTED_WORKOUT_TYPES).toContain("HKWorkoutActivityTypeRunning");
    });
  });

  describe("ParsedWorkout type validation", () => {
    it("should have all required fields", async () => {
      const result = await parseAppleHealthXML(sampleXML);
      const workout = result.workouts[0];

      // Required fields
      expect(workout).toHaveProperty("externalId");
      expect(workout).toHaveProperty("workoutType");
      expect(workout).toHaveProperty("startTime");
      expect(workout).toHaveProperty("endTime");
      expect(workout).toHaveProperty("durationMinutes");
      expect(workout).toHaveProperty("metadata");

      // Optional fields should exist (may be undefined)
      expect("caloriesBurned" in workout).toBe(true);
      expect("heartRateAvg" in workout).toBe(true);
      expect("heartRateMin" in workout).toBe(true);
      expect("heartRateMax" in workout).toBe(true);
      expect("distanceKm" in workout).toBe(true);
      expect("sourceName" in workout).toBe(true);
    });
  });

  describe("Performance", () => {
    it("should handle large XML data efficiently", async () => {
      // Generate a larger XML by repeating workouts
      const workoutTemplate = `
        <Workout
          workoutActivityType="HKWorkoutActivityTypeClimbing"
          duration="30"
          durationUnit="min"
          totalEnergyBurned="200"
          totalEnergyBurnedUnit="kcal"
          sourceName="Apple Watch"
          creationDate="2025-11-20 10:00:00 -0800"
          startDate="2025-11-20 09:00:00 -0800"
          endDate="2025-11-20 09:30:00 -0800">
        </Workout>
      `;

      // Generate 100 workouts (should be fast)
      const manyWorkouts = Array(100)
        .fill(workoutTemplate)
        .map((w, i) => w.replace(/startDate="[^"]+"/g, `startDate="2025-01-${String(i % 28 + 1).padStart(2, '0')} 09:00:00 -0800"`))
        .join("\n");

      const largeXML = `<?xml version="1.0" encoding="UTF-8"?>
        <HealthData locale="en_US">
          <ExportDate value="2025-11-21 10:00:00 -0800"/>
          ${manyWorkouts}
        </HealthData>
      `;

      const startTime = Date.now();
      const result = await parseAppleHealthXML(largeXML);
      const elapsed = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.workouts.length).toBe(100);
      expect(elapsed).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });

  describe("Edge cases", () => {
    it("should handle workouts without heart rate data", async () => {
      const xmlWithoutHR = `<?xml version="1.0" encoding="UTF-8"?>
        <HealthData locale="en_US">
          <Workout
            workoutActivityType="HKWorkoutActivityTypeClimbing"
            duration="30"
            durationUnit="min"
            sourceName="Apple Watch"
            startDate="2025-11-20 09:00:00 -0800"
            endDate="2025-11-20 09:30:00 -0800">
          </Workout>
        </HealthData>
      `;

      const result = await parseAppleHealthXML(xmlWithoutHR);

      expect(result.success).toBe(true);
      expect(result.workouts.length).toBe(1);
      expect(result.workouts[0].heartRateAvg).toBeUndefined();
    });

    it("should handle workouts with duration in hours", async () => {
      const xmlWithHours = `<?xml version="1.0" encoding="UTF-8"?>
        <HealthData locale="en_US">
          <Workout
            workoutActivityType="HKWorkoutActivityTypeClimbing"
            duration="1.5"
            durationUnit="hr"
            sourceName="Apple Watch"
            startDate="2025-11-20 09:00:00 -0800"
            endDate="2025-11-20 10:30:00 -0800">
          </Workout>
        </HealthData>
      `;

      const result = await parseAppleHealthXML(xmlWithHours);

      expect(result.success).toBe(true);
      expect(result.workouts[0].durationMinutes).toBe(90); // 1.5 hours = 90 minutes
    });

    it("should handle empty string values gracefully", async () => {
      const xmlWithEmptyValues = `<?xml version="1.0" encoding="UTF-8"?>
        <HealthData locale="en_US">
          <Workout
            workoutActivityType="HKWorkoutActivityTypeClimbing"
            duration="30"
            durationUnit="min"
            totalEnergyBurned=""
            sourceName="Apple Watch"
            startDate="2025-11-20 09:00:00 -0800"
            endDate="2025-11-20 09:30:00 -0800">
          </Workout>
        </HealthData>
      `;

      const result = await parseAppleHealthXML(xmlWithEmptyValues);

      expect(result.success).toBe(true);
      expect(result.workouts[0].caloriesBurned).toBeUndefined();
    });

    it("should skip workouts with missing required fields", async () => {
      const xmlMissingRequired = `<?xml version="1.0" encoding="UTF-8"?>
        <HealthData locale="en_US">
          <Workout
            workoutActivityType="HKWorkoutActivityTypeClimbing"
            duration="30"
            sourceName="Apple Watch">
            <!-- Missing startDate and endDate -->
          </Workout>
          <Workout
            workoutActivityType="HKWorkoutActivityTypeRunning"
            duration="30"
            durationUnit="min"
            sourceName="Apple Watch"
            startDate="2025-11-20 09:00:00 -0800"
            endDate="2025-11-20 09:30:00 -0800">
          </Workout>
        </HealthData>
      `;

      const result = await parseAppleHealthXML(xmlMissingRequired);

      expect(result.success).toBe(true);
      // Only the valid workout should be included
      expect(result.workouts.length).toBe(1);
      expect(result.workouts[0].workoutType).toBe("HKWorkoutActivityTypeRunning");
    });
  });
});

# Import Data Schemas: Technical Specification

**Date**: 2025-11-21
**Purpose**: Define exact data structures for Apple Watch and Kilter Board integration

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [Apple Health XML Examples](#apple-health-xml-examples)
4. [Kilter Board API Examples](#kilter-board-api-examples)
5. [Validation Schemas](#validation-schemas)

---

## Database Schema

### 1. externalWorkouts

Stores all imported workout data from Apple Watch, Strava, or other fitness sources.

```sql
CREATE TABLE external_workouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL, -- 'apple_watch', 'strava', 'other'
  external_id TEXT NOT NULL, -- Unique ID from source for deduplication
  workout_type TEXT NOT NULL, -- 'HKWorkoutActivityTypeClimbing', etc.
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  heart_rate_avg INTEGER, -- bpm
  heart_rate_max INTEGER, -- bpm
  heart_rate_min INTEGER, -- bpm
  calories_burned INTEGER, -- kcal
  distance_km DECIMAL(10, 2), -- For cardio activities
  metadata JSONB DEFAULT '{}', -- Additional fields
  linked_habit_id INTEGER REFERENCES habits(id) ON DELETE SET NULL,
  imported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Deduplication constraint
  UNIQUE(user_id, source_type, external_id)
);

-- Indexes for performance
CREATE INDEX idx_external_workouts_user_date ON external_workouts(user_id, start_time);
CREATE INDEX idx_external_workouts_type ON external_workouts(workout_type);
CREATE INDEX idx_external_workouts_linked_habit ON external_workouts(linked_habit_id);
```

### 2. climbingSessions

Stores Kilter Board (and potentially other board) climbing session data.

```sql
CREATE TABLE climbing_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL DEFAULT 'kilter_board', -- 'kilter_board', 'tension_board', 'moonboard'
  external_id TEXT NOT NULL, -- Composite of session date + source
  session_date DATE NOT NULL,
  session_start_time TIMESTAMP,
  duration_minutes INTEGER,
  problems_attempted INTEGER NOT NULL DEFAULT 0,
  problems_sent INTEGER NOT NULL DEFAULT 0,
  average_grade VARCHAR(10), -- 'V4', '6b', etc.
  max_grade VARCHAR(10), -- Hardest send
  board_angle INTEGER, -- Degrees of overhang
  climbs JSONB DEFAULT '[]', -- Array of climb objects
  linked_habit_id INTEGER REFERENCES habits(id) ON DELETE SET NULL,
  imported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Deduplication constraint
  UNIQUE(user_id, source_type, external_id)
);

-- Indexes
CREATE INDEX idx_climbing_sessions_user_date ON climbing_sessions(user_id, session_date);
CREATE INDEX idx_climbing_sessions_linked_habit ON climbing_sessions(linked_habit_id);
```

### 3. dataSourceConnections

Manages user connections to external data sources and sync configuration.

```sql
CREATE TABLE data_source_connections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL, -- 'kilter_board', 'apple_watch', 'strava'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(20) DEFAULT 'idle', -- 'idle', 'syncing', 'error'
  sync_error TEXT, -- Last error message if any
  credentials JSONB, -- ENCRYPTED credentials
  sync_frequency VARCHAR(20) DEFAULT 'manual', -- 'manual', 'daily', 'weekly'
  auto_complete_habits BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- One connection per source per user
  UNIQUE(user_id, source_type)
);

-- Indexes
CREATE INDEX idx_data_source_connections_user ON data_source_connections(user_id);
CREATE INDEX idx_data_source_connections_active ON data_source_connections(is_active);
```

### 4. habitDataMappings

User-configured rules for matching external data to habits.

```sql
CREATE TABLE habit_data_mappings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL, -- 'apple_watch', 'kilter_board'
  match_criteria JSONB NOT NULL, -- { workoutType: 'Climbing', minDuration: 20 }
  auto_complete BOOLEAN DEFAULT TRUE,
  auto_increment BOOLEAN DEFAULT FALSE, -- For cumulative goals
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- One mapping per habit per source
  UNIQUE(habit_id, source_type)
);

-- Indexes
CREATE INDEX idx_habit_data_mappings_habit ON habit_data_mappings(habit_id);
CREATE INDEX idx_habit_data_mappings_user ON habit_data_mappings(user_id);
```

### 5. Modifications to habitLogs

Add fields to track auto-completion from external sources.

```sql
ALTER TABLE habit_logs
ADD COLUMN auto_complete_source VARCHAR(20), -- 'apple_watch', 'kilter_board', NULL
ADD COLUMN linked_workout_id INTEGER REFERENCES external_workouts(id) ON DELETE SET NULL,
ADD COLUMN linked_session_id INTEGER REFERENCES climbing_sessions(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_habit_logs_linked_workout ON habit_logs(linked_workout_id);
CREATE INDEX idx_habit_logs_linked_session ON habit_logs(linked_session_id);
```

---

## TypeScript Interfaces

### External Workouts

```typescript
// shared/types.ts

export type WorkoutSource = 'apple_watch' | 'strava' | 'other';
export type SyncFrequency = 'manual' | 'daily' | 'weekly';
export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface ExternalWorkout {
  id: number;
  userId: number;
  sourceType: WorkoutSource;
  externalId: string;
  workoutType: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  heartRateMin?: number;
  caloriesBurned?: number;
  distanceKm?: number;
  metadata: Record<string, any>;
  linkedHabitId?: number;
  importedAt: Date;
  createdAt: Date;
}

export interface ExternalWorkoutInsert {
  userId: number;
  sourceType: WorkoutSource;
  externalId: string;
  workoutType: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  heartRateMin?: number;
  caloriesBurned?: number;
  distanceKm?: number;
  metadata?: Record<string, any>;
  linkedHabitId?: number;
}
```

### Climbing Sessions

```typescript
export type ClimbingSource = 'kilter_board' | 'tension_board' | 'moonboard';

export interface ClimbDetails {
  climbId: string;
  name: string;
  grade: string; // 'V4', '6b'
  angle: number;
  attempts: number;
  sent: boolean;
  sentAt?: Date;
  quality?: number; // 1-5 rating
}

export interface ClimbingSession {
  id: number;
  userId: number;
  sourceType: ClimbingSource;
  externalId: string;
  sessionDate: Date;
  sessionStartTime?: Date;
  durationMinutes?: number;
  problemsAttempted: number;
  problemsSent: number;
  averageGrade?: string;
  maxGrade?: string;
  boardAngle?: number;
  climbs: ClimbDetails[];
  linkedHabitId?: number;
  importedAt: Date;
  createdAt: Date;
}

export interface ClimbingSessionInsert {
  userId: number;
  sourceType: ClimbingSource;
  externalId: string;
  sessionDate: Date;
  sessionStartTime?: Date;
  durationMinutes?: number;
  problemsAttempted: number;
  problemsSent: number;
  averageGrade?: string;
  maxGrade?: string;
  boardAngle?: number;
  climbs: ClimbDetails[];
  linkedHabitId?: number;
}
```

### Data Source Connections

```typescript
export interface DataSourceConnection {
  id: number;
  userId: number;
  sourceType: string;
  isActive: boolean;
  lastSyncAt?: Date;
  syncStatus: SyncStatus;
  syncError?: string;
  credentials: Record<string, any>; // Encrypted in DB
  syncFrequency: SyncFrequency;
  autoCompleteHabits: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSourceConnectionInsert {
  userId: number;
  sourceType: string;
  isActive?: boolean;
  credentials: Record<string, any>;
  syncFrequency?: SyncFrequency;
  autoCompleteHabits?: boolean;
}
```

### Habit Data Mappings

```typescript
export interface MatchCriteria {
  workoutType?: string | string[]; // 'HKWorkoutActivityTypeClimbing'
  minDuration?: number; // minutes
  maxDuration?: number;
  minCalories?: number;
  keywords?: string[]; // Match in workout metadata
  boardAngle?: number; // For climbing
  minGrade?: string; // For climbing
}

export interface HabitDataMapping {
  id: number;
  userId: number;
  habitId: number;
  sourceType: string;
  matchCriteria: MatchCriteria;
  autoComplete: boolean;
  autoIncrement: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitDataMappingInsert {
  userId: number;
  habitId: number;
  sourceType: string;
  matchCriteria: MatchCriteria;
  autoComplete?: boolean;
  autoIncrement?: boolean;
}
```

---

## Apple Health XML Examples

### Example 1: Climbing Workout

```xml
<Workout
  workoutActivityType="HKWorkoutActivityTypeClimbing"
  duration="52.36789"
  durationUnit="min"
  totalEnergyBurned="387.5"
  totalEnergyBurnedUnit="kcal"
  sourceName="Apple Watch"
  sourceVersion="10.1"
  device="&lt;&lt;HKDevice: 0x123456789, name:Apple Watch, manufacturer:Apple Inc., model:Watch, hardware:Watch6,4, software:10.1&gt;&gt;"
  creationDate="2025-11-21 10:15:30 -0800"
  startDate="2025-11-21 09:00:00 -0800"
  endDate="2025-11-21 09:52:22 -0800">

  <MetadataEntry key="HKIndoorWorkout" value="1"/>
  <MetadataEntry key="HKWeatherTemperature" value="68 degF"/>

  <WorkoutStatistics
    type="HKQuantityTypeIdentifierHeartRate"
    startDate="2025-11-21 09:00:00 -0800"
    endDate="2025-11-21 09:52:22 -0800"
    average="142"
    minimum="115"
    maximum="178"
    sum="0"
    unit="count/min"/>

  <WorkoutStatistics
    type="HKQuantityTypeIdentifierActiveEnergyBurned"
    startDate="2025-11-21 09:00:00 -0800"
    endDate="2025-11-21 09:52:22 -0800"
    average="0"
    minimum="0"
    maximum="0"
    sum="387.5"
    unit="kcal"/>
</Workout>
```

### Example 2: Functional Strength Training

```xml
<Workout
  workoutActivityType="HKWorkoutActivityTypeFunctionalStrengthTraining"
  duration="35.12345"
  durationUnit="min"
  totalEnergyBurned="245.8"
  totalEnergyBurnedUnit="kcal"
  sourceName="Fitness+"
  startDate="2025-11-20 18:30:00 -0800"
  endDate="2025-11-20 19:05:07 -0800">

  <MetadataEntry key="HKIndoorWorkout" value="1"/>
</Workout>
```

### Parsing Strategy

```typescript
// server/importers/apple-health-parser.ts

interface ParsedWorkout {
  externalId: string; // Generated from startDate + endDate + workoutType
  workoutType: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  caloriesBurned?: number;
  heartRateAvg?: number;
  heartRateMax?: number;
  heartRateMin?: number;
  metadata: {
    sourceName?: string;
    sourceVersion?: string;
    isIndoor?: boolean;
    temperature?: string;
  };
}

function parseWorkoutElement(workoutXml: Element): ParsedWorkout {
  const startDate = new Date(workoutXml.getAttribute('startDate')!);
  const endDate = new Date(workoutXml.getAttribute('endDate')!);

  // Generate external ID for deduplication
  const externalId = `${startDate.toISOString()}-${endDate.toISOString()}-${workoutXml.getAttribute('workoutActivityType')}`;

  // Parse duration
  const duration = parseFloat(workoutXml.getAttribute('duration') || '0');
  const durationUnit = workoutXml.getAttribute('durationUnit');
  const durationMinutes = durationUnit === 'min' ? duration : duration * 60;

  // Parse calories
  const calories = parseFloat(workoutXml.getAttribute('totalEnergyBurned') || '0');

  // Parse heart rate from WorkoutStatistics
  const heartRateStats = Array.from(workoutXml.getElementsByTagName('WorkoutStatistics'))
    .find(stat => stat.getAttribute('type') === 'HKQuantityTypeIdentifierHeartRate');

  const heartRateAvg = heartRateStats ? parseInt(heartRateStats.getAttribute('average') || '0') : undefined;
  const heartRateMax = heartRateStats ? parseInt(heartRateStats.getAttribute('maximum') || '0') : undefined;
  const heartRateMin = heartRateStats ? parseInt(heartRateStats.getAttribute('minimum') || '0') : undefined;

  // Parse metadata
  const metadataEntries = Array.from(workoutXml.getElementsByTagName('MetadataEntry'));
  const metadata: any = {
    sourceName: workoutXml.getAttribute('sourceName') || undefined,
    sourceVersion: workoutXml.getAttribute('sourceVersion') || undefined,
  };

  metadataEntries.forEach(entry => {
    const key = entry.getAttribute('key');
    const value = entry.getAttribute('value');
    if (key === 'HKIndoorWorkout') {
      metadata.isIndoor = value === '1';
    }
  });

  return {
    externalId,
    workoutType: workoutXml.getAttribute('workoutActivityType')!,
    startTime: startDate,
    endTime: endDate,
    durationMinutes,
    caloriesBurned: calories > 0 ? calories : undefined,
    heartRateAvg,
    heartRateMax,
    heartRateMin,
    metadata,
  };
}
```

---

## Kilter Board API Examples

### Login Request/Response

**Request**:
```http
POST https://api.kilterboardapp.com/v1/logins
Content-Type: application/json

{
  "username": "climber@example.com",
  "password": "secretpassword",
  "tou": true,
  "pp": true
}
```

**Response**:
```json
{
  "login": {
    "id": 12345,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user_id": 67890,
    "username": "climber@example.com",
    "created_at": "2025-11-21T10:00:00Z",
    "expires_at": "2025-11-28T10:00:00Z"
  }
}
```

### Sync Request/Response

**Request**:
```http
POST https://api.kilterboardapp.com/v1/sync
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "client": {
    "enforces_product_passwords": 1,
    "enforce_hover_time": 1,
    "enforce_minimum_time": 1
  },
  "tables": {
    "ascents": "2025-11-20T00:00:00Z",
    "attempts": "2025-11-20T00:00:00Z",
    "climbs": "2024-01-01T00:00:00Z"
  }
}
```

**Response (abbreviated)**:
```json
{
  "PUT": {
    "climbs": [
      {
        "uuid": "abc123-def456-ghi789",
        "layout_id": 1,
        "setter_id": 5432,
        "setter_username": "route_setter_pro",
        "name": "Crimpy Delights",
        "description": "Technical crimps with a dynamic finish",
        "frames": "p1083r15p1117r15p1151r16p1185r13...",
        "angle": 40,
        "quality_average": 4.2,
        "difficulty_average": 5.8,
        "benchmark_difficulty": "V5",
        "is_draft": false,
        "created_at": "2025-11-15T08:30:00Z"
      }
    ],
    "ascents": [
      {
        "uuid": "ascent-xyz789",
        "climb_uuid": "abc123-def456-ghi789",
        "user_id": 67890,
        "angle": 40,
        "is_mirror": false,
        "attempt_id": 12,
        "bid_count": 1,
        "quality": 5,
        "difficulty": 6,
        "is_benchmark": true,
        "climbed_at": "2025-11-20T14:30:00Z",
        "created_at": "2025-11-20T14:35:00Z"
      }
    ],
    "attempts": [
      {
        "uuid": "attempt-123abc",
        "climb_uuid": "abc123-def456-ghi789",
        "user_id": 67890,
        "angle": 40,
        "attempt_number": 5,
        "bid_count": 0,
        "attempted_at": "2025-11-19T16:00:00Z",
        "created_at": "2025-11-19T16:15:00Z"
      }
    ]
  }
}
```

### Derived Session Data

**Note**: Kilter Board API doesn't provide explicit "sessions" - we must derive them from ascents/attempts.

**Derivation Logic**:
```typescript
interface KilterAscent {
  climb_uuid: string;
  climbed_at: string;
  angle: number;
  difficulty: number;
  quality: number;
}

interface KilterAttempt {
  climb_uuid: string;
  attempted_at: string;
  angle: number;
  attempt_number: number;
}

function groupIntoSessions(
  ascents: KilterAscent[],
  attempts: KilterAttempt[]
): ClimbingSession[] {
  // Combine and sort by timestamp
  const activities = [
    ...ascents.map(a => ({ timestamp: new Date(a.climbed_at), type: 'ascent', data: a })),
    ...attempts.map(a => ({ timestamp: new Date(a.attempted_at), type: 'attempt', data: a }))
  ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const sessions: ClimbingSession[] = [];
  let currentSession: ClimbingSession | null = null;
  const SESSION_GAP_HOURS = 4; // 4 hours between activities = new session

  for (const activity of activities) {
    if (!currentSession ||
        activity.timestamp.getTime() - currentSession.sessionStartTime!.getTime() > SESSION_GAP_HOURS * 60 * 60 * 1000) {
      // Start new session
      if (currentSession) sessions.push(currentSession);

      currentSession = {
        userId: userId,
        sourceType: 'kilter_board',
        sessionDate: activity.timestamp,
        sessionStartTime: activity.timestamp,
        problemsAttempted: 0,
        problemsSent: 0,
        climbs: []
      };
    }

    // Add to current session
    if (activity.type === 'ascent') {
      currentSession.problemsSent++;
      currentSession.climbs.push({
        climbId: activity.data.climb_uuid,
        sent: true,
        sentAt: activity.timestamp,
        grade: difficultyToGrade(activity.data.difficulty),
        angle: activity.data.angle,
        attempts: 1, // Lookup from attempts array
        quality: activity.data.quality
      });
    } else {
      currentSession.problemsAttempted++;
    }
  }

  if (currentSession) sessions.push(currentSession);
  return sessions;
}

// Map Kilter difficulty (1-18) to V-scale
function difficultyToGrade(difficulty: number): string {
  const gradeMap: Record<number, string> = {
    1: 'V0', 2: 'V0', 3: 'V1', 4: 'V2',
    5: 'V3', 6: 'V3', 7: 'V4', 8: 'V4',
    9: 'V5', 10: 'V5', 11: 'V6', 12: 'V6',
    13: 'V7', 14: 'V8', 15: 'V9', 16: 'V10',
    17: 'V11', 18: 'V12+'
  };
  return gradeMap[difficulty] || 'V?';
}
```

---

## Validation Schemas

### Zod Schemas for API Validation

```typescript
// shared/validation.ts

import { z } from 'zod';

export const externalWorkoutInsertSchema = z.object({
  userId: z.number().positive(),
  sourceType: z.enum(['apple_watch', 'strava', 'other']),
  externalId: z.string().min(1),
  workoutType: z.string().min(1),
  startTime: z.date(),
  endTime: z.date(),
  durationMinutes: z.number().positive(),
  heartRateAvg: z.number().positive().optional(),
  heartRateMax: z.number().positive().optional(),
  heartRateMin: z.number().positive().optional(),
  caloriesBurned: z.number().positive().optional(),
  distanceKm: z.number().positive().optional(),
  metadata: z.record(z.any()).optional(),
  linkedHabitId: z.number().positive().optional(),
});

export const climbingSessionInsertSchema = z.object({
  userId: z.number().positive(),
  sourceType: z.enum(['kilter_board', 'tension_board', 'moonboard']),
  externalId: z.string().min(1),
  sessionDate: z.date(),
  sessionStartTime: z.date().optional(),
  durationMinutes: z.number().positive().optional(),
  problemsAttempted: z.number().nonnegative(),
  problemsSent: z.number().nonnegative(),
  averageGrade: z.string().optional(),
  maxGrade: z.string().optional(),
  boardAngle: z.number().min(0).max(90).optional(),
  climbs: z.array(z.object({
    climbId: z.string(),
    name: z.string().optional(),
    grade: z.string(),
    angle: z.number(),
    attempts: z.number().positive(),
    sent: z.boolean(),
    sentAt: z.date().optional(),
    quality: z.number().min(1).max(5).optional(),
  })),
  linkedHabitId: z.number().positive().optional(),
});

export const dataSourceConnectionInsertSchema = z.object({
  userId: z.number().positive(),
  sourceType: z.string().min(1),
  isActive: z.boolean().optional(),
  credentials: z.record(z.any()),
  syncFrequency: z.enum(['manual', 'daily', 'weekly']).optional(),
  autoCompleteHabits: z.boolean().optional(),
});

export const habitDataMappingInsertSchema = z.object({
  userId: z.number().positive(),
  habitId: z.number().positive(),
  sourceType: z.string().min(1),
  matchCriteria: z.object({
    workoutType: z.union([z.string(), z.array(z.string())]).optional(),
    minDuration: z.number().positive().optional(),
    maxDuration: z.number().positive().optional(),
    minCalories: z.number().positive().optional(),
    keywords: z.array(z.string()).optional(),
    boardAngle: z.number().optional(),
    minGrade: z.string().optional(),
  }),
  autoComplete: z.boolean().optional(),
  autoIncrement: z.boolean().optional(),
});
```

---

## API Endpoints Structure

### Import Endpoints

```typescript
// POST /api/import/apple-health
// Upload Apple Health XML file
{
  file: File, // multipart/form-data
  options?: {
    workoutTypes?: string[], // Filter specific types
    startDate?: string, // Only import workouts after this date
    endDate?: string,
    autoMatch?: boolean // Automatically match to habits
  }
}

// Response
{
  success: true,
  imported: {
    workouts: 125,
    habitsCompleted: 18,
    goalsUpdated: 3
  },
  errors: []
}

// POST /api/import/kilter-board
// Connect Kilter Board account
{
  username: string,
  password: string,
  syncFrequency: 'manual' | 'daily' | 'weekly',
  autoComplete: boolean
}

// Response
{
  success: true,
  connectionId: 123,
  userId: 67890
}

// POST /api/sync/kilter-board
// Trigger manual sync
{
  connectionId: number,
  options?: {
    startDate?: string,
    includeAttempts?: boolean
  }
}

// Response
{
  success: true,
  synced: {
    sessions: 15,
    problems: 87,
    habitsCompleted: 12
  }
}
```

---

## Summary

This technical specification provides:

✅ **Complete database schema** with migrations
✅ **TypeScript interfaces** for type safety
✅ **Real-world data examples** from both sources
✅ **Parsing strategies** with code examples
✅ **Validation schemas** using Zod
✅ **API endpoint definitions**

---

## Implementation Status

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Database schema & migrations | ✅ Complete |
| 2 | Apple Health XML parser | ✅ Complete |
| 3 | Kilter Board data import | ✅ Complete |
| 4 | Habit matching & auto-completion | ✅ Complete |
| 5 | Frontend import UI | 🔲 Pending |
| 6 | Analytics dashboard | 🔲 Pending |

### Phase 2 Deliverables (Completed 2025-11-21)

**Parser Module**: `server/importers/apple-health-parser.ts`
- Regex-based XML parsing (efficient for large 50MB+ files)
- SHA-256 based deduplication IDs
- Filtering by workout type, date range, min duration
- Heart rate, calories, distance extraction
- Metadata (indoor/outdoor, temperature) parsing

**API Endpoints**: `server/routes/import.ts`
- `POST /api/import/apple-health` - Upload XML file
- `GET /api/import/workouts` - List imported workouts
- `GET /api/import/workouts/:id` - Get single workout
- `DELETE /api/import/workouts/:id` - Delete workout
- `DELETE /api/import/workouts` - Delete all (with source filter)
- `GET /api/import/stats` - Import statistics
- `GET /api/import/supported-workout-types` - List supported types

**Tests**: `server/importers/__tests__/apple-health-parser.test.ts`
- 20 unit tests covering parsing, filtering, edge cases, performance
- Test fixtures for sample, empty, and malformed XML

### Phase 3 Deliverables (Completed 2025-11-21)

**API Client**: `server/importers/kilter-board-client.ts`
- Authentication with Kilter Board API (Bearer tokens)
- Sync endpoint for fetching ascents, attempts, and climbs
- Token validation for session management
- Error handling with custom KilterBoardError class

**Parser Module**: `server/importers/kilter-board-parser.ts`
- Session grouping from ascents/attempts by date
- Grade conversion: Kilter difficulty (1-18) to V-scale (V0-V12+)
- Session statistics: avg/max grade, duration, problems sent/attempted
- SHA-256 based external ID generation for deduplication

**API Endpoints**: `server/routes/kilter-board.ts`
- `POST /api/import/kilter-board/connect` - Connect account & initial sync
- `POST /api/import/kilter-board/sync` - Manual sync trigger
- `DELETE /api/import/kilter-board/disconnect` - Disconnect account
- `GET /api/import/kilter-board/status` - Connection status
- `GET /api/import/kilter-board/sessions` - List climbing sessions
- `GET /api/import/kilter-board/sessions/:id` - Get single session
- `GET /api/import/kilter-board/stats` - Climbing statistics

**Tests**:
- `kilter-board-client.test.ts` - 22 tests for API client (auth, sync, errors)
- `kilter-board-parser.test.ts` - 24 tests for parser (grouping, grades, stats)
- Test fixtures for API response mocking

### Phase 4 Deliverables (Completed 2025-11-21)

**Habit Matching Engine**: `server/services/habit-matcher.ts`
- Flexible match criteria: workout type, duration, calories, grade, problems
- Criteria checking for both workouts and climbing sessions
- Grade comparison utilities (V0-V12+ scale)
- Match result processing with action types (complete/increment)

**Auto-Completion Service**: `server/services/habit-auto-complete.ts`
- Binary habit auto-completion from matched workouts/sessions
- Cumulative goal incrementing (e.g., +8 problems sent)
- Manual log preservation (never overrides user entries)
- Linked workout/session tracking in habit logs

**API Endpoints**: `server/routes/habit-mappings.ts`
- `GET /api/habit-mappings` - List user's habit mappings
- `GET /api/habit-mappings/:id` - Get single mapping
- `POST /api/habit-mappings` - Create mapping
- `PUT /api/habit-mappings/:id` - Update mapping
- `DELETE /api/habit-mappings/:id` - Delete mapping
- `GET /api/habit-mappings/for-habit/:habitId` - Mappings for specific habit

**Tests**:
- `habit-matcher.test.ts` - 34 tests for matching logic and criteria checking

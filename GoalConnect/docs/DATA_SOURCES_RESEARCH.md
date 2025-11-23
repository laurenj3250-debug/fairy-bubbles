# Data Sources Research: Apple Watch & Kilter Board Integration

**Date**: 2025-11-21
**Status**: Phase 0 Complete - Ready for Implementation

## Summary

Research completed for integrating Apple Watch health data and Kilter Board climbing statistics into GoalConnect. Both data sources are accessible, though Kilter Board requires reverse-engineered API usage due to lack of official documentation.

---

## Kilter Board (Aurora Climbing)

### API Access Method

**Status**: ✅ Accessible via reverse-engineered API
**Official API**: ❌ No public documentation from Aurora Climbing
**Best Approach**: Use community tools or implement custom client

### Authentication

- **Method**: Bearer token authentication
- **Endpoint**: `POST https://api.kilterboardapp.com/v1/logins`
- **Credentials Required**: Username and password for Kilter Board account
- **Request Payload**:
  ```json
  {
    "username": "user@example.com",
    "password": "password",
    "tou": true,
    "pp": true
  }
  ```
- **Response**: Returns `login.token` for use in subsequent API calls
- **Token Storage**: Must be stored securely (encrypted) in database

### Available Data

#### Primary Endpoint: `/v1/sync`
- **Method**: POST with Bearer token
- **Response Size**: ~4MB JSON
- **Contains**:
  - All climbs (problems) with grades, setters, names, descriptions
  - Routes with layout information (hold positions)
  - User attempts and ascents (sends)
  - Circuits and user bids
  - Wall configurations and board angles
  - LED mappings and hold placements
  - Draft climbs (user-created)

#### Data Structures

**Climbs**:
- Problem ID, name, setter
- Grade (V-scale or font grades)
- Frames (sequence of holds with roles)
- Layout encoded as `p[position]r[role]` (e.g., "p1083r15p1117r15")
- Creation date, difficulty, quality ratings

**Ascents** (Sends):
- Climb ID, user ID
- Timestamp of send
- Attempt count before success
- Bid status (flash, send, project)
- Angle of board at time of send

**Attempts**:
- Climb ID, user ID
- Number of attempts
- Date attempted
- Success status

**Sessions** (Derived):
- Must be calculated from ascent/attempt timestamps
- Group activities by date/time proximity
- Calculate session duration, volume, average grade

### Implementation Options

1. **Option A: Use BoardLib (Python)**
   - ✅ Proven, community-tested
   - ✅ Handles auth and sync
   - ❌ Python dependency (we're Node/TS)
   - **Approach**: Create Python microservice or use child_process

2. **Option B: Custom TypeScript Client** ⭐ RECOMMENDED
   - ✅ Native to our stack
   - ✅ Full control over data parsing
   - ✅ Can integrate directly into Express backend
   - ❌ Must implement auth and parsing ourselves
   - **Approach**: Build client in `server/importers/kilter-board-client.ts`

3. **Option C: SQLite Database Export via BoardLib**
   - ✅ One-time setup, offline data
   - ❌ Not real-time
   - ❌ Requires manual syncs
   - **Approach**: Use as fallback if API issues

### Recommended Implementation

**Custom TypeScript Client** with these endpoints:
```typescript
// server/importers/kilter-board-client.ts
class KilterBoardClient {
  async login(username: string, password: string): Promise<string>
  async sync(token: string): Promise<KilterSyncData>
  async getUserAscents(token: string, userId: number): Promise<Ascent[]>
  async getUserAttempts(token: string, userId: number): Promise<Attempt[]>
}
```

### Data to Track

For GoalConnect integration, we want:
- ✅ Problems sent (with grade, date, attempts)
- ✅ Session data (date, duration, problem count, grade distribution)
- ✅ Progress metrics (max grade, volume over time)
- ✅ Board angle used
- ✅ Attempt/send ratios

---

## Apple Watch (Apple Health)

### Data Access Method

**Status**: ✅ Accessible via XML export
**Official API**: HealthKit (iOS/macOS apps only)
**Best Approach**: Manual XML export upload

### Export Process

1. **On iPhone**:
   - Open Health app → Profile → Export All Health Data
   - Generates `export.zip` file
2. **File Contents**:
   - `export.xml` - Main health data (can be 50MB+)
   - `export_cda.xml` - Clinical data (optional)
   - `workout-routes/` - GPS route data (optional)
   - `electrocardiograms/` - ECG data (optional)

### XML Structure: Workout Elements

#### Workout Attributes

```xml
<Workout
  workoutActivityType="HKWorkoutActivityTypeClimbing"
  duration="45.5"
  durationUnit="min"
  totalDistance="0"
  totalDistanceUnit="km"
  totalEnergyBurned="350"
  totalEnergyBurnedUnit="kcal"
  sourceName="Apple Watch"
  sourceVersion="10.1"
  device="&lt;&lt;HKDevice: ...&gt;&gt;"
  creationDate="2025-11-21 08:30:00 -0800"
  startDate="2025-11-21 08:00:00 -0800"
  endDate="2025-11-21 08:45:30 -0800">

  <MetadataEntry key="HKIndoorWorkout" value="1"/>
  <WorkoutStatistics type="HKQuantityTypeIdentifierHeartRate"
                     startDate="2025-11-21 08:00:00 -0800"
                     endDate="2025-11-21 08:45:30 -0800"
                     average="145"
                     minimum="120"
                     maximum="175"
                     sum="0"
                     unit="count/min"/>
</Workout>
```

#### Available Fields

**Required**:
- `workoutActivityType` - Exercise type identifier
- `startDate` - When workout started
- `endDate` - When workout ended
- `sourceName` - Device/app name

**Optional but Common**:
- `duration` + `durationUnit` - Length in minutes/hours
- `totalDistance` + `totalDistanceUnit` - For cardio (km, mi)
- `totalEnergyBurned` + `totalEnergyBurnedUnit` - Calories (kcal)
- `creationDate` - When data was synced
- `sourceVersion` - OS version
- `device` - Device details

**Child Elements**:
- `MetadataEntry` - Additional key-value data (indoor/outdoor, etc.)
- `WorkoutStatistics` - Aggregated metrics (heart rate, power, etc.)
- `WorkoutEvent` - Lap markers, pauses
- `WorkoutRoute` - GPS coordinates (separate files)

### Workout Activity Types (Relevant)

Apple uses `HKWorkoutActivityType` enum:
- `HKWorkoutActivityTypeClimbing` - Indoor climbing
- `HKWorkoutActivityTypeBouldering` - Bouldering (if tracked separately)
- `HKWorkoutActivityTypeTraditionalStrengthTraining` - Gym workouts
- `HKWorkoutActivityTypeFunctionalStrengthTraining` - Functional training
- `HKWorkoutActivityTypeCrossTraining` - General cross-training
- `HKWorkoutActivityTypeOther` - Generic workouts

### Heart Rate Data

❗ **Important**: Heart rate is stored as **separate `<Record>` elements**, NOT nested in workouts.

```xml
<Record
  type="HKQuantityTypeIdentifierHeartRate"
  sourceName="Apple Watch"
  unit="count/min"
  value="145"
  startDate="2025-11-21 08:15:30 -0800"
  endDate="2025-11-21 08:15:30 -0800"/>
```

To associate heart rate with workouts:
1. Parse workout start/end times
2. Find all `HeartRate` records within that time range
3. Calculate average, min, max from individual records
4. **OR** use `WorkoutStatistics` if available (more reliable)

### Implementation Approach

**XML Parsing Strategy**:
1. **Library**: Use `xml2js` or Node's built-in `XMLParser`
2. **Streaming**: For large files (50MB+), use SAX parser to avoid memory issues
3. **Workflow**:
   - User uploads `export.xml` via frontend
   - Backend streams and parses workouts
   - Filter by activity type (climbing, strength)
   - Store in `externalWorkouts` table
   - Match to habits by date + type

**Parser Implementation**:
```typescript
// server/importers/apple-health-parser.ts
class AppleHealthParser {
  async parseWorkouts(xmlFile: Buffer): Promise<Workout[]>
  async parseHeartRateRecords(xmlFile: Buffer, startDate: Date, endDate: Date): Promise<HeartRate[]>
  filterByActivityType(workouts: Workout[], types: string[]): Workout[]
}
```

### Data to Track

For GoalConnect integration:
- ✅ Workout sessions (type, date, duration)
- ✅ Calories burned
- ✅ Heart rate stats (avg, min, max)
- ✅ Indoor vs outdoor (from metadata)
- ✅ Source device (Watch vs iPhone)
- ⚠️ Distance (for cardio activities)
- ❌ GPS routes (too complex for Phase 1)

---

## Integration Strategy

### Matching Workouts to Habits

#### Apple Watch → Habits

**Matching Logic**:
```typescript
// Match by date + workout type
if (workout.workoutActivityType === 'HKWorkoutActivityTypeClimbing') {
  // Find habits with category='training' and effort matching duration
  matchToHabits(habits.filter(h => h.category === 'training'))
}
```

**Matching Rules**:
1. **Date Match**: Workout date = habit log date
2. **Type Match**: Map Apple workout types to habit categories:
   - `Climbing/Bouldering` → habits with "climb" in title or category='training'
   - `StrengthTraining` → habits with "strength" or "gym" in title
   - `FunctionalStrengthTraining` → foundation category habits
3. **Duration Threshold**: Only auto-complete if workout ≥ threshold (e.g., 20 min)

#### Kilter Board → Habits

**Matching Logic**:
```typescript
// Match by date + climbing activity
if (session.problemsSent >= 1) {
  // Find climbing habits or cumulative "50 climbs" goals
  matchToClimbingHabits(habits.filter(h => h.goalType === 'cumulative'))
}
```

**Matching Rules**:
1. **Date Match**: Session date = habit log date
2. **Cumulative Goals**: Increment `currentValue` by `problemsSent`
3. **Binary Habits**: Auto-complete if session duration ≥ threshold OR problems sent ≥ threshold
4. **Grade-Based**: If habit has grade requirement, only count sends at/above that grade

### Deduplication Strategy

**Problem**: User might manually log habit THEN import workout data (or vice versa)

**Solution**:
1. Store external ID in `externalWorkouts` table (unique constraint)
2. Before auto-completing:
   ```typescript
   const existingLog = await getHabitLog(habitId, date)
   if (existingLog && !existingLog.autoCompleteSource) {
     // Manual entry exists, don't override
     return
   }
   ```
3. Add `autoCompleteSource` field to `habitLogs`:
   - `null` = manual entry
   - `'apple_watch'` = auto from Apple Health
   - `'kilter_board'` = auto from Kilter
4. Allow user to "unlink" and revert to manual

---

## Database Schema Requirements

### New Tables

```typescript
// externalWorkouts - Store all imported workout data
{
  id: serial
  userId: integer
  sourceType: 'apple_watch' | 'strava' | 'other'
  externalId: text // For deduplication
  workoutType: text // HKWorkoutActivityType or custom
  startTime: timestamp
  endTime: timestamp
  durationMinutes: integer
  heartRateAvg: integer?
  heartRateMax: integer?
  heartRateMin: integer?
  caloriesBurned: integer?
  metadata: jsonb // Additional fields
  linkedHabitId: integer? // If matched
  importedAt: timestamp
}

// climbingSessions - Kilter Board specific
{
  id: serial
  userId: integer
  sourceType: 'kilter_board'
  externalId: text
  sessionDate: date
  sessionStartTime: timestamp?
  durationMinutes: integer?
  problemsAttempted: integer
  problemsSent: integer
  averageGrade: text // "V4"
  maxGrade: text // "V7"
  boardAngle: integer // degrees
  climbs: jsonb // Array of climb details
  linkedHabitId: integer?
  importedAt: timestamp
}

// dataSourceConnections - Manage API credentials
{
  id: serial
  userId: integer
  sourceType: 'kilter_board' | 'apple_watch'
  isActive: boolean
  lastSyncAt: timestamp?
  credentials: jsonb // ENCRYPTED
  syncFrequency: 'manual' | 'daily' | 'weekly'
  autoCompleteHabits: boolean
}

// habitDataMappings - User-configured matching rules
{
  id: serial
  userId: integer
  habitId: integer
  sourceType: text
  matchCriteria: jsonb // { workoutType: 'Climbing', minDuration: 20 }
  autoComplete: boolean
  autoIncrement: boolean // For cumulative goals
}
```

### Schema Modifications

**habitLogs** table - Add:
```typescript
autoCompleteSource: 'apple_watch' | 'kilter_board' | null
linkedWorkoutId: integer? // FK to externalWorkouts or climbingSessions
```

---

## Technical Decisions

### ✅ Confirmed Approaches

1. **Kilter Board**: Custom TypeScript client using reverse-engineered API
2. **Apple Health**: XML upload parser (not HealthKit)
3. **Matching**: Rule-based engine with user configuration
4. **Credentials**: Encrypted storage using Node crypto module
5. **Deduplication**: Composite unique index on (userId, sourceType, externalId)

### ⚠️ Open Questions

1. **Sync Frequency**: How often should Kilter auto-sync? (Recommendation: Daily at midnight)
2. **Conflict Resolution**: What if manual log conflicts with imported workout? (Recommendation: Manual takes precedence)
3. **Historical Import**: Import all past data or just forward-looking? (Recommendation: Let user choose)
4. **Performance**: Large XML files (50MB+) - stream or in-memory? (Recommendation: Stream parsing with progress updates)

### 🚧 Future Enhancements (Not Phase 1)

- [ ] Strava integration (another popular fitness tracker)
- [ ] Real-time HealthKit integration (requires native iOS app)
- [ ] Automatic Apple Health sync via third-party service
- [ ] GPS route visualization for outdoor climbs
- [ ] Comparative analytics (predicted vs actual performance)

---

## Next Steps: Phase 1

Ready to begin implementation:

1. **Create database schema** (Phase 1)
2. **Implement Apple Health XML parser** (Phase 2)
3. **Implement Kilter Board API client** (Phase 3)
4. **Build matching engine** (Phase 4)

See main implementation plan for detailed breakdown.

---

## References

- BoardLib: https://github.com/lemeryfertitta/BoardLib
- Kilter Board API Research: https://bazun.me/blog/kiterboard
- Apple Health XML Structure: https://www.tdda.info/in-defence-of-xml-exporting-and-analysing-apple-health-data
- Apple Health Parsing Guide: https://gist.github.com/hoffa/936db2bb85e134709cd263dd358ca309

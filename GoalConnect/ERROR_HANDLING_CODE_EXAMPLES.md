# Error Handling & Validation - Code Examples

## Table of Contents
1. [Custom Error Types](#custom-error-types)
2. [Validation Helpers](#validation-helpers)
3. [Route Handler Patterns](#route-handler-patterns)
4. [Error Boundary Usage](#error-boundary-usage)
5. [Before/After Comparisons](#beforeafter-comparisons)

---

## Custom Error Types

### Usage Examples

```typescript
import {
  DatabaseError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  AuthenticationError,
  NetworkError,
} from './server/errors';

// Not Found
throw new NotFoundError("Habit not found", "Habit", habitId);
// → 404 with { error: "Habit not found", resourceType: "Habit", resourceId: 123 }

// Validation Error
throw new ValidationError("Invalid habit ID", "habitId", "abc");
// → 400 with { error: "Invalid habit ID", field: "habitId", invalidValue: "abc" }

// Authorization Error
throw new AuthorizationError("You don't have permission to view this habit");
// → 403 with { error: "You don't have permission..." }

// Database Error
throw new DatabaseError("Failed to update pet", "updateVirtualPet");
// → 500 with { error: "Database operation failed (updateVirtualPet): ..." }

// Authentication Error
throw new AuthenticationError("Session expired. Please log in again.");
// → 401 with { error: "Session expired..." }

// Network Error
throw new NetworkError();
// → 503 with { error: "Network connection lost. Please check your internet." }
```

### Error Utility Functions

```typescript
import {
  isApiError,
  isOperationalError,
  getErrorMessage,
  getErrorStatusCode,
  formatErrorForLogging,
} from './server/errors';

// Type guard
if (isApiError(error)) {
  console.log(error.statusCode); // TypeScript knows statusCode exists
}

// Check if operational (expected) vs programmer error
if (isOperationalError(error)) {
  // Show to user
} else {
  // Alert developers
}

// Safely get message from unknown error
const message = getErrorMessage(error); // Always returns string

// Get status code (defaults to 500)
const code = getErrorStatusCode(error);

// Format for logging
const errorLog = formatErrorForLogging(error);
console.error("[Handler]", errorLog);
// {
//   message: "Habit not found",
//   type: "NotFoundError",
//   statusCode: 404,
//   resourceType: "Habit",
//   resourceId: 123,
//   stack: "..."
// }
```

---

## Validation Helpers

### parseNumericId (Programmatic)

```typescript
import { parseNumericId } from './server/validation';

app.get("/api/habits/:id", async (req, res) => {
  try {
    // Validates and returns number (throws ValidationError if invalid)
    const id = parseNumericId(req.params.id, 'habit ID');

    // id is guaranteed to be a valid positive integer
    const habit = await storage.getHabit(id);

    res.json(habit);
  } catch (error) {
    sendError(res, error, "Unable to load habit");
  }
});

// Test cases:
// req.params.id = "123" → returns 123 ✅
// req.params.id = "abc" → throws ValidationError ❌
// req.params.id = "-5" → throws ValidationError ❌
// req.params.id = "3.14" → throws ValidationError ❌
// req.params.id = "" → throws ValidationError ❌
```

### validateNumericId (Middleware)

```typescript
import { validateNumericId } from './server/validation';

// Single param
app.get(
  "/api/habits/:id",
  validateNumericId('id'), // Middleware validates before handler
  async (req, res) => {
    const id = parseInt(req.params.id); // Guaranteed valid
    // ...
  }
);

// Multiple params
import { validateNumericIds } from './server/validation';

app.get(
  "/api/habits/:habitId/goals/:goalId",
  validateNumericIds('habitId', 'goalId'),
  async (req, res) => {
    // Both IDs validated
  }
);
```

### validateRequiredFields

```typescript
import { validateRequiredFields } from './server/validation';

app.post(
  "/api/habits",
  validateRequiredFields(['name', 'category']),
  async (req, res) => {
    // name and category guaranteed to exist
    const { name, category } = req.body;
    // ...
  }
);

// Missing field → 400: "Missing required fields: name, category"
```

### validateDateFormat

```typescript
import { validateDateFormat } from './server/validation';

app.get(
  "/api/habits/logs/:date",
  validateDateFormat('date'),
  async (req, res) => {
    const date = req.params.date; // Guaranteed YYYY-MM-DD format
    // ...
  }
);

// Valid: "2025-11-20" ✅
// Invalid: "11/20/2025" ❌
// Invalid: "2025-13-01" ❌
```

### validateEnum

```typescript
import { validateEnum } from './server/validation';

app.get(
  "/api/habits/filter/:status",
  validateEnum('status', ['active', 'archived', 'completed'], 'params'),
  async (req, res) => {
    const status = req.params.status; // One of the allowed values
    // ...
  }
);

// status = "active" ✅
// status = "invalid" → 400: "Invalid status: must be one of active, archived, completed"
```

---

## Route Handler Patterns

### Pattern 1: Simple GET with ID

```typescript
import { parseNumericId } from './validation';
import { NotFoundError, AuthorizationError } from './errors';
import { sendError } from './error-handler';

app.get("/api/habits/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseNumericId(req.params.id, 'habit ID');

    const habit = await storage.getHabit(id);
    if (!habit) {
      throw new NotFoundError("Habit not found", "Habit", id);
    }

    if (habit.userId !== userId) {
      throw new AuthorizationError("You don't have permission to view this habit");
    }

    res.json(habit);
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    console.error(`[GET /api/habits/:id] Error:`, errorLog);
    sendError(res, error, "Unable to load this habit. Please try again.");
  }
});
```

### Pattern 2: POST with Zod Validation

```typescript
import { insertHabitSchema } from '@shared/schema';
import { sendError } from './error-handler';

app.post("/api/habits", async (req, res) => {
  try {
    const userId = getUserId(req);

    // Zod validation (throws ZodError if invalid)
    const validated = insertHabitSchema.parse({ ...req.body, userId });

    const habit = await storage.createHabit(validated);
    res.status(201).json(habit);
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    console.error("[POST /api/habits] Error:", errorLog);
    sendError(res, error, "Unable to create habit. Please check your input.");
  }
});
```

### Pattern 3: PATCH/PUT with Validation

```typescript
app.patch("/api/habits/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseNumericId(req.params.id, 'habit ID');

    // Verify ownership
    const existing = await storage.getHabit(id);
    if (!existing) {
      throw new NotFoundError("Habit not found", "Habit", id);
    }
    if (existing.userId !== userId) {
      throw new AuthorizationError("You don't have permission to update this habit");
    }

    // Update
    const habit = await storage.updateHabit(id, req.body);
    res.json(habit);
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    console.error(`[PATCH /api/habits/:id] Error:`, errorLog);
    sendError(res, error, "Unable to update this habit. Please try again.");
  }
});
```

### Pattern 4: DELETE

```typescript
app.delete("/api/habits/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseNumericId(req.params.id, 'habit ID');

    // Verify ownership
    const existing = await storage.getHabit(id);
    if (!existing) {
      throw new NotFoundError("Habit not found", "Habit", id);
    }
    if (existing.userId !== userId) {
      throw new AuthorizationError("You don't have permission to delete this habit");
    }

    await storage.deleteHabit(id);
    res.status(204).send();
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    console.error(`[DELETE /api/habits/:id] Error:`, errorLog);
    sendError(res, error, "Unable to delete this habit. Please try again.");
  }
});
```

### Pattern 5: Database Operations with Error Handling

```typescript
import { DatabaseError } from './errors';

async function updatePetStats(userId: number) {
  try {
    const pet = await storage.getVirtualPet(userId);

    if (!pet) {
      try {
        return await storage.createVirtualPet({ /* ... */ });
      } catch (createError) {
        const errorLog = formatErrorForLogging(createError);
        console.error("[updatePetStats] Failed to create pet:", errorLog);
        throw new DatabaseError(getErrorMessage(createError), "createVirtualPet");
      }
    }

    try {
      await storage.updateVirtualPet(pet.id, { /* ... */ });
    } catch (updateError) {
      const errorLog = formatErrorForLogging(updateError);
      console.error("[updatePetStats] Failed to update pet:", errorLog);
      throw new DatabaseError(getErrorMessage(updateError), "updateVirtualPet");
    }
  } catch (error) {
    // Re-throw DatabaseError, convert others
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError(getErrorMessage(error), "updatePetStats");
  }
}
```

### Pattern 6: Using asyncHandler

```typescript
import { asyncHandler } from './error-handler';

// Automatically catches Promise rejections
app.get("/api/habits", asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const habits = await storage.getHabits(userId);
  res.json(habits);
}));

// Errors automatically passed to error handler middleware
```

---

## Error Boundary Usage

### Basic Usage

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary fallbackMessage="App crashed">
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Nested Boundaries

```tsx
function App() {
  return (
    <ErrorBoundary fallbackMessage="GoalConnect encountered an error">
      <Providers>
        <ErrorBoundary fallbackMessage="Page failed to load">
          <Routes />
        </ErrorBoundary>
      </Providers>
    </ErrorBoundary>
  );
}
```

### With Error Callback

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Send to error tracking service
    Sentry.captureException(error, {
      contexts: { react: errorInfo }
    });
  };

  return (
    <ErrorBoundary
      fallbackMessage="Something went wrong"
      onError={handleError}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Per-Page Boundaries

```tsx
function Routes() {
  return (
    <Switch>
      <Route path="/habits">
        <ErrorBoundary fallbackMessage="Habits page error">
          <HabitsPage />
        </ErrorBoundary>
      </Route>
      <Route path="/goals">
        <ErrorBoundary fallbackMessage="Goals page error">
          <GoalsPage />
        </ErrorBoundary>
      </Route>
    </Switch>
  );
}
```

---

## Before/After Comparisons

### Comparison 1: Error Handling

**Before:**
```typescript
app.get("/api/habits/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id); // Could be NaN
    const habit = await storage.getHabit(id);
    if (!habit) {
      return res.status(404).json({ error: "Habit not found" });
    }
    res.json(habit);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch habit" });
  }
});

// Problems:
// ❌ No validation (NaN passes through)
// ❌ Uses 'any' type
// ❌ Generic error message
// ❌ No structured logging
// ❌ No authorization check
```

**After:**
```typescript
app.get("/api/habits/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseNumericId(req.params.id, 'habit ID'); // ✅ Validated

    const habit = await storage.getHabit(id);
    if (!habit) {
      throw new NotFoundError("Habit not found", "Habit", id); // ✅ Typed error
    }

    if (habit.userId !== userId) {
      throw new AuthorizationError("Access denied"); // ✅ Authorization
    }

    res.json(habit);
  } catch (error) { // ✅ No 'any'
    const errorLog = formatErrorForLogging(error); // ✅ Structured logging
    console.error(`[GET /api/habits/:id]`, errorLog);
    sendError(res, error, "Unable to load this habit."); // ✅ Specific message
  }
});
```

### Comparison 2: Silent Failures

**Before:**
```typescript
async function updatePetStats(userId: number) {
  try {
    const stats = calculatePetStats(habits, logs, pet);
    await storage.updateVirtualPet(pet.id, stats);
    return { stats };
  } catch (error) {
    console.error("Failed to update pet:", error);
    return null; // ❌ Silent failure
  }
}

// Caller:
const result = await updatePetStats(userId);
if (result) {
  // Success
} else {
  // Failure - but user never knows!
}
```

**After:**
```typescript
async function updatePetStats(userId: number) {
  try {
    const stats = calculatePetStats(habits, logs, pet);

    try {
      await storage.updateVirtualPet(pet.id, stats);
    } catch (updateError) {
      const errorLog = formatErrorForLogging(updateError);
      console.error("[updatePetStats] Update failed:", errorLog);
      throw new DatabaseError(getErrorMessage(updateError), "updateVirtualPet");
    }

    return { stats };
  } catch (error) {
    // ✅ Re-throw instead of returning null
    throw error instanceof DatabaseError
      ? error
      : new DatabaseError(getErrorMessage(error), "updatePetStats");
  }
}

// Caller:
try {
  const result = await updatePetStats(userId);
  showSuccess("Pet updated!");
} catch (error) {
  // ✅ Error properly caught
  showError("Failed to update pet. Please try again.");
}
```

### Comparison 3: Input Validation

**Before:**
```typescript
// Test: curl /api/habits/abc
// Result: 500 Internal Server Error
// {
//   "error": "Failed to fetch habit"
// }

app.get("/api/habits/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id); // ❌ id = NaN
    const habit = await storage.getHabit(id); // ❌ Database query with NaN
    res.json(habit);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch habit" });
  }
});
```

**After:**
```typescript
// Test: curl /api/habits/abc
// Result: 400 Bad Request
// {
//   "error": "Invalid habit ID: must be a number",
//   "field": "habit ID",
//   "invalidValue": "abc"
// }

app.get("/api/habits/:id", async (req, res) => {
  try {
    const id = parseNumericId(req.params.id, 'habit ID');
    // ✅ Throws ValidationError if invalid, never reaches database

    const habit = await storage.getHabit(id);
    res.json(habit);
  } catch (error) {
    sendError(res, error, "Unable to load habit");
  }
});
```

### Comparison 4: Error Messages

**Before:**
```typescript
// Generic, unhelpful messages
"Failed to fetch habits"
"Failed to update habit"
"Failed to delete habit"
"Habit not found"
"Access denied"
"Invalid habit data"
```

**After:**
```typescript
// Specific, actionable messages
"Unable to load your habits. Please check your connection and try again."
"Unable to update this habit. Please check your input and try again."
"Unable to delete this habit. Please try again or contact support."
"Habit not found" (with resource type and ID in logs)
"You don't have permission to view this habit"
"Invalid habit ID: must be a positive integer"
"Invalid input: name is required"
```

### Comparison 5: React Error Boundaries

**Before:**
```tsx
function App() {
  return <HabitsPage />; // ❌ Single error crashes entire app
}

// Result: White screen of death
// User sees: Blank page
// Console: Uncaught Error: ...
```

**After:**
```tsx
function App() {
  return (
    <ErrorBoundary fallbackMessage="GoalConnect encountered an error">
      <HabitsPage /> {/* ✅ Errors caught */}
    </ErrorBoundary>
  );
}

// Result: User-friendly error UI
// User sees:
// ┌─────────────────────────────────────┐
// │ ⚠️  GoalConnect encountered an error │
// │                                     │
// │ We've encountered an unexpected     │
// │ error. Don't worry, your data is    │
// │ safe.                               │
// │                                     │
// │ [Try Again]  [Reload Page]          │
// └─────────────────────────────────────┘
```

---

## Integration Examples

### Full Route with All Patterns

```typescript
import { parseNumericId, validateRequiredFields } from './validation';
import {
  DatabaseError,
  ValidationError,
  NotFoundError,
  AuthorizationError,
  formatErrorForLogging,
  getErrorMessage,
} from './errors';
import { sendError, asyncHandler } from './error-handler';
import { insertHabitSchema } from '@shared/schema';

// GET with validation
app.get("/api/habits/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseNumericId(req.params.id, 'habit ID');

    const habit = await storage.getHabit(id);
    if (!habit) {
      throw new NotFoundError("Habit not found", "Habit", id);
    }

    if (habit.userId !== userId) {
      throw new AuthorizationError("You don't have permission to view this habit");
    }

    res.json(habit);
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    console.error(`[GET /api/habits/:id]`, errorLog);
    sendError(res, error, "Unable to load this habit.");
  }
});

// POST with Zod validation
app.post("/api/habits", async (req, res) => {
  try {
    const userId = getUserId(req);
    const validated = insertHabitSchema.parse({ ...req.body, userId });

    try {
      const habit = await storage.createHabit(validated);
      res.status(201).json(habit);
    } catch (dbError) {
      const errorLog = formatErrorForLogging(dbError);
      console.error("[POST /api/habits] Database error:", errorLog);
      throw new DatabaseError(getErrorMessage(dbError), "createHabit");
    }
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    console.error("[POST /api/habits]", errorLog);
    sendError(res, error, "Unable to create habit. Please check your input.");
  }
});

// PATCH with validation
app.patch("/api/habits/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseNumericId(req.params.id, 'habit ID');

    const existing = await storage.getHabit(id);
    if (!existing) {
      throw new NotFoundError("Habit not found", "Habit", id);
    }

    if (existing.userId !== userId) {
      throw new AuthorizationError("You don't have permission to update this habit");
    }

    const habit = await storage.updateHabit(id, req.body);
    res.json(habit);
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    console.error(`[PATCH /api/habits/:id]`, errorLog);
    sendError(res, error, "Unable to update this habit.");
  }
});

// DELETE with validation
app.delete("/api/habits/:id", async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = parseNumericId(req.params.id, 'habit ID');

    const existing = await storage.getHabit(id);
    if (!existing) {
      throw new NotFoundError("Habit not found", "Habit", id);
    }

    if (existing.userId !== userId) {
      throw new AuthorizationError("You don't have permission to delete this habit");
    }

    await storage.deleteHabit(id);
    res.status(204).send();
  } catch (error) {
    const errorLog = formatErrorForLogging(error);
    console.error(`[DELETE /api/habits/:id]`, errorLog);
    sendError(res, error, "Unable to delete this habit.");
  }
});
```

---

**Generated:** 2025-11-20
**Purpose:** Reference guide for error handling patterns

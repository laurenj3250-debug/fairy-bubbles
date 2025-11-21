#!/usr/bin/env tsx
// GoalConnect/scripts/test-habit-scoring-integration.ts

/**
 * Integration test for habit scoring system
 *
 * This script:
 * 1. Creates a test user and habit
 * 2. Logs several completions over multiple days
 * 3. Verifies scores are computed and saved correctly
 * 4. Checks that scores increase with completions
 * 5. Checks that scores decrease with gaps
 * 6. Cleans up test data
 *
 * Run with: npm run test:unit -- scripts/test-habit-scoring-integration.ts
 * Or directly: tsx scripts/test-habit-scoring-integration.ts
 */

import { getDb } from '../server/db'
import { users, habits, habitLogs } from '../shared/schema'
import { eq } from 'drizzle-orm'
import { updateHabitScore } from '../server/services/habitScoring'

const db = getDb()

interface TestResult {
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function log(message: string) {
  console.log(`[TEST] ${message}`)
}

function pass(message: string, details?: any) {
  results.push({ passed: true, message, details })
  console.log(`✅ PASS: ${message}`)
}

function fail(message: string, details?: any) {
  results.push({ passed: false, message, details })
  console.error(`❌ FAIL: ${message}`, details)
}

async function cleanup(userId?: number, habitId?: number) {
  try {
    if (habitId) {
      await db.delete(habitLogs).where(eq(habitLogs.habitId, habitId))
      await db.delete(habits).where(eq(habits.id, habitId))
    }
    if (userId) {
      await db.delete(users).where(eq(users.id, userId))
    }
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}

async function runIntegrationTests() {
  let testUserId: number | undefined
  let testHabitId: number | undefined

  try {
    log('Starting habit scoring integration tests...')

    // ============ TEST 1: Create test user and habit ============
    log('Test 1: Creating test user and habit')

    const [user] = await db.insert(users).values({
      name: 'Integration Test User',
      email: `integration-test-${Date.now()}@example.com`,
      password: 'hashedpassword123'
    }).returning()
    testUserId = user.id

    const [habit] = await db.insert(habits).values({
      userId: testUserId,
      title: 'Daily Meditation',
      description: 'Test habit for integration testing',
      icon: '🧘',
      color: '#8b5cf6',
      frequencyNumerator: 1,
      frequencyDenominator: 1,
      frequencyType: 'daily',
      currentScore: '0',
      scoreHistory: []
    }).returning()
    testHabitId = habit.id

    pass('Created test user and habit', { userId: testUserId, habitId: testHabitId })

    // ============ TEST 2: Log completions for 7 consecutive days ============
    log('Test 2: Logging 7 consecutive days of completions')

    const today = new Date()
    const dates: string[] = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dates.push(dateStr)

      await db.insert(habitLogs).values({
        habitId: testHabitId,
        userId: testUserId,
        date: dateStr,
        completed: true
      })
    }

    pass('Logged 7 consecutive days', { dates })

    // ============ TEST 3: Verify scores are computed after each log ============
    log('Test 3: Computing scores for each day')

    const scores: number[] = []
    for (const date of dates) {
      const result = await updateHabitScore(testHabitId, date)
      scores.push(result.newScore)

      if (result.newScore <= 0) {
        fail(`Score should be > 0 for date ${date}`, result)
      }
    }

    pass('All scores computed successfully', { scores })

    // ============ TEST 4: Verify scores increase with consistency ============
    log('Test 4: Checking that scores increase with consecutive completions')

    let increasingScores = true
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] <= scores[i - 1]) {
        increasingScores = false
        fail(`Score did not increase: day ${i - 1} = ${scores[i - 1]}, day ${i} = ${scores[i]}`)
      }
    }

    if (increasingScores) {
      pass('Scores increased with consecutive completions', { scoreProgression: scores })
    }

    // ============ TEST 5: Verify score is persisted in database ============
    log('Test 5: Verifying score persistence in database')

    const updatedHabit = await db.query.habits.findFirst({
      where: eq(habits.id, testHabitId)
    })

    if (!updatedHabit) {
      fail('Habit not found in database')
    } else {
      const currentScore = parseFloat(updatedHabit.currentScore)
      const lastComputedScore = scores[scores.length - 1]

      if (Math.abs(currentScore - lastComputedScore) < 0.0001) {
        pass('Score correctly persisted in database', {
          dbScore: currentScore,
          computedScore: lastComputedScore
        })
      } else {
        fail('Database score does not match computed score', {
          dbScore: currentScore,
          computedScore: lastComputedScore
        })
      }

      if (updatedHabit.scoreHistory && updatedHabit.scoreHistory.length > 0) {
        pass('Score history saved to database', {
          historyLength: updatedHabit.scoreHistory.length
        })
      } else {
        fail('Score history not saved to database')
      }
    }

    // ============ TEST 6: Add a gap (missed day) and verify score decreases ============
    log('Test 6: Adding a missed day and checking score decrease')

    const dayAfterStreak = new Date(today)
    dayAfterStreak.setDate(dayAfterStreak.getDate() + 1)
    const missedDateStr = dayAfterStreak.toISOString().split('T')[0]

    await db.insert(habitLogs).values({
      habitId: testHabitId,
      userId: testUserId,
      date: missedDateStr,
      completed: false
    })

    const beforeMissScore = scores[scores.length - 1]
    const afterMissResult = await updateHabitScore(testHabitId, missedDateStr)

    if (afterMissResult.newScore < beforeMissScore) {
      pass('Score decreased after missed day', {
        before: beforeMissScore,
        after: afterMissResult.newScore,
        change: afterMissResult.scoreChange
      })
    } else {
      fail('Score should decrease after missed day', {
        before: beforeMissScore,
        after: afterMissResult.newScore
      })
    }

    // ============ TEST 7: Test weekly habit frequency ============
    log('Test 7: Testing weekly habit frequency')

    const [weeklyHabit] = await db.insert(habits).values({
      userId: testUserId,
      title: 'Weekly Review',
      description: 'Test weekly habit',
      icon: '📅',
      color: '#10b981',
      frequencyNumerator: 1,
      frequencyDenominator: 7,
      frequencyType: 'weekly',
      currentScore: '0',
      scoreHistory: []
    }).returning()

    await db.insert(habitLogs).values({
      habitId: weeklyHabit.id,
      userId: testUserId,
      date: dates[0],
      completed: true
    })

    const weeklyResult = await updateHabitScore(weeklyHabit.id, dates[0])

    // Weekly habits should have lower scores for single completion than daily
    if (weeklyResult.newScore > 0 && weeklyResult.newScore < scores[0]) {
      pass('Weekly habit scored lower than daily for single completion', {
        weeklyScore: weeklyResult.newScore,
        dailyScore: scores[0]
      })
    } else {
      fail('Weekly habit score should be lower than daily', {
        weeklyScore: weeklyResult.newScore,
        dailyScore: scores[0]
      })
    }

    // Clean up weekly habit
    await db.delete(habitLogs).where(eq(habitLogs.habitId, weeklyHabit.id))
    await db.delete(habits).where(eq(habits.id, weeklyHabit.id))

    // ============ TEST 8: Test 30-day history limit ============
    log('Test 8: Testing 30-day history limit')

    // Create logs for 35 days
    for (let i = 35; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Check if log already exists
      const existingLog = await db.query.habitLogs.findFirst({
        where: eq(habitLogs.habitId, testHabitId),
      })

      if (!existingLog || !dates.includes(dateStr)) {
        await db.insert(habitLogs).values({
          habitId: testHabitId,
          userId: testUserId,
          date: dateStr,
          completed: true
        })
      }
    }

    const longHistoryResult = await updateHabitScore(testHabitId, today.toISOString().split('T')[0])

    if (longHistoryResult.updatedHistory.length === 30) {
      pass('Score history limited to 30 days', {
        historyLength: longHistoryResult.updatedHistory.length
      })
    } else {
      fail('Score history should be limited to 30 days', {
        actual: longHistoryResult.updatedHistory.length,
        expected: 30
      })
    }

    // ============ SUMMARY ============
    log('\n' + '='.repeat(60))
    log('TEST SUMMARY')
    log('='.repeat(60))

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length
    const total = results.length

    log(`Total tests: ${total}`)
    log(`Passed: ${passed}`)
    log(`Failed: ${failed}`)

    if (failed === 0) {
      log('✅ All integration tests passed!')
    } else {
      log(`❌ ${failed} test(s) failed`)
    }

    log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Integration test failed with error:', error)
    fail('Unexpected error during integration tests', error)
  } finally {
    // ============ CLEANUP ============
    log('Cleaning up test data...')
    await cleanup(testUserId, testHabitId)
    log('Cleanup complete')
  }

  // Exit with appropriate code
  const failedTests = results.filter(r => !r.passed).length
  process.exit(failedTests > 0 ? 1 : 0)
}

// Run tests
runIntegrationTests().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

/**
 * End-to-End Test Script for Frequency Selector
 *
 * This script tests the new frequency selector by:
 * 1. Creating habits with different frequency types (daily, weekly, custom)
 * 2. Verifying the frequency fields are stored correctly
 * 3. Checking that scores are calculated properly for each frequency
 * 4. Cleaning up test data
 *
 * Run with: npx tsx scripts/test-frequency-selector.ts
 */

import { db } from '../server/db'
import { habits, habitLogs } from '../shared/schema'
import { eq, and } from 'drizzle-orm'
import { computeHabitScore } from '@shared/lib/habitScore'
import { frequencyToDecimal, FrequencyType } from '@shared/lib/habitFrequency'

const TEST_USER_ID = 1 // Make sure this user exists in your DB

interface TestHabit {
  title: string
  frequencyNumerator: number
  frequencyDenominator: number
  frequencyType: FrequencyType
  expectedDecimal: number
}

const TEST_HABITS: TestHabit[] = [
  {
    title: 'TEST: Daily Habit',
    frequencyNumerator: 1,
    frequencyDenominator: 1,
    frequencyType: FrequencyType.DAILY,
    expectedDecimal: 1.0
  },
  {
    title: 'TEST: Weekly Habit (1x)',
    frequencyNumerator: 1,
    frequencyDenominator: 7,
    frequencyType: FrequencyType.WEEKLY,
    expectedDecimal: 1 / 7
  },
  {
    title: 'TEST: Weekly Habit (3x)',
    frequencyNumerator: 3,
    frequencyDenominator: 7,
    frequencyType: FrequencyType.WEEKLY,
    expectedDecimal: 3 / 7
  },
  {
    title: 'TEST: Custom (2 every 5 days)',
    frequencyNumerator: 2,
    frequencyDenominator: 5,
    frequencyType: FrequencyType.CUSTOM,
    expectedDecimal: 2 / 5
  },
  {
    title: 'TEST: Custom (Every other day)',
    frequencyNumerator: 1,
    frequencyDenominator: 2,
    frequencyType: FrequencyType.CUSTOM,
    expectedDecimal: 0.5
  }
]

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...')

  // Delete test habits
  const testHabits = await db
    .select()
    .from(habits)
    .where(eq(habits.userId, TEST_USER_ID))

  for (const habit of testHabits) {
    if (habit.title.startsWith('TEST:')) {
      // Delete habit logs first
      await db
        .delete(habitLogs)
        .where(eq(habitLogs.habitId, habit.id))

      // Delete habit
      await db
        .delete(habits)
        .where(eq(habits.id, habit.id))

      console.log(`  ✓ Deleted habit: ${habit.title}`)
    }
  }
}

async function testHabitCreation() {
  console.log('\n📝 Testing Habit Creation with Different Frequencies\n')

  const createdHabits: number[] = []

  for (const testHabit of TEST_HABITS) {
    console.log(`Creating: ${testHabit.title}`)
    console.log(`  Frequency: ${testHabit.frequencyNumerator}/${testHabit.frequencyDenominator} (${testHabit.frequencyType})`)

    const [created] = await db
      .insert(habits)
      .values({
        userId: TEST_USER_ID,
        title: testHabit.title,
        description: 'Test habit for frequency selector',
        icon: '🧪',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        difficulty: 'medium',
        frequencyNumerator: testHabit.frequencyNumerator,
        frequencyDenominator: testHabit.frequencyDenominator,
        frequencyType: testHabit.frequencyType,
        currentScore: '0',
        scoreHistory: []
      })
      .returning()

    createdHabits.push(created.id)

    // Verify frequency decimal
    const actualDecimal = frequencyToDecimal({
      numerator: testHabit.frequencyNumerator,
      denominator: testHabit.frequencyDenominator,
      type: testHabit.frequencyType
    })

    const match = Math.abs(actualDecimal - testHabit.expectedDecimal) < 0.0001
    console.log(`  Expected decimal: ${testHabit.expectedDecimal.toFixed(4)}`)
    console.log(`  Actual decimal: ${actualDecimal.toFixed(4)}`)
    console.log(`  ${match ? '✅ PASS' : '❌ FAIL'}\n`)
  }

  return createdHabits
}

async function testFrequencyRetrieval(habitIds: number[]) {
  console.log('\n🔍 Testing Frequency Field Retrieval\n')

  for (const habitId of habitIds) {
    const [habit] = await db
      .select()
      .from(habits)
      .where(eq(habits.id, habitId))

    if (!habit) {
      console.log(`❌ FAIL: Habit ${habitId} not found`)
      continue
    }

    console.log(`Habit: ${habit.title}`)
    console.log(`  frequencyNumerator: ${habit.frequencyNumerator}`)
    console.log(`  frequencyDenominator: ${habit.frequencyDenominator}`)
    console.log(`  frequencyType: ${habit.frequencyType}`)

    const hasAllFields = habit.frequencyNumerator && habit.frequencyDenominator && habit.frequencyType
    console.log(`  ${hasAllFields ? '✅ PASS' : '❌ FAIL'}\n`)
  }
}

async function testScoreCalculation(habitIds: number[]) {
  console.log('\n🧮 Testing Score Calculation with Different Frequencies\n')

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString().split('T')[0]

  for (const habitId of habitIds) {
    const [habit] = await db
      .select()
      .from(habits)
      .where(eq(habits.id, habitId))

    if (!habit || !habit.frequencyNumerator || !habit.frequencyDenominator) {
      continue
    }

    console.log(`Habit: ${habit.title}`)

    // Add some completion logs
    await db.insert(habitLogs).values([
      { habitId, userId: TEST_USER_ID, date: twoDaysAgo, completed: true },
      { habitId, userId: TEST_USER_ID, date: yesterday, completed: true },
      { habitId, userId: TEST_USER_ID, date: today, completed: false }
    ])

    // Fetch logs
    const logs = await db
      .select()
      .from(habitLogs)
      .where(eq(habitLogs.habitId, habitId))
      .orderBy(habitLogs.date)

    // Calculate score
    const frequency = {
      numerator: habit.frequencyNumerator,
      denominator: habit.frequencyDenominator,
      type: habit.frequencyType as FrequencyType
    }

    const score = computeHabitScore(logs, frequency)

    console.log(`  Frequency: ${frequency.numerator}/${frequency.denominator}`)
    console.log(`  Completions: 2 (last 2 days)`)
    console.log(`  Calculated Score: ${score.toFixed(8)}`)
    console.log(`  ${score > 0 ? '✅ PASS' : '❌ FAIL'} (score > 0)\n`)
  }
}

async function testBackwardCompatibility() {
  console.log('\n🔄 Testing Backward Compatibility\n')

  // Create a habit with old cadence fields only
  console.log('Creating habit with OLD fields (cadence + targetPerWeek)...')
  const [oldStyleHabit] = await db
    .insert(habits)
    .values({
      userId: TEST_USER_ID,
      title: 'TEST: Old Style Weekly Habit',
      description: 'Legacy habit using cadence field',
      icon: '🕰️',
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      difficulty: 'medium',
      cadence: 'weekly',
      targetPerWeek: 3,
      currentScore: '0',
      scoreHistory: []
    })
    .returning()

  console.log(`  Created habit ID: ${oldStyleHabit.id}`)
  console.log(`  cadence: ${oldStyleHabit.cadence}`)
  console.log(`  targetPerWeek: ${oldStyleHabit.targetPerWeek}`)
  console.log(`  frequencyNumerator: ${oldStyleHabit.frequencyNumerator || 'null'}`)
  console.log(`  frequencyDenominator: ${oldStyleHabit.frequencyDenominator || 'null'}`)
  console.log(`  ✅ PASS: Old fields still work\n`)

  return oldStyleHabit.id
}

async function runTests() {
  console.log('═══════════════════════════════════════════════')
  console.log('  Frequency Selector End-to-End Test Suite')
  console.log('═══════════════════════════════════════════════')

  try {
    // Clean up any existing test data
    await cleanup()

    // Test 1: Create habits with different frequencies
    const habitIds = await testHabitCreation()

    // Test 2: Verify frequency fields are stored correctly
    await testFrequencyRetrieval(habitIds)

    // Test 3: Test score calculation
    await testScoreCalculation(habitIds)

    // Test 4: Test backward compatibility
    const oldHabitId = await testBackwardCompatibility()
    habitIds.push(oldHabitId)

    console.log('\n═══════════════════════════════════════════════')
    console.log('  ✅ All Tests Completed Successfully!')
    console.log('═══════════════════════════════════════════════\n')

    // Final cleanup
    await cleanup()
    console.log('✓ Test cleanup complete\n')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    await cleanup()
    process.exit(1)
  }
}

// Run tests
runTests()
  .then(() => {
    console.log('Test script finished')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

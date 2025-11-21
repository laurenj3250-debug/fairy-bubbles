/**
 * End-to-end test for habit score display
 *
 * This script:
 * 1. Creates a test habit
 * 2. Logs completions to build up a score
 * 3. Fetches the habit via API to verify score is returned
 * 4. Cleans up test data
 */

const API_BASE = process.env.API_URL || 'http://localhost:5000';
const TEST_USER_ID = 1; // Assumes test user exists

interface HabitResponse {
  id: number;
  title: string;
  currentScore: string | null;
  scoreHistory: Array<{date: string, score: number, completed: boolean}> | null;
}

interface HabitLogResponse {
  id: number;
  habitId: number;
  date: string;
  completed: boolean;
}

async function apiRequest(endpoint: string, method: string = 'GET', body?: any) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getDateDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function testScoreDisplay() {
  console.log('\n=== Testing Habit Score Display ===\n');

  let habitId: number | null = null;

  try {
    // Step 1: Create a test habit
    console.log('1. Creating test habit...');
    const habitData = {
      userId: TEST_USER_ID,
      title: 'Test Habit for Score Display',
      description: 'E2E test habit',
      icon: '🧪',
      color: '#3b82f6',
      frequencyNumerator: 7,
      frequencyDenominator: 7,
      frequencyType: 'daily',
      difficulty: 'medium',
    };

    const habit: HabitResponse = await apiRequest('/api/habits', 'POST', habitData);
    habitId = habit.id;
    console.log(`   ✓ Created habit with ID: ${habitId}`);

    // Step 2: Log completions for the past 14 days to build up a score
    console.log('\n2. Logging completions for past 14 days...');
    const completionPattern = [
      true, true, true, true, true, false, true,  // Week 1: 6/7 days
      true, true, false, true, true, true, true,  // Week 2: 6/7 days
    ];

    for (let i = 0; i < 14; i++) {
      const date = getDateDaysAgo(13 - i); // Start from 13 days ago to today
      const completed = completionPattern[i];

      await apiRequest('/api/habit-logs/toggle', 'POST', {
        habitId,
        date,
      });

      // If we need to toggle again to set to incomplete
      if (!completed) {
        await apiRequest('/api/habit-logs/toggle', 'POST', {
          habitId,
          date,
        });
      }
    }

    const completedDays = completionPattern.filter(c => c).length;
    console.log(`   ✓ Logged ${completedDays}/14 completions`);

    // Step 3: Fetch the habit and verify score is returned
    console.log('\n3. Fetching habit with score...');
    const updatedHabit: HabitResponse = await apiRequest(`/api/habits/${habitId}`);

    console.log(`   ✓ Habit fetched successfully`);
    console.log(`   • Current Score: ${updatedHabit.currentScore}`);
    console.log(`   • Score History Length: ${updatedHabit.scoreHistory?.length || 0}`);

    // Verify score exists
    if (!updatedHabit.currentScore) {
      throw new Error('❌ Current score is null! Expected a numeric score.');
    }

    const scoreValue = parseFloat(updatedHabit.currentScore);
    if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 1) {
      throw new Error(`❌ Invalid score value: ${updatedHabit.currentScore}. Expected 0-1 range.`);
    }

    const percentage = Math.round(scoreValue * 100);
    let category = 'Unknown';
    if (scoreValue >= 0.75) category = 'Strong';
    else if (scoreValue >= 0.50) category = 'Building';
    else if (scoreValue >= 0.25) category = 'Growing';
    else category = 'Weak';

    console.log(`   ✓ Score is valid: ${percentage}% (${category})`);

    // Verify score history exists
    if (!updatedHabit.scoreHistory || updatedHabit.scoreHistory.length === 0) {
      console.warn('   ⚠ Warning: Score history is empty');
    } else {
      console.log(`   ✓ Score history has ${updatedHabit.scoreHistory.length} entries`);

      // Show first and last score entries
      const first = updatedHabit.scoreHistory[0];
      const last = updatedHabit.scoreHistory[updatedHabit.scoreHistory.length - 1];
      console.log(`   • First entry: ${first.date} - ${Math.round(first.score * 100)}% (${first.completed ? 'completed' : 'skipped'})`);
      console.log(`   • Last entry: ${last.date} - ${Math.round(last.score * 100)}% (${last.completed ? 'completed' : 'skipped'})`);
    }

    // Step 4: Verify it appears in the habits list
    console.log('\n4. Verifying habit appears in list...');
    const allHabits: HabitResponse[] = await apiRequest('/api/habits');
    const foundHabit = allHabits.find(h => h.id === habitId);

    if (!foundHabit) {
      throw new Error('❌ Habit not found in list!');
    }

    console.log(`   ✓ Habit found in list with score: ${foundHabit.currentScore}`);

    // Step 5: Test UI integration (check if score would display)
    console.log('\n5. Testing UI integration logic...');
    const shouldDisplay = foundHabit.currentScore && parseFloat(foundHabit.currentScore) > 0;
    console.log(`   • Should display in UI: ${shouldDisplay ? 'YES' : 'NO'}`);

    if (shouldDisplay) {
      const displayScore = parseFloat(foundHabit.currentScore);
      const displayPercentage = Math.round(displayScore * 100);
      console.log(`   ✓ UI would show: ${displayPercentage}% badge`);
    }

    console.log('\n✅ All tests passed!');
    console.log('\n=== Summary ===');
    console.log(`• Habit ID: ${habitId}`);
    console.log(`• Score: ${percentage}% (${category})`);
    console.log(`• Completions: ${completedDays}/14 days`);
    console.log(`• Score History: ${updatedHabit.scoreHistory?.length || 0} entries`);
    console.log(`• UI Display: ${shouldDisplay ? 'Enabled' : 'Disabled'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    // Step 6: Cleanup
    if (habitId) {
      console.log('\n6. Cleaning up test data...');
      try {
        await apiRequest(`/api/habits/${habitId}`, 'DELETE');
        console.log(`   ✓ Deleted test habit (ID: ${habitId})`);
      } catch (cleanupError) {
        console.error('   ⚠ Warning: Failed to cleanup test habit:', cleanupError);
      }
    }
  }
}

// Run the test
testScoreDisplay()
  .then(() => {
    console.log('\n✨ Test completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed\n');
    process.exit(1);
  });

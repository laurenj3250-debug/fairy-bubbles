/**
 * Test script for Expedition Missions end-to-end flow
 * Tests the complete mission lifecycle from start to completion
 */

const BASE_URL = 'http://localhost:5001';
const TEST_USER_EMAIL = 'laurenj3250@gmail.com';
const TEST_USER_PASSWORD = 'password123';

interface Mission {
  id: number;
  mountainId: number;
  status: string;
  totalDays: number;
  currentDay: number;
  requiredCompletionPercent: number;
  daysCompleted: number;
  mountain?: {
    name: string;
    elevation: number;
    difficultyTier: string;
  };
}

interface NextMountain {
  mountain: {
    id: number;
    name: string;
    elevation: number;
    difficultyTier: string;
    requiredClimbingLevel: number;
  };
  missionParams: {
    totalDays: number;
    requiredCompletionPercent: number;
  };
  canStart: boolean;
  reason?: string;
}

async function login(): Promise<string> {
  console.log('🔐 Logging in...');
  const response = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const cookies = response.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('No session cookie received');
  }

  const sessionCookie = cookies.split(';')[0];
  console.log('✅ Logged in successfully\n');
  return sessionCookie;
}

async function getCurrentMission(cookie: string): Promise<Mission | null> {
  console.log('📍 Checking for current mission...');
  const response = await fetch(`${BASE_URL}/api/expedition-missions/current`, {
    headers: { Cookie: cookie },
  });

  if (!response.ok) {
    throw new Error(`Failed to get current mission: ${response.statusText}`);
  }

  const mission = await response.json();
  if (mission) {
    console.log(`✅ Current mission: ${mission.mountain?.name || 'Unknown'}`);
    console.log(`   Status: ${mission.status}, Day ${mission.currentDay}/${mission.totalDays}\n`);
  } else {
    console.log('✅ No current mission\n');
  }
  return mission;
}

async function getNextMountain(cookie: string): Promise<NextMountain> {
  console.log('🏔️  Fetching next mountain...');
  const response = await fetch(`${BASE_URL}/api/expedition-missions/next`, {
    headers: { Cookie: cookie },
  });

  if (!response.ok) {
    throw new Error(`Failed to get next mountain: ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Next mountain: ${data.mountain.name} (${data.mountain.elevation}m)`);
  console.log(`   Difficulty: ${data.mountain.difficultyTier}`);
  console.log(`   Mission: ${data.missionParams.totalDays} days, ${data.missionParams.requiredCompletionPercent}% completion required`);
  console.log(`   Can start: ${data.canStart}${data.reason ? ` (${data.reason})` : ''}\n`);
  return data;
}

async function startMission(cookie: string, mountainId: number): Promise<Mission> {
  console.log(`🚀 Starting mission on mountain ID ${mountainId}...`);
  const response = await fetch(`${BASE_URL}/api/expedition-missions/start`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mountainId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to start mission: ${response.statusText} - ${error}`);
  }

  const mission = await response.json();
  console.log(`✅ Mission started!`);
  console.log(`   Mission ID: ${mission.id}`);
  console.log(`   Duration: ${mission.totalDays} days`);
  console.log(`   Required completion: ${mission.requiredCompletionPercent}%\n`);
  return mission;
}

async function checkProgress(cookie: string, missionId: number, date: string): Promise<any> {
  console.log(`📊 Checking progress for ${date}...`);
  const response = await fetch(`${BASE_URL}/api/expedition-missions/check-progress`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ missionId, date }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to check progress: ${response.statusText} - ${error}`);
  }

  const result = await response.json();
  console.log(`✅ Progress checked: ${result.message || 'Success'}`);
  if (result.mission) {
    console.log(`   Day ${result.mission.currentDay}/${result.mission.totalDays}`);
    console.log(`   Days completed: ${result.mission.daysCompleted}`);
    console.log(`   Status: ${result.mission.status}\n`);
  }
  return result;
}

async function completeMission(cookie: string, missionId: number): Promise<any> {
  console.log(`🏆 Completing mission ${missionId}...`);
  const response = await fetch(`${BASE_URL}/api/expedition-missions/complete`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ missionId }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to complete mission: ${response.statusText} - ${error}`);
  }

  const result = await response.json();
  console.log(`✅ Mission completed!`);
  if (result.rewards) {
    console.log(`   XP earned: ${result.rewards.xp}`);
    console.log(`   Points earned: ${result.rewards.points}`);
    console.log(`   Background unlocked: ${result.rewards.backgroundUnlocked ? 'Yes' : 'No'}`);
  }
  console.log(`   New climbing level: ${result.climbingStats.climbingLevel}\n`);
  return result;
}

async function main() {
  console.log('🧪 Starting Expedition Missions End-to-End Test\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // Step 1: Login
    const cookie = await login();

    // Step 2: Check current mission
    let currentMission = await getCurrentMission(cookie);

    // If there's an active mission, complete it first
    if (currentMission && currentMission.status === 'active') {
      console.log('⚠️  Found active mission, completing it first...\n');
      await completeMission(cookie, currentMission.id);
      currentMission = await getCurrentMission(cookie);
    }

    // Step 3: Get next mountain
    const nextMountain = await getNextMountain(cookie);

    if (!nextMountain.canStart) {
      console.log(`❌ Cannot start mission: ${nextMountain.reason}`);
      return;
    }

    // Step 4: Start mission
    const mission = await startMission(cookie, nextMountain.mountain.id);

    // Step 5: Simulate daily progress
    console.log('📅 Simulating daily progress...\n');
    const startDate = new Date();
    const requiredDays = Math.ceil(mission.totalDays * mission.requiredCompletionPercent / 100);

    for (let i = 0; i < requiredDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      await checkProgress(cookie, mission.id, dateStr);

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 6: Complete mission
    const completionResult = await completeMission(cookie, mission.id);

    // Step 7: Verify next mountain is unlocked
    console.log('🔓 Verifying next mountain unlock...\n');
    const newNextMountain = await getNextMountain(cookie);

    console.log('=' .repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('=' .repeat(60));
    console.log('\nSummary:');
    console.log(`- Completed mission on: ${nextMountain.mountain.name}`);
    console.log(`- XP earned: ${completionResult.rewards.xp}`);
    console.log(`- Points earned: ${completionResult.rewards.points}`);
    console.log(`- New climbing level: ${completionResult.climbingStats.climbingLevel}`);
    console.log(`- Next mountain available: ${newNextMountain.mountain.name}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();

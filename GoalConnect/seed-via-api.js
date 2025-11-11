// Seed data via API endpoints (works with any schema)
const BASE_URL = 'http://localhost:5000';

async function seedViaAPI() {
  console.log('[seed] Starting API-based seed...');

  try {
    // Create 5 test habits
    const habits = [
      {
        title: 'Morning Stretch',
        icon: '🧘',
        category: 'mind',
        effort: 'light',
        grade: '5.6',
        cadence: 'daily',
        description: 'Light morning movement',
        color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        difficulty: 'easy',
      },
      {
        title: 'Gym Training',
        icon: '💪',
        category: 'training',
        effort: 'heavy',
        grade: '5.10',
        cadence: 'weekly',
        targetPerWeek: 3,
        description: 'Hard physical training',
        color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        difficulty: 'hard',
      },
      {
        title: 'Read',
        icon: '📚',
        category: 'mind',
        effort: 'light',
        grade: '5.7',
        cadence: 'daily',
        description: 'Daily reading habit',
        color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        difficulty: 'easy',
      },
      {
        title: 'Walk Outside',
        icon: '🥾',
        category: 'foundation',
        effort: 'light',
        grade: '5.5',
        cadence: 'daily',
        description: 'Daily outdoor movement',
        color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        difficulty: 'easy',
      },
      {
        title: 'Meditate',
        icon: '🧠',
        category: 'mind',
        effort: 'light',
        grade: '5.8',
        cadence: 'daily',
        description: 'Mindfulness practice',
        color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        difficulty: 'easy',
      },
    ];

    console.log('[seed] Creating habits...');
    const createdHabits = [];

    for (const habit of habits) {
      const response = await fetch(`${BASE_URL}/api/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': '', // Session cookie will be used from browser
        },
        credentials: 'include',
        body: JSON.stringify(habit),
      });

      if (response.ok) {
        const created = await response.json();
        createdHabits.push(created);
        console.log(`[seed] ✅ Created: ${habit.title}`);
      } else {
        const error = await response.text();
        console.log(`[seed] ⚠️  Failed to create ${habit.title}: ${error}`);
      }
    }

    // Create some habit logs for the past week
    console.log('[seed] Creating habit logs...');
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Mark some habits as completed on past days
      for (const habit of createdHabits.slice(0, 3)) {
        if (Math.random() > 0.3) { // 70% chance of completion
          await fetch(`${BASE_URL}/api/habit-logs/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              habitId: habit.id,
              date: dateStr,
            }),
          });
        }
      }
    }
    console.log('[seed] ✅ Created habit logs');

    console.log('\n========================================');
    console.log('✅ SUCCESS! Seed completed via API');
    console.log('========================================');
    console.log(`Created ${createdHabits.length} habits`);
    console.log('Created habit logs for past 7 days');
    console.log('Visit http://localhost:5000 to see them!');
    console.log('========================================\n');

  } catch (error) {
    console.error('[seed] ❌ Error:', error.message);
  }
}

seedViaAPI();

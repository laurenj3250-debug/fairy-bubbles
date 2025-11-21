import "../server/load-env";
import { getDb } from "../server/db";
import { todos } from "../shared/schema";

const db = getDb();
const userId = 1; // laurenj3250@gmail.com

async function main() {
  try {
    console.log("Adding daily tasks for user ID:", userId);

    const today = new Date().toISOString().split('T')[0];

    // Organize tasks by priority and category
    const tasks = [
      // High priority / urgent tasks (P1)
      {
        userId,
        title: 'Get fluoxetine from pharmacy',
        priority: 1,
        difficulty: 'easy' as const,
        dueDate: today,
      },
      {
        userId,
        title: 'Sign up for insurance',
        priority: 1,
        difficulty: 'medium' as const,
        notes: 'Important administrative task',
      },
      {
        userId,
        title: "Fill cat's water bowl",
        priority: 1,
        difficulty: 'easy' as const,
        dueDate: today,
      },

      // Medium-high priority tasks (P2)
      {
        userId,
        title: 'Deposit check',
        priority: 2,
        difficulty: 'easy' as const,
      },
      {
        userId,
        title: 'Submit to RCVS that I am in residency',
        priority: 2,
        difficulty: 'medium' as const,
        notes: 'Professional requirement',
      },
      {
        userId,
        title: 'Send paperwork to court for name change',
        priority: 2,
        difficulty: 'medium' as const,
        notes: 'Legal documentation',
      },
      {
        userId,
        title: 'Book dental appointment',
        priority: 2,
        difficulty: 'easy' as const,
      },
      {
        userId,
        title: 'Locate house key',
        priority: 2,
        difficulty: 'medium' as const,
      },

      // Regular tasks (P3)
      {
        userId,
        title: 'Do laundry',
        priority: 3,
        difficulty: 'easy' as const,
      },
      {
        userId,
        title: 'Clean room',
        priority: 3,
        difficulty: 'medium' as const,
        notes: 'Deep clean - room is quite messy',
      },
      {
        userId,
        title: 'Go to Trader Joes',
        priority: 3,
        difficulty: 'easy' as const,
      },
      {
        userId,
        title: 'Fill bike tires',
        priority: 3,
        difficulty: 'easy' as const,
      },
      {
        userId,
        title: 'Cancel subscriptions',
        priority: 3,
        difficulty: 'easy' as const,
        notes: 'Review and cancel unused subscriptions',
      },

      // Fun/wellness tasks (P3)
      {
        userId,
        title: 'Go to gym or climbing',
        priority: 3,
        difficulty: 'medium' as const,
        notes: 'Exercise and self-care',
      },
      {
        userId,
        title: 'Get outside - do something fun outdoors',
        priority: 3,
        difficulty: 'easy' as const,
        notes: 'Important for mental health and balance',
      },

      // Technical task (P3)
      {
        userId,
        title: 'Fix gym app code',
        priority: 3,
        difficulty: 'hard' as const,
        notes: 'Development work',
      },
    ];

    console.log(`\nAdding ${tasks.length} tasks...\n`);

    for (const taskData of tasks) {
      const [newTask] = await db.insert(todos).values(taskData).returning();
      const priorityLabel = ['P1 (urgent)', 'P2 (high)', 'P3 (normal)', 'P4 (low)'][newTask.priority - 1];
      console.log(`✓ Added: ${newTask.title} [${priorityLabel}, ${newTask.difficulty}]`);
    }

    console.log("\n✅ Successfully added all tasks to Fairy Bubbles!");
    console.log("\nTask breakdown by priority:");
    console.log("  P1 (urgent): 3 tasks - pharmacy, insurance, cat water");
    console.log("  P2 (high): 5 tasks - deposit, RCVS, court, dental, key");
    console.log("  P3 (normal): 8 tasks - chores, errands, fun activities, coding");

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();

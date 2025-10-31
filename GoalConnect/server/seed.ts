import { db } from "./db";
import * as schema from "@shared/schema";

async function seed() {
  console.log("Starting database seed...");

  // Create default user
  const [user] = await db.insert(schema.users).values({
    name: "Demo User",
    email: "demo@example.com",
  }).returning();
  console.log("✓ User created");

  // Seed habits
  const habitData = [
    { userId: user.id, title: "Morning Exercise", description: "30 minutes cardio or strength training", icon: "Dumbbell", color: "#8B5CF6", cadence: "daily" as const },
    { userId: user.id, title: "Read 30 minutes", description: "Read books, articles, or learning materials", icon: "BookOpen", color: "#3B82F6", cadence: "daily" as const },
    { userId: user.id, title: "Meditate", description: "10 minutes mindfulness meditation", icon: "Brain", color: "#10B981", cadence: "daily" as const },
    { userId: user.id, title: "Weekly Review", description: "Review goals and plan next week", icon: "ClipboardCheck", color: "#F59E0B", cadence: "weekly" as const },
  ];
  
  const habits = await db.insert(schema.habits).values(habitData).returning();
  console.log(`✓ ${habits.length} habits created`);

  // Seed habit logs
  const today = new Date();
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    last7Days.unshift(date.toISOString().split('T')[0]);
  }

  const habitLogData: any[] = [];
  last7Days.forEach((date, i) => {
    habitLogData.push({ habitId: habits[0].id, userId: user.id, date, completed: true, note: null });
    habitLogData.push({ habitId: habits[1].id, userId: user.id, date, completed: i % 3 !== 0, note: null });
    habitLogData.push({ habitId: habits[2].id, userId: user.id, date, completed: i % 2 === 0, note: null });
  });

  await db.insert(schema.habitLogs).values(habitLogData);
  console.log(`✓ ${habitLogData.length} habit logs created`);

  // Seed goals
  const goalData = [
    { userId: user.id, title: "Complete 30 Day Meditation Streak", description: "Meditate every day for 30 consecutive days", targetValue: 30, currentValue: 22, unit: "days", deadline: "2025-11-10", category: "Health" },
    { userId: user.id, title: "Read 12 Books This Year", description: "Read at least one book per month", targetValue: 12, currentValue: 7, unit: "books", deadline: "2025-12-31", category: "Learning" },
    { userId: user.id, title: "Save $5000", description: "Build emergency fund", targetValue: 5000, currentValue: 2800, unit: "$", deadline: "2025-12-31", category: "Finance" },
    { userId: user.id, title: "Run 100 Miles", description: "Run 100 miles in Q4", targetValue: 100, currentValue: 42, unit: "miles", deadline: "2025-12-31", category: "Fitness" },
  ];

  await db.insert(schema.goals).values(goalData);
  console.log(`✓ ${goalData.length} goals created`);

  // Seed user settings
  await db.insert(schema.userSettings).values({
    userId: user.id,
    darkMode: true,
    notifications: true,
  });
  console.log("✓ User settings created");

  // Seed costumes
  const costumeData = [
    { name: "Party Hat", description: "A festive party hat with stars and confetti", category: "hat" as const, price: 50, imageUrl: "/attached_assets/generated_images/Party_hat_for_cat_79b322cc.png", rarity: "common" as const },
    { name: "Royal Crown", description: "A golden royal crown fit for a king", category: "hat" as const, price: 200, imageUrl: "/attached_assets/generated_images/Royal_crown_for_cat_a6a52cf7.png", rarity: "rare" as const },
    { name: "Wizard Hat", description: "A magical wizard hat with stars and moons", category: "hat" as const, price: 150, imageUrl: "/attached_assets/generated_images/Wizard_hat_for_cat_1530fbe8.png", rarity: "rare" as const },
    { name: "Superhero Cape", description: "Feel like a superhero with this flowing cape", category: "outfit" as const, price: 100, imageUrl: "/attached_assets/generated_images/Superhero_cape_for_cat_1bb6ad3e.png", rarity: "common" as const },
    { name: "Cool Sunglasses", description: "Stylish shades for your cool cat", category: "accessory" as const, price: 75, imageUrl: "/attached_assets/generated_images/Sunglasses_for_cat_3e1586b0.png", rarity: "common" as const },
    { name: "Gold Medal", description: "Achievement unlocked!", category: "accessory" as const, price: 300, imageUrl: "🏅", rarity: "epic" as const },
  ];

  await db.insert(schema.costumes).values(costumeData);
  console.log(`✓ ${costumeData.length} costumes created`);

  // Create virtual pet
  await db.insert(schema.virtualPets).values({
    userId: user.id,
    name: "Gizmo",
    species: "Gremlin",
    happiness: 85,
    health: 90,
    level: 3,
    experience: 150,
    currentCostumeId: null,
  });
  console.log("✓ Virtual pet created");

  // Initialize user points
  await db.insert(schema.userPoints).values({
    userId: user.id,
    totalEarned: 250,
    totalSpent: 0,
    available: 250,
  });
  console.log("✓ User points initialized");

  console.log("\n✅ Database seeded successfully!");
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});

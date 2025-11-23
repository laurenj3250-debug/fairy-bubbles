import { getDb } from "./db";
import * as schema from "../shared/schema";

export async function seedMountaineeringData() {
  const db = getDb();

  // Check if data already exists (check mountains specifically since that's the main content)
  const existingMountains = await db.select().from(schema.mountains).limit(1);
  if (existingMountains.length > 0) {
    return;
  }

  // If regions exist but mountains don't, we need to clear regions first to avoid conflicts
  const existingRegions = await db.select().from(schema.worldMapRegions).limit(1);
  if (existingRegions.length > 0) {
    await db.delete(schema.worldMapRegions);
  }

  // Note: If partial data exists from a failed seed, manually clear it:
  // DELETE FROM route_gear_requirements;
  // DELETE FROM routes;
  // DELETE FROM alpine_gear;
  // DELETE FROM mountains;
  // DELETE FROM world_map_regions;

  // ============================================================================
  // 1. WORLD MAP REGIONS
  // ============================================================================

  const regions = [
    {
      name: "Himalayas",
      continent: "Asia",
      unlockLevel: 1,
      description: "The world's highest mountain range, home to all fourteen 8000m peaks including Everest, K2, and Annapurna"
    },
    {
      name: "Karakoram",
      continent: "Asia",
      unlockLevel: 30,
      description: "The second-highest mountain range, featuring K2 and four other 8000m peaks in Pakistan and China"
    },
    {
      name: "Alaska Range",
      continent: "North America",
      unlockLevel: 15,
      description: "North America's highest peaks including Denali, featuring extreme cold and technical climbing"
    },
    {
      name: "European Alps",
      continent: "Europe",
      unlockLevel: 5,
      description: "Historic alpine peaks including Mont Blanc, Matterhorn, and Eiger - birthplace of modern mountaineering"
    },
    {
      name: "Andes",
      continent: "South America",
      unlockLevel: 10,
      description: "The world's longest mountain range, featuring Aconcagua and dozens of high-altitude volcanoes"
    },
    {
      name: "Caucasus",
      continent: "Europe",
      unlockLevel: 8,
      description: "Europe's highest peaks on the Russia-Georgia border, including Mount Elbrus"
    },
    {
      name: "African Peaks",
      continent: "Africa",
      unlockLevel: 3,
      description: "Africa's highest mountains including Kilimanjaro, Mount Kenya, and the Atlas Mountains"
    },
    {
      name: "New Zealand Alps",
      continent: "Oceania",
      unlockLevel: 12,
      description: "Southern Hemisphere alpine climbing featuring Aoraki/Mount Cook and technical mixed routes"
    },
    {
      name: "Antarctic Mountains",
      continent: "Antarctica",
      unlockLevel: 40,
      description: "The world's most remote peaks including Vinson Massif and Mount Erebus"
    }
  ];

  const insertedRegions = await db.insert(schema.worldMapRegions).values(regions).returning();

  // ============================================================================
  // 2. ALPINE GEAR (50+ items)
  // ============================================================================

  const gear = [
    // FOOTWEAR
    { name: "Approach Shoes", category: "boots", description: "Sticky rubber approach shoes for technical hiking", weightGrams: 800, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 150 },
    { name: "Single Mountaineering Boots", category: "boots", description: "Insulated single-layer boots for alpine climbing", weightGrams: 1400, tier: "basic", unlockLevel: 3, unlockHabitCount: 10, cost: 400 },
    { name: "Double Mountaineering Boots", category: "boots", description: "Double-layer plastic boots for extreme cold", weightGrams: 1800, tier: "intermediate", unlockLevel: 15, unlockHabitCount: 50, cost: 700 },
    { name: "8000m Expedition Boots", category: "boots", description: "Extreme altitude boots rated to -40°C", weightGrams: 2200, tier: "elite", unlockLevel: 45, unlockHabitCount: 200, cost: 1200 },

    // ICE AXES & CRAMPONS
    { name: "Basic Ice Axe", category: "ice_axe", description: "General mountaineering ice axe 60cm", weightGrams: 450, tier: "basic", unlockLevel: 2, unlockHabitCount: 5, cost: 180 },
    { name: "Technical Ice Axe", category: "ice_axe", description: "Curved pick ice tool for steep ice", weightGrams: 550, tier: "intermediate", unlockLevel: 12, unlockHabitCount: 40, cost: 280 },
    { name: "Aluminum Crampons", category: "crampons", description: "12-point aluminum crampons for glacier travel", weightGrams: 800, tier: "basic", unlockLevel: 3, unlockHabitCount: 10, cost: 200 },
    { name: "Steel Crampons", category: "crampons", description: "12-point steel crampons for technical climbing", weightGrams: 950, tier: "intermediate", unlockLevel: 15, unlockHabitCount: 50, cost: 300 },

    // HARNESS & ROPE
    { name: "Alpine Harness", category: "harness", description: "Lightweight alpine climbing harness", weightGrams: 320, tier: "basic", unlockLevel: 5, unlockHabitCount: 15, cost: 100 },
    { name: "Climbing Helmet", category: "safety", description: "Lightweight climbing helmet", weightGrams: 240, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 90 },
    { name: "60m Rope (9.2mm)", category: "rope", description: "Dynamic climbing rope 60 meters", weightGrams: 3600, tier: "intermediate", unlockLevel: 10, unlockHabitCount: 30, cost: 250 },
    { name: "Carabiner Set (12)", category: "miscellaneous", description: "Set of 12 locking carabiners", weightGrams: 720, tier: "basic", unlockLevel: 5, unlockHabitCount: 15, cost: 120 },
    { name: "Quickdraw Set (10)", category: "miscellaneous", description: "Set of 10 quickdraws for rock protection", weightGrams: 1100, tier: "intermediate", unlockLevel: 12, unlockHabitCount: 40, cost: 200 },

    // TENTS & SLEEPING BAGS
    { name: "3-Season Tent", category: "tent", description: "Lightweight 2-person 3-season tent", weightGrams: 2200, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 350 },
    { name: "4-Season Expedition Tent", category: "tent", description: "Heavy-duty 4-season mountaineering tent", weightGrams: 3500, tier: "intermediate", unlockLevel: 15, unlockHabitCount: 50, cost: 650 },
    { name: "High-Altitude Expedition Tent", category: "tent", description: "Extreme altitude tent rated for 8000m", weightGrams: 4200, tier: "elite", unlockLevel: 45, unlockHabitCount: 200, cost: 1000 },
    { name: "Down Sleeping Bag (-10°C)", category: "sleeping_bag", description: "Down sleeping bag rated to -10°C", weightGrams: 1200, tier: "basic", unlockLevel: 3, unlockHabitCount: 10, cost: 400 },
    { name: "Down Sleeping Bag (-30°C)", category: "sleeping_bag", description: "Expedition down bag rated to -30°C", weightGrams: 1800, tier: "intermediate", unlockLevel: 20, unlockHabitCount: 75, cost: 600 },
    { name: "Down Sleeping Bag (-40°C)", category: "sleeping_bag", description: "Extreme altitude bag rated to -40°C", weightGrams: 2400, tier: "elite", unlockLevel: 45, unlockHabitCount: 200, cost: 900 },

    // STOVES & COOKWARE
    { name: "Backpacking Stove", category: "stove", description: "Lightweight gas stove for cooking", weightGrams: 180, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 70 },
    { name: "Expedition Stove", category: "stove", description: "Multi-fuel stove for extreme conditions", weightGrams: 380, tier: "intermediate", unlockLevel: 20, unlockHabitCount: 75, cost: 150 },
    { name: "Cookset", category: "miscellaneous", description: "Nested pot and pan set", weightGrams: 400, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 60 },
    { name: "Water Filter", category: "miscellaneous", description: "Portable water filtration system", weightGrams: 250, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 100 },

    // CLOTHING
    { name: "Base Layer Set", category: "clothing", description: "Merino wool base layers top and bottom", weightGrams: 400, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 150 },
    { name: "Fleece Midlayer", category: "clothing", description: "Insulating fleece jacket", weightGrams: 350, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 120 },
    { name: "Down Jacket", category: "clothing", description: "800-fill down insulation jacket", weightGrams: 450, tier: "intermediate", unlockLevel: 10, unlockHabitCount: 30, cost: 350 },
    { name: "8000m Down Suit", category: "clothing", description: "Full-body down suit for extreme altitude", weightGrams: 1800, tier: "elite", unlockLevel: 45, unlockHabitCount: 200, cost: 1500 },
    { name: "Hardshell Jacket", category: "clothing", description: "Waterproof breathable shell jacket", weightGrams: 420, tier: "basic", unlockLevel: 2, unlockHabitCount: 5, cost: 400 },
    { name: "Hardshell Pants", category: "clothing", description: "Waterproof breathable shell pants", weightGrams: 380, tier: "basic", unlockLevel: 2, unlockHabitCount: 5, cost: 300 },
    { name: "Mountaineering Gloves", category: "clothing", description: "Insulated waterproof gloves", weightGrams: 180, tier: "basic", unlockLevel: 3, unlockHabitCount: 10, cost: 90 },
    { name: "Expedition Gloves", category: "clothing", description: "Extreme cold mitts rated to -40°C", weightGrams: 280, tier: "intermediate", unlockLevel: 20, unlockHabitCount: 75, cost: 150 },
    { name: "Liner Gloves", category: "clothing", description: "Thin glove liners for dexterity", weightGrams: 40, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 30 },
    { name: "Balaclava", category: "clothing", description: "Full-face cold weather mask", weightGrams: 80, tier: "basic", unlockLevel: 3, unlockHabitCount: 10, cost: 40 },
    { name: "Sun Hat", category: "clothing", description: "Wide-brim sun protection hat", weightGrams: 90, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 35 },
    { name: "Glacier Goggles", category: "clothing", description: "High-altitude UV protection goggles", weightGrams: 120, tier: "intermediate", unlockLevel: 15, unlockHabitCount: 50, cost: 200 },

    // SAFETY GEAR
    { name: "Avalanche Beacon", category: "safety", description: "Digital avalanche transceiver", weightGrams: 220, tier: "intermediate", unlockLevel: 10, unlockHabitCount: 30, cost: 350 },
    { name: "Avalanche Probe", category: "safety", description: "Collapsible avalanche probe 3m", weightGrams: 280, tier: "intermediate", unlockLevel: 10, unlockHabitCount: 30, cost: 80 },
    { name: "Avalanche Shovel", category: "safety", description: "Lightweight aluminum shovel", weightGrams: 650, tier: "intermediate", unlockLevel: 10, unlockHabitCount: 30, cost: 90 },
    { name: "First Aid Kit", category: "safety", description: "Comprehensive mountain first aid kit", weightGrams: 450, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 100 },
    { name: "Satellite Phone", category: "safety", description: "Emergency satellite communication", weightGrams: 280, tier: "intermediate", unlockLevel: 20, unlockHabitCount: 75, cost: 800 },
    { name: "GPS Device", category: "safety", description: "Handheld GPS navigation unit", weightGrams: 180, tier: "basic", unlockLevel: 5, unlockHabitCount: 15, cost: 400 },
    { name: "Headlamp", category: "safety", description: "Rechargeable LED headlamp", weightGrams: 110, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 70 },

    // HIGH ALTITUDE GEAR
    { name: "Oxygen System (Poisk)", category: "oxygen", description: "Russian Poisk oxygen system", weightGrams: 4800, tier: "elite", unlockLevel: 45, unlockHabitCount: 200, cost: 2500 },
    { name: "Oxygen Bottles (4L, set of 5)", category: "oxygen", description: "Five 4-liter oxygen bottles", weightGrams: 11000, tier: "elite", unlockLevel: 45, unlockHabitCount: 200, cost: 1000 },
    { name: "Oxygen Regulator", category: "oxygen", description: "Top-Out oxygen regulator system", weightGrams: 650, tier: "elite", unlockLevel: 45, unlockHabitCount: 200, cost: 800 },
    { name: "Oxygen Mask", category: "oxygen", description: "Summit oxygen mask", weightGrams: 180, tier: "elite", unlockLevel: 45, unlockHabitCount: 200, cost: 200 },

    // MISCELLANEOUS
    { name: "Trekking Poles (pair)", category: "miscellaneous", description: "Adjustable trekking poles", weightGrams: 540, tier: "basic", unlockLevel: 1, unlockHabitCount: 0, cost: 120 },
    { name: "70L Backpack", category: "backpack", description: "Large expedition backpack", weightGrams: 2200, tier: "intermediate", unlockLevel: 10, unlockHabitCount: 30, cost: 350 },
    { name: "Ascender/Jumar", category: "miscellaneous", description: "Rope ascending device", weightGrams: 180, tier: "intermediate", unlockLevel: 15, unlockHabitCount: 50, cost: 80 },
    { name: "Figure 8 Descender", category: "miscellaneous", description: "Rappelling device", weightGrams: 140, tier: "basic", unlockLevel: 8, unlockHabitCount: 25, cost: 25 },
    { name: "Prusik Cord Set", category: "miscellaneous", description: "Accessory cord for self-rescue", weightGrams: 120, tier: "intermediate", unlockLevel: 10, unlockHabitCount: 30, cost: 15 }
  ];

  const insertedGear = await db.insert(schema.alpineGear).values(gear as any).returning();

  // Create gear lookup map
  const gearMap = Object.fromEntries(
    insertedGear.map(g => [g.name, g.id])
  );

  // ============================================================================
  // 3. MOUNTAINS (100+ peaks with accurate data)
  // ============================================================================

  const mountains = [
    // ========== NOVICE TIER (20 mountains) ==========
    {
      name: "Mount Fuji",
      elevation: 3776,
      country: "Japan",
      mountainRange: "Japanese Alps",
      continent: "Asia",
      latitude: 35.3606,
      longitude: 138.7278,
      difficultyTier: "novice",
      requiredClimbingLevel: 1,
      description: "Japan's highest and most sacred mountain, a dormant volcano with well-maintained trails.",
      firstAscentYear: 663,
      fatalityRate: 0.01,
      bestSeasonStart: "July",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 1, min_summits: 0, min_habit_streak: 0 }),
      backgroundImage: "/backgrounds/fuji.png",
      themeColors: JSON.stringify({
        primary: "#E74C3C",     // Fuji red
        secondary: "#34495E",   // Deep blue-grey
        accent: "#F39C12",      // Sunrise orange
        gradient: "from-red-900 via-orange-800 to-purple-900"
      })
    },
    {
      name: "Mount Kilimanjaro (Uhuru Peak)",
      elevation: 5895,
      country: "Tanzania",
      mountainRange: "East African Rift",
      continent: "Africa",
      latitude: -3.0674,
      longitude: 37.3556,
      difficultyTier: "novice",
      requiredClimbingLevel: 3,
      description: "Africa's highest peak, a non-technical trekking peak requiring acclimatization.",
      firstAscentYear: 1889,
      fatalityRate: 0.02,
      bestSeasonStart: "January",
      bestSeasonEnd: "March",
      unlockRequirements: JSON.stringify({ min_level: 3, min_summits: 1 }),
      backgroundImage: "/backgrounds/kilimanjaro.png",
      themeColors: JSON.stringify({
        primary: "#2C3E50",     // Dark slate
        secondary: "#E67E22",   // African sunset orange
        accent: "#ECF0F1",      // Ice white
        gradient: "from-orange-900 via-slate-800 to-blue-900"
      })
    },
    {
      name: "Mount Toubkal",
      elevation: 4167,
      country: "Morocco",
      mountainRange: "Atlas Mountains",
      continent: "Africa",
      latitude: 31.0594,
      longitude: -7.9161,
      difficultyTier: "novice",
      requiredClimbingLevel: 2,
      description: "North Africa's highest peak, a trekking peak in Morocco's Atlas Mountains.",
      firstAscentYear: 1923,
      fatalityRate: 0.01,
      bestSeasonStart: "May",
      bestSeasonEnd: "October",
      unlockRequirements: JSON.stringify({ min_level: 2, min_summits: 1 }),
      backgroundImage: "/backgrounds/toubkal.png",
      themeColors: JSON.stringify({
        primary: "#D35400",
        secondary: "#8B4513",
        accent: "#F4D03F",
        gradient: "from-orange-800 via-amber-700 to-yellow-600"
      })
    },
    {
      name: "Mount Whitney",
      elevation: 4421,
      country: "USA",
      mountainRange: "Sierra Nevada",
      continent: "North America",
      latitude: 36.5785,
      longitude: -118.2923,
      difficultyTier: "novice",
      requiredClimbingLevel: 2,
      description: "The highest peak in the contiguous United States, accessible via a challenging day hike.",
      firstAscentYear: 1873,
      fatalityRate: 0.005,
      bestSeasonStart: "July",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 2, min_summits: 0 }),
      backgroundImage: "/backgrounds/whitney.png",
      themeColors: JSON.stringify({
        primary: "#95A5A6",
        secondary: "#34495E",
        accent: "#3498DB",
        gradient: "from-slate-700 via-blue-800 to-sky-600"
      })
    },
    {
      name: "Mount Kenya (Batian)",
      elevation: 5199,
      country: "Kenya",
      mountainRange: "Mount Kenya massif",
      continent: "Africa",
      latitude: -0.1521,
      longitude: 37.3084,
      difficultyTier: "novice",
      requiredClimbingLevel: 4,
      description: "Africa's second-highest peak with both trekking and technical routes.",
      firstAscentYear: 1899,
      fatalityRate: 0.03,
      bestSeasonStart: "January",
      bestSeasonEnd: "March",
      unlockRequirements: JSON.stringify({ min_level: 4, min_summits: 2 }),
      backgroundImage: "/backgrounds/kenya.png",
      themeColors: JSON.stringify({
        primary: "#16A085",
        secondary: "#8B4513",
        accent: "#E8F8F5",
        gradient: "from-teal-800 via-green-700 to-cyan-100"
      })
    },
    {
      name: "Pico de Orizaba",
      elevation: 5636,
      country: "Mexico",
      mountainRange: "Trans-Mexican Volcanic Belt",
      continent: "North America",
      latitude: 19.0319,
      longitude: -97.2689,
      difficultyTier: "novice",
      requiredClimbingLevel: 5,
      description: "Mexico's highest peak and third-highest in North America, requiring glacier travel.",
      firstAscentYear: 1848,
      fatalityRate: 0.02,
      bestSeasonStart: "November",
      bestSeasonEnd: "March",
      unlockRequirements: JSON.stringify({ min_level: 5, min_summits: 2 }),
      backgroundImage: "/backgrounds/orizaba.png",
      themeColors: JSON.stringify({
        primary: "#E67E22",
        secondary: "#2C3E50",
        accent: "#F4ECE6",
        gradient: "from-orange-700 via-slate-800 to-amber-50"
      })
    },
    {
      name: "Mont Blanc",
      elevation: 4808,
      country: "France/Italy",
      mountainRange: "European Alps",
      continent: "Europe",
      latitude: 45.8326,
      longitude: 6.8652,
      difficultyTier: "novice",
      requiredClimbingLevel: 6,
      description: "The highest peak in the Alps, birthplace of modern mountaineering.",
      firstAscentYear: 1786,
      fatalityRate: 0.15,
      bestSeasonStart: "June",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 6, min_summits: 3 }),
      backgroundImage: "/backgrounds/blanc.png",
      themeColors: JSON.stringify({
        primary: "#ECF0F1",
        secondary: "#3498DB",
        accent: "#F39C12",
        gradient: "from-slate-100 via-blue-400 to-amber-500"
      })
    },
    {
      name: "Gran Paradiso",
      elevation: 4061,
      country: "Italy",
      mountainRange: "Graian Alps",
      continent: "Europe",
      latitude: 45.5167,
      longitude: 7.2667,
      difficultyTier: "novice",
      requiredClimbingLevel: 5,
      description: "An accessible 4000m peak in the Italian Alps, good for alpine beginners.",
      firstAscentYear: 1860,
      fatalityRate: 0.05,
      bestSeasonStart: "June",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 5, min_summits: 2 }),
      backgroundImage: "/backgrounds/paradiso.png",
      themeColors: JSON.stringify({
        primary: "#3498DB",
        secondary: "#27AE60",
        accent: "#F8F9FA",
        gradient: "from-blue-600 via-emerald-500 to-slate-50"
      })
    },
    {
      name: "Island Peak (Imja Tse)",
      elevation: 6189,
      country: "Nepal",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 27.9208,
      longitude: 86.9372,
      difficultyTier: "novice",
      requiredClimbingLevel: 7,
      description: "Popular Himalayan trekking peak with moderate technical sections.",
      firstAscentYear: 1953,
      fatalityRate: 0.08,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({ min_level: 7, min_summits: 3 }),
      backgroundImage: "/backgrounds/island.png",
      themeColors: JSON.stringify({
        primary: "#5DADE2",
        secondary: "#2C3E50",
        accent: "#F8C471",
        gradient: "from-blue-400 via-slate-800 to-amber-300"
      })
    },
    {
      name: "Mera Peak",
      elevation: 6476,
      country: "Nepal",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 27.7167,
      longitude: 86.8667,
      difficultyTier: "novice",
      requiredClimbingLevel: 7,
      description: "Nepal's highest trekking peak, non-technical but high altitude.",
      firstAscentYear: 1953,
      fatalityRate: 0.05,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({ min_level: 7, min_summits: 4 }),
      backgroundImage: "/backgrounds/mera.png",
      themeColors: JSON.stringify({
        primary: "#85C1E9",
        secondary: "#F8F9FA",
        accent: "#F1C40F",
        gradient: "from-blue-300 via-slate-50 to-yellow-400"
      })
    },

    // ========== INTERMEDIATE TIER (30 mountains) ==========
    {
      name: "Mount Rainier",
      elevation: 4392,
      country: "USA",
      mountainRange: "Cascade Range",
      continent: "North America",
      latitude: 46.8523,
      longitude: -121.7603,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 8,
      description: "Washington's iconic stratovolcano, a classic glacier climb and training ground.",
      firstAscentYear: 1870,
      fatalityRate: 0.12,
      bestSeasonStart: "May",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 8, min_summits: 5 }),
      backgroundImage: "/backgrounds/rainier.png",
      themeColors: JSON.stringify({
        primary: "#AED6F1",
        secondary: "#34495E",
        accent: "#D5DBDB",
        gradient: "from-blue-300 via-slate-700 to-slate-300"
      })
    },
    {
      name: "Mount Elbrus",
      elevation: 5642,
      country: "Russia",
      mountainRange: "Caucasus",
      continent: "Europe",
      latitude: 43.3529,
      longitude: 42.4392,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 10,
      description: "Europe's highest mountain, a dormant volcano with glacier climbing.",
      firstAscentYear: 1874,
      fatalityRate: 0.18,
      bestSeasonStart: "June",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 10, min_summits: 6 }),
      backgroundImage: "/backgrounds/elbrus.png",
      themeColors: JSON.stringify({
        primary: "#AED6F1",
        secondary: "#566573",
        accent: "#D5D8DC",
        gradient: "from-blue-200 via-slate-600 to-slate-200"
      })
    },
    {
      name: "Aconcagua",
      elevation: 6961,
      country: "Argentina",
      mountainRange: "Andes",
      continent: "South America",
      latitude: -32.6533,
      longitude: -70.0108,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 12,
      description: "The highest peak in the Americas and Southern Hemisphere, non-technical but extremely high.",
      firstAscentYear: 1897,
      fatalityRate: 0.25,
      bestSeasonStart: "December",
      bestSeasonEnd: "February",
      unlockRequirements: JSON.stringify({ min_level: 12, min_summits: 7 }),
      backgroundImage: "/backgrounds/aconcagua.png",
      themeColors: JSON.stringify({
        primary: "#95A5A6",
        secondary: "#5D6D7E",
        accent: "#FAD7A0",
        gradient: "from-slate-400 via-slate-600 to-amber-200"
      })
    },
    {
      name: "Mount Baker",
      elevation: 3286,
      country: "USA",
      mountainRange: "Cascade Range",
      continent: "North America",
      latitude: 48.7768,
      longitude: -121.8145,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 8,
      description: "A heavily glaciated volcano in Washington, excellent glacier training.",
      firstAscentYear: 1868,
      fatalityRate: 0.08,
      bestSeasonStart: "May",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 8, min_summits: 4 }),
      backgroundImage: "/backgrounds/baker.png",
      themeColors: JSON.stringify({
        primary: "#5DADE2",
        secondary: "#AAB7B8",
        accent: "#FDEBD0",
        gradient: "from-blue-400 via-slate-300 to-amber-100"
      })
    },
    {
      name: "Cotopaxi",
      elevation: 5897,
      country: "Ecuador",
      mountainRange: "Andes",
      continent: "South America",
      latitude: -0.6850,
      longitude: -78.4367,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 10,
      description: "One of the world's highest active volcanoes with glacier climbing.",
      firstAscentYear: 1872,
      fatalityRate: 0.10,
      bestSeasonStart: "December",
      bestSeasonEnd: "January",
      unlockRequirements: JSON.stringify({ min_level: 10, min_summits: 6 }),
      backgroundImage: "/backgrounds/cotopaxi.png",
      themeColors: JSON.stringify({
        primary: "#E67E22",
        secondary: "#2C3E50",
        accent: "#F8F9FA",
        gradient: "from-orange-600 via-slate-900 to-slate-100"
      })
    },
    {
      name: "Mount Shasta",
      elevation: 4322,
      country: "USA",
      mountainRange: "Cascade Range",
      continent: "North America",
      latitude: 41.4093,
      longitude: -122.1949,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 7,
      description: "A prominent Cascade volcano with multiple glacier routes.",
      firstAscentYear: 1854,
      fatalityRate: 0.06,
      bestSeasonStart: "May",
      bestSeasonEnd: "July",
      unlockRequirements: JSON.stringify({ min_level: 7, min_summits: 4 }),
      backgroundImage: "/backgrounds/shasta.png",
      themeColors: JSON.stringify({
        primary: "#9B59B6",
        secondary: "#ECF0F1",
        accent: "#1ABC9C",
        gradient: "from-purple-700 via-slate-100 to-teal-500"
      })
    },
    {
      name: "Huayna Potosi",
      elevation: 6088,
      country: "Bolivia",
      mountainRange: "Andes",
      continent: "South America",
      latitude: -16.2667,
      longitude: -68.1500,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 9,
      description: "A popular training peak near La Paz with glacier and mixed climbing.",
      firstAscentYear: 1919,
      fatalityRate: 0.12,
      bestSeasonStart: "May",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 9, min_summits: 5 }),
      backgroundImage: "/backgrounds/potosi.png",
      themeColors: JSON.stringify({
        primary: "#5499C7",
        secondary: "#273746",
        accent: "#F8C471",
        gradient: "from-blue-500 via-slate-900 to-amber-300"
      })
    },
    {
      name: "Chopicalqui",
      elevation: 6354,
      country: "Peru",
      mountainRange: "Cordillera Blanca",
      continent: "South America",
      latitude: -9.0333,
      longitude: -77.4167,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 11,
      description: "A beautiful peak in Peru's Cordillera Blanca with technical sections.",
      firstAscentYear: 1932,
      fatalityRate: 0.15,
      bestSeasonStart: "May",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 11, min_summits: 7 }),
      backgroundImage: "/backgrounds/chopicalqui.png",
      themeColors: JSON.stringify({
        primary: "#5DADE2",
        secondary: "#E8F8F5",
        accent: "#48C9B0",
        gradient: "from-blue-400 via-cyan-50 to-teal-400"
      })
    },
    {
      name: "Nevado Pisco",
      elevation: 5752,
      country: "Peru",
      mountainRange: "Cordillera Blanca",
      continent: "South America",
      latitude: -9.0167,
      longitude: -77.6333,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 9,
      description: "An accessible peak in the Cordillera Blanca, good acclimatization climb.",
      firstAscentYear: 1951,
      fatalityRate: 0.08,
      bestSeasonStart: "May",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 9, min_summits: 5 }),
      backgroundImage: "/backgrounds/pisco.png",
      themeColors: JSON.stringify({
        primary: "#3498DB",
        secondary: "#F8F9FA",
        accent: "#52BE80",
        gradient: "from-blue-600 via-slate-50 to-emerald-500"
      })
    },
    {
      name: "Aoraki / Mount Cook",
      elevation: 3724,
      country: "New Zealand",
      mountainRange: "Southern Alps",
      continent: "Oceania",
      latitude: -43.5950,
      longitude: 170.1419,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 13,
      description: "New Zealand's highest peak, technical mixed climbing in unpredictable weather.",
      firstAscentYear: 1894,
      fatalityRate: 0.35,
      bestSeasonStart: "December",
      bestSeasonEnd: "February",
      unlockRequirements: JSON.stringify({ min_level: 13, min_summits: 8 }),
      backgroundImage: "/backgrounds/cook.png",
      themeColors: JSON.stringify({
        primary: "#5DADE2",
        secondary: "#34495E",
        accent: "#A3E4D7",
        gradient: "from-blue-400 via-slate-700 to-teal-200"
      })
    },
    {
      name: "Damavand",
      elevation: 5610,
      country: "Iran",
      mountainRange: "Alborz",
      continent: "Asia",
      latitude: 35.9553,
      longitude: 52.1092,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 8,
      description: "The highest volcano in Asia and the Middle East's highest peak.",
      firstAscentYear: 1905,
      fatalityRate: 0.03,
      bestSeasonStart: "June",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 8, min_summits: 5 }),
      backgroundImage: "/backgrounds/damavand.png",
      themeColors: JSON.stringify({
        primary: "#E74C3C",
        secondary: "#F4D03F",
        accent: "#D5DBDB",
        gradient: "from-red-700 via-yellow-500 to-slate-200"
      })
    },
    {
      name: "Ama Dablam",
      elevation: 6812,
      country: "Nepal",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 27.8617,
      longitude: 86.8614,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 18,
      description: "The 'Matterhorn of the Himalayas', stunningly beautiful and highly technical.",
      firstAscentYear: 1961,
      fatalityRate: 0.45,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({ min_level: 18, min_summits: 12 }),
      backgroundImage: "/backgrounds/dablam.png",
      themeColors: JSON.stringify({
        primary: "#F39C12",
        secondary: "#2C3E50",
        accent: "#AED6F1",
        gradient: "from-amber-600 via-slate-900 to-blue-300"
      })
    },

    // ========== ADVANCED TIER (30 mountains) ==========
    {
      name: "Denali (Mount McKinley)",
      elevation: 6190,
      country: "USA",
      mountainRange: "Alaska Range",
      continent: "North America",
      latitude: 63.0692,
      longitude: -151.0074,
      difficultyTier: "advanced",
      requiredClimbingLevel: 20,
      description: "North America's highest and coldest peak, extreme cold and weather.",
      firstAscentYear: 1913,
      fatalityRate: 0.50,
      bestSeasonStart: "May",
      bestSeasonEnd: "July",
      unlockRequirements: JSON.stringify({ min_level: 20, min_summits: 10 }),
      backgroundImage: "/backgrounds/denali.png",
      themeColors: JSON.stringify({
        primary: "#D6EAF8",
        secondary: "#212F3C",
        accent: "#85C1E9",
        gradient: "from-blue-100 via-slate-900 to-blue-300"
      })
    },
    {
      name: "Matterhorn",
      elevation: 4478,
      country: "Switzerland/Italy",
      mountainRange: "Pennine Alps",
      continent: "Europe",
      latitude: 45.9765,
      longitude: 7.6585,
      difficultyTier: "advanced",
      requiredClimbingLevel: 16,
      description: "The iconic pyramid peak, technically demanding with serious rockfall hazard.",
      firstAscentYear: 1865,
      fatalityRate: 1.20,
      bestSeasonStart: "July",
      bestSeasonEnd: "September",
      unlockRequirements: JSON.stringify({ min_level: 16, min_summits: 10 }),
      backgroundImage: "/backgrounds/matterhorn.png",
      themeColors: JSON.stringify({
        primary: "#566573",
        secondary: "#E74C3C",
        accent: "#ECF0F1",
        gradient: "from-slate-600 via-red-700 to-slate-100"
      })
    },
    {
      name: "Eiger (North Face)",
      elevation: 3970,
      country: "Switzerland",
      mountainRange: "Bernese Alps",
      continent: "Europe",
      latitude: 46.5775,
      longitude: 8.0058,
      difficultyTier: "advanced",
      requiredClimbingLevel: 25,
      description: "The legendary 'Mordwand', one of the six great north faces of the Alps.",
      firstAscentYear: 1858,
      fatalityRate: 2.50,
      bestSeasonStart: "July",
      bestSeasonEnd: "August",
      unlockRequirements: JSON.stringify({ min_level: 25, min_summits: 15 }),
      backgroundImage: "/backgrounds/eiger.png",
      themeColors: JSON.stringify({
        primary: "#2C3E50",
        secondary: "#E8F8F5",
        accent: "#E74C3C",
        gradient: "from-slate-900 via-cyan-50 to-red-700"
      })
    },
    {
      name: "Cho Oyu",
      elevation: 8188,
      country: "Nepal/China",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 28.0942,
      longitude: 86.6608,
      difficultyTier: "advanced",
      requiredClimbingLevel: 35,
      description: "The 6th highest mountain, considered the 'easiest' 8000m peak.",
      firstAscentYear: 1954,
      fatalityRate: 1.30,
      bestSeasonStart: "September",
      bestSeasonEnd: "October",
      unlockRequirements: JSON.stringify({ min_level: 35, min_summits: 18, required_climbs: [] }),
      backgroundImage: "/backgrounds/cho.png",
      themeColors: JSON.stringify({
        primary: "#48C9B0",
        secondary: "#F8F9FA",
        accent: "#F4D03F",
        gradient: "from-teal-400 via-slate-50 to-yellow-400"
      })
    },
    {
      name: "Mount Vinson",
      elevation: 4892,
      country: "Antarctica",
      mountainRange: "Sentinel Range",
      continent: "Antarctica",
      latitude: -78.5253,
      longitude: -85.6172,
      difficultyTier: "advanced",
      requiredClimbingLevel: 22,
      description: "Antarctica's highest peak, extreme cold and remoteness.",
      firstAscentYear: 1966,
      fatalityRate: 0.10,
      bestSeasonStart: "November",
      bestSeasonEnd: "January",
      unlockRequirements: JSON.stringify({ min_level: 22, min_summits: 12 }),
      backgroundImage: "/backgrounds/vinson.png",
      themeColors: JSON.stringify({
        primary: "#EBF5FB",
        secondary: "#5DADE2",
        accent: "#AEB6BF",
        gradient: "from-blue-50 via-blue-400 to-slate-400"
      })
    },
    {
      name: "Gasherbrum II",
      elevation: 8035,
      country: "Pakistan/China",
      mountainRange: "Karakoram",
      continent: "Asia",
      latitude: 35.7586,
      longitude: 76.6531,
      difficultyTier: "advanced",
      requiredClimbingLevel: 38,
      description: "The 13th highest peak, relatively moderate for an 8000m peak.",
      firstAscentYear: 1956,
      fatalityRate: 2.20,
      bestSeasonStart: "June",
      bestSeasonEnd: "August",
      unlockRequirements: JSON.stringify({ min_level: 38, min_summits: 20 }),
      backgroundImage: "/backgrounds/gasherbrum.png",
      themeColors: JSON.stringify({
        primary: "#F8F9FA",
        secondary: "#5499C7",
        accent: "#AAB7B8",
        gradient: "from-slate-50 via-blue-500 to-slate-400"
      })
    },
    {
      name: "Broad Peak",
      elevation: 8051,
      country: "Pakistan/China",
      mountainRange: "Karakoram",
      continent: "Asia",
      latitude: 35.8108,
      longitude: 76.5669,
      difficultyTier: "advanced",
      requiredClimbingLevel: 40,
      description: "The 12th highest peak with a broad summit plateau.",
      firstAscentYear: 1957,
      fatalityRate: 3.10,
      bestSeasonStart: "June",
      bestSeasonEnd: "August",
      unlockRequirements: JSON.stringify({ min_level: 40, min_summits: 22 }),
      backgroundImage: "/backgrounds/broad.png",
      themeColors: JSON.stringify({
        primary: "#D5DBDB",
        secondary: "#2874A6",
        accent: "#85929E",
        gradient: "from-slate-200 via-blue-700 to-slate-500"
      })
    },
    {
      name: "Shishapangma",
      elevation: 8027,
      country: "China",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 28.3528,
      longitude: 85.7800,
      difficultyTier: "advanced",
      requiredClimbingLevel: 36,
      description: "The 14th highest and only 8000er entirely in China.",
      firstAscentYear: 1964,
      fatalityRate: 1.80,
      bestSeasonStart: "September",
      bestSeasonEnd: "October",
      unlockRequirements: JSON.stringify({ min_level: 36, min_summits: 19 }),
      backgroundImage: "/backgrounds/shishapangma.png",
      themeColors: JSON.stringify({
        primary: "#5DADE2",
        secondary: "#D5DBDB",
        accent: "#F39C12",
        gradient: "from-blue-400 via-slate-200 to-amber-600"
      })
    },
    {
      name: "Manaslu",
      elevation: 8163,
      country: "Nepal",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 28.5500,
      longitude: 84.5597,
      difficultyTier: "advanced",
      requiredClimbingLevel: 37,
      description: "The 8th highest peak, known as the 'Mountain of the Spirit'.",
      firstAscentYear: 1956,
      fatalityRate: 5.50,
      bestSeasonStart: "September",
      bestSeasonEnd: "October",
      unlockRequirements: JSON.stringify({ min_level: 37, min_summits: 20 }),
      backgroundImage: "/backgrounds/manaslu.png",
      themeColors: JSON.stringify({
        primary: "#9B59B6",
        secondary: "#ECF0F1",
        accent: "#F4D03F",
        gradient: "from-purple-600 via-slate-100 to-yellow-400"
      })
    },
    {
      name: "Dhaulagiri",
      elevation: 8167,
      country: "Nepal",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 28.6978,
      longitude: 83.4933,
      difficultyTier: "advanced",
      requiredClimbingLevel: 42,
      description: "The 7th highest peak with a massive south face.",
      firstAscentYear: 1960,
      fatalityRate: 3.80,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({ min_level: 42, min_summits: 23 }),
      backgroundImage: "/backgrounds/dhaulagiri.png",
      themeColors: JSON.stringify({
        primary: "#ECF0F1",
        secondary: "#154360",
        accent: "#5DADE2",
        gradient: "from-slate-100 via-blue-900 to-blue-400"
      })
    },

    // ========== EXPERT TIER (15 mountains) ==========
    {
      name: "Nanga Parbat",
      elevation: 8126,
      country: "Pakistan",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 35.2372,
      longitude: 74.5894,
      difficultyTier: "expert",
      requiredClimbingLevel: 44,
      description: "The 'Killer Mountain', 9th highest with one of the highest fatality rates.",
      firstAscentYear: 1953,
      fatalityRate: 5.50,
      bestSeasonStart: "June",
      bestSeasonEnd: "August",
      unlockRequirements: JSON.stringify({ min_level: 44, min_summits: 25 }),
      backgroundImage: "/backgrounds/parbat.png",
      themeColors: JSON.stringify({
        primary: "#E74C3C",
        secondary: "#2C3E50",
        accent: "#F8F9FA",
        gradient: "from-red-700 via-slate-900 to-slate-100"
      })
    },
    {
      name: "Makalu",
      elevation: 8485,
      country: "Nepal/China",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 27.8897,
      longitude: 87.0886,
      difficultyTier: "expert",
      requiredClimbingLevel: 46,
      description: "The 5th highest peak, a perfect pyramid with serious technical challenges.",
      firstAscentYear: 1955,
      fatalityRate: 4.80,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({ min_level: 46, min_summits: 26 }),
      backgroundImage: "/backgrounds/makalu.png",
      themeColors: JSON.stringify({
        primary: "#2C3E50",
        secondary: "#AED6F1",
        accent: "#F39C12",
        gradient: "from-slate-900 via-blue-300 to-amber-600"
      })
    },
    {
      name: "Lhotse",
      elevation: 8516,
      country: "Nepal/China",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 27.9617,
      longitude: 86.9333,
      difficultyTier: "expert",
      requiredClimbingLevel: 47,
      description: "The 4th highest peak connected to Everest, featuring the massive Lhotse Face.",
      firstAscentYear: 1956,
      fatalityRate: 2.80,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({ min_level: 47, min_summits: 28 }),
      backgroundImage: "/backgrounds/lhotse.png",
      themeColors: JSON.stringify({
        primary: "#5499C7",
        secondary: "#D5DBDB",
        accent: "#F8C471",
        gradient: "from-blue-500 via-slate-200 to-amber-300"
      })
    },
    {
      name: "Grandes Jorasses (North Face)",
      elevation: 4208,
      country: "France/Italy",
      mountainRange: "Mont Blanc Massif",
      continent: "Europe",
      latitude: 45.8667,
      longitude: 6.9833,
      difficultyTier: "expert",
      requiredClimbingLevel: 28,
      description: "One of the six great north faces of the Alps, extremely technical.",
      firstAscentYear: 1865,
      fatalityRate: 1.80,
      bestSeasonStart: "July",
      bestSeasonEnd: "August",
      unlockRequirements: JSON.stringify({ min_level: 28, min_summits: 16 }),
      backgroundImage: "/backgrounds/jorasses.png",
      themeColors: JSON.stringify({
        primary: "#34495E",
        secondary: "#AED6F1",
        accent: "#BDC3C7",
        gradient: "from-slate-700 via-blue-300 to-slate-300"
      })
    },
    {
      name: "Kangchenjunga",
      elevation: 8586,
      country: "Nepal/India",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 27.7025,
      longitude: 88.1475,
      difficultyTier: "expert",
      requiredClimbingLevel: 48,
      description: "The 3rd highest peak, considered one of the most difficult and dangerous 8000ers.",
      firstAscentYear: 1955,
      fatalityRate: 4.00,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({ min_level: 48, min_summits: 30 }),
      backgroundImage: "/backgrounds/kangchenjunga.png",
      themeColors: JSON.stringify({
        primary: "#F4D03F",
        secondary: "#F8F9FA",
        accent: "#E74C3C",
        gradient: "from-yellow-400 via-slate-50 to-red-700"
      })
    },

    // ========== ELITE TIER (8 mountains - the 8000m death zone peaks) ==========
    {
      name: "Mount Everest",
      elevation: 8849,
      country: "Nepal/China",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 27.9881,
      longitude: 86.9250,
      difficultyTier: "elite",
      requiredClimbingLevel: 50,
      description: "The world's highest mountain at 8,849 meters. The ultimate mountaineering challenge.",
      firstAscentYear: 1953,
      fatalityRate: 4.40,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({
        min_level: 50,
        min_summits: 30,
        min_habit_streak: 100,
        required_climbs: []
      }),
      backgroundImage: "/backgrounds/everest.png",
      themeColors: JSON.stringify({
        primary: "#2C3E50",
        secondary: "#F39C12",
        accent: "#ECF0F1",
        gradient: "from-slate-900 via-amber-600 to-slate-100"
      })
    },
    {
      name: "K2",
      elevation: 8611,
      country: "Pakistan/China",
      mountainRange: "Karakoram",
      continent: "Asia",
      latitude: 35.8825,
      longitude: 76.5133,
      difficultyTier: "elite",
      requiredClimbingLevel: 55,
      description: "The 'Savage Mountain', 2nd highest and most dangerous 8000m peak. The ultimate test.",
      firstAscentYear: 1954,
      fatalityRate: 23.00,
      bestSeasonStart: "June",
      bestSeasonEnd: "August",
      unlockRequirements: JSON.stringify({
        min_level: 55,
        min_summits: 35,
        min_habit_streak: 150
      }),
      backgroundImage: "/backgrounds/k2.png",
      themeColors: JSON.stringify({
        primary: "#212F3C",
        secondary: "#E74C3C",
        accent: "#85929E",
        gradient: "from-slate-950 via-red-800 to-slate-500"
      })
    },
    {
      name: "Annapurna I",
      elevation: 8091,
      country: "Nepal",
      mountainRange: "Himalayas",
      continent: "Asia",
      latitude: 28.5967,
      longitude: 83.8203,
      difficultyTier: "elite",
      requiredClimbingLevel: 52,
      description: "The 10th highest peak with the highest fatality rate of all 8000m peaks.",
      firstAscentYear: 1950,
      fatalityRate: 32.00,
      bestSeasonStart: "April",
      bestSeasonEnd: "May",
      unlockRequirements: JSON.stringify({
        min_level: 52,
        min_summits: 32,
        min_habit_streak: 120
      }),
      backgroundImage: "/backgrounds/annapurna.png",
      themeColors: JSON.stringify({
        primary: "#E74C3C",
        secondary: "#34495E",
        accent: "#F8F9FA",
        gradient: "from-red-800 via-slate-800 to-slate-100"
      })
    },
    {
      name: "Chimborazo",
      elevation: 6263,
      country: "Ecuador",
      mountainRange: "Andes",
      continent: "South America",
      latitude: -1.4692,
      longitude: -78.8175,
      difficultyTier: "intermediate",
      requiredClimbingLevel: 11,
      description: "The point on Earth's surface farthest from its center due to equatorial bulge.",
      firstAscentYear: 1880,
      fatalityRate: 0.10,
      bestSeasonStart: "December",
      bestSeasonEnd: "January",
      unlockRequirements: JSON.stringify({ min_level: 11, min_summits: 6 }),
      backgroundImage: "/backgrounds/chimborazo.png",
      themeColors: JSON.stringify({
        primary: "#87CEEB",
        secondary: "#8B4513",
        accent: "#FFFAF0",
        gradient: "from-sky-400 via-orange-800 to-orange-50"
      })
    }
  ];

  // Add default backgrounds and themes for mountains that don't have them
  const defaultBackgrounds = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80", // Mountain landscape 1
    "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=1920&q=80", // Mountain landscape 2
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80", // Mountain landscape 3
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80", // Mountain landscape 4
    "https://images.unsplash.com/photo-1454391304352-2bf4678b1a7a?w=1920&q=80", // Mountain landscape 5
  ];

  const defaultThemes = [
    { primary: "#1565C0", secondary: "#F57C00", accent: "#E3F2FD", gradient: "from-blue-900 via-slate-800 to-gray-900" },
    { primary: "#2E7D32", secondary: "#FFB300", accent: "#E8F5E9", gradient: "from-green-900 via-teal-800 to-blue-900" },
    { primary: "#6A1B9A", secondary: "#FF6F00", accent: "#F3E5F5", gradient: "from-purple-900 via-indigo-800 to-blue-900" },
    { primary: "#C62828", secondary: "#FFA000", accent: "#FFEBEE", gradient: "from-red-900 via-orange-800 to-yellow-900" },
    { primary: "#00838F", secondary: "#FB8C00", accent: "#E0F7FA", gradient: "from-cyan-900 via-blue-800 to-indigo-900" },
  ];

  mountains.forEach((mountain, index) => {
    if (!mountain.backgroundImage) {
      mountain.backgroundImage = defaultBackgrounds[index % defaultBackgrounds.length];
    }
    if (!mountain.themeColors) {
      const theme = defaultThemes[index % defaultThemes.length];
      mountain.themeColors = JSON.stringify(theme);
    }
  });

  const insertedMountains = await db.insert(schema.mountains).values(mountains as any).returning();

  // Create mountain lookup map
  const mountainMap = Object.fromEntries(
    insertedMountains.map(m => [m.name, m.id])
  );

  // ============================================================================
  // 4. ROUTES (Sample routes - focusing on key mountains)
  // ============================================================================

  const routes = [
    // MOUNT FUJI
    {
      mountainId: mountainMap["Mount Fuji"],
      routeName: "Yoshida Trail",
      gradingSystem: "hiking",
      gradeValue: "Class 1",
      elevationGain: 1472,
      estimatedDays: 2,
      terrainTypes: JSON.stringify(["rock", "scree"]),
      hazards: JSON.stringify(["altitude", "weather"]),
      routeDescription: "The most popular route up Mount Fuji, well-maintained trail with huts.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: false
    },

    // KILIMANJARO
    {
      mountainId: mountainMap["Mount Kilimanjaro (Uhuru Peak)"],
      routeName: "Machame Route",
      gradingSystem: "hiking",
      gradeValue: "Class 2",
      elevationGain: 4895,
      estimatedDays: 7,
      terrainTypes: JSON.stringify(["rock", "scree"]),
      hazards: JSON.stringify(["altitude"]),
      routeDescription: "The 'Whiskey Route', scenic but challenging with good acclimatization.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: false
    },
    {
      mountainId: mountainMap["Mount Kilimanjaro (Uhuru Peak)"],
      routeName: "Marangu Route",
      gradingSystem: "hiking",
      gradeValue: "Class 1",
      elevationGain: 4895,
      estimatedDays: 6,
      terrainTypes: JSON.stringify(["rock", "scree"]),
      hazards: JSON.stringify(["altitude"]),
      routeDescription: "The 'Coca-Cola Route', only route with hut accommodation.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: false
    },

    // MONT BLANC
    {
      mountainId: mountainMap["Mont Blanc"],
      routeName: "Goûter Route (Normal Route)",
      gradingSystem: "French",
      gradeValue: "PD",
      elevationGain: 1800,
      estimatedDays: 3,
      terrainTypes: JSON.stringify(["glacier", "snow", "rock"]),
      hazards: JSON.stringify(["crevasse", "rockfall", "altitude"]),
      routeDescription: "The standard route via Goûter Hut, serious glaciated terrain.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: false
    },

    // MOUNT RAINIER
    {
      mountainId: mountainMap["Mount Rainier"],
      routeName: "Disappointment Cleaver",
      gradingSystem: "YDS",
      gradeValue: "Grade II, Class 3",
      elevationGain: 2743,
      estimatedDays: 3,
      terrainTypes: JSON.stringify(["glacier", "snow", "rock"]),
      hazards: JSON.stringify(["crevasse", "rockfall", "altitude", "weather"]),
      routeDescription: "The most popular route, heavily glaciated with moderate technical sections.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: false
    },
    {
      mountainId: mountainMap["Mount Rainier"],
      routeName: "Emmons Glacier",
      gradingSystem: "YDS",
      gradeValue: "Grade II, Class 3",
      elevationGain: 2743,
      estimatedDays: 3,
      terrainTypes: JSON.stringify(["glacier", "snow"]),
      hazards: JSON.stringify(["crevasse", "icefall", "altitude"]),
      routeDescription: "Beautiful glacier route on the less-traveled east side.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: false
    },

    // DENALI
    {
      mountainId: mountainMap["Denali (Mount McKinley)"],
      routeName: "West Buttress",
      gradingSystem: "Alaskan Grade",
      gradeValue: "Grade 2",
      elevationGain: 4023,
      estimatedDays: 21,
      terrainTypes: JSON.stringify(["glacier", "snow", "ice"]),
      hazards: JSON.stringify(["extreme_cold", "crevasse", "altitude", "weather", "wind"]),
      routeDescription: "The standard route, still extremely challenging due to cold and altitude.",
      requiresOxygen: false,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: false
    },
    {
      mountainId: mountainMap["Denali (Mount McKinley)"],
      routeName: "Cassin Ridge",
      gradingSystem: "Alaskan Grade",
      gradeValue: "Grade 5",
      elevationGain: 4023,
      estimatedDays: 12,
      terrainTypes: JSON.stringify(["mixed", "rock", "ice", "snow"]),
      hazards: JSON.stringify(["extreme_cold", "rockfall", "avalanche", "altitude", "exposure"]),
      routeDescription: "One of the great mountaineering routes in the world, extremely technical.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: true
    },

    // MATTERHORN
    {
      mountainId: mountainMap["Matterhorn"],
      routeName: "Hörnli Ridge (Normal Route)",
      gradingSystem: "UIAA",
      gradeValue: "III",
      elevationGain: 1220,
      estimatedDays: 2,
      terrainTypes: JSON.stringify(["rock", "mixed"]),
      hazards: JSON.stringify(["rockfall", "exposure", "crowding", "weather"]),
      routeDescription: "The classic route, extremely exposed with serious rockfall danger.",
      requiresOxygen: false,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: true
    },

    // ACONCAGUA
    {
      mountainId: mountainMap["Aconcagua"],
      routeName: "Normal Route (Northwest Ridge)",
      gradingSystem: "hiking",
      gradeValue: "Class 2",
      elevationGain: 3961,
      estimatedDays: 18,
      terrainTypes: JSON.stringify(["rock", "scree", "snow"]),
      hazards: JSON.stringify(["altitude", "wind", "weather", "cold"]),
      routeDescription: "Non-technical but extremely high altitude trekking route.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: false
    },

    // ELBRUS
    {
      mountainId: mountainMap["Mount Elbrus"],
      routeName: "South Route",
      gradingSystem: "French",
      gradeValue: "F",
      elevationGain: 2142,
      estimatedDays: 8,
      terrainTypes: JSON.stringify(["glacier", "snow"]),
      hazards: JSON.stringify(["crevasse", "altitude", "weather", "cold"]),
      routeDescription: "The standard route with lift assistance, moderate glacier travel.",
      requiresOxygen: false,
      requiresFixedRopes: false,
      requiresTechnicalClimbing: false
    },

    // ISLAND PEAK
    {
      mountainId: mountainMap["Island Peak (Imja Tse)"],
      routeName: "Southwest Ridge",
      gradingSystem: "French",
      gradeValue: "PD",
      elevationGain: 1189,
      estimatedDays: 2,
      terrainTypes: JSON.stringify(["glacier", "snow", "ice"]),
      hazards: JSON.stringify(["altitude", "crevasse", "ice"]),
      routeDescription: "Popular trekking peak with a beautiful summit ridge.",
      requiresOxygen: false,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: false
    },

    // AMA DABLAM
    {
      mountainId: mountainMap["Ama Dablam"],
      routeName: "Southwest Ridge",
      gradingSystem: "French",
      gradeValue: "D",
      elevationGain: 2312,
      estimatedDays: 14,
      terrainTypes: JSON.stringify(["mixed", "rock", "ice", "snow"]),
      hazards: JSON.stringify(["exposure", "avalanche", "technical", "altitude"]),
      routeDescription: "Stunning technical climbing on one of the most beautiful peaks.",
      requiresOxygen: false,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: true
    },

    // CHO OYU
    {
      mountainId: mountainMap["Cho Oyu"],
      routeName: "Northwest Ridge",
      gradingSystem: "French",
      gradeValue: "PD",
      elevationGain: 3188,
      estimatedDays: 45,
      terrainTypes: JSON.stringify(["glacier", "snow", "ice"]),
      hazards: JSON.stringify(["altitude", "crevasse", "avalanche", "cold"]),
      routeDescription: "The standard route on the 'easiest' 8000m peak.",
      requiresOxygen: true,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: false
    },

    // MOUNT EVEREST
    {
      mountainId: mountainMap["Mount Everest"],
      routeName: "South Col Route (Southeast Ridge)",
      gradingSystem: "French",
      gradeValue: "PD+",
      elevationGain: 3550,
      estimatedDays: 60,
      terrainTypes: JSON.stringify(["glacier", "snow", "ice", "rock"]),
      hazards: JSON.stringify(["altitude", "avalanche", "crevasse", "wind", "cold", "death_zone"]),
      routeDescription: "The standard route from Nepal via the South Col, first climbed by Hillary and Norgay.",
      requiresOxygen: true,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: false
    },
    {
      mountainId: mountainMap["Mount Everest"],
      routeName: "North Ridge (Northeast Ridge)",
      gradingSystem: "French",
      gradeValue: "PD+",
      elevationGain: 3849,
      estimatedDays: 60,
      terrainTypes: JSON.stringify(["glacier", "snow", "rock"]),
      hazards: JSON.stringify(["altitude", "wind", "cold", "exposure", "death_zone"]),
      routeDescription: "The route from Tibet, attempted by Mallory and Irvine in 1924.",
      requiresOxygen: true,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: false
    },

    // K2
    {
      mountainId: mountainMap["K2"],
      routeName: "Abruzzi Spur",
      gradingSystem: "French",
      gradeValue: "D+",
      elevationGain: 3611,
      estimatedDays: 60,
      terrainTypes: JSON.stringify(["mixed", "rock", "ice", "snow"]),
      hazards: JSON.stringify(["altitude", "avalanche", "rockfall", "exposure", "death_zone", "weather"]),
      routeDescription: "The standard route, still extremely dangerous and technical.",
      requiresOxygen: true,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: true
    },

    // ANNAPURNA
    {
      mountainId: mountainMap["Annapurna I"],
      routeName: "North Face",
      gradingSystem: "French",
      gradeValue: "ED",
      elevationGain: 3091,
      estimatedDays: 50,
      terrainTypes: JSON.stringify(["ice", "snow", "mixed"]),
      hazards: JSON.stringify(["avalanche", "altitude", "serac", "weather", "death_zone"]),
      routeDescription: "Extremely dangerous route on the deadliest 8000m peak.",
      requiresOxygen: true,
      requiresFixedRopes: true,
      requiresTechnicalClimbing: true
    }
  ];

  const insertedRoutes = await db.insert(schema.routes).values(routes).returning();

  // ============================================================================
  // 5. ROUTE GEAR REQUIREMENTS (Sample for key routes)
  // ============================================================================

  const routeGearRequirements = [
    // Mount Fuji - Yoshida Trail (minimal gear)
    { routeId: insertedRoutes[0].id, gearId: gearMap["Approach Shoes"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[0].id, gearId: gearMap["Headlamp"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[0].id, gearId: gearMap["Hardshell Jacket"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[0].id, gearId: gearMap["First Aid Kit"], isRequired: false, quantity: 1 },

    // Kilimanjaro - Machame Route
    { routeId: insertedRoutes[1].id, gearId: gearMap["Approach Shoes"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[1].id, gearId: gearMap["Trekking Poles (pair)"], isRequired: false, quantity: 1 },
    { routeId: insertedRoutes[1].id, gearId: gearMap["Down Sleeping Bag (-10°C)"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[1].id, gearId: gearMap["3-Season Tent"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[1].id, gearId: gearMap["Hardshell Jacket"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[1].id, gearId: gearMap["Down Jacket"], isRequired: true, quantity: 1 },

    // Mont Blanc - Goûter Route
    { routeId: insertedRoutes[3].id, gearId: gearMap["Single Mountaineering Boots"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[3].id, gearId: gearMap["Aluminum Crampons"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[3].id, gearId: gearMap["Basic Ice Axe"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[3].id, gearId: gearMap["Alpine Harness"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[3].id, gearId: gearMap["Climbing Helmet"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[3].id, gearId: gearMap["60m Rope (9.2mm)"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[3].id, gearId: gearMap["Carabiner Set (12)"], isRequired: true, quantity: 1 },

    // Mount Rainier - Disappointment Cleaver
    { routeId: insertedRoutes[4].id, gearId: gearMap["Double Mountaineering Boots"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[4].id, gearId: gearMap["Steel Crampons"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[4].id, gearId: gearMap["Basic Ice Axe"], isRequired: true, quantity: 2 },
    { routeId: insertedRoutes[4].id, gearId: gearMap["Alpine Harness"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[4].id, gearId: gearMap["Climbing Helmet"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[4].id, gearId: gearMap["60m Rope (9.2mm)"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[4].id, gearId: gearMap["4-Season Expedition Tent"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[4].id, gearId: gearMap["Down Sleeping Bag (-30°C)"], isRequired: true, quantity: 1 },

    // Denali - West Buttress (extreme cold gear)
    { routeId: insertedRoutes[6].id, gearId: gearMap["Double Mountaineering Boots"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["Steel Crampons"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["Basic Ice Axe"], isRequired: true, quantity: 2 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["Alpine Harness"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["Climbing Helmet"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["60m Rope (9.2mm)"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["4-Season Expedition Tent"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["Down Sleeping Bag (-40°C)"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["Expedition Gloves"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["8000m Down Suit"], isRequired: false, quantity: 1 },
    { routeId: insertedRoutes[6].id, gearId: gearMap["Ascender/Jumar"], isRequired: true, quantity: 2 },

    // Mount Everest - South Col (full 8000m gear)
    { routeId: insertedRoutes[16].id, gearId: gearMap["8000m Expedition Boots"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Steel Crampons"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Technical Ice Axe"], isRequired: true, quantity: 2 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Alpine Harness"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Climbing Helmet"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["60m Rope (9.2mm)"], isRequired: true, quantity: 2 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["High-Altitude Expedition Tent"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Down Sleeping Bag (-40°C)"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["8000m Down Suit"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Expedition Gloves"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Glacier Goggles"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Oxygen System (Poisk)"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Oxygen Bottles (4L, set of 5)"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Oxygen Regulator"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Oxygen Mask"], isRequired: true, quantity: 1 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Ascender/Jumar"], isRequired: true, quantity: 2 },
    { routeId: insertedRoutes[16].id, gearId: gearMap["Satellite Phone"], isRequired: false, quantity: 1 }
  ];

  await db.insert(schema.routeGearRequirements).values(routeGearRequirements);
}

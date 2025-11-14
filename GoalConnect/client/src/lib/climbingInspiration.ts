// Daily climbing inspiration content
// Mix: 50% locations, 30% facts, 15% technique tips, 5% quotes

export type InspirationType = 'location' | 'fact' | 'technique' | 'quote';

export interface InspirationContent {
  type: InspirationType;
  title: string;
  content: string;
  emoji: string;
  imageUrl?: string; // Optional climbing photo
}

export const CLIMBING_INSPIRATION: InspirationContent[] = [
  // LOCATIONS (50% = 20+ items) ===========================================
  {
    type: 'location',
    title: 'El Capitan, Yosemite',
    content: 'The 3,000-foot granite monolith that defines big wall climbing. First ascended in 1958, it took 47 days. Today, speed climbers summit in under 2 hours.',
    emoji: '🏔️',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
  },
  {
    type: 'location',
    title: 'Matterhorn, Swiss Alps',
    content: 'The iconic pyramid peak standing 14,692 feet. Its distinctive shape has inspired climbers since the first ascent in 1865, though the descent claimed four lives.',
    emoji: '⛰️',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7'
  },
  {
    type: 'location',
    title: 'Half Dome, Yosemite',
    content: 'The granite dome with its distinctive shape, featuring the famous cables route. Over 50,000 people attempt the summit each year via the 400-foot cable section.',
    emoji: '🪨',
    imageUrl: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3'
  },
  {
    type: 'location',
    title: 'K2, Karakoram',
    content: 'The "Savage Mountain" - second highest peak at 28,251 feet but statistically more dangerous than Everest. One person dies for every four who summit.',
    emoji: '🗻',
    imageUrl: 'https://images.unsplash.com/photo-1464207687429-7505649dae38'
  },
  {
    type: 'location',
    title: 'Joshua Tree, California',
    content: 'Desert bouldering paradise with over 8,000 established routes. The perfect rock texture and year-round climbing weather make it a world-class destination.',
    emoji: '🌵',
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851'
  },
  {
    type: 'location',
    title: 'Aiguille du Midi, France',
    content: 'Accessed by cable car to 12,605 feet, this peak offers stunning alpine climbing with views of Mont Blanc. The téléphérique is one of the highest in the world.',
    emoji: '🚡',
    imageUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99'
  },
  {
    type: 'location',
    title: 'Patagonia Torres del Paine',
    content: 'The granite towers of Patagonia challenge climbers with fierce winds and unpredictable weather. The Compressor Route on Cerro Torre is legendary.',
    emoji: '🌊',
    imageUrl: 'https://images.unsplash.com/photo-1587982024948-9b5cc04d7b5a'
  },
  {
    type: 'location',
    title: 'Railay Beach, Thailand',
    content: 'Limestone cliffs rising from tropical waters offer 700+ routes from 5a to 8c. Deep water soloing adds adventure - if you fall, you swim.',
    emoji: '🏝️',
    imageUrl: 'https://images.unsplash.com/photo-1552055570-3b5b4f6ed6c6'
  },
  {
    type: 'location',
    title: 'Fontainebleau, France',
    content: 'The birthplace of modern bouldering. Over 30,000 problems spread across the forest, where legends like John Gill and Fred Nicole trained.',
    emoji: '🌲',
    imageUrl: 'https://images.unsplash.com/photo-1583225776942-0c269a09e3c4'
  },
  {
    type: 'location',
    title: 'Ama Dablam, Nepal',
    content: 'The "Matterhorn of the Himalayas" at 22,349 feet. Its elegant ridgeline and technical climbing make it one of the most beautiful peaks in the world.',
    emoji: '🏔️',
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad'
  },
  {
    type: 'location',
    title: 'Red Rocks, Nevada',
    content: 'Sandstone wonderland with 2,000+ routes just 20 miles from Las Vegas. The Calico Hills and Kraft Boulders offer world-class climbing.',
    emoji: '🪨',
    imageUrl: 'https://images.unsplash.com/photo-1606941165185-c30024abecdf'
  },
  {
    type: 'location',
    title: 'Tonsai Beach, Thailand',
    content: 'Secret climbing paradise accessible only by boat. Steep limestone walls emerge from the jungle, with routes for every skill level.',
    emoji: '🛶',
    imageUrl: 'https://images.unsplash.com/photo-1551881638-a1c49d81e6c6'
  },
  {
    type: 'location',
    title: 'Siurana, Spain',
    content: 'Catalan climbing mecca perched above a reservoir. Over 1,000 routes on perfect limestone, plus the medieval village charm.',
    emoji: '🇪🇸',
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306'
  },
  {
    type: 'location',
    title: 'Mount Rainier, Washington',
    content: 'The 14,411-foot volcano is a training ground for Everest expeditions. Its glaciated slopes teach essential mountaineering skills.',
    emoji: '🌋',
    imageUrl: 'https://images.unsplash.com/photo-1469521669194-babb212f6e1f'
  },
  {
    type: 'location',
    title: 'Kalymnos, Greece',
    content: 'Island paradise with 3,400+ routes on perfect limestone. Sport climbing heaven with blue Aegean views and fresh seafood.',
    emoji: '🇬🇷',
    imageUrl: 'https://images.unsplash.com/photo-1533105079780-92b9be482077'
  },
  {
    type: 'location',
    title: 'Frankenjura, Germany',
    content: 'The birthplace of sport climbing with 10,000+ routes. Wolfgang Güllich developed here, establishing the modern grading system.',
    emoji: '🇩🇪',
    imageUrl: 'https://images.unsplash.com/photo-1522163182402-834f871fd851'
  },
  {
    type: 'location',
    title: 'Annapurna Circuit, Nepal',
    content: 'Trekking route through the Himalayas, passing under 26,545-foot Annapurna I - the first 8,000m peak ever climbed (1950).',
    emoji: '🥾',
    imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa'
  },
  {
    type: 'location',
    title: 'The Bugaboos, Canada',
    content: 'Alpine granite spires in British Columbia. Snowpatch Spire and Bugaboo Spire offer classic alpine rock routes in stunning wilderness.',
    emoji: '🍁',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4'
  },
  {
    type: 'location',
    title: 'Devils Tower, Wyoming',
    content: 'Sacred monolith rising 1,267 feet from the plains. The crack climbing on this volcanic plug is legendary - featured in Close Encounters.',
    emoji: '👽',
    imageUrl: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b'
  },
  {
    type: 'location',
    title: 'Chamonix, France',
    content: 'The birthplace of mountaineering. Home to Mont Blanc (15,774 ft) and the Aiguilles - granite spires that define alpine climbing.',
    emoji: '🥖',
    imageUrl: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e'
  },

  // FACTS (30% = 12+ items) ================================================
  {
    type: 'fact',
    title: 'The Term "Beta"',
    content: 'Climbers call route information "beta" after Bates Method videos in the 1980s. Jack Bates filmed climbers solving problems, and his name became synonymous with insider knowledge.',
    emoji: '💡'
  },
  {
    type: 'fact',
    title: 'The First 5.14',
    content: 'Tony Yaniro established "Grand Illusion" in 1979 at Sugarloaf, California - the first 5.14 in history. It took years for others to repeat it.',
    emoji: '🎯'
  },
  {
    type: 'fact',
    title: 'Chalk Was Controversial',
    content: 'In the 1970s, using chalk was considered cheating. John Gill, the father of bouldering, was criticized for introducing gymnastic chalk to climbing.',
    emoji: '🤚'
  },
  {
    type: 'fact',
    title: 'The Hardest Climb',
    content: 'As of 2023, "Silence" by Adam Ondra (9c/5.15d) remains the hardest route. He spent 3 years working it, requiring perfect conditions and beta.',
    emoji: '🔇'
  },
  {
    type: 'fact',
    title: 'Lynn Hill\'s Free Ascent',
    content: 'In 1993, Lynn Hill made history as the first person to free climb The Nose on El Cap. A year later, she freed it in under 24 hours.',
    emoji: '👩‍🦰'
  },
  {
    type: 'fact',
    title: 'Speed Climbing Record',
    content: 'Alex Honnold and Tommy Caldwell set the Nose speed record at 1:58:07 in 2018. That\'s 3,000 feet of climbing in under two hours - roped.',
    emoji: '⚡'
  },
  {
    type: 'fact',
    title: 'The Stonemasters',
    content: 'In the 1970s, Yosemite\'s Stonemasters (including John Bachar and Ron Kauk) revolutionized free climbing, establishing routes still considered test-pieces.',
    emoji: '🗿'
  },
  {
    type: 'fact',
    title: 'Huber Brothers\' Speed Ascent',
    content: 'In 2007, the Huber brothers climbed El Cap\'s Nose in 2:45:45, carrying everything needed for the traditional ascent including haul bags.',
    emoji: '👬'
  },
  {
    type: 'fact',
    title: 'Tommy Caldwell\'s Return',
    content: 'After losing his index finger in a table saw accident, Tommy Caldwell adapted and became one of the world\'s best climbers, freeing the Dawn Wall.',
    emoji: '✋'
  },
  {
    type: 'fact',
    title: 'The Moonboard',
    content: 'Created by Ben Moon in 2005, the MoonBoard standardized indoor training. Every board worldwide has identical holds in identical positions.',
    emoji: '🌙'
  },
  {
    type: 'fact',
    title: 'Free Solo\'s Impact',
    content: 'After "Free Solo" won the Oscar in 2019, climbing gym memberships increased by 30%. Alex Honnold\'s El Cap free solo brought climbing to mainstream consciousness.',
    emoji: '🎬'
  },
  {
    type: 'fact',
    title: 'First Woman on Everest',
    content: 'Junko Tabei of Japan became the first woman to summit Everest in 1975. She went on to become the first woman to climb the Seven Summits.',
    emoji: '👩‍🏔️'
  },

  // TECHNIQUE TIPS (15% = 6+ items) ========================================
  {
    type: 'technique',
    title: 'Straight Arms Save Energy',
    content: 'Keep your arms straight while resting. Bent arms engage muscles constantly, while straight arms use your skeleton for support - saving energy for the crux.',
    emoji: '💪'
  },
  {
    type: 'technique',
    title: 'Twist and Lock',
    content: 'Turn your hips into the wall on steep terrain. This "twist-lock" position lets you reach farther with less effort, keeping your weight over your feet.',
    emoji: '🔄'
  },
  {
    type: 'technique',
    title: 'Silent Feet Practice',
    content: 'Practice placing your feet silently. This forces deliberate, precise foot placement - the foundation of efficient climbing technique.',
    emoji: '🦶'
  },
  {
    type: 'technique',
    title: 'Read the Rock',
    content: 'Before starting a route, identify rests, knee-bars, and the crux. A good pre-climb analysis can save minutes of figuring while pumped.',
    emoji: '📖'
  },
  {
    type: 'technique',
    title: 'Breathe Through Cruxes',
    content: 'Climbers often hold their breath during hard moves, but this increases pump. Practice rhythmic breathing, especially on powerful sequences.',
    emoji: '😮‍💨'
  },
  {
    type: 'technique',
    title: 'Drop Knee Technique',
    content: 'On overhangs, drop your inside knee toward the wall. This powerful position lets you reach far with minimal arm strength.',
    emoji: '🦵'
  },

  // INSPIRATIONAL QUOTES (5% = 2+ items) ===================================
  {
    type: 'quote',
    title: 'Alex Lowe',
    content: '"The best climber in the world is the one who\'s having the most fun." - Alex Lowe, legendary alpinist',
    emoji: '😊'
  },
  {
    type: 'quote',
    title: 'Lynn Hill',
    content: '"It\'s not about the grade, it\'s about the experience." - Lynn Hill, first person to free climb The Nose',
    emoji: '🌟'
  }
];

// Get inspiration by day of year for daily rotation
export function getTodaysInspiration(): InspirationContent {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  return CLIMBING_INSPIRATION[dayOfYear % CLIMBING_INSPIRATION.length];
}

// Get inspiration by index (useful for testing specific items)
export function getInspirationByIndex(index: number): InspirationContent {
  return CLIMBING_INSPIRATION[index % CLIMBING_INSPIRATION.length];
}

// Get random inspiration (for variety)
export function getRandomInspiration(): InspirationContent {
  const randomIndex = Math.floor(Math.random() * CLIMBING_INSPIRATION.length);
  return CLIMBING_INSPIRATION[randomIndex];
}

// Famous mountain profiles for dynamic backgrounds
// Each mountain has unique silhouettes, colors, and gradients

export interface MountainProfile {
  name: string;
  location: string;
  layers: {
    far1: string;
    far2: string;
    mid: string;
    near: string;
    foreground: string;
  };
  snowCaps: {
    layer: number;
    paths: string[];
  }[];
  skyGradient: string[];
  horizonGlow: {
    colors: string[];
    opacity: number;
  };
}

export const MOUNTAIN_PROFILES: Record<string, MountainProfile> = {
  // Monday: El Capitan - Massive vertical granite face
  elCapitan: {
    name: "El Capitan",
    location: "Yosemite, California",
    layers: {
      // Distant rolling hills
      far1: "M0,600 L0,420 Q200,380 350,360 L450,380 L550,340 Q700,320 850,360 L950,340 L1100,380 Q1250,400 1400,420 L1400,600 Z",
      // Mid-distance peaks
      far2: "M0,600 L0,460 Q180,400 300,370 L420,400 L540,350 Q680,320 820,380 L940,360 L1100,400 Q1250,430 1400,450 L1400,600 Z",
      // Main valley with peaks
      mid: "M0,600 L0,490 Q150,440 280,420 L400,450 L520,400 Q660,370 800,430 L920,410 L1080,450 Q1220,480 1400,500 L1400,600 Z",
      // Dramatic cliff face (El Cap)
      near: "M0,600 L0,520 L200,510 L400,500 L500,300 L600,290 L700,500 L900,510 L1100,520 Q1250,530 1400,540 L1400,600 Z",
      // Foreground rocks
      foreground: "M0,600 L0,540 L150,535 L300,530 L450,525 L550,520 L700,525 L850,530 L1000,535 L1150,540 L1300,545 L1400,550 L1400,600 Z"
    },
    snowCaps: [
      { layer: 4, paths: ["M480,300 L500,300 L520,340 Z", "M580,290 L600,290 L620,330 Z"] },
      { layer: 5, paths: [] } // No snow on foreground rocks
    ],
    skyGradient: [
      "#0a1628 0%",    // Deep night blue
      "#152438 30%",
      "#1f3248 60%",
      "#2a4158 100%"
    ],
    horizonGlow: {
      colors: ["rgba(255, 160, 100, 0.12)", "rgba(255, 200, 140, 0.08)", "transparent"],
      opacity: 0.7
    }
  },

  // Tuesday: Matterhorn - Iconic pyramid peak
  matterhorn: {
    name: "Matterhorn",
    location: "Swiss Alps",
    layers: {
      far1: "M0,600 L0,400 Q150,340 280,320 L380,360 L480,280 Q600,240 720,300 L820,270 L920,240 L1020,280 Q1140,260 1260,300 L1400,340 L1400,600 Z",
      far2: "M0,600 L0,450 Q170,390 300,360 L400,390 L500,320 Q620,280 740,340 L840,310 L940,280 L1040,320 Q1160,300 1280,340 L1400,380 L1400,600 Z",
      // Distinctive pyramid in center
      mid: "M0,600 L0,480 Q160,430 290,410 L390,440 L500,370 L600,180 L700,170 L800,370 L900,400 L1000,380 Q1130,360 1260,390 L1400,430 L1400,600 Z",
      near: "M0,600 L0,510 Q150,470 280,450 L380,480 L480,420 L580,220 L680,210 L780,420 L880,450 L980,430 Q1110,410 1240,440 L1400,480 L1400,600 Z",
      foreground: "M0,600 L0,530 Q140,500 270,485 L370,510 L470,470 L570,300 L670,290 L770,470 L870,500 L970,485 Q1100,470 1230,495 L1400,520 L1400,600 Z"
    },
    snowCaps: [
      { layer: 3, paths: ["M580,180 L600,180 L620,230 Z", "M680,170 L700,170 L720,220 Z"] },
      { layer: 4, paths: ["M560,220 L580,220 L600,270 Z", "M660,210 L680,210 L700,260 Z"] },
      { layer: 5, paths: ["M550,300 L570,300 L590,350 Z", "M650,290 L670,290 L690,340 Z"] }
    ],
    skyGradient: [
      "#0f1f3a 0%",
      "#1a2d4a 30%",
      "#253a5a 60%",
      "#2f4768 100%"
    ],
    horizonGlow: {
      colors: ["rgba(255, 140, 110, 0.18)", "rgba(254, 190, 140, 0.12)", "transparent"],
      opacity: 0.85
    }
  },

  // Wednesday: K2 - Steep, dramatic pyramid
  k2: {
    name: "K2",
    location: "Karakoram, Pakistan",
    layers: {
      far1: "M0,600 L0,390 Q180,330 320,310 L420,340 L520,270 Q640,230 760,290 L860,260 L960,230 L1060,270 Q1180,250 1300,290 L1400,330 L1400,600 Z",
      far2: "M0,600 L0,440 Q190,380 330,350 L430,380 L530,310 Q650,270 770,330 L870,300 L970,270 L1070,310 Q1190,290 1310,330 L1400,370 L1400,600 Z",
      // Very steep, aggressive peaks
      mid: "M0,600 L0,470 Q170,420 310,400 L410,430 L510,350 L610,160 L710,150 L810,350 L910,390 L1010,370 Q1140,350 1270,380 L1400,420 L1400,600 Z",
      near: "M0,600 L0,500 Q160,460 300,440 L400,470 L500,390 L600,190 L700,180 L800,390 L900,430 L1000,410 Q1130,390 1260,420 L1400,460 L1400,600 Z",
      foreground: "M0,600 L0,520 Q150,490 290,475 L390,500 L490,440 L590,260 L690,250 L790,440 L890,490 L990,475 Q1120,460 1250,485 L1400,510 L1400,600 Z"
    },
    snowCaps: [
      { layer: 3, paths: ["M590,160 L610,160 L630,210 Z", "M690,150 L710,150 L730,200 Z"] },
      { layer: 4, paths: ["M580,190 L600,190 L620,240 Z", "M680,180 L700,180 L720,230 Z"] },
      { layer: 5, paths: ["M570,260 L590,260 L610,310 Z", "M670,250 L690,250 L710,300 Z"] }
    ],
    skyGradient: [
      "#08152a 0%",    // Very dark, ominous
      "#121f38 30%",
      "#1c2a46 60%",
      "#263554 100%"
    ],
    horizonGlow: {
      colors: ["rgba(200, 180, 255, 0.10)", "rgba(180, 200, 255, 0.08)", "transparent"],
      opacity: 0.6
    }
  },

  // Thursday: Denali - Massive, broad profile
  denali: {
    name: "Denali",
    location: "Alaska Range",
    layers: {
      // Very broad, massive mountains
      far1: "M0,600 L0,410 Q250,360 450,340 L650,370 L850,330 Q1050,310 1250,350 L1400,380 L1400,600 Z",
      far2: "M0,600 L0,450 Q260,400 460,380 L660,410 L860,370 Q1060,350 1260,390 L1400,420 L1400,600 Z",
      // Wide, massive central peak
      mid: "M0,600 L0,480 Q270,430 470,410 L670,440 L870,200 L1070,190 L1270,420 L1400,450 L1400,600 Z",
      near: "M0,600 L0,510 Q280,460 480,440 L680,470 L880,250 L1080,240 L1280,460 L1400,490 L1400,600 Z",
      foreground: "M0,600 L0,530 Q290,490 490,475 L690,500 L890,320 L1090,310 L1290,495 L1400,520 L1400,600 Z"
    },
    snowCaps: [
      { layer: 3, paths: ["M820,200 L870,200 L920,270 Z", "M970,190 L1020,190 L1070,260 Z"] },
      { layer: 4, paths: ["M830,250 L880,250 L930,320 Z", "M980,240 L1030,240 L1080,310 Z"] },
      { layer: 5, paths: ["M840,320 L890,320 L940,390 Z", "M990,310 L1040,310 L1090,380 Z"] }
    ],
    skyGradient: [
      "#0d1f35 0%",
      "#182b45 30%",
      "#233855 60%",
      "#2e4565 100%"
    ],
    horizonGlow: {
      colors: ["rgba(130, 200, 255, 0.15)", "rgba(160, 210, 255, 0.10)", "transparent"],
      opacity: 0.75
    }
  },

  // Friday: Mount Rainier - Classic volcanic cone
  mountRainier: {
    name: "Mount Rainier",
    location: "Cascade Range, Washington",
    layers: {
      far1: "M0,600 L0,420 Q200,370 350,350 L500,380 L650,360 Q800,340 950,370 L1100,360 L1250,380 L1400,400 L1400,600 Z",
      far2: "M0,600 L0,460 Q210,410 360,390 L510,420 L660,400 Q810,380 960,410 L1110,400 L1260,420 L1400,440 L1400,600 Z",
      // Perfect cone shape in center
      mid: "M0,600 L0,490 Q220,450 370,430 L520,240 Q670,220 820,240 L970,430 L1120,450 Q1270,470 1400,490 L1400,600 Z",
      near: "M0,600 L0,520 Q230,480 380,460 L530,280 Q680,260 830,280 L980,460 L1130,480 Q1280,500 1400,520 L1400,600 Z",
      foreground: "M0,600 L0,540 Q240,505 390,490 L540,330 Q690,310 840,330 L990,490 L1140,505 Q1290,520 1400,540 L1400,600 Z"
    },
    snowCaps: [
      { layer: 3, paths: ["M470,240 L520,240 L570,300 Z", "M620,220 L670,220 L720,280 Z", "M770,240 L820,240 L870,300 Z"] },
      { layer: 4, paths: ["M480,280 L530,280 L580,340 Z", "M630,260 L680,260 L730,320 Z", "M780,280 L830,280 L880,340 Z"] },
      { layer: 5, paths: ["M490,330 L540,330 L590,390 Z", "M640,310 L690,310 L740,370 Z", "M790,330 L840,330 L890,390 Z"] }
    ],
    skyGradient: [
      "#0f1f3a 0%",
      "#1a2d4a 30%",
      "#253a5a 60%",
      "#304758 100%"
    ],
    horizonGlow: {
      colors: ["rgba(255, 150, 100, 0.16)", "rgba(255, 180, 130, 0.11)", "transparent"],
      opacity: 0.80
    }
  },

  // Saturday: Half Dome - Iconic rounded granite dome
  halfDome: {
    name: "Half Dome",
    location: "Yosemite, California",
    layers: {
      far1: "M0,600 L0,415 Q190,365 330,345 L470,375 L610,355 Q750,335 890,365 L1030,355 L1170,375 L1310,395 L1400,410 L1400,600 Z",
      far2: "M0,600 L0,455 Q200,405 340,385 L480,415 L620,395 Q760,375 900,405 L1040,395 L1180,415 L1320,435 L1400,450 L1400,600 Z",
      // Distinctive dome shape
      mid: "M0,600 L0,485 Q210,445 350,425 L490,455 L580,320 Q670,280 760,320 L850,455 L990,445 Q1130,435 1270,455 L1400,475 L1400,600 Z",
      near: "M0,600 L0,515 Q220,475 360,455 L500,485 L590,350 Q680,310 770,350 L860,485 L1000,475 Q1140,465 1280,485 L1400,505 L1400,600 Z",
      foreground: "M0,600 L0,535 Q230,500 370,485 L510,510 L600,390 Q690,350 780,390 L870,510 L1010,500 Q1150,490 1290,510 L1400,525 L1400,600 Z"
    },
    snowCaps: [
      { layer: 3, paths: ["M560,320 L580,320 L600,360 Z", "M740,320 L760,320 L780,360 Z"] },
      { layer: 4, paths: ["M570,350 L590,350 L610,390 Z", "M750,350 L770,350 L790,390 Z"] }
    ],
    skyGradient: [
      "#0b1a2e 0%",
      "#16263e 30%",
      "#21334e 60%",
      "#2c405e 100%"
    ],
    horizonGlow: {
      colors: ["rgba(255, 165, 105, 0.14)", "rgba(255, 195, 145, 0.09)", "transparent"],
      opacity: 0.75
    }
  },

  // Sunday: Ama Dablam - Elegant Himalayan spire
  amaDablam: {
    name: "Ama Dablam",
    location: "Himalayas, Nepal",
    layers: {
      far1: "M0,600 L0,405 Q175,355 310,335 L445,365 L580,345 Q715,325 850,355 L985,345 L1120,365 L1255,385 L1400,405 L1400,600 Z",
      far2: "M0,600 L0,445 Q185,395 320,375 L455,405 L590,385 Q725,365 860,395 L995,385 L1130,405 L1265,425 L1400,445 L1400,600 Z",
      // Elegant, graceful spire
      mid: "M0,600 L0,480 Q195,440 330,420 L465,450 L600,360 L700,150 L800,360 L935,450 L1070,440 Q1205,430 1340,450 L1400,470 L1400,600 Z",
      near: "M0,600 L0,510 Q205,470 340,450 L475,480 L610,390 L710,180 L810,390 L945,480 L1080,470 Q1215,460 1350,480 L1400,500 L1400,600 Z",
      foreground: "M0,600 L0,530 Q215,495 350,480 L485,505 L620,425 L720,230 L820,425 L955,505 L1090,495 Q1225,485 1360,505 L1400,520 L1400,600 Z"
    },
    snowCaps: [
      { layer: 3, paths: ["M680,150 L700,150 L720,200 Z"] },
      { layer: 4, paths: ["M690,180 L710,180 L730,230 Z"] },
      { layer: 5, paths: ["M700,230 L720,230 L740,280 Z"] }
    ],
    skyGradient: [
      "#0e1d32 0%",
      "#192942 30%",
      "#243652 60%",
      "#2f4362 100%"
    ],
    horizonGlow: {
      colors: ["rgba(255, 200, 150, 0.17)", "rgba(255, 220, 170, 0.12)", "transparent"],
      opacity: 0.85
    }
  }
};

// Get mountain profile by day of week (0 = Sunday, 1 = Monday, etc.)
export function getMountainByDay(dayOfWeek: number): MountainProfile {
  const profileKeys = [
    'amaDablam',    // Sunday
    'elCapitan',    // Monday
    'matterhorn',   // Tuesday
    'k2',           // Wednesday
    'denali',       // Thursday
    'mountRainier', // Friday
    'halfDome'      // Saturday
  ];

  return MOUNTAIN_PROFILES[profileKeys[dayOfWeek]];
}

// Get today's mountain profile
export function getTodaysMountain(): MountainProfile {
  const dayOfWeek = new Date().getDay();
  return getMountainByDay(dayOfWeek);
}

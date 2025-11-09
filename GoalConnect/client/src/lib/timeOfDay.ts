export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 15) return 'midday';
  if (hour >= 15 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 20) return 'dusk';
  return 'night';
}

export const TIME_OF_DAY_INFO = {
  dawn: {
    name: 'Dawn',
    description: 'Alpine Glow',
    emoji: '🌅'
  },
  morning: {
    name: 'Morning',
    description: 'Clear Skies',
    emoji: '☀️'
  },
  midday: {
    name: 'Midday',
    description: 'Summit Sun',
    emoji: '🌞'
  },
  afternoon: {
    name: 'Afternoon',
    description: 'Golden Hour',
    emoji: '🌤️'
  },
  dusk: {
    name: 'Dusk',
    description: 'Sunset Ridge',
    emoji: '🌆'
  },
  night: {
    name: 'Night',
    description: 'Starlit Peak',
    emoji: '🌃'
  }
} as const;

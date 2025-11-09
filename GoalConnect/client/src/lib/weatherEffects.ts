export type WeatherType = 'sunny' | 'partly-cloudy' | 'cloudy' | 'storm' | 'snow';

export function getWeatherFromStreak(currentStreak: number, missedDaysThisWeek: number): WeatherType {
  // Sunny: 7+ day streak
  if (currentStreak >= 7) return 'sunny';

  // Storm: Missed 3+ days this week
  if (missedDaysThisWeek >= 3) return 'storm';

  // Cloudy: No current streak
  if (currentStreak === 0) return 'cloudy';

  // Partly cloudy: Default
  return 'partly-cloudy';
}

export const WEATHER_INFO = {
  sunny: {
    name: 'Clear Skies',
    emoji: '☀️',
    description: 'Perfect climbing conditions'
  },
  'partly-cloudy': {
    name: 'Partly Cloudy',
    emoji: '⛅',
    description: 'Good conditions'
  },
  cloudy: {
    name: 'Overcast',
    emoji: '☁️',
    description: 'Difficult visibility'
  },
  storm: {
    name: 'Storm Warning',
    emoji: '⛈️',
    description: 'Dangerous conditions'
  },
  snow: {
    name: 'Snowfall',
    emoji: '🌨️',
    description: 'Heavy accumulation'
  }
};

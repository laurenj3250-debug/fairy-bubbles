/**
 * WeatherExample.tsx
 *
 * This is an example component showing how to integrate the weather system
 * into any page or component. The weather system dynamically adjusts based
 * on user's streak and performance.
 *
 * To integrate weather effects into your component:
 *
 * 1. Import the necessary functions and components:
 *    import { getWeatherFromStreak, WEATHER_INFO } from '@/lib/weatherEffects';
 *    import { WeatherOverlay } from '@/components/WeatherOverlay';
 *
 * 2. Calculate weather based on user data:
 *    const weather = getWeatherFromStreak(currentStreak, missedDaysThisWeek);
 *    const weatherInfo = WEATHER_INFO[weather];
 *
 * 3. Add data-weather attribute to your container:
 *    <div data-weather={weather}>
 *
 * 4. Render the WeatherOverlay component:
 *    <WeatherOverlay weather={weather} />
 *
 * 5. Display weather info to the user (optional):
 *    <div>
 *      <span>{weatherInfo.emoji}</span>
 *      <div>{weatherInfo.name}</div>
 *      <div>{weatherInfo.description}</div>
 *    </div>
 */

import { useState } from 'react';
import { getWeatherFromStreak, WEATHER_INFO, WeatherType } from '@/lib/weatherEffects';
import { WeatherOverlay } from '@/components/WeatherOverlay';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function WeatherExample() {
  // Example state - in real usage, get these from your API/queries
  const [currentStreak, setCurrentStreak] = useState(0);
  const [missedDaysThisWeek, setMissedDaysThisWeek] = useState(0);

  // Calculate weather based on performance
  const weather = getWeatherFromStreak(currentStreak, missedDaysThisWeek);
  const weatherInfo = WEATHER_INFO[weather];

  return (
    <div className="min-h-screen p-6" data-weather={weather}>
      {/* Render animated weather overlay */}
      <WeatherOverlay weather={weather} />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dynamic Weather System Demo</CardTitle>
            <CardDescription>
              Weather changes based on your streak and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Weather Display */}
            <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-xl border border-border">
              <span className="text-4xl">{weatherInfo.emoji}</span>
              <div className="flex-1">
                <div className="text-lg font-bold">{weatherInfo.name}</div>
                <div className="text-sm text-muted-foreground">{weatherInfo.description}</div>
              </div>
              <Badge variant="outline">{weather}</Badge>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Current Streak: {currentStreak} days
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setCurrentStreak(Math.max(0, currentStreak - 1))}
                  >
                    -1
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setCurrentStreak(currentStreak + 1)}
                  >
                    +1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentStreak(7)}
                  >
                    Set to 7 (Sunny)
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Missed Days This Week: {missedDaysThisWeek} days
                </label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setMissedDaysThisWeek(Math.max(0, missedDaysThisWeek - 1))}
                  >
                    -1
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setMissedDaysThisWeek(Math.min(7, missedDaysThisWeek + 1))}
                  >
                    +1
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setMissedDaysThisWeek(3)}
                  >
                    Set to 3 (Storm)
                  </Button>
                </div>
              </div>
            </div>

            {/* Weather Conditions Reference */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Weather Conditions:</h3>
              <div className="grid gap-2">
                {Object.entries(WEATHER_INFO).map(([key, info]) => (
                  <div
                    key={key}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/10 border border-border/50"
                  >
                    <span className="text-2xl">{info.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{info.name}</div>
                      <div className="text-xs text-muted-foreground">{info.description}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules Reference */}
            <div className="space-y-2 p-4 bg-muted/10 rounded-lg">
              <h3 className="text-sm font-medium">Weather Rules:</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>Sunny: 7+ day streak</li>
                <li>Storm: Missed 3+ days this week</li>
                <li>Cloudy: No current streak (0 days)</li>
                <li>Partly Cloudy: Default condition</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

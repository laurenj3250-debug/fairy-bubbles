# Dynamic Weather Effects System

A complete weather system that provides visual feedback based on user's streak and performance. The weather dynamically changes to reflect climbing conditions.

## Files Created/Modified

### Core System Files

1. **`client/src/lib/weatherEffects.ts`** - Weather calculation logic and configuration
2. **`client/src/components/WeatherOverlay.tsx`** - Animated weather effects component
3. **`client/src/index.css`** - Weather CSS animations and effects (additions at end of file)

### Integration Examples

4. **`client/src/pages/DashboardNew.tsx`** - Main dashboard with weather integration
5. **`client/src/pages/HabitsMountain.tsx`** - Habits page with weather integration
6. **`client/src/components/WeatherExample.tsx`** - Documentation and example component

## Weather Types

The system supports 5 weather types:

| Weather Type | Emoji | Condition | Description |
|-------------|-------|-----------|-------------|
| **Sunny** | ☀️ | 7+ day streak | Perfect climbing conditions |
| **Partly Cloudy** | ⛅ | Default | Good conditions |
| **Cloudy** | ☁️ | 0 streak | Difficult visibility |
| **Storm** | ⛈️ | 3+ missed days this week | Dangerous conditions |
| **Snow** | 🌨️ | Special conditions | Heavy accumulation |

## Weather Calculation Logic

```typescript
function getWeatherFromStreak(currentStreak: number, missedDaysThisWeek: number): WeatherType {
  // Sunny: 7+ day streak
  if (currentStreak >= 7) return 'sunny';

  // Storm: Missed 3+ days this week
  if (missedDaysThisWeek >= 3) return 'storm';

  // Cloudy: No current streak
  if (currentStreak === 0) return 'cloudy';

  // Partly cloudy: Default
  return 'partly-cloudy';
}
```

## Visual Effects

### CSS Animations

- **Clouds**: Floating clouds that drift across the screen
- **Rain**: Animated raindrops falling during storms
- **Snow**: Gentle snowfall with drift animation
- **Lightning**: Flash effects during storms
- **Weather Overlays**: Gradient overlays that change based on weather

### Data Attributes

The system uses the `data-weather` attribute to apply weather-specific CSS:

```css
[data-weather="sunny"] {
  --weather-overlay: linear-gradient(135deg, rgba(255, 223, 0, 0.1) 0%, transparent 50%);
}
```

## Integration Guide

### Step 1: Import Required Modules

```typescript
import { getWeatherFromStreak, WEATHER_INFO } from '@/lib/weatherEffects';
import { WeatherOverlay } from '@/components/WeatherOverlay';
```

### Step 2: Calculate Weather

```typescript
// Get user's current streak (from your habits/goals data)
const currentStreak = 5; // Example: 5 day streak

// Calculate missed days this week (0-7)
const missedDaysThisWeek = 1; // Example: missed 1 day

// Get weather type
const weather = getWeatherFromStreak(currentStreak, missedDaysThisWeek);
const weatherInfo = WEATHER_INFO[weather];
```

### Step 3: Add to Component Container

```typescript
<div data-weather={weather}>
  {/* Your content */}
</div>
```

### Step 4: Render Weather Overlay

```typescript
<WeatherOverlay weather={weather} />
```

### Step 5: Display Weather Info (Optional)

```typescript
<div className="weather-display">
  <span>{weatherInfo.emoji}</span>
  <div>
    <div>{weatherInfo.name}</div>
    <div>{weatherInfo.description}</div>
  </div>
</div>
```

## Complete Integration Example

```typescript
import { useState } from 'react';
import { getWeatherFromStreak, WEATHER_INFO } from '@/lib/weatherEffects';
import { WeatherOverlay } from '@/components/WeatherOverlay';

export function MyComponent() {
  // Your data
  const currentStreak = 10;
  const missedDaysThisWeek = 0;

  // Calculate weather
  const weather = getWeatherFromStreak(currentStreak, missedDaysThisWeek);
  const weatherInfo = WEATHER_INFO[weather];

  return (
    <div className="min-h-screen" data-weather={weather}>
      {/* Animated weather effects */}
      <WeatherOverlay weather={weather} />

      {/* Your content */}
      <div className="relative z-10">
        {/* Weather info display */}
        <div className="weather-card">
          <span className="text-2xl">{weatherInfo.emoji}</span>
          <div>
            <div className="font-bold">{weatherInfo.name}</div>
            <div className="text-sm">{weatherInfo.description}</div>
          </div>
        </div>

        {/* Rest of your content */}
      </div>
    </div>
  );
}
```

## Implemented Pages

### 1. DashboardNew (`/`)

**Location**: `client/src/pages/DashboardNew.tsx`

**Weather Calculation**:
- Uses longest streak from all habits
- Calculates missed days based on completion percentage

**Features**:
- Weather display in header with emoji and description
- Animated weather overlay
- Conditional badges for "Perfect Conditions" (7+ streak) or "Take Shelter" (3+ missed)

### 2. HabitsMountain (`/habits`)

**Location**: `client/src/pages/HabitsMountain.tsx`

**Weather Calculation**:
- Uses longest streak from all habits
- Approximates missed days based on incomplete habits today

**Features**:
- Weather display in header
- Animated weather overlay
- Conditional badges for warnings

## CSS Classes Available

### Animation Classes

- `.weather-clouds` - Container for cloud effects
- `.cloud` - Individual cloud element
- `.rain-container` - Container for rain effects
- `.raindrop` - Individual raindrop
- `.snow-container` - Container for snow effects
- `.snowflake` - Individual snowflake
- `.lightning-flash` - Lightning flash effect

### Keyframe Animations

- `@keyframes float-cloud` - Cloud movement
- `@keyframes fall-rain` - Rain falling animation
- `@keyframes fall-snow` - Snow falling animation
- `@keyframes lightning-flash` - Lightning effect

## Customization

### Adjusting Weather Thresholds

Edit `client/src/lib/weatherEffects.ts`:

```typescript
export function getWeatherFromStreak(currentStreak: number, missedDaysThisWeek: number): WeatherType {
  // Change threshold from 7 to 5 days for sunny weather
  if (currentStreak >= 5) return 'sunny';

  // Change threshold from 3 to 2 days for storm
  if (missedDaysThisWeek >= 2) return 'storm';

  // ... rest of logic
}
```

### Adding New Weather Types

1. Add to `WeatherType` union in `weatherEffects.ts`
2. Add entry to `WEATHER_INFO` object
3. Add CSS animations in `index.css`
4. Update `WeatherOverlay.tsx` to handle new type

### Modifying Animations

Edit the CSS in `client/src/index.css`:

```css
/* Adjust cloud speed */
@keyframes float-cloud {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100vw); }
}

/* Change animation duration */
.cloud {
  animation: float-cloud 20s linear infinite; /* Was 30s */
}
```

## Performance Considerations

- Weather overlay uses fixed positioning and low z-index
- Animations use CSS transforms for GPU acceleration
- Particle counts are optimized (30 snowflakes, 50 raindrops, 5 clouds max)
- Components only re-render when weather changes

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS animations use standard properties
- No vendor prefixes required
- Falls back gracefully if animations not supported

## Future Enhancements

Potential additions to the weather system:

1. **Seasonal variations** - Different weather patterns by time of year
2. **Weather transitions** - Smooth animations between weather states
3. **Sound effects** - Rain sounds, thunder, wind
4. **Weather forecasts** - Show predicted weather based on upcoming habits
5. **Achievement integration** - Special weather for milestones
6. **Time-based weather** - Combine with existing time-of-day themes
7. **Intensity levels** - Light rain vs. heavy rain based on severity

## Troubleshooting

### Weather not displaying

1. Check that `data-weather` attribute is on container
2. Verify `WeatherOverlay` component is rendered
3. Check z-index conflicts with other elements

### Animations not smooth

1. Reduce particle count in `WeatherOverlay.tsx`
2. Check browser performance settings
3. Verify hardware acceleration is enabled

### Weather not updating

1. Ensure weather calculation is inside component (not outside)
2. Check that dependencies are properly tracked
3. Verify data is being fetched correctly

## Support

For issues or questions:
1. Check `WeatherExample.tsx` for working implementation
2. Review this documentation
3. Check browser console for errors
4. Verify all files are in correct locations

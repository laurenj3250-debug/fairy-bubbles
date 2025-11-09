import { useEffect, useState } from 'react';
import { WeatherType } from '@/lib/weatherEffects';

interface WeatherOverlayProps {
  weather: WeatherType;
}

export function WeatherOverlay({ weather }: WeatherOverlayProps) {
  const [raindrops, setRaindrops] = useState<Array<{ id: number; left: number; delay: number }>>([]);
  const [clouds, setClouds] = useState<Array<{ id: number; top: number; delay: number; size: number }>>([]);
  const [snowflakes, setSnowflakes] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Generate rain for storm weather
    if (weather === 'storm') {
      const drops = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setRaindrops(drops);
    } else {
      setRaindrops([]);
    }

    // Generate clouds for cloudy and partly-cloudy weather
    if (weather === 'cloudy' || weather === 'partly-cloudy') {
      const cloudCount = weather === 'cloudy' ? 5 : 3;
      const cloudArray = Array.from({ length: cloudCount }, (_, i) => ({
        id: i,
        top: Math.random() * 40 + 10, // 10% to 50% from top
        delay: Math.random() * 30,
        size: Math.random() * 40 + 60, // 60-100px
      }));
      setClouds(cloudArray);
    } else {
      setClouds([]);
    }

    // Generate snowflakes for snow weather
    if (weather === 'snow') {
      const flakes = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 3 + 6, // 6-9 seconds
      }));
      setSnowflakes(flakes);
    } else {
      setSnowflakes([]);
    }
  }, [weather]);

  return (
    <>
      {/* Rain effect for storms */}
      {weather === 'storm' && (
        <>
          <div className="rain-container">
            {raindrops.map((drop) => (
              <div
                key={drop.id}
                className="raindrop"
                style={{
                  left: `${drop.left}%`,
                  animationDelay: `${drop.delay}s`,
                }}
              />
            ))}
          </div>
          {/* Lightning flash */}
          <div className="lightning-flash" style={{ animationDelay: '2s' }} />
        </>
      )}

      {/* Cloud effect for cloudy/partly-cloudy */}
      {(weather === 'cloudy' || weather === 'partly-cloudy') && (
        <div className="weather-clouds">
          {clouds.map((cloud) => (
            <div
              key={cloud.id}
              className="cloud"
              style={{
                top: `${cloud.top}%`,
                width: `${cloud.size}px`,
                height: `${cloud.size * 0.6}px`,
                animationDelay: `${cloud.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Snow effect */}
      {weather === 'snow' && (
        <div className="snow-container">
          {snowflakes.map((flake) => (
            <div
              key={flake.id}
              className="snowflake"
              style={{
                left: `${flake.left}%`,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${flake.duration}s`,
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { WeatherType } from "@/lib/weatherEffects";

interface WeatherMoodSystemProps {
  weather: WeatherType;
  className?: string;
}

const WEATHER_PALETTES = {
  sunny: {
    bgStart: "#87CEEB", // clear sky blue
    bgMid: "#B8D8F5",
    bgEnd: "#E6F2FF",
    name: "clear",
  },
  "partly-cloudy": {
    bgStart: "#6B8BA8", // muted blue
    bgMid: "#8AA3B8",
    bgEnd: "#B5C7D3",
    name: "overcast",
  },
  cloudy: {
    bgStart: "#4A5F7A", // darker blue-gray
    bgMid: "#5A7085",
    bgEnd: "#7A8C9E",
    name: "overcast",
  },
  storm: {
    bgStart: "#2C3E50", // dark storm
    bgMid: "#34495E",
    bgEnd: "#4A5F6D",
    name: "storm",
  },
  snow: {
    bgStart: "#5A7085",
    bgMid: "#7A8C9E",
    bgEnd: "#9AACBE",
    name: "overcast",
  },
};

export function WeatherMoodSystem({ weather, className }: WeatherMoodSystemProps) {
  const palette = WEATHER_PALETTES[weather];

  const parallaxClouds = useMemo(() => {
    if (weather === "sunny") return null;

    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Near clouds - move faster */}
        <div
          className="absolute top-[10%] w-[200px] h-[60px] rounded-full opacity-20"
          style={{
            background: "rgba(255, 255, 255, 0.3)",
            filter: "blur(20px)",
            animation: "cloud-drift-near 40s linear infinite",
            left: "-200px",
          }}
        />
        <div
          className="absolute top-[25%] w-[250px] h-[70px] rounded-full opacity-20"
          style={{
            background: "rgba(255, 255, 255, 0.25)",
            filter: "blur(25px)",
            animation: "cloud-drift-near 50s linear infinite 10s",
            left: "-250px",
          }}
        />

        {/* Distant clouds - move slower */}
        <div
          className="absolute top-[15%] w-[300px] h-[80px] rounded-full opacity-10"
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            filter: "blur(30px)",
            animation: "cloud-drift-far 80s linear infinite",
            right: "-300px",
          }}
        />
      </div>
    );
  }, [weather]);

  return (
    <>
      {/* Weather-based gradient background */}
      <div
        className={cn("fixed inset-0 transition-all ease-in-out", className)}
        style={{
          background: `linear-gradient(180deg, ${palette.bgStart} 0%, ${palette.bgMid} 50%, ${palette.bgEnd} 100%)`,
          zIndex: -10,
          transitionDuration: "3000ms",
        }}
      >
        {parallaxClouds}
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes cloud-drift-near {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(100vw + 200px)); }
        }
        @keyframes cloud-drift-far {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-100vw - 300px)); }
        }
      `}</style>
    </>
  );
}

import { useQuery } from "@tanstack/react-query";

const WMO_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  56: "Freezing Drizzle",
  57: "Heavy Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Heavy Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow Grains",
  80: "Light Showers",
  81: "Showers",
  82: "Heavy Showers",
  85: "Light Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ Hail",
  99: "Heavy Thunderstorm w/ Hail",
};

function useWeather() {
  return useQuery<{ current: { temperature_2m: number | null; weather_code: number | null } }>({
    queryKey: ["weather"],
    queryFn: async () => {
      const res = await fetch("/api/weather");
      if (!res.ok) throw new Error("Weather fetch failed");
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
  });
}

interface SundownHeroProps {
  tasksDone?: number;
  tasksTotal?: number;
  streak?: number;
}

export function SundownHero({
  tasksDone = 0,
  tasksTotal = 0,
  streak = 0,
}: SundownHeroProps) {
  const { data: weather } = useWeather();

  const temp = weather?.current?.temperature_2m;
  const code = weather?.current?.weather_code;
  const tempDisplay = temp != null ? `${Math.round(temp)}\u00B0` : "--\u00B0";
  const conditionDisplay = code != null ? (WMO_LABELS[code] ?? "Unknown") : "...";

  return (
    <>
      <section className="sd-hero">
        <h1>Sundown</h1>
        <div className="sd-hero-pills">
          <div className="sd-pill">
            <div className="sd-pill-face">
              <span className="sd-pill-val">{tempDisplay}</span> {conditionDisplay}
            </div>
          </div>
          <div className="sd-pill">
            <div className="sd-pill-face">
              <span className="sd-pill-val">{streak}</span> Streak
            </div>
          </div>
          <div className="sd-pill">
            <div className="sd-pill-face">
              <span className="sd-pill-val">{tasksDone}/{tasksTotal}</span> Today
            </div>
          </div>
        </div>
      </section>

      {/* Spacer to let the landscape breathe between title and cards */}
      <div className="sd-landscape-spacer" />
    </>
  );
}

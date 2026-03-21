import { SundownShell, SundownFace, SundownCardHeader } from "./SundownCard";

/* ------------------------------------------------------------------ */
/*  Bar chart data                                                     */
/* ------------------------------------------------------------------ */

const bars: { label: string; height: number; opacity?: number }[] = [
  { label: "Mon", height: 80 },
  { label: "Tue", height: 55 },
  { label: "Wed", height: 95 },
  { label: "Thu", height: 70 },
  { label: "Fri", height: 60 },
  { label: "Sat", height: 40, opacity: 0.5 },
  { label: "Sun", height: 20, opacity: 0.3 },
];

/* ------------------------------------------------------------------ */
/*  Line graph points                                                  */
/* ------------------------------------------------------------------ */

const points = [
  { x: 0, y: 90 },
  { x: 33, y: 70 },
  { x: 66, y: 50 },
  { x: 100, y: 60 },
  { x: 133, y: 35 },
  { x: 166, y: 40 },
  { x: 200, y: 25 },
];

const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
const areaPath = `${linePath} L200,120 L0,120 Z`;

/* ------------------------------------------------------------------ */
/*  SundownStatsCard                                                   */
/* ------------------------------------------------------------------ */

export function SundownStatsCard() {
  return (
    <SundownShell
      style={{
        background: "rgba(40,22,18,0.55)",
      }}
    >
      <SundownFace
        style={{
          background: "rgba(80,50,35,0.2)",
          backdropFilter: "blur(10px) saturate(1.1)",
          WebkitBackdropFilter: "blur(10px) saturate(1.1)",
        }}
      >
        {/* Ghostly dune silhouettes */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
            pointerEvents: "none",
            background: [
              "radial-gradient(ellipse 120% 40% at 20% 100%, rgba(139,69,19,0.08) 0%, transparent 70%)",
              "radial-gradient(ellipse 100% 35% at 60% 100%, rgba(139,69,19,0.06) 0%, transparent 70%)",
              "radial-gradient(ellipse 80% 30% at 85% 100%, rgba(139,69,19,0.05) 0%, transparent 70%)",
            ].join(", "),
          }}
        />

        {/* Header */}
        <SundownCardHeader
          title="Statistics"
          right={
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--sd-text-muted)",
                background: "rgba(169,130,106,0.12)",
                padding: "4px 10px",
                borderRadius: 8,
              }}
            >
              This Week
            </span>
          }
        />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: 20 }}>
          {/* ---- Left: CSS Bar Chart ---- */}
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 8 }}>
            {bars.map((bar) => (
              <div
                key={bar.label}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: bar.height,
                    borderRadius: "4px 4px 0 0",
                    background:
                      "linear-gradient(180deg, rgba(225,164,92,0.6), rgba(200,131,73,0.3))",
                    boxShadow: "0 0 8px rgba(225,164,92,0.15)",
                    opacity: bar.opacity ?? 1,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    color: "var(--sd-text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  {bar.label}
                </span>
              </div>
            ))}
          </div>

          {/* ---- Right: SVG Line Graph ---- */}
          <div style={{ flex: 1 }}>
            <svg viewBox="0 0 200 120" width="100%" height="100%">
              <defs>
                <linearGradient id="stats-area-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(225,164,92,0.25)" />
                  <stop offset="100%" stopColor="rgba(225,164,92,0)" />
                </linearGradient>
                <filter id="stats-gold-glow">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="rgb(208,138,79)" floodOpacity="0.4" />
                </filter>
              </defs>

              {/* Grid lines */}
              {[30, 60, 90].map((y) => (
                <line
                  key={y}
                  x1={0}
                  y1={y}
                  x2={200}
                  y2={y}
                  stroke="rgba(169,130,106,0.08)"
                  strokeWidth={0.5}
                />
              ))}

              {/* Area fill */}
              <path d={areaPath} fill="url(#stats-area-fill)" />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="var(--sd-accent-mid, #D08A4F)"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                filter="url(#stats-gold-glow)"
              />

              {/* Dots */}
              {points.map((p, i) => {
                const isLast = i === points.length - 1;
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={isLast ? 4 : 3}
                    fill={isLast ? "var(--sd-accent, #E1A45C)" : "var(--sd-accent-mid, #D08A4F)"}
                    stroke={isLast ? "rgba(40,22,18,0.6)" : "none"}
                    strokeWidth={isLast ? 1.5 : 0}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </SundownFace>
    </SundownShell>
  );
}

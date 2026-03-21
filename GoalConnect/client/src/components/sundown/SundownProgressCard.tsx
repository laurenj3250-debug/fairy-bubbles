import { SundownCard } from "./SundownCard";

const CIRCUMFERENCE = 2 * Math.PI * 68; // ≈ 427.26

interface SundownProgressCardProps {
  percentage?: number;
  label?: string;
}

export function SundownProgressCard({
  percentage = 78,
  label = "This Week",
}: SundownProgressCardProps) {
  const offset = CIRCUMFERENCE * (1 - percentage / 100);

  return (
    <SundownCard title="Progress" useTray>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {/* Ring well */}
        <div
          style={{
            position: "relative",
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "rgba(15,10,8,0.5)",
            boxShadow:
              "inset 0 6px 12px rgba(0,0,0,0.4), inset 0 -4px 8px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* SVG ring */}
          <svg
            width={160}
            height={160}
            viewBox="0 0 160 160"
            style={{
              transform: "rotate(-90deg)",
              filter: "drop-shadow(0 0 12px rgba(218,165,32,0.35))",
            }}
          >
            {/* Background track */}
            <circle
              cx={80}
              cy={80}
              r={68}
              fill="none"
              stroke="rgba(225,164,92,0.1)"
              strokeWidth={10}
            />
            {/* Fill track */}
            <circle
              cx={80}
              cy={80}
              r={68}
              fill="none"
              stroke="var(--sd-accent-mid, #D08A4F)"
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
            />
          </svg>

          {/* Center text */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              className="font-display"
              style={{
                fontSize: 42,
                fontWeight: 600,
                color: "var(--sd-text-accent)",
                lineHeight: 1,
              }}
            >
              {percentage}%
            </span>
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: "var(--sd-text-muted)",
                marginTop: 4,
              }}
            >
              {label}
            </span>
          </div>
        </div>
      </div>
    </SundownCard>
  );
}

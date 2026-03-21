interface SundownStreakProps {
  streak?: number;
}

export function SundownStreak({ streak = 22 }: SundownStreakProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1 }}>🔥</span>
      <span
        className="font-display"
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--sd-text-accent)",
          lineHeight: 1.2,
          marginTop: 4,
        }}
      >
        {streak}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "var(--sd-text-muted)",
          marginTop: 2,
        }}
      >
        day streak
      </span>
    </div>
  );
}

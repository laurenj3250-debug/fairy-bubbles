import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TopoProgressLinesProps {
  seasonProgress: number; // 0-90 days
  className?: string;
}

export function TopoProgressLines({ seasonProgress, className }: TopoProgressLinesProps) {
  // Calculate contour density based on season progress
  const contourDensity = useMemo(() => {
    // Start with 40px spacing, decrease to 15px as progress increases
    const minSpacing = 15;
    const maxSpacing = 40;
    const progressRatio = Math.min(seasonProgress / 90, 1);
    return maxSpacing - (maxSpacing - minSpacing) * progressRatio;
  }, [seasonProgress]);

  const lineOpacity = useMemo(() => {
    // Gradually increase opacity as progress grows
    return 0.02 + (seasonProgress / 90) * 0.04; // 0.02 to 0.06
  }, [seasonProgress]);

  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="topo-contours"
            x="0"
            y="0"
            width={contourDensity * 2}
            height={contourDensity * 2}
            patternUnits="userSpaceOnUse"
          >
            {/* Horizontal contour lines */}
            <line
              x1="0"
              y1={contourDensity}
              x2={contourDensity * 2}
              y2={contourDensity}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="0.5"
              opacity={lineOpacity}
            />

            {/* Diagonal contour lines for depth */}
            <line
              x1="0"
              y1="0"
              x2={contourDensity * 2}
              y2={contourDensity * 2}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="0.3"
              opacity={lineOpacity * 0.7}
            />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#topo-contours)" />
      </svg>
    </div>
  );
}

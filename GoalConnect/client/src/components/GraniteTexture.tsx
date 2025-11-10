import { cn } from "@/lib/utils";

interface GraniteTextureProps {
  className?: string;
  opacity?: number;
}

export function GraniteTexture({ className, opacity = 0.03 }: GraniteTextureProps) {
  return (
    <div
      className={cn("absolute inset-0 pointer-events-none rounded-inherit overflow-hidden", className)}
      style={{ opacity }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="granite-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="5"
              seed="42"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.5
                      0 0 0 0 0.5
                      0 0 0 0 0.5
                      0 0 0 1 0"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#granite-noise)" />
      </svg>
    </div>
  );
}

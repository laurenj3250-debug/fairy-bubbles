import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  variant?: "text" | "card" | "avatar" | "button";
  lines?: number;
  className?: string;
}

export function SkeletonLoader({
  variant = "text",
  lines = 3,
  className
}: SkeletonLoaderProps) {
  if (variant === "text") {
    return (
      <div className={cn("space-y-2 animate-pulse", className)} role="status" aria-label="Loading content">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 bg-muted rounded",
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
          />
        ))}
        <span className="sr-only">Loading content</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn("p-4 space-y-4 animate-pulse", className)}
        role="status"
        aria-label="Loading card"
      >
        <div className="h-32 bg-muted rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
        <span className="sr-only">Loading card</span>
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div
        className={cn("animate-pulse", className)}
        role="status"
        aria-label="Loading avatar"
      >
        <div className="w-12 h-12 bg-muted rounded-full" />
        <span className="sr-only">Loading avatar</span>
      </div>
    );
  }

  if (variant === "button") {
    return (
      <div
        className={cn("h-10 bg-muted rounded-lg animate-pulse", className)}
        role="status"
        aria-label="Loading button"
      >
        <span className="sr-only">Loading button</span>
      </div>
    );
  }

  return null;
}

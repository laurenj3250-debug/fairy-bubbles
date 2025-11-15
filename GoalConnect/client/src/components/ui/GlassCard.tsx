import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  blur?: "sm" | "md" | "lg";
  opacity?: 50 | 60 | 70 | 75 | 80 | 90;
}

/**
 * GlassCard - Base glassmorphism card component for Base Camp dashboard
 *
 * Features:
 * - Semi-transparent white background
 * - Backdrop blur for glass effect
 * - Soft borders and shadows
 * - Rounded corners
 */
export function GlassCard({
  children,
  className,
  blur = "md",
  opacity = 75
}: GlassCardProps) {
  const blurClass = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
  }[blur];

  // Map opacity to Tailwind classes (fixes dynamic class generation issue)
  const opacityClass = {
    50: "bg-card/50",
    60: "bg-card/60",
    70: "bg-card/70",
    75: "bg-card/75",
    80: "bg-card/80",
    90: "bg-card/90",
  }[opacity];

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/30",
        opacityClass,
        blurClass,
        "shadow-lg",
        "transition-all duration-200",
        "hover:shadow-xl",
        "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * GlassCardHeader - Header section for glass cards
 */
export function GlassCardHeader({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 pt-6 pb-3", className)}>
      {children}
    </div>
  );
}

/**
 * GlassCardTitle - Title for glass cards
 */
export function GlassCardTitle({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn(
      "text-lg font-semibold tracking-tight text-foreground",
      className
    )}>
      {children}
    </h3>
  );
}

/**
 * GlassCardContent - Content section for glass cards
 */
export function GlassCardContent({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 pb-6", className)}>
      {children}
    </div>
  );
}

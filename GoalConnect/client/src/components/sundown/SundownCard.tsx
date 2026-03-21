import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  1. SundownShell — outer bevel frame                               */
/* ------------------------------------------------------------------ */

interface SundownShellProps extends HTMLMotionProps<"div"> {
  hover?: boolean;
  children?: ReactNode;
}

export const SundownShell = forwardRef<HTMLDivElement, SundownShellProps>(
  ({ hover = true, className, children, style, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn("relative min-w-0 h-full", className)}
        style={{
          background: "var(--sd-shell-bg)",
          borderRadius: "var(--sd-shell-radius)",
          padding: "var(--sd-shell-pad)",
          boxShadow: "var(--sd-card-shadow)",
          ...style,
        }}
        {...(hover
          ? {
              whileHover: {
                y: -4,
                boxShadow:
                  "var(--sd-card-shadow, 0 8px 32px rgba(0,0,0,0.18)), 0 12px 40px rgba(0,0,0,0.12)",
              },
              transition: { type: "spring", stiffness: 300, damping: 24 },
            }
          : {})}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

SundownShell.displayName = "SundownShell";

/* ------------------------------------------------------------------ */
/*  2. SundownFace — glass surface inside shell                       */
/* ------------------------------------------------------------------ */

type SundownFaceProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export const SundownFace = forwardRef<HTMLDivElement, SundownFaceProps>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative overflow-hidden min-w-0 h-full", className)}
        style={{
          background: "var(--sd-face-bg)",
          borderRadius: "var(--sd-face-radius)",
          padding: 20,
          boxShadow: "var(--sd-face-inset)",
          backdropFilter: "blur(var(--sd-face-blur)) saturate(1.3)",
          WebkitBackdropFilter: "blur(var(--sd-face-blur)) saturate(1.3)",
          borderTop: "1px solid rgba(255,200,140,0.12)",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

SundownFace.displayName = "SundownFace";

/* ------------------------------------------------------------------ */
/*  3. SundownTray — recessed inner well                              */
/* ------------------------------------------------------------------ */

type SundownTrayProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export const SundownTray = forwardRef<HTMLDivElement, SundownTrayProps>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(className)}
        style={{
          background: "var(--sd-tray-bg)",
          padding: 16,
          boxShadow: "var(--sd-tray-inset)",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.15)",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  },
);

SundownTray.displayName = "SundownTray";

/* ------------------------------------------------------------------ */
/*  4. SundownCardHeader — title + optional right slot                 */
/* ------------------------------------------------------------------ */

interface SundownCardHeaderProps {
  title: string;
  right?: ReactNode;
  className?: string;
}

export function SundownCardHeader({
  title,
  right,
  className,
}: SundownCardHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between", className)}
      style={{ marginBottom: 14 }}
    >
      <h2
        className="font-display font-semibold"
        style={{
          fontSize: 22,
          color: "var(--sd-text-primary)",
        }}
      >
        {title}
      </h2>
      {right && <div>{right}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  5. SundownCard — convenience composite                            */
/* ------------------------------------------------------------------ */

interface SundownCardProps {
  title?: string;
  headerRight?: ReactNode;
  children?: ReactNode;
  className?: string;
  useTray?: boolean;
  hover?: boolean;
}

export function SundownCard({
  title,
  headerRight,
  children,
  className,
  useTray = true,
  hover = true,
}: SundownCardProps) {
  return (
    <SundownShell hover={hover} className={className}>
      <SundownFace>
        {title && <SundownCardHeader title={title} right={headerRight} />}
        {useTray ? <SundownTray>{children}</SundownTray> : children}
      </SundownFace>
    </SundownShell>
  );
}

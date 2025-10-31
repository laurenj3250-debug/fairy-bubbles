import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center py-16 px-8 text-center bg-gradient-lagoon rounded-3xl", className)}
      data-testid="empty-state"
    >
      <div className="p-4 rounded-2xl bg-white/40 backdrop-blur-sm">
        <Icon className="w-16 h-16 text-primary" />
      </div>
      <h3 className="mt-6 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-base text-foreground/80 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-8 rounded-xl" data-testid="empty-state-action">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

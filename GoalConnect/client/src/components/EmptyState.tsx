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
    <div className={cn("sd-shell", className)} data-testid="empty-state">
      <div className="sd-face" style={{ padding: '40px 24px', textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
        <div style={{
          padding: 16,
          borderRadius: 'var(--sd-radius-lg, 20px)',
          background: 'rgba(225,164,92,0.08)',
          border: '1px solid rgba(225,164,92,0.1)',
        }}>
          <Icon style={{ width: 40, height: 40, color: 'var(--sd-text-accent)' }} />
        </div>
        <h3 style={{ marginTop: 16, fontSize: 16, fontWeight: 600, color: 'var(--sd-text-primary)', fontFamily: "'Cormorant Garamond', serif" }}>
          {title}
        </h3>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--sd-text-muted)', maxWidth: 280, lineHeight: 1.5 }}>
          {description}
        </p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            data-testid="empty-state-action"
            style={{
              marginTop: 20,
              padding: '10px 24px',
              borderRadius: 'var(--sd-radius-md, 14px)',
              border: '1px solid rgba(225,164,92,0.3)',
              background: 'linear-gradient(145deg, rgba(225,164,92,0.2), rgba(200,131,73,0.15))',
              color: 'var(--sd-text-accent)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { SundownLandscape } from './SundownLandscape';

interface SundownPageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Wraps any page in the Sundown desert landscape background.
 * Used by all non-dashboard pages to unify the visual theme.
 * The dashboard (SundownDash) has its own layout with tabs.
 */
export function SundownPageWrapper({ children, title, subtitle }: SundownPageWrapperProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        overflowX: 'hidden',
        fontFamily: "'Source Sans 3', sans-serif",
        color: 'var(--sd-text-primary)',
        background: 'var(--sd-bg-deep, #0a0507)',
        position: 'relative',
      }}
    >
      <SundownLandscape />
      <div className="sd-content" style={{ position: 'relative', zIndex: 2, padding: '24px 0' }}>
        {title && (
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: 4,
              textTransform: 'uppercase' as const,
              color: 'var(--sd-text-primary)',
            }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: 13, color: 'var(--sd-text-muted)', marginTop: 4 }}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

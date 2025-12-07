import { cn } from '@/lib/utils';

interface LuxuryFunFactProps {
  title: string;
  content: string;
  category?: string;
  className?: string;
}

export function LuxuryFunFact({
  title,
  content,
  category = 'Fun Fact',
  className,
}: LuxuryFunFactProps) {
  return (
    <div className={cn("relative h-full flex flex-col", className)}>
      {/* Decorative open quote */}
      <span
        className="absolute -top-2 -left-1 font-display text-4xl text-peach-300/30"
        aria-hidden="true"
      >
        &ldquo;
      </span>

      {/* Content */}
      <div className="pl-4 pt-4">
        {/* Title */}
        <h4 className="font-heading font-medium text-base text-peach-400 mb-3">
          {title}
        </h4>

        {/* Body */}
        <p
          className="font-body text-sm leading-relaxed"
          style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}
        >
          {content}
        </p>
      </div>

      {/* Decorative close quote */}
      <span
        className="absolute -bottom-4 right-2 font-display text-4xl text-peach-300/30 rotate-180"
        aria-hidden="true"
      >
        &ldquo;
      </span>

      {/* Category footer */}
      <div className="flex items-center gap-2 mt-6 pt-3 border-t border-white/5">
        <span className="font-heading-sc text-[10px] tracking-wide text-[var(--text-muted)]">
          {category}
        </span>
      </div>
    </div>
  );
}

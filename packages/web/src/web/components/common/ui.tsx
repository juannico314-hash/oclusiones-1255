'use client';

import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4', className)}>
      <div>
        <h2 className="text-[22px] font-serif font-semibold text-foreground tracking-tight leading-tight">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-[13px] text-muted-foreground max-w-3xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ children, className }: SectionTitleProps) {
  return (
    <h3 className={cn('text-[11px] font-semibold uppercase tracking-wider text-muted-foreground', className)}>
      {children}
    </h3>
  );
}

interface DotsDisplayProps {
  value: number | null;
  size?: 'sm' | 'md' | 'lg';
}

export function DotsDisplay({ value, size = 'md' }: DotsDisplayProps) {
  const v = value ?? 0;
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            dotSize,
            'rounded-full transition-colors',
            i <= v ? 'bg-primary' : 'bg-muted-foreground/15',
          )}
        />
      ))}
    </div>
  );
}

interface ValuePillProps {
  value: number | null;
  className?: string;
}

export function ValuePill({ value, className }: ValuePillProps) {
  if (value === null || value === undefined) {
    return <span className={cn('text-muted-foreground text-[11px] italic', className)}>NR</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded text-[11px] font-semibold',
        `value-pill-${value}`,
        className,
      )}
    >
      {value}
    </span>
  );
}

interface DomainBadgeProps {
  domain: string;
  className?: string;
}

export function DomainBadge({ domain, className }: DomainBadgeProps) {
  const d = domain.trim().toLowerCase();
  const cls = d === 'eficacia'
    ? 'domain-eficacia'
    : d === 'seguridad'
      ? 'domain-seguridad'
      : d === 'pros'
        ? 'domain-pros'
        : 'domain-posicionamiento';
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider', cls, className)}>
      {domain.trim()}
    </span>
  );
}

interface MoneyProps {
  value: number;
  className?: string;
  compact?: boolean;
}

export function Money({ value, className, compact }: MoneyProps) {
  if (compact && Math.abs(value) >= 1_000_000) {
    return (
      <span className={cn('font-mono tabular-nums', className)}>
        ${(value / 1_000_000).toFixed(2)}M
      </span>
    );
  }
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      ${value.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
    </span>
  );
}

interface PercentProps {
  value: number;
  className?: string;
  decimals?: number;
}

export function Percent({ value, className, decimals = 1 }: PercentProps) {
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {value.toFixed(decimals)}%
    </span>
  );
}

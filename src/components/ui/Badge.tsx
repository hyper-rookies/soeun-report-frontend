import { HTMLAttributes } from 'react';

type Variant = 'default' | 'accent' | 'success' | 'warning' | 'destructive' | 'outline';
type Size = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center gap-1 font-medium rounded-[4px] leading-none tracking-[0.02em]';

const variants: Record<Variant, string> = {
  default:
    'bg-canvas text-ink-dim border border-[var(--bd-strong)]',
  accent:
    'bg-accent-dim text-accent border border-accent/20',
  success:
    'bg-success-dim text-success-text border border-success/20',
  warning:
    'bg-warning-dim text-warning-text border border-warning/20',
  destructive:
    'bg-destructive-dim text-destructive-text border border-destructive/20',
  outline:
    'bg-transparent text-ink-dim border border-[var(--bd-strong)]',
};

const sizes: Record<Size, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-[3px] text-[11px]',
};

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      className={[base, variants[variant], sizes[size], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;

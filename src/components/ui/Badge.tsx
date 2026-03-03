import { HTMLAttributes } from 'react';

type Variant = 'default' | 'accent' | 'success' | 'warning' | 'destructive' | 'outline';
type Size = 'sm' | 'md';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  size?: Size;
}

const base = 'inline-flex items-center gap-1 font-medium rounded-[4px] leading-none tracking-[0.02em]';

const variants: Record<Variant, string> = {
  default: 'bg-[var(--surface-well)] text-[var(--text-dim)] border border-[var(--border-default)]',
  accent: 'bg-[var(--surface-ai)] text-[var(--accent-default)] border border-[var(--accent-default)]/20',
  success: 'bg-[hsl(158,60%,95%)] text-[hsl(158,64%,28%)] border border-[hsl(158,64%,38%)]/20',
  warning: 'bg-[hsl(38,90%,95%)] text-[hsl(38,92%,30%)] border border-[hsl(38,92%,48%)]/20',
  destructive: 'bg-[hsl(0,70%,96%)] text-[hsl(0,72%,40%)] border border-[hsl(0,72%,52%)]/20',
  outline: 'bg-transparent text-[var(--text-dim)] border border-[var(--border-strong)]',
};

const sizes: Record<Size, string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-[3px] text-[11px]',
};

export function Badge({ variant = 'default', size = 'md', children, className = '', ...props }: BadgeProps) {
  return (
    <span className={[base, variants[variant], sizes[size], className].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  );
}
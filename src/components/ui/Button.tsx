import { forwardRef, ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-default)] ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-canvas)] ' +
  'disabled:pointer-events-none disabled:opacity-40 select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--accent-default)] text-[var(--accent-text)] hover:bg-[var(--accent-dark)] active:bg-[var(--accent-deeper)] rounded-[6px] border border-transparent',
  secondary:
    'bg-[var(--surface-elevated)] text-[var(--text-ink)] hover:bg-[var(--surface-canvas)] active:bg-[var(--surface-well)] rounded-[6px] border border-[var(--border-strong)]',
  ghost:
    'bg-transparent text-[var(--text-dim)] hover:bg-[var(--surface-well)] hover:text-[var(--text-ink)] active:bg-[var(--border-faint)] rounded-[6px] border border-transparent',
  destructive:
    'bg-[hsl(0,72%,52%)] text-white hover:bg-[hsl(0,72%,46%)] active:bg-[hsl(0,72%,40%)] rounded-[6px] border border-transparent',
};

const sizes: Record<Size, string> = {
  sm: 'h-7 px-3 text-[12px] tracking-[0.01em]',
  md: 'h-8 px-4 text-[13px]',
  lg: 'h-10 px-5 text-[14px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[base, variants[variant], sizes[size], fullWidth ? 'w-full' : '', className].filter(Boolean).join(' ')}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
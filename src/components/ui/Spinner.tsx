// Spinner.tsx
import { HTMLAttributes } from 'react';

type Size = 'sm' | 'md' | 'lg';
type Color = 'accent' | 'current' | 'muted';

interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: Size;
  color?: Color;
  label?: string;
}

const sizes: Record<Size, { svg: string; stroke: number }> = {
  sm: { svg: 'w-3.5 h-3.5', stroke: 2.5 },
  md: { svg: 'w-5 h-5', stroke: 2.5 },
  lg: { svg: 'w-7 h-7', stroke: 2 },
};

const colors: Record<Color, string> = {
  accent: 'text-[var(--accent-default)]',
  current: 'text-current',
  muted: 'text-[var(--text-ghost)]',
};

export function Spinner({ size = 'md', color = 'accent', label = '로딩 중...', className = '', ...props }: SpinnerProps) {
  const s = sizes[size];
  return (
    <span role="status" aria-label={label} className={['inline-flex', colors[color], className].filter(Boolean).join(' ')} {...props}>
      <svg className={`${s.svg} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={s.stroke} className="opacity-15" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={s.stroke} strokeLinecap="round" />
      </svg>
    </span>
  );
}
import { HTMLAttributes } from 'react';

type Size = 'sm' | 'md' | 'lg';

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: Size;
  /** Override auto-generated color */
  colorIndex?: number;
}

const sizes: Record<Size, { container: string; text: string }> = {
  sm: { container: 'w-6 h-6',   text: 'text-[10px] font-semibold' },
  md: { container: 'w-8 h-8',   text: 'text-[12px] font-semibold' },
  lg: { container: 'w-10 h-10', text: 'text-[14px] font-semibold' },
};

/**
 * Fixed palette — cool-toned, on-brand.
 * Derived from the product's domain: data signal colors + slate foundation.
 */
const palette = [
  { bg: 'hsl(245, 55%, 88%)', fg: 'hsl(245, 75%, 42%)' }, // indigo  — accent family
  { bg: 'hsl(158, 48%, 86%)', fg: 'hsl(158, 64%, 28%)' }, // green   — success signal
  { bg: 'hsl(220, 20%, 84%)', fg: 'hsl(222, 25%, 28%)' }, // slate   — neutral
  { bg: 'hsl(38,  80%, 88%)', fg: 'hsl(38,  92%, 28%)' }, // amber   — warning signal
  { bg: 'hsl(260, 45%, 86%)', fg: 'hsl(260, 65%, 38%)' }, // violet  — analysis accent
  { bg: 'hsl(195, 55%, 84%)', fg: 'hsl(195, 75%, 28%)' }, // teal    — data accent
];

/** Deterministic color from name — same name always gets same color */
function getColorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % palette.length;
}

/** Returns up to 2 initials from a name */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  size = 'md',
  colorIndex,
  className = '',
  style,
  ...props
}: AvatarProps) {
  const idx = colorIndex ?? getColorIndex(name);
  const color = palette[idx % palette.length];
  const s = sizes[size];

  return (
    <span
      aria-label={name}
      title={name}
      className={[
        'inline-flex items-center justify-center rounded-full shrink-0 select-none',
        s.container,
        s.text,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        backgroundColor: color.bg,
        color: color.fg,
        ...style,
      }}
      {...props}
    >
      {getInitials(name)}
    </span>
  );
}

export default Avatar;

import { HTMLAttributes } from 'react';

type Variant = 'line' | 'block' | 'circle';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  /** Width — Tailwind class or arbitrary value, e.g. "w-32" or "w-[120px]" */
  width?: string;
  /** Height — Tailwind class or arbitrary value, e.g. "h-4" */
  height?: string;
  lines?: number;
}

const base =
  'animate-pulse bg-[var(--bd)] rounded';

/** Single skeleton shape */
function SkeletonShape({
  variant = 'block',
  width = '',
  height = '',
  className = '',
  ...props
}: Omit<SkeletonProps, 'lines'>) {
  const shape =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'line'
      ? 'rounded-[3px]'
      : 'rounded-lg';

  const defaultSize =
    variant === 'circle'
      ? 'w-8 h-8'
      : variant === 'line'
      ? 'h-3'
      : 'h-20';

  return (
    <div
      className={[
        base,
        shape,
        width || (variant === 'circle' ? '' : 'w-full'),
        height || defaultSize,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Skeleton — loading state placeholder.
 *
 * Single shape or multiple lines.
 *
 * @example
 * // Single block
 * <Skeleton variant="block" height="h-24" />
 *
 * // Text lines
 * <Skeleton variant="line" lines={3} />
 *
 * // Avatar circle
 * <Skeleton variant="circle" width="w-8" height="h-8" />
 */
export function Skeleton({
  variant = 'line',
  lines,
  width,
  height,
  className = '',
  ...props
}: SkeletonProps) {
  if (variant === 'line' && lines && lines > 1) {
    return (
      <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonShape
            key={i}
            variant="line"
            height={height}
            /* Last line is shorter — feels like natural text flow */
            width={i === lines - 1 ? 'w-3/4' : width}
            {...props}
          />
        ))}
      </div>
    );
  }

  return (
    <SkeletonShape
      variant={variant}
      width={width}
      height={height}
      className={className}
      {...props}
    />
  );
}

export default Skeleton;

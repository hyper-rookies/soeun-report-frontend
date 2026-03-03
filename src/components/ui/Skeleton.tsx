// Skeleton.tsx
import { HTMLAttributes } from 'react';

type Variant = 'line' | 'block' | 'circle';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  width?: string;
  height?: string;
  lines?: number;
}

const base = 'animate-pulse bg-[var(--border-default)]';

function SkeletonShape({ variant = 'block', width = '', height = '', className = '', ...props }: Omit<SkeletonProps, 'lines'>) {
  const shape = variant === 'circle' ? 'rounded-full' : variant === 'line' ? 'rounded-[3px]' : 'rounded-[8px]';
  const defaultSize = variant === 'circle' ? 'w-8 h-8' : variant === 'line' ? 'h-3' : 'h-20';

  return (
    <div className={[base, shape, width || (variant === 'circle' ? '' : 'w-full'), height || defaultSize, className].filter(Boolean).join(' ')} aria-hidden="true" {...props} />
  );
}

export function Skeleton({ variant = 'line', lines, width, height, className = '', ...props }: SkeletonProps) {
  if (variant === 'line' && lines && lines > 1) {
    return (
      <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonShape key={i} variant="line" height={height} width={i === lines - 1 ? 'w-3/4' : width} {...props} />
        ))}
      </div>
    );
  }
  return <SkeletonShape variant={variant} width={width} height={height} className={className} {...props} />;
}
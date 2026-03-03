import { HTMLAttributes } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  /** Elevates the border to bd-strong. Use when card needs more presence. */
  bordered?: boolean;
}

const paddings: Record<Padding, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

export function Card({
  padding = 'md',
  bordered = false,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'bg-surface rounded-lg',
        bordered
          ? 'border border-[var(--bd-strong)]'
          : 'border border-[var(--bd)]',
        paddings[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

/** Card sub-components for structured layouts */
export function CardHeader({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['pb-3 border-b border-[var(--bd-faint)]', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={[
        'text-[14px] font-semibold text-ink tracking-[-0.01em]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['pt-3', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'pt-3 mt-3 border-t border-[var(--bd-faint)] flex items-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;

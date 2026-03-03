import { HTMLAttributes } from 'react';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: Padding;
  bordered?: boolean;
}

const paddings: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ padding = 'md', bordered = false, children, className = '', ...props }: CardProps) {
  return (
    <div
      className={[
        'bg-[var(--surface-elevated)] rounded-[8px]',
        bordered ? 'border border-[var(--border-strong)]' : 'border border-[var(--border-default)]',
        paddings[padding],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['pb-3 border-b border-[var(--border-faint)]', className].filter(Boolean).join(' ')} {...props}>{children}</div>;
}

export function CardTitle({ children, className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={['text-[14px] font-semibold text-[var(--text-ink)] tracking-[-0.01em]', className].filter(Boolean).join(' ')} {...props}>{children}</h3>;
}

export function CardContent({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['pt-3', className].filter(Boolean).join(' ')} {...props}>{children}</div>;
}

export function CardFooter({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['pt-3 mt-3 border-t border-[var(--border-faint)] flex items-center', className].filter(Boolean).join(' ')} {...props}>{children}</div>;
}
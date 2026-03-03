import { HTMLAttributes, ReactElement } from 'react';

type Variant = 'info' | 'success' | 'warning' | 'destructive';

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  title?: string;
}

const styles: Record<
  Variant,
  { container: string; icon: string; title: string; body: string; svg: ReactElement }
> = {
  info: {
    container: 'bg-accent-dim border-l-[3px] border-accent border border-accent/20',
    icon: 'text-accent',
    title: 'text-ink',
    body: 'text-ink-dim',
    svg: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0 mt-[1px]">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm.75 3.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7 7a1 1 0 0 1 2 0v4a1 1 0 0 1-2 0V7Z" />
      </svg>
    ),
  },
  success: {
    container: 'bg-success-dim border-l-[3px] border-success border border-success/20',
    icon: 'text-success-text',
    title: 'text-ink',
    body: 'text-ink-dim',
    svg: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0 mt-[1px]">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm3.53 5.28-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06l1.47 1.47 3.97-3.97a.75.75 0 0 1 1.06 1.06Z" />
      </svg>
    ),
  },
  warning: {
    container: 'bg-warning-dim border-l-[3px] border-warning border border-warning/20',
    icon: 'text-warning-text',
    title: 'text-ink',
    body: 'text-ink-dim',
    svg: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0 mt-[1px]">
        <path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047ZM9 11a1 1 0 1 0-2 0 1 1 0 0 0 2 0Zm-.25-5.25a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5Z" />
      </svg>
    ),
  },
  destructive: {
    container: 'bg-destructive-dim border-l-[3px] border-destructive border border-destructive/20',
    icon: 'text-destructive-text',
    title: 'text-ink',
    body: 'text-ink-dim',
    svg: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0 mt-[1px]">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM6.47 5.47a.75.75 0 0 1 1.06 0L8 5.94l.47-.47a.75.75 0 0 1 1.06 1.06L9.06 7l.47.47a.75.75 0 0 1-1.06 1.06L8 8.06l-.47.47a.75.75 0 0 1-1.06-1.06L6.94 7l-.47-.47a.75.75 0 0 1 0-1.06Zm-1 5.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 0 1.5h-3.5a.75.75 0 0 1-.75-.75Z" />
      </svg>
    ),
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  ...props
}: AlertProps) {
  const s = styles[variant];

  return (
    <div
      role="alert"
      className={[
        'flex gap-3 rounded-lg px-4 py-3',
        s.container,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <span className={s.icon}>{s.svg}</span>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-[13px] font-semibold mb-0.5 ${s.title}`}>{title}</p>
        )}
        {children && (
          <div className={`text-[13px] leading-relaxed ${s.body}`}>{children}</div>
        )}
      </div>
    </div>
  );
}

export default Alert;

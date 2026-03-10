'use client';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  size?: LogoSize;
  className?: string;
}

const cfg = {
  sm: { mark: 24, gap: 7,  word: 14 },
  md: { mark: 32, gap: 9,  word: 18 },
  lg: { mark: 48, gap: 12, word: 26 },
};

export function Logo({ size = 'md', className }: LogoProps) {
  const c = cfg[size];
  return (
    <div
      className={`flex items-center${className ? ` ${className}` : ''}`}
      style={{ gap: c.gap }}
    >
      {/* N lettermark */}
      <svg
        width={c.mark}
        height={c.mark}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden
      >
        <rect width="48" height="48" rx="11" fill="var(--primary-500)" />
        {/* Left vertical bar */}
        <rect x="11" y="10" width="6" height="28" fill="white" />
        {/* Diagonal */}
        <polygon points="17,10 25,10 31,38 23,38" fill="white" />
        {/* Right vertical bar */}
        <rect x="31" y="10" width="6" height="28" fill="white" />
      </svg>

      {/* Wordmark */}
      <span
        style={{
          fontSize: c.word,
          fontWeight: 400,
          fontFamily: 'var(--font-palette-mosaic)',
          color: 'var(--neutral-700)',
          lineHeight: 1,
        }}
      >
        nADu
      </span>
    </div>
  );
}

export default Logo;

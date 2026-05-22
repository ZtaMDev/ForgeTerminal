interface ForgeLogoProps {
  size?: number;
  className?: string;
}

export function ForgeLogo({ size = 32, className }: ForgeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="f-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#89b4fa" />
          <stop offset="100%" stopColor="#74c7ec" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="24" height="24" rx="6" fill="#1e1e2e" stroke="#89b4fa" strokeWidth="1.5" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontSize="20"
        fontWeight="800"
        fill="#89b4fa"
        fontFamily="'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace"
      >
        F
      </text>
    </svg>
  );
}

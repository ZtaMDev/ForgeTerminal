interface ForgeLogoProps {
  size?: number;
  className?: string;
  bg?: boolean;
}

export function ForgeLogo({ size = 32, className, bg = true }: ForgeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {bg && (
        <>
          <rect x="0.5" y="0.5" width="31" height="31" rx="6" fill="#1e1e2e" stroke="#313244" strokeWidth="1" />
          <rect x="1.5" y="1.5" width="29" height="29" rx="4.5" stroke="#313244" strokeWidth="0.5" opacity="0.6" />
          <rect x="22.5" y="20" width="2" height="2" rx="0.3" fill="#a6e3a1" opacity="0.5" />
        </>
      )}
      <circle cx={bg ? 5 : 4} cy={bg ? 5 : 3} r="0.8" fill="#45475a" />
      <circle cx={bg ? 8 : 7} cy={bg ? 5 : 3} r="0.8" fill="#45475a" />
      <circle cx={bg ? 11 : 10} cy={bg ? 5 : 3} r="0.8" fill="#45475a" />
      <path d={bg ? "M11 23V11h10" : "M10 25V7h11"} stroke="#a6e3a1" strokeWidth="2.5" strokeLinecap="square" />
      <path d={bg ? "M11 17h7.5" : "M10 16h8"} stroke="#a6e3a1" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

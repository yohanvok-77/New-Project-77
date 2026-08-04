interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-blue/24 via-white/10 to-success/14 shadow-glow">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.28),transparent_30%)]" />
        <svg
          className="relative h-8 w-8 text-text"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M9 32.5L18.5 23L25.5 28.5L38.5 14.5"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M35 14.5H38.5V18"
            stroke="#22C55E"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M12 12V36" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
          <path d="M24 10V38" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
          <path d="M36 10V36" stroke="#22C55E" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
      {compact ? null : (
        <div className="min-w-0">
          <span className="block truncate text-2xl font-black tracking-normal text-text sm:text-[2rem]">
            izforex<span className="text-blue">.pro</span>
          </span>
          <div className="mt-1 h-1 w-24 rounded-full bg-gradient-to-r from-blue via-success to-gold" />
        </div>
      )}
    </div>
  );
}

export default function NovaMascot() {
  return (
    <div className="flex items-center gap-4">
      <svg
        width="132"
        height="132"
        viewBox="0 0 132 132"
        fill="none"
        role="img"
        aria-label="Nova mascot"
      >
        <defs>
          <linearGradient id="novaCore" x1="30" y1="16" x2="106" y2="114" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#67e8f9" />
            <stop offset="1" stopColor="#facc15" />
          </linearGradient>
        </defs>

        <circle cx="66" cy="66" r="50" stroke="rgba(103,232,249,0.45)" strokeWidth="1.5" />
        <circle cx="66" cy="66" r="36" stroke="rgba(250,204,21,0.35)" strokeWidth="1.5" />

        <path
          d="M46 84 L38 50 L56 30 L76 30 L94 50 L86 84 L66 96 Z"
          fill="rgba(8,18,36,0.72)"
          stroke="url(#novaCore)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        <path
          d="M56 30 L52 18 L66 24 L80 18 L76 30"
          fill="rgba(103,232,249,0.16)"
          stroke="#67e8f9"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <path
          d="M38 50 L22 44 L30 56 L46 58"
          fill="rgba(250,204,21,0.16)"
          stroke="#facc15"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <path
          d="M94 50 L110 44 L102 56 L86 58"
          fill="rgba(250,204,21,0.16)"
          stroke="#facc15"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <ellipse cx="56" cy="56" rx="5" ry="6" fill="#67e8f9" />
        <ellipse cx="76" cy="56" rx="5" ry="6" fill="#67e8f9" />
        <circle cx="56" cy="56" r="2" fill="#0b1220" />
        <circle cx="76" cy="56" r="2" fill="#0b1220" />

        <path
          d="M54 74 Q66 82 78 74"
          stroke="#f8fafc"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        <path
          d="M66 96 L58 110 L66 106 L74 110 Z"
          fill="rgba(248,250,252,0.28)"
          stroke="#e2e8f0"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      <div className="space-y-1">
        <p className="text-sm font-display text-cyan-50">Nova, The Studio Fox</p>
        <p className="max-w-[170px] text-xs leading-relaxed text-cyan-50/80">
          Calm guide for creators exploring design tools, storefront setup, and print workflows.
        </p>
      </div>
    </div>
  );
}
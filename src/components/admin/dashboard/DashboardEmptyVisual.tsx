"use client";

type Variant = "activity" | "events";

export function DashboardEmptyVisual({ variant }: { variant: Variant }) {
  if (variant === "activity") {
    return (
      <svg
        viewBox="0 0 160 100"
        className="mx-auto h-24 w-40 text-brand-green"
        aria-hidden
      >
        <style>{`
          @keyframes dashPulse {
            0%, 100% { opacity: 0.35; transform: translateY(0); }
            50% { opacity: 1; transform: translateY(-2px); }
          }
          @keyframes barGrow {
            0%, 100% { transform: scaleY(0.55); }
            50% { transform: scaleY(1); }
          }
          .act-bar { transform-origin: bottom; animation: barGrow 2.4s ease-in-out infinite; }
          .act-dot { animation: dashPulse 2s ease-in-out infinite; }
        `}</style>
        <rect x="18" y="58" width="14" height="28" rx="3" fill="currentColor" opacity="0.25" className="act-bar" style={{ animationDelay: "0s" }} />
        <rect x="40" y="42" width="14" height="44" rx="3" fill="currentColor" opacity="0.4" className="act-bar" style={{ animationDelay: "0.2s" }} />
        <rect x="62" y="30" width="14" height="56" rx="3" fill="currentColor" opacity="0.55" className="act-bar" style={{ animationDelay: "0.4s" }} />
        <rect x="84" y="48" width="14" height="38" rx="3" fill="currentColor" opacity="0.35" className="act-bar" style={{ animationDelay: "0.6s" }} />
        <rect x="106" y="36" width="14" height="50" rx="3" fill="currentColor" opacity="0.5" className="act-bar" style={{ animationDelay: "0.8s" }} />
        <rect x="128" y="52" width="14" height="34" rx="3" fill="currentColor" opacity="0.3" className="act-bar" style={{ animationDelay: "1s" }} />
        <circle cx="80" cy="18" r="4" fill="currentColor" className="act-dot" />
        <path
          d="M28 72 C48 58, 72 80, 92 64 C108 52, 122 70, 136 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 160 100"
      className="mx-auto h-24 w-40 text-brand-green"
      aria-hidden
    >
      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes softPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        .evt-orbit { transform-origin: 80px 50px; animation: orbit 12s linear infinite; }
        .evt-pulse { animation: softPulse 2.8s ease-in-out infinite; }
      `}</style>
      <circle
        cx="80"
        cy="50"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.25"
      />
      <circle
        cx="80"
        cy="50"
        r="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        opacity="0.45"
        className="evt-orbit"
      />
      <circle cx="80" cy="50" r="6" fill="currentColor" className="evt-pulse" />
      <g className="evt-orbit">
        <circle cx="80" cy="22" r="3.5" fill="currentColor" opacity="0.85" />
      </g>
      <rect
        x="52"
        y="72"
        width="56"
        height="8"
        rx="4"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  );
}

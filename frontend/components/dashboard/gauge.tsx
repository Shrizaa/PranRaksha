"use client"

export function CircularGauge({
  value,
  label,
  color,
  size = 210,
}: {
  value: number
  label: string
  color: string
  size?: number
}) {
  const stroke = 15
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(100, value))
  const offset = c - (clamped / 100) * c
  const center = size / 2

  // Fallback to vibrant color if a muted grey var is passed
  const activeColor =
    color && !color.includes("var(--chart-4)") && !color.includes("var(--chart-3)")
      ? color
      : clamped > 70
      ? "#ef4444"
      : clamped > 40
      ? "#f59e0b"
      : "#10b981"

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Track background */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={stroke}
        />
        {/* Active progress ring with luminous glow */}
        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke={activeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 12px ${activeColor})`,
          }}
        />
      </svg>
      {/* Center value display with high-contrast bright text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="text-5xl font-black tabular-nums tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]"
          style={{ color: "#ffffff" }}
        >
          {clamped.toFixed(1)}
        </span>
        <span
          className="mt-1.5 text-xs font-black uppercase tracking-widest text-slate-200"
        >
          {label}
        </span>
      </div>
    </div>
  )
}

export function ScoreBar({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className="rounded-xl bg-slate-900/60 border border-white/5 p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-300">{label}</span>
        <span className="font-mono font-black text-white tabular-nums text-base">
          {value.toFixed(1)}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/80">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${clamped}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
          }}
        />
      </div>
    </div>
  )
}

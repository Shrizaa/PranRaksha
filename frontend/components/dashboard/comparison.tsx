"use client"

import { RESOURCE_META } from "@/components/dashboard/resource-cards"
import { fmt } from "@/components/dashboard/feature-shell"
import type { ResourceBundle } from "@/lib/types"

export function ResourceComparison({
  required,
  available,
}: {
  required: ResourceBundle
  available: ResourceBundle
}) {
  return (
    <div className="space-y-4">
      {RESOURCE_META.map((m) => {
        const req = required[m.key]
        const avail = available[m.key]
        const coverage = req === 0 ? 100 : Math.min(100, (avail / req) * 100)
        const sufficient = avail >= req
        const max = Math.max(req, avail, 1)
        const Icon = m.icon
        return (
          <div
            key={m.key}
            className="rounded-xl border border-white/10 bg-slate-900/70 p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Icon className="size-4" />
                </div>
                <span className="text-sm font-bold text-white tracking-tight">{m.label}</span>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  sufficient
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}
              >
                {coverage.toFixed(0)}% covered
              </span>
            </div>
            <div className="space-y-2.5">
              <Bar
                caption="Required"
                value={req}
                pct={(req / max) * 100}
                color="#64748b"
              />
              <Bar
                caption="Available"
                value={avail}
                pct={(avail / max) * 100}
                color={sufficient ? "#10b981" : "#f59e0b"}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Bar({
  caption,
  value,
  pct,
  color,
}: {
  caption: string
  value: number
  pct: number
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {caption}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary/80">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(2, pct)}%`, background: color }}
        />
      </div>
      <span className="w-24 shrink-0 text-right text-xs font-bold tabular-nums text-white">
        {fmt(value)}
      </span>
    </div>
  )
}

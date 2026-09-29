"use client"

import { Utensils, Droplets, HeartPulse, BedDouble } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { fmt } from "@/components/dashboard/feature-shell"
import type { ResourceBundle } from "@/lib/types"
import { useLanguage } from "@/lib/i18n/language-context"

export const RESOURCE_META: {
  key: keyof ResourceBundle
  label: string
  icon: LucideIcon
  color: string
  unit: string
}[] = [
  { key: "food_packets", label: "Food Packets", icon: Utensils, color: "var(--chart-1)", unit: "packets" },
  { key: "water_bottles", label: "Water Bottles", icon: Droplets, color: "var(--chart-5)", unit: "bottles" },
  { key: "medkits", label: "Medical Kits", icon: HeartPulse, color: "var(--chart-3)", unit: "kits" },
  { key: "blankets", label: "Blankets", icon: BedDouble, color: "var(--chart-4)", unit: "units" },
]

export function ResourceCards({ bundle }: { bundle: ResourceBundle }) {
  const { t } = useLanguage()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {RESOURCE_META.map((m) => {
        const Icon = m.icon
        return (
          <div
            key={m.key}
            className="relative overflow-hidden rounded-xl border border-border bg-card/60 p-5"
          >
            <div
              className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-20 blur-2xl"
              style={{ background: m.color }}
            />
            <div
              className="flex size-10 items-center justify-center rounded-lg border"
              style={{
                borderColor: `color-mix(in oklch, ${m.color} 45%, transparent)`,
                background: `color-mix(in oklch, ${m.color} 12%, transparent)`,
              }}
            >
              <Icon className="size-5" style={{ color: m.color }} />
            </div>
            <p className="mt-4 text-2xl font-bold tabular-nums text-white">
              {fmt(bundle[m.key])}
            </p>
            <p className="text-sm font-bold text-muted-foreground">{t(m.label)}</p>
            <p className="text-[11px] text-muted-foreground/70">{t(m.unit)}</p>
          </div>
        )
      })}
    </div>
  )
}

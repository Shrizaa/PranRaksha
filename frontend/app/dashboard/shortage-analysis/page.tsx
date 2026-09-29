"use client"

import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { getFeature } from "@/lib/features"
import { useFeature } from "@/hooks/use-feature"
import { useLanguage } from "@/lib/i18n/language-context"
import {
  FeatureHeader,
  ErrorState,
  ResultsSkeleton,
  fmt,
} from "@/components/dashboard/feature-shell"
import { ResourceComparison } from "@/components/dashboard/comparison"
import { RESOURCE_META } from "@/components/dashboard/resource-cards"
import type { ResourceBundle } from "@/lib/types"

interface Response {
  affected_population: number
  relief_days: number
  warehouse_name: string
  required_resources: ResourceBundle
  available_resources: ResourceBundle
  shortage_analysis: {
    shortage: ResourceBundle
    total_shortage_units: number
    overall_status: string
  }
}

export default function ShortageAnalysisPage() {
  const feature = getFeature("shortage-analysis")!
  const { data, error, loading, refresh, location } =
    useFeature<Response>("shortage-analysis")

  return (
    <div>
      <FeatureHeader
        feature={feature}
        location={location}
        onRefresh={refresh}
        loading={loading}
      />
      {error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <ResultsSkeleton />
      ) : (
        <ShortageResult data={data} />
      )}
    </div>
  )
}

function ShortageResult({ data }: { data: Response }) {
  const { t } = useLanguage()
  const sufficient = data.shortage_analysis.overall_status === "Sufficient"
  const color = sufficient ? "var(--chart-4)" : "var(--chart-3)"
  const Icon = sufficient ? CheckCircle2 : AlertTriangle

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-6"
        style={{
          borderColor: `color-mix(in oklch, ${color} 45%, transparent)`,
          background: `color-mix(in oklch, ${color} 10%, transparent)`,
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="flex size-12 items-center justify-center rounded-xl"
            style={{ background: `color-mix(in oklch, ${color} 20%, transparent)` }}
          >
            <Icon className="size-6" style={{ color }} />
          </div>
          <div>
            <p className="text-lg font-bold" style={{ color }}>
              {sufficient ? (t("Supply Sufficient") || "Supply Sufficient") : (t("Supply Shortage Detected") || "Supply Shortage Detected")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("Responding via") || "Responding via"} <span className="font-semibold text-white">{data.warehouse_name}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("Total shortfall") || "Total shortfall"}
          </p>
          <p className="text-2xl font-bold tabular-nums" style={{ color }}>
            {fmt(data.shortage_analysis.total_shortage_units)}
          </p>
          <p className="text-xs text-muted-foreground font-medium">{t("units short") || "units short"}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {RESOURCE_META.map((m) => {
          const short = data.shortage_analysis.shortage[m.key]
          const ok = short === 0
          return (
            <div
              key={m.key}
              className="rounded-xl border border-border bg-card/60 p-4"
            >
              <div className="flex items-center gap-2">
                <m.icon className="size-4" style={{ color: m.color }} />
                <span className="text-sm font-semibold text-white">{t(m.label)}</span>
              </div>
              <p
                className="mt-3 text-2xl font-bold tabular-nums"
                style={{ color: ok ? "var(--chart-4)" : "var(--chart-3)" }}
              >
                {ok ? "0" : `-${fmt(short)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {ok ? (t("Fully stocked") || "Fully stocked") : (t("Additional units needed") || "Additional units needed")}
              </p>
            </div>
          )
        })}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t("Required vs Available") || "Required vs Available"}
        </h3>
        <ResourceComparison
          required={data.required_resources}
          available={data.available_resources}
        />
      </div>
    </div>
  )
}

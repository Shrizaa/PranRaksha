"use client"

import { Hospital, GraduationCap, Home, MapPin } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getFeature } from "@/lib/features"
import { useFeature } from "@/hooks/use-feature"
import { useLanguage } from "@/lib/i18n/language-context"
import {
  FeatureHeader,
  ErrorState,
  ResultsSkeleton,
} from "@/components/dashboard/feature-shell"

interface InfraItem {
  name: string
  lat?: number
  lon?: number
}

interface Response {
  station: string
  state: string
  nearby_infrastructure: {
    relief_shelters: number
    hospitals: number
    schools: number
  }
  details: {
    hospitals: InfraItem[]
    schools: InfraItem[]
    relief_shelters: InfraItem[]
  }
}

export default function NearbyInfrastructurePage() {
  const { t } = useLanguage()
  const feature = getFeature("nearby-infrastructure")!
  const { data, error, loading, refresh, location } =
    useFeature<Response>("nearby-infrastructure")

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
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <CountTile
              icon={Hospital}
              label={t("Hospitals")}
              count={data.nearby_infrastructure.hospitals}
              color="#0ea5e9"
            />
            <CountTile
              icon={GraduationCap}
              label={t("Schools")}
              count={data.nearby_infrastructure.schools}
              color="var(--chart-2)"
            />
            <CountTile
              icon={Home}
              label={t("Relief Shelters")}
              count={data.nearby_infrastructure.relief_shelters}
              color="var(--chart-4)"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            {t("Within 5km of")} {data.station || "epicentre"}
            {data.state ? `, ${data.state}` : ""}
          </p>

          <div className="grid gap-4 lg:grid-cols-3">
            <InfraList
              title={t("Hospitals")}
              icon={Hospital}
              color="#0ea5e9"
              items={data.details.hospitals}
              noRecordsText={t("No records within 5km")}
            />
            <InfraList
              title={t("Schools")}
              icon={GraduationCap}
              color="var(--chart-2)"
              items={data.details.schools}
              noRecordsText={t("No records within 5km")}
            />
            <InfraList
              title={t("Relief Shelters")}
              icon={Home}
              color="var(--chart-4)"
              items={data.details.relief_shelters}
              noRecordsText={t("No records within 5km")}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CountTile({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: LucideIcon
  label: string
  count: number
  color: string
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card/60 p-5">
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
      />
      <div
        className="flex size-10 items-center justify-center rounded-lg border"
        style={{
          borderColor: `color-mix(in oklch, ${color} 45%, transparent)`,
          background: `color-mix(in oklch, ${color} 12%, transparent)`,
        }}
      >
        <Icon className="size-5" style={{ color }} />
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums" style={{ color }}>
        {count}
      </p>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  )
}

function InfraList({
  title,
  icon: Icon,
  color,
  items,
  noRecordsText,
}: {
  title: string
  icon: LucideIcon
  color: string
  items: InfraItem[]
  noRecordsText: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4" style={{ color }} />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="ml-auto text-xs font-mono font-bold text-muted-foreground">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          {noRecordsText}
        </p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {items.map((it: any, i) => {
            const name = typeof it === "string" ? it : it?.name ?? "Facility"
            const lat = typeof it === "object" ? it?.lat : undefined
            const lon = typeof it === "object" ? it?.lon : undefined
            return (
              <li
                key={i}
                className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-slate-900/80 p-3 shadow-sm transition hover:border-cyan-500/40 hover:bg-slate-900"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-cyan-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-bold text-white tracking-tight leading-snug">
                      {name}
                    </span>
                    {lat !== undefined && lon !== undefined && (
                      <span className="text-xs font-mono font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.35)]">
                        ({lat.toFixed(4)}° N, {lon.toFixed(4)}° E)
                      </span>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

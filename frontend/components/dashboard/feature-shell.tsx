"use client"

import Link from "next/link"
import { ArrowLeft, RefreshCw, MapPin, CalendarDays } from "lucide-react"
import type { Feature } from "@/lib/features"
import type { AppLocation } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n/language-context"

export function FeatureHeader({
  feature,
  location,
  onRefresh,
  loading,
}: {
  feature: Feature
  location: AppLocation
  onRefresh?: () => void
  loading?: boolean
}) {
  const { t } = useLanguage()
  const Icon = feature.icon
  return (
    <div className="mb-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {t("Command Overview")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="flex size-12 items-center justify-center rounded-xl border"
            style={{
              borderColor: `color-mix(in oklch, ${feature.accent} 45%, transparent)`,
              background: `color-mix(in oklch, ${feature.accent} 12%, transparent)`,
            }}
          >
            <Icon className="size-6" style={{ color: feature.accent }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t(feature.title)}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t(feature.description)}
            </p>
          </div>
        </div>
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
            {t("Re-run")}
          </Button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1">
          <MapPin className="size-3.5 text-primary" />
          {typeof location.label === "string" && location.label
            ? location.label
            : `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1">
          <CalendarDays className="size-3.5 text-primary" />
          {location.relief_days} {location.relief_days > 1 ? t("relief days") : t("relief day")}
        </span>
      </div>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  const { t } = useLanguage()
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
      <p className="font-medium">{t("Unable to complete request")}</p>
      <p className="mt-1 opacity-90">{message}</p>
    </div>
  )
}

export function StatTile({
  label,
  value,
  accent,
  hint,
}: {
  label: string
  value: string
  accent?: string
  hint?: string
}) {
  const { t } = useLanguage()
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {t(label)}
      </p>
      <p
        className="mt-1 text-2xl font-bold tabular-nums text-white"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{t(hint)}</p>}
    </div>
  )
}

export function fmt(n: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(n))
}

export function ResultsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-border bg-card/50"
        />
      ))}
      <div className="col-span-full h-64 animate-pulse rounded-xl border border-border bg-card/50" />
    </div>
  )
}

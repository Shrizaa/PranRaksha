"use client"

import { Warehouse as WarehouseIcon } from "lucide-react"
import { getFeature } from "@/lib/features"
import { useFeature } from "@/hooks/use-feature"
import { useLanguage } from "@/lib/i18n/language-context"
import {
  FeatureHeader,
  ErrorState,
  ResultsSkeleton,
  StatTile,
  fmt,
} from "@/components/dashboard/feature-shell"
import { ResourceComparison } from "@/components/dashboard/comparison"
import type { ResourceBundle } from "@/lib/types"

interface Response {
  affected_population: number
  relief_days: number
  warehouse_id: string
  warehouse_name: string
  required_resources: ResourceBundle
  available_resources: ResourceBundle
}

export default function ResourceAvailabilityPage() {
  const feature = getFeature("resource-availability")!
  const { data, error, loading, refresh, location } =
    useFeature<Response>("resource-availability")
  const { t } = useLanguage()

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
            <StatTile
              label={t("Affected population") || "Affected population"}
              value={fmt(data.affected_population)}
              accent="var(--chart-1)"
            />
            <StatTile label={t("Relief window") || "Relief window"} value={`${data.relief_days} ${t("days") || "days"}`} />
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("Responding warehouse") || "Responding warehouse"}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <WarehouseIcon className="size-4 text-primary" />
                <p className="truncate text-sm font-bold text-white">
                  {data.warehouse_name}
                </p>
              </div>
              <p className="text-xs font-mono text-cyan-400">
                {data.warehouse_id}
              </p>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Required vs Available Stock") || "Required vs Available Stock"}
            </h3>
            <ResourceComparison
              required={data.required_resources}
              available={data.available_resources}
            />
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { getFeature } from "@/lib/features"
import { useFeature } from "@/hooks/use-feature"
import {
  FeatureHeader,
  ErrorState,
  ResultsSkeleton,
  StatTile,
  fmt,
} from "@/components/dashboard/feature-shell"
import { ResourceCards } from "@/components/dashboard/resource-cards"
import type { ResourceBundle } from "@/lib/types"

interface Response {
  affected_population: number
  relief_days: number
  resource_requirements: ResourceBundle
}

export default function ResourceRequirementsPage() {
  const feature = getFeature("resource-requirements")!
  const { data, error, loading, refresh, location } =
    useFeature<Response>("resource-requirements")

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
          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile
              label="Affected population (5km)"
              value={fmt(data.affected_population)}
              accent="var(--chart-1)"
              hint="Nearest gauge population_within_5km"
            />
            <StatTile
              label="Relief window"
              value={`${data.relief_days} days`}
              hint="Sizing multiplier applied to consumables"
            />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Required Relief Resources
            </h3>
            <ResourceCards bundle={data.resource_requirements} />
          </div>
          <p className="rounded-lg border border-border bg-card/40 p-4 text-xs text-muted-foreground">
            Formula · food = pop × days × 3 · water = pop × days × 5 · medkits =
            pop ÷ 20 · blankets = pop × 0.7
          </p>
        </div>
      )}
    </div>
  )
}

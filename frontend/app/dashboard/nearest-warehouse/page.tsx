"use client"

import { MapPin, Navigation, Warehouse as WarehouseIcon } from "lucide-react"
import { getFeature } from "@/lib/features"
import { useFeature } from "@/hooks/use-feature"
import { useLanguage } from "@/lib/i18n/language-context"
import {
  FeatureHeader,
  ErrorState,
  ResultsSkeleton,
} from "@/components/dashboard/feature-shell"
import { Badge } from "@/components/ui/badge"

interface NearestWarehouse {
  warehouse_id: string
  warehouse_name: string
  state: string
  city: string
  latitude: number
  longitude: number
  distance_km: number
}

interface RankedWarehouse {
  warehouse_id: string
  warehouse_name: string
  city: string
  state: string
  distance_km: number
}

interface Response {
  nearest_warehouse: NearestWarehouse
  ranked_warehouses: RankedWarehouse[]
}

export default function NearestWarehousePage() {
  const feature = getFeature("nearest-warehouse")!
  const { data, error, loading, refresh, location } =
    useFeature<Response>("nearest-warehouse")
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
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="relative overflow-hidden rounded-2xl border border-primary/40 bg-card/60 p-6 glow-primary">
            <Badge className="mb-4 bg-primary/15 text-primary">
              {t("Closest facility") || "Closest facility"}
            </Badge>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/10">
                <WarehouseIcon className="size-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {data.nearest_warehouse.warehouse_name}
                </h3>
                <p className="text-sm font-mono text-cyan-400">
                  {data.nearest_warehouse.warehouse_id}
                </p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                  <Navigation className="size-3.5" /> {t("Distance") || "Distance"}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-cyan-400">
                  {data.nearest_warehouse.distance_km} km
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                  <MapPin className="size-3.5" /> {t("Location") || "Location"}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {data.nearest_warehouse.city}, {data.nearest_warehouse.state}
                </p>
                <p className="text-xs font-mono text-cyan-400">
                  ({data.nearest_warehouse.latitude.toFixed(3)}°N,{" "}
                  {data.nearest_warehouse.longitude.toFixed(3)}°E)
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("Supply Network · Ranked by Distance") || "Supply Network · Ranked by Distance"}
            </h3>
            <ul className="space-y-2">
              {data.ranked_warehouses.map((w, i) => (
                <li
                  key={w.warehouse_id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background/60 p-3 hover:border-primary/40 transition-colors"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-cyan-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {w.warehouse_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {w.city}, {w.state}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-cyan-400">
                    {w.distance_km} km
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

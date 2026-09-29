"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Warehouse as WarehouseIcon,
  PackageCheck,
  TrendingDown,
  Route,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  MapPin,
} from "lucide-react"
import { useAppLocation } from "@/components/app-provider"
import { useLanguage } from "@/lib/i18n/language-context"
import { callFeature, fetchWarehouses } from "@/lib/api-client"
import { ReliefGlobe, type MarkerData } from "@/components/three/relief-globe"
import { cn } from "@/lib/utils"

interface WarehouseItem {
  warehouseId: string
  warehouseName: string
  city: string
  state: string
  latitude: number
  longitude: number
  foodPackets: number
  waterBottles: number
  medkits: number
  blankets: number
}

interface RankedWarehouse {
  warehouse_id: string
  warehouse_name: string
  city: string
  state: string
  distance_km: number
}

interface NearestWarehouseResponse {
  nearest_warehouse: {
    warehouse_id: string
    warehouse_name: string
    state: string
    city: string
    latitude: number
    longitude: number
    distance_km: number
  }
  ranked_warehouses: RankedWarehouse[]
}

interface ShortageResponse {
  affected_population: number
  relief_days: number
  warehouse_id: string
  warehouse_name: string
  required_resources: {
    food_packets: number
    water_bottles: number
    medkits: number
    blankets: number
  }
  available_resources: {
    food_packets: number
    water_bottles: number
    medkits: number
    blankets: number
  }
  shortage_analysis: {
    shortage: {
      food_packets: number
      water_bottles: number
      medkits: number
      blankets: number
    }
    total_shortage_units: number
    overall_status: string
  }
}

export default function ReliefOperationsPage() {
  const { location } = useAppLocation()
  const { t } = useLanguage()

  const [nearestData, setNearestData] = useState<NearestWarehouseResponse | null>(null)
  const [shortageData, setShortageData] = useState<ShortageResponse | null>(null)
  const [allWarehouses, setAllWarehouses] = useState<WarehouseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const payload = {
          latitude: location.latitude,
          longitude: location.longitude,
          relief_days: location.relief_days,
        }

        const [nearest, shortage, warehouses] = await Promise.all([
          callFeature<NearestWarehouseResponse>("nearest-warehouse", payload),
          callFeature<ShortageResponse>("shortage-analysis", payload),
          fetchWarehouses(),
        ])

        if (active) {
          setNearestData(nearest)
          setShortageData(shortage)
          setAllWarehouses(warehouses ?? [])
          setLoading(false)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the emergency logistics service."
          )
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [location])

  const warehouseMarkers = useMemo<MarkerData[]>(() => {
    return allWarehouses.map((w) => ({
      id: w.warehouseId,
      name: w.warehouseName,
      sub: `${w.city}, ${w.state}`,
      lat: w.latitude,
      lon: w.longitude,
      type: "warehouse",
    }))
  }, [allWarehouses])

  const nearestCoord = useMemo(() => {
    if (!nearestData?.nearest_warehouse) return null
    return {
      lat: nearestData.nearest_warehouse.latitude,
      lon: nearestData.nearest_warehouse.longitude,
      name: nearestData.nearest_warehouse.warehouse_name,
    }
  }, [nearestData])

  return (
    <div className="space-y-6">
      <header className="border-b border-border/60 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("Relief Operations")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          National 15-hub relief supply grid, great-circle routing, inventory balances, and supply deficit calculation.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="size-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* 3D Logistics Grid */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-[#080f1d] shadow-2xl">
        <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-border/70 bg-background/80 px-3 py-1.5 backdrop-blur-md text-xs">
          <span className="text-muted-foreground">National Network · </span>
          <span className="font-semibold text-foreground">15 Hubs Indexed</span>
        </div>

        <div className="h-[320px] sm:h-[400px] w-full">
          <ReliefGlobe
            markers={warehouseMarkers}
            activeCoord={{ lat: location.latitude, lon: location.longitude }}
            nearestWarehouseCoord={nearestCoord}
            autoRotate={true}
          />
        </div>
      </section>

      {/* Logistics & Shortage breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nearest Warehouse & Distance Rank */}
        <section className="rounded-2xl border border-border bg-card/60 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Nearest Dispatch Warehouses</h2>
              <p className="text-xs text-muted-foreground">Ranked by great-circle distance from active target</p>
            </div>
            <WarehouseIcon className="size-5 text-primary" />
          </div>

          <div className="space-y-2.5">
            {nearestData?.ranked_warehouses?.map((w, i) => (
              <div
                key={w.warehouse_id}
                className={cn(
                  "flex items-center justify-between rounded-xl p-3 border transition-colors",
                  i === 0
                    ? "border-primary/40 bg-primary/10 shadow-sm"
                    : "border-border/50 bg-background/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex size-8 items-center justify-center rounded-lg font-bold text-xs",
                    i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-xs text-foreground">{w.warehouse_name}</p>
                    <p className="text-[10px] text-muted-foreground">{w.city}, {w.state} ({w.warehouse_id})</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-bold text-foreground">{w.distance_km} km</p>
                  {i === 0 && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Primary Hub</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Shortage & Deficit Breakdown */}
        <section className="rounded-2xl border border-border bg-card/60 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Supply Deficit Assessment</h2>
              <p className="text-xs text-muted-foreground">{location.relief_days}-day relief requirements vs hub stock</p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold uppercase",
                shortageData?.shortage_analysis.total_shortage_units === 0
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              )}
            >
              {shortageData?.shortage_analysis.overall_status ?? t("Partially Available")}
            </span>
          </div>

          <div className="space-y-3">
            {[
              {
                label: t("Food Packets"),
                req: shortageData?.required_resources.food_packets ?? 0,
                avail: shortageData?.available_resources.food_packets ?? 0,
                short: shortageData?.shortage_analysis.shortage.food_packets ?? 0,
              },
              {
                label: t("Water Bottles"),
                req: shortageData?.required_resources.water_bottles ?? 0,
                avail: shortageData?.available_resources.water_bottles ?? 0,
                short: shortageData?.shortage_analysis.shortage.water_bottles ?? 0,
              },
              {
                label: t("Medical Kits"),
                req: shortageData?.required_resources.medkits ?? 0,
                avail: shortageData?.available_resources.medkits ?? 0,
                short: shortageData?.shortage_analysis.shortage.medkits ?? 0,
              },
              {
                label: t("Blankets"),
                req: shortageData?.required_resources.blankets ?? 0,
                avail: shortageData?.available_resources.blankets ?? 0,
                short: shortageData?.shortage_analysis.shortage.blankets ?? 0,
              },
            ].map((res) => (
              <div key={res.label} className="rounded-xl bg-background/50 border border-border/50 p-3 text-xs">
                <div className="flex items-center justify-between mb-1.5 font-semibold">
                  <span>{res.label}</span>
                  <span className={cn(res.short > 0 ? "text-destructive" : "text-emerald-400")}>
                    {res.short > 0 ? `Shortage: -${res.short.toLocaleString()}` : "Fully Covered"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                  <span>Required: {res.req.toLocaleString()}</span>
                  <span>Stock: {res.avail.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

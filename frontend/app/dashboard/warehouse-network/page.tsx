"use client"

import { useState } from "react"
import useSWR from "swr"
import { Warehouse as WarehouseIcon, MapPin } from "lucide-react"
import { getFeature } from "@/lib/features"
import { fetchWarehouses } from "@/lib/api-client"
import { useAppLocation } from "@/components/app-provider"
import { ReliefGlobe } from "@/components/three/relief-globe"
import { RESOURCE_META } from "@/components/dashboard/resource-cards"
import {
  FeatureHeader,
  ErrorState,
  fmt,
} from "@/components/dashboard/feature-shell"
import type { Warehouse } from "@/lib/types"

export default function WarehouseNetworkPage() {
  const feature = getFeature("warehouse-network")!
  const { location } = useAppLocation()
  const { data, error } = useSWR<Warehouse[]>("warehouses", fetchWarehouses, {
    revalidateOnFocus: false,
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const warehouses = data ?? []
  const selected =
    warehouses.find((w) => w.warehouseId === selectedId) ?? warehouses[0]

  const markers = warehouses.map((w) => ({
    id: w.warehouseId,
    name: w.warehouseName,
    sub: w.city,
    lat: w.latitude,
    lon: w.longitude,
  }))

  return (
    <div>
      <FeatureHeader feature={feature} location={location} />
      {error ? (
        <ErrorState message={String(error)} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-border bg-[#0b1220]">
            <ReliefGlobe
              markers={markers}
              activeCoord={{ lat: location.latitude, lon: location.longitude }}
              activeId={selected?.warehouseId ?? null}
              onSelect={(m: any) => setSelectedId(typeof m === "string" ? m : m?.id ?? null)}
              autoRotate={false}
            />
            <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-border bg-background/70 px-3 py-1.5 text-xs backdrop-blur">
              Click a marker to inspect · drag to rotate
            </div>
          </div>

          <div className="space-y-4">
            {selected && (
              <div className="rounded-2xl border border-primary/40 bg-card/60 p-5 glow-primary">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10">
                    <WarehouseIcon className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      {selected.warehouseName}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {selected.city}, {selected.state}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {RESOURCE_META.map((m) => (
                    <div
                      key={m.key}
                      className="rounded-lg border border-border bg-background/40 p-3"
                    >
                      <div className="flex items-center gap-1.5">
                        <m.icon className="size-3.5" style={{ color: m.color }} />
                        <span className="text-[11px] text-muted-foreground">
                          {m.label}
                        </span>
                      </div>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {fmt(selected[warehouseKey(m.key)] as number)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card/60 p-4">
              <h3 className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                All Warehouses · {warehouses.length}
              </h3>
              <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
                {warehouses.map((w) => {
                  const active = w.warehouseId === selected?.warehouseId
                  return (
                    <li key={w.warehouseId}>
                      <button
                        onClick={() => setSelectedId(w.warehouseId)}
                        className={
                          "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition " +
                          (active
                            ? "border-primary/50 bg-primary/10"
                            : "border-border bg-background/40 hover:border-primary/30")
                        }
                      >
                        <span
                          className={
                            "size-2 rounded-full " +
                            (active ? "bg-primary" : "bg-muted-foreground/50")
                          }
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {w.warehouseName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {w.city}, {w.state}
                          </p>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function warehouseKey(
  key: "food_packets" | "water_bottles" | "medkits" | "blankets",
): keyof Warehouse {
  const map = {
    food_packets: "foodPackets",
    water_bottles: "waterBottles",
    medkits: "medkits",
    blankets: "blankets",
  } as const
  return map[key]
}

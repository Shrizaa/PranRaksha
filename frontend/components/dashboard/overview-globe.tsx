"use client"

import useSWR from "swr"
import { fetchWarehouses } from "@/lib/api-client"
import { useAppLocation } from "@/components/app-provider"
import { ReliefGlobe } from "@/components/three/relief-globe"
import type { Warehouse } from "@/lib/types"

export function OverviewGlobe() {
  const { location } = useAppLocation()
  const { data: warehouses } = useSWR<Warehouse[]>(
    "warehouses",
    fetchWarehouses,
    { revalidateOnFocus: false },
  )

  const markers = (warehouses ?? []).map((w) => ({
    id: w.warehouseId,
    name: w.warehouseName,
    sub: w.city,
    lat: w.latitude,
    lon: w.longitude,
  }))

  return (
    <ReliefGlobe
      markers={markers}
      activeCoord={{ lat: location.latitude, lon: location.longitude }}
      autoRotate
    />
  )
}

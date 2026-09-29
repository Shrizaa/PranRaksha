import { NextResponse } from "next/server"
import { parseLocation, requireUser, unauthorized } from "@/lib/api-helpers"
import { rankWarehouses } from "@/lib/disaster-engine"

export async function POST(req: Request) {
  if (!requireUser(req)) return unauthorized()
  const loc = await parseLocation(req)
  if (!loc) return NextResponse.json({ detail: "Invalid input" }, { status: 400 })

  const ranked = rankWarehouses(loc.latitude, loc.longitude)
  const nearest = ranked[0]

  return NextResponse.json({
    location: { latitude: loc.latitude, longitude: loc.longitude },
    nearest_warehouse: {
      warehouse_id: nearest.warehouseId,
      warehouse_name: nearest.warehouseName,
      state: nearest.state,
      city: nearest.city,
      latitude: nearest.latitude,
      longitude: nearest.longitude,
      distance_km: nearest.distance_km,
    },
    ranked_warehouses: ranked.slice(0, 5).map((w) => ({
      warehouse_id: w.warehouseId,
      warehouse_name: w.warehouseName,
      city: w.city,
      state: w.state,
      distance_km: w.distance_km,
    })),
  })
}

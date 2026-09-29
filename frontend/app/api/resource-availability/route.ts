import { NextResponse } from "next/server"
import { parseLocation, requireUser, unauthorized } from "@/lib/api-helpers"
import {
  calculateResourceRequirements,
  getNearestDisaster,
  getNearestWarehouse,
  getResourceAvailability,
} from "@/lib/disaster-engine"

export async function POST(req: Request) {
  if (!requireUser(req)) return unauthorized()
  const loc = await parseLocation(req)
  if (!loc) return NextResponse.json({ detail: "Invalid input" }, { status: 400 })

  const disaster = getNearestDisaster(loc.latitude, loc.longitude)
  const warehouse = getNearestWarehouse(loc.latitude, loc.longitude)
  const population = Math.round(disaster.population)
  const required = calculateResourceRequirements(population, loc.relief_days)
  const available = getResourceAvailability(warehouse)

  return NextResponse.json({
    affected_population: population,
    relief_days: loc.relief_days,
    warehouse_id: warehouse.warehouseId,
    warehouse_name: warehouse.warehouseName,
    required_resources: required,
    available_resources: available,
  })
}

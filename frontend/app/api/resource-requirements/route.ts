import { NextResponse } from "next/server"
import { parseLocation, requireUser, unauthorized } from "@/lib/api-helpers"
import {
  calculateResourceRequirements,
  getNearestDisaster,
} from "@/lib/disaster-engine"

export async function POST(req: Request) {
  if (!requireUser(req)) return unauthorized()
  const loc = await parseLocation(req)
  if (!loc) return NextResponse.json({ detail: "Invalid input" }, { status: 400 })

  const disaster = getNearestDisaster(loc.latitude, loc.longitude)
  const population = Math.round(disaster.population)
  const resources = calculateResourceRequirements(population, loc.relief_days)

  return NextResponse.json({
    location: { latitude: loc.latitude, longitude: loc.longitude },
    affected_population: population,
    relief_days: loc.relief_days,
    resource_requirements: resources,
  })
}

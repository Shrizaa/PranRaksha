import { NextResponse } from "next/server"
import { parseLocation, requireUser, unauthorized } from "@/lib/api-helpers"
import { calculateRiskScore, getNearestDisaster } from "@/lib/disaster-engine"

export async function POST(req: Request) {
  if (!requireUser(req)) return unauthorized()
  const loc = await parseLocation(req)
  if (!loc) return NextResponse.json({ detail: "Invalid input" }, { status: 400 })

  const disaster = getNearestDisaster(loc.latitude, loc.longitude)
  const risk = calculateRiskScore(disaster)

  return NextResponse.json({
    location: { latitude: loc.latitude, longitude: loc.longitude },
    nearest_event: {
      station: disaster.station,
      state: disaster.state,
      latitude: disaster.latitude,
      longitude: disaster.longitude,
      river: disaster.river,
      basin: disaster.basin,
      flood_type: disaster.floodType,
      start_date: disaster.startDate,
      peak_flood_level: disaster.peakFloodLevel,
      warning_level: disaster.warningLevel,
      danger_level: disaster.dangerLevel,
      rainfall_mm: disaster.rainfall,
      wind_speed_kmh: disaster.windSpeed,
      humidity_percent: disaster.humidity,
      temperature_c: disaster.temperature,
      distance_km: Math.round(
        ((disaster.latitude - loc.latitude) ** 2 +
          (disaster.longitude - loc.longitude) ** 2) **
          0.5 *
          111 *
          100,
      ) / 100,
    },
    risk_assessment: risk,
  })
}

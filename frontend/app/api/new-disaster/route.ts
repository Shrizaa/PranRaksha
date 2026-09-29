import { NextResponse } from "next/server"
import { requireUser, unauthorized } from "@/lib/api-helpers"
import { STATS, calculateResourceRequirements, rankWarehouses } from "@/lib/disaster-engine"

function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 50
  const score = ((value - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, score))
}

export async function POST(req: Request) {
  if (!requireUser(req)) return unauthorized()

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 })
  }

  const num = (k: string, fallback: number) => {
    const v = Number(body[k])
    return Number.isFinite(v) ? v : fallback
  }

  const rainfall = num("rainfall", 0)
  const windSpeed = num("wind_speed", 0)
  const humidity = num("humidity", 50)
  const population = num("population", 50000)
  const roadDensity = num("road_density", 40)
  const roadConnectivity = num("road_connectivity", 50)
  const highwayDistance = num("highway_distance", 20)
  const accessibilityRaw = num("accessibility_score", 0)
  const reliefDays = Math.max(1, Math.round(num("relief_days", 5)))
  const latitude = num("latitude", 20.59)
  const longitude = num("longitude", 78.96)

  // ── Weather score ──────────────────────────────────────────────────────────
  const rainfallScore = normalizeScore(rainfall, ...STATS.rainfall)
  const windScore = normalizeScore(windSpeed, ...STATS.windSpeed)
  const humidityScore = normalizeScore(humidity, ...STATS.humidity)
  const weatherScore = 0.5 * rainfallScore + 0.3 * windScore + 0.2 * humidityScore

  // ── Population / vulnerability ────────────────────────────────────────────
  const populationScore = normalizeScore(population, ...STATS.population)
  const vulnerabilityScore = populationScore

  // ── Accessibility (never 0) ────────────────────────────────────────────────
  let accessibilityScore =
    accessibilityRaw > 0
      ? normalizeScore(accessibilityRaw, ...STATS.accessibilityScore)
      : 0

  if (accessibilityScore <= 0.01) {
    const hwScore = highwayDistance > 0 ? Math.max(15, 100 - Math.min(100, highwayDistance)) : 35
    const rdScore = roadDensity > 0 ? Math.min(100, roadDensity) : 25
    const connScore = roadConnectivity > 0 ? roadConnectivity : 25
    accessibilityScore = Math.max(18.0, Math.min(85.0, 0.4 * hwScore + 0.3 * rdScore + 0.3 * connScore))
  }
  if (accessibilityScore < 15.0) accessibilityScore = 18.5

  // ── Composite risk ─────────────────────────────────────────────────────────
  let risk =
    0.4 * weatherScore +
    0.25 * populationScore +
    0.25 * vulnerabilityScore +
    0.1 * accessibilityScore
  risk = Math.round(Math.max(0, Math.min(100, risk)) * 100) / 100

  let risk_level: string
  let response_priority: string
  if (risk >= 75) { risk_level = "Critical"; response_priority = "P1" }
  else if (risk >= 50) { risk_level = "High"; response_priority = "P2" }
  else if (risk >= 25) { risk_level = "Moderate"; response_priority = "P3" }
  else { risk_level = "Low"; response_priority = "P4" }

  const r2 = (n: number) => Math.round(n * 100) / 100

  // ── Resource requirements ──────────────────────────────────────────────────
  const resources = calculateResourceRequirements(Math.round(population), reliefDays)

  // ── Nearest warehouses ─────────────────────────────────────────────────────
  const ranked = rankWarehouses(latitude, longitude)
  const nearest = ranked[0]

  return NextResponse.json({
    risk_assessment: {
      risk_score: risk,
      risk_level,
      response_priority,
      weather_score: r2(weatherScore),
      population_score: r2(populationScore),
      vulnerability_score: r2(vulnerabilityScore),
      accessibility_score: r2(accessibilityScore),
    },
    resource_requirements: {
      affected_population: Math.round(population),
      relief_days: reliefDays,
      food_packets: resources.food_packets,
      water_bottles: resources.water_bottles,
      medkits: resources.medkits,
      blankets: resources.blankets,
    },
    nearest_warehouse: {
      warehouse_id: nearest.warehouseId,
      warehouse_name: nearest.warehouseName,
      city: nearest.city,
      state: nearest.state,
      distance_km: r2(nearest.distance_km),
      latitude: nearest.latitude,
      longitude: nearest.longitude,
      food_packets: nearest.foodPackets,
      water_bottles: nearest.waterBottles,
      medkits: nearest.medkits,
      blankets: nearest.blankets,
    },
    top_warehouses: ranked.slice(0, 3).map((w) => ({
      warehouse_id: w.warehouseId,
      warehouse_name: w.warehouseName,
      city: w.city,
      state: w.state,
      distance_km: r2(w.distance_km),
    })),
  })
}

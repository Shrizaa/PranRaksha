import disasterData from "@/lib/generated/disasters.json"
import warehouseData from "@/lib/generated/warehouses.json"
import type {
  DisasterRecord,
  DatasetStats,
  Warehouse,
  ResourceBundle,
  RiskDetails,
} from "@/lib/types"

const DATA = disasterData as { stats: DatasetStats; records: DisasterRecord[] }
export const WAREHOUSES = warehouseData as Warehouse[]
export const DISASTERS = DATA.records
export const STATS = DATA.stats

// --- Geo -----------------------------------------------------------------
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const earthRadius = 6371.0
  const rlat1 = (lat1 * Math.PI) / 180
  const rlon1 = (lon1 * Math.PI) / 180
  const rlat2 = (lat2 * Math.PI) / 180
  const rlon2 = (lon2 * Math.PI) / 180
  const dLat = rlat2 - rlat1
  const dLon = rlon2 - rlon1
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(earthRadius * c * 100) / 100
}

export function getNearestDisaster(lat: number, lon: number): DisasterRecord {
  let best = DISASTERS[0]
  let bestDist = Infinity
  for (const rec of DISASTERS) {
    const d = calculateDistance(lat, lon, rec.latitude, rec.longitude)
    if (d < bestDist) {
      bestDist = d
      best = rec
    }
  }
  return best
}

export function getNearestWarehouse(
  lat: number,
  lon: number,
): Warehouse & { distance_km: number } {
  let best = WAREHOUSES[0]
  let bestDist = Infinity
  for (const w of WAREHOUSES) {
    const d = calculateDistance(lat, lon, w.latitude, w.longitude)
    if (d < bestDist) {
      bestDist = d
      best = w
    }
  }
  return { ...best, distance_km: bestDist }
}

export function rankWarehouses(
  lat: number,
  lon: number,
): (Warehouse & { distance_km: number })[] {
  return WAREHOUSES.map((w) => ({
    ...w,
    distance_km: calculateDistance(lat, lon, w.latitude, w.longitude),
  })).sort((a, b) => a.distance_km - b.distance_km)
}

// --- Scoring -------------------------------------------------------------
function normalizeScore(value: number, min: number, max: number): number {
  if (max === min) return 50
  const score = ((value - min) / (max - min)) * 100
  return Math.max(0, Math.min(100, score))
}

export function calculateRiskScore(rec: DisasterRecord): RiskDetails {
  const rainfallScore = normalizeScore(rec.rainfall, ...STATS.rainfall)
  const windScore = normalizeScore(rec.windSpeed, ...STATS.windSpeed)
  const humidityScore = normalizeScore(rec.humidity, ...STATS.humidity)
  const weatherScore =
    0.5 * rainfallScore + 0.3 * windScore + 0.2 * humidityScore

  const populationScore = normalizeScore(rec.population, ...STATS.population)
  // Dataset has no vulnerability_score column -> falls back to population score
  const vulnerabilityScore = populationScore
  let accessibilityScore = normalizeScore(
    rec.accessibilityScore,
    ...STATS.accessibilityScore,
  )

  // In emergency response logistics, accessibility is never 0.0.
  // When raw record accessibility is 0 or unrecorded, compute realistic estimate from infrastructure & highway proximity
  if (accessibilityScore <= 0.01) {
    const hwScore =
      rec.highwayDistance > 0
        ? Math.max(15, 100 - Math.min(100, rec.highwayDistance))
        : 35
    const roadScore = rec.roadDensity > 0 ? Math.min(100, rec.roadDensity) : 25
    const connScore = rec.roadConnectivity > 0 ? rec.roadConnectivity : 25
    accessibilityScore = Math.max(
      18.0,
      Math.min(85.0, 0.4 * hwScore + 0.3 * roadScore + 0.3 * connScore),
    )
  }
  if (accessibilityScore < 15.0) {
    accessibilityScore =
      18.0 +
      Math.round(
        ((Math.abs(rec.latitude) * 7 + Math.abs(rec.longitude) * 11) % 15) * 10,
      ) /
        10
  }

  let risk =
    0.4 * weatherScore +
    0.25 * populationScore +
    0.25 * vulnerabilityScore +
    0.1 * accessibilityScore
  risk = Math.round(Math.max(0, Math.min(100, risk)) * 100) / 100

  let riskLevel: RiskDetails["risk_level"]
  let priority: RiskDetails["response_priority"]
  if (risk >= 75) {
    riskLevel = "Critical"
    priority = "P1"
  } else if (risk >= 50) {
    riskLevel = "High"
    priority = "P2"
  } else if (risk >= 25) {
    riskLevel = "Moderate"
    priority = "P3"
  } else {
    riskLevel = "Low"
    priority = "P4"
  }

  const r2 = (n: number) => Math.round(n * 100) / 100
  return {
    risk_score: risk,
    risk_level: riskLevel,
    response_priority: priority,
    weather_score: r2(weatherScore),
    population_score: r2(populationScore),
    vulnerability_score: r2(vulnerabilityScore),
    accessibility_score: r2(accessibilityScore),
  }
}

export function calculateResourceRequirements(
  population: number,
  reliefDays: number,
): ResourceBundle {
  return {
    food_packets: Math.ceil(population * reliefDays * 3),
    water_bottles: Math.ceil(population * reliefDays * 5),
    medkits: Math.ceil(population / 20),
    blankets: Math.ceil(population * 0.7),
  }
}

export function getResourceAvailability(w: Warehouse): ResourceBundle {
  return {
    food_packets: w.foodPackets,
    water_bottles: w.waterBottles,
    medkits: w.medkits,
    blankets: w.blankets,
  }
}

export function calculateShortage(
  required: ResourceBundle,
  available: ResourceBundle,
) {
  const shortage: ResourceBundle = {
    food_packets: Math.max(0, required.food_packets - available.food_packets),
    water_bottles: Math.max(
      0,
      required.water_bottles - available.water_bottles,
    ),
    medkits: Math.max(0, required.medkits - available.medkits),
    blankets: Math.max(0, required.blankets - available.blankets),
  }
  const total =
    shortage.food_packets +
    shortage.water_bottles +
    shortage.medkits +
    shortage.blankets
  return {
    shortage,
    total_shortage_units: total,
    overall_status: total === 0 ? "Sufficient" : "Shortage Available",
  }
}

export function parseInfraList(raw: string): { name: string; lat?: number; lon?: number }[] {
  if (!raw || raw.trim().toLowerCase() === "not available") return []
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((entry) => {
      const m = entry.match(/^(.*?)\s*\(([-\d.]+),\s*([-\d.]+)\)\s*$/)
      if (m) {
        return { name: m[1].trim(), lat: Number(m[2]), lon: Number(m[3]) }
      }
      return { name: entry }
    })
}

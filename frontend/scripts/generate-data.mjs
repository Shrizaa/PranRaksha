import { read, utils } from "xlsx"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"

// --- Parse the INDOFLOODS disaster dataset -------------------------------
const buf = readFileSync("data/Final_INDOFLOODS_dataset-7dc55a.xlsx")
const wb = read(buf, { cellDates: false })
const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

const num = (v) => {
  if (v === null || v === undefined || v === "") return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

const records = rows.map((r) => ({
  eventId: String(r["EventID"] ?? ""),
  startDate: String(r["Start Date"] ?? ""),
  floodType: String(r["Flood Type"] ?? ""),
  latitude: num(r["Latitude"]),
  longitude: num(r["Longitude"]),
  station: String(r["Station"] ?? ""),
  state: String(r["State"] ?? ""),
  river: String(r["River Name/ Tributory/ SubTributory"] ?? ""),
  basin: String(r["Basin"] ?? ""),
  peakFloodLevel: num(r["Peak Flood Level (m)"]),
  warningLevel: num(r["Warning Level"]),
  dangerLevel: num(r["Danger Level"]),
  eventDuration: num(r["Event Duration (days)"]),
  rainfall: num(r["Rainfall_mm"]),
  temperature: num(r["Temperature_C"]),
  humidity: num(r["Humidity_percent"]),
  windSpeed: num(r["WindSpeed_kmh"]),
  roadDensity: num(r["road_density"]),
  roadConnectivity: num(r["road_connectivity"]),
  highwayDistance: num(r["highway_distance"]),
  accessibilityScore: num(r["accessibility_score"]),
  hospitalCount: num(r["hospital_count_5km"]),
  hospitalsList: String(r["hospitals_within_5km"] ?? "Not available"),
  schoolCount: num(r["school_count_5km"]),
  schoolsList: String(r["schools_within_5km"] ?? "Not available"),
  reliefShelterCount: num(r["relief_shelter_count_5km"]),
  reliefSheltersList: String(r["relief_shelters_within_5km"] ?? "Not available"),
  population: num(r["population_within_5km"]),
}))

// Precompute column min/max for normalization (matches backend logic)
function minMax(key) {
  let min = Infinity
  let max = -Infinity
  for (const rec of records) {
    const v = rec[key]
    if (v < min) min = v
    if (v > max) max = v
  }
  return [min, max]
}

const stats = {
  rainfall: minMax("rainfall"),
  windSpeed: minMax("windSpeed"),
  humidity: minMax("humidity"),
  population: minMax("population"),
  accessibilityScore: minMax("accessibilityScore"),
}

mkdirSync("lib/generated", { recursive: true })
writeFileSync("lib/generated/disasters.json", JSON.stringify({ stats, records }))
console.log(`Wrote ${records.length} disaster records. Stats:`, stats)

// --- Warehouse inventory -------------------------------------------------
const csv = readFileSync("data/warehouse_inventory.csv", "utf8").trim()
const [header, ...lines] = csv.split(/\r?\n/)
const cols = header.split(",")
const warehouses = lines.map((line) => {
  const parts = line.split(",")
  const o = {}
  cols.forEach((c, i) => (o[c] = parts[i]))
  return {
    warehouseId: o.warehouse_id,
    warehouseName: o.warehouse_name,
    state: o.state,
    city: o.city,
    latitude: Number(o.latitude),
    longitude: Number(o.longitude),
    foodPackets: Number(o.food_packets),
    waterBottles: Number(o.water_bottles),
    medkits: Number(o.medkits),
    blankets: Number(o.blankets),
  }
})
writeFileSync("lib/generated/warehouses.json", JSON.stringify(warehouses))
console.log(`Wrote ${warehouses.length} warehouses.`)

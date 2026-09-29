export interface DisasterRecord {
  eventId: string
  startDate: string
  floodType: string
  latitude: number
  longitude: number
  station: string
  state: string
  river: string
  basin: string
  peakFloodLevel: number
  warningLevel: number
  dangerLevel: number
  eventDuration: number
  rainfall: number
  temperature: number
  humidity: number
  windSpeed: number
  roadDensity: number
  roadConnectivity: number
  highwayDistance: number
  accessibilityScore: number
  hospitalCount: number
  hospitalsList: string
  schoolCount: number
  schoolsList: string
  reliefShelterCount: number
  reliefSheltersList: string
  population: number
}

export interface DatasetStats {
  rainfall: [number, number]
  windSpeed: [number, number]
  humidity: [number, number]
  population: [number, number]
  accessibilityScore: [number, number]
}

export interface Warehouse {
  warehouseId: string
  warehouseName: string
  state: string
  city: string
  latitude: number
  longitude: number
  foodPackets: number
  waterBottles: number
  medkits: number
  blankets: number
}

export interface ResourceBundle {
  food_packets: number
  water_bottles: number
  medkits: number
  blankets: number
}

export interface RiskDetails {
  risk_score: number
  risk_level: "Critical" | "High" | "Moderate" | "Low"
  response_priority: "P1" | "P2" | "P3" | "P4"
  weather_score: number
  population_score: number
  vulnerability_score: number
  accessibility_score: number
}

export interface LocationInput {
  latitude: number
  longitude: number
  relief_days: number
}

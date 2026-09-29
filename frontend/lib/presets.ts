export interface PresetLocation {
  name: string
  state: string
  latitude: number
  longitude: number
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  { name: "Guwahati", state: "Assam", latitude: 26.1445, longitude: 91.7362 },
  { name: "Patna", state: "Bihar", latitude: 25.5941, longitude: 85.1376 },
  { name: "Kolkata", state: "West Bengal", latitude: 22.5726, longitude: 88.3639 },
  { name: "Bhubaneswar", state: "Odisha", latitude: 20.2961, longitude: 85.8245 },
  { name: "Chennai", state: "Tamil Nadu", latitude: 13.0827, longitude: 80.2707 },
  { name: "Mumbai", state: "Maharashtra", latitude: 19.076, longitude: 72.8777 },
  { name: "Kochi", state: "Kerala", latitude: 9.9312, longitude: 76.2673 },
  { name: "Lucknow", state: "Uttar Pradesh", latitude: 26.8467, longitude: 80.9462 },
  { name: "Vijayawada", state: "Andhra Pradesh", latitude: 16.5062, longitude: 80.648 },
  { name: "Siliguri", state: "West Bengal", latitude: 26.7271, longitude: 88.3953 },
]

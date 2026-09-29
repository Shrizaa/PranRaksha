"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertOctagon,
  MapPin,
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  Users,
  Route,
  Building2,
  ShieldAlert,
  Loader2,
  BedDouble,
  ChevronRight,
  Navigation,
  Info,
} from "lucide-react"
import { getToken } from "@/lib/api-client"
import { useAppLocation } from "@/components/app-provider"

const FLOOD_TYPES = [
  "Flood",
  "Severe Flood",
  "Flash Flood",
  "Coastal Flood",
  "Urban Flood",
  "River Flood",
  "Glacial Flood",
  "Other",
]

export interface DisasterEntry {
  id: string
  timestamp: string
  label: string
  state: string
  flood_type: string
  latitude: number
  longitude: number
  rainfall: number
  wind_speed: number
  humidity: number
  temperature: number
  population: number
  road_density: number
  road_connectivity: number
  highway_distance: number
  accessibility_score: number
  relief_days: number
  result: {
    risk_score: number
    risk_level: string
    weather_score: number
    population_score: number
    vulnerability_score: number
    accessibility_score: number
  }
  resources?: {
    affected_population: number
    relief_days: number
    food_packets: number
    water_bottles: number
    medkits: number
    blankets: number
  }
  warehouse?: {
    warehouse_id: string
    warehouse_name: string
    city: string
    state: string
    distance_km: number
    latitude: number
    longitude: number
    food_packets: number
    water_bottles: number
    medkits: number
    blankets: number
  }
}

const HISTORY_KEY = "pranraksha_disaster_inputs"
export const LATEST_KEY = "pranraksha_latest_disaster"

export function saveDisasterEntry(entry: DisasterEntry) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const existing: DisasterEntry[] = raw ? JSON.parse(raw) : []
    existing.unshift(entry)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.slice(0, 50)))
  } catch { /* ignore */ }
}

function defaultForm() {
  return {
    label: "",
    state: "",
    district: "",
    flood_type: "Flood",
    latitude: "",
    longitude: "",
    rainfall: "",
    wind_speed: "",
    humidity: "",
    temperature: "",
    population: "",
    road_density: "",
    road_connectivity: "",
    highway_distance: "",
    accessibility_score: "",
    relief_days: "5",
  }
}

const INPUT_CLASS =
  "w-full rounded-xl border border-white/15 bg-slate-900/80 px-3 py-2.5 text-sm font-semibold text-slate-100 placeholder:text-slate-600 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/30 transition"

function Section({ icon, title, badge, children }: {
  icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        {icon}
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">{title}</h3>
        {badge && <span className="ml-auto text-[11px] text-slate-400 font-mono">{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function FormField({ label, icon, hint, children }: {
  label: string; icon?: React.ReactNode; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
        {icon}{label}<span className="text-red-400">*</span>
      </label>
      {hint && <p className="text-[11px] text-slate-500 leading-tight">{hint}</p>}
      {children}
    </div>
  )
}

export default function NewDisasterPage() {
  const router = useRouter()
  const { setLocation } = useAppLocation()
  const [form, setForm] = useState(defaultForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const token = getToken()
      const lat = Number(form.latitude)
      const lon = Number(form.longitude)
      const reliefDays = Number(form.relief_days) || 5

      const res = await fetch("/api/new-disaster", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          rainfall: Number(form.rainfall),
          wind_speed: Number(form.wind_speed),
          humidity: Number(form.humidity),
          temperature: Number(form.temperature),
          population: Number(form.population),
          road_density: Number(form.road_density) || 40,
          road_connectivity: Number(form.road_connectivity) || 50,
          highway_distance: Number(form.highway_distance) || 20,
          accessibility_score: Number(form.accessibility_score) || 0,
          relief_days: reliefDays,
          latitude: lat,
          longitude: lon,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? "Assessment failed")

      // Build history entry
      const entry: DisasterEntry = {
        id: `DIS-${Date.now()}`,
        timestamp: new Date().toISOString(),
        label: form.label || `${form.flood_type} — ${form.state || "Unknown"}`,
        state: form.state,
        flood_type: form.flood_type,
        latitude: lat,
        longitude: lon,
        rainfall: Number(form.rainfall),
        wind_speed: Number(form.wind_speed),
        humidity: Number(form.humidity),
        temperature: Number(form.temperature),
        population: Number(form.population),
        road_density: Number(form.road_density) || 40,
        road_connectivity: Number(form.road_connectivity) || 50,
        highway_distance: Number(form.highway_distance) || 20,
        accessibility_score: Number(form.accessibility_score) || 0,
        relief_days: reliefDays,
        result: data.risk_assessment,
        resources: data.resource_requirements,
        warehouse: data.nearest_warehouse,
      }

      // Save to history
      saveDisasterEntry(entry)

      // Store as latest so dashboard can display it
      try { localStorage.setItem(LATEST_KEY, JSON.stringify(entry)) } catch { /* ignore */ }

      // Update global app location to the submitted disaster coordinates
      setLocation({
        latitude: lat,
        longitude: lon,
        relief_days: reliefDays,
        label: entry.label,
      })

      // Navigate to dashboard — results will be shown there
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/20">
            <AlertOctagon className="size-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-foreground">
              Report New Disaster
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit telemetry → AI runs full assessment → Dashboard shows risk, resources &amp; warehouse
            </p>
          </div>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => router.push("/dashboard/disaster-history")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition"
          >
            <ChevronRight className="size-3.5" /> My Reported Disasters
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-300">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* A. Identification */}
        <Section icon={<MapPin className="size-4 text-sky-400" />} title="Disaster Identification & Location">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Disaster Label / Name" icon={<AlertOctagon className="size-3.5 text-red-400" />} hint="Short descriptive name for this report">
              <input type="text" placeholder="e.g. Brahmaputra Flash Flood 2026" value={form.label} onChange={e => handleChange("label", e.target.value)} className={INPUT_CLASS} required />
            </FormField>

            <FormField label="Flood Type" icon={<Info className="size-3.5 text-sky-400" />}>
              <select value={form.flood_type} onChange={e => handleChange("flood_type", e.target.value)} className={INPUT_CLASS} required>
                {FLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </FormField>

            <FormField label="State / Region" icon={<MapPin className="size-3.5 text-sky-400" />} hint="e.g. Odisha, Assam, Bihar">
              <input type="text" placeholder="e.g. Odisha" value={form.state} onChange={e => handleChange("state", e.target.value)} className={INPUT_CLASS} required />
            </FormField>

            <FormField label="Latitude" icon={<Navigation className="size-3.5 text-emerald-400" />} hint="Used for warehouse &amp; infrastructure lookup">
              <input type="number" step="0.0001" min="-90" max="90" placeholder="20.2961" value={form.latitude} onChange={e => handleChange("latitude", e.target.value)} className={INPUT_CLASS} required />
            </FormField>

            <FormField label="Longitude" icon={<Navigation className="size-3.5 text-emerald-400" />} hint="Used for warehouse &amp; infrastructure lookup">
              <input type="number" step="0.0001" min="-180" max="180" placeholder="85.8245" value={form.longitude} onChange={e => handleChange("longitude", e.target.value)} className={INPUT_CLASS} required />
            </FormField>

            <FormField label="District / Area" icon={<Building2 className="size-3.5 text-sky-400" />} hint="Sub-district or area name">
              <input type="text" placeholder="e.g. Bhubaneswar, Lakhimpur" value={form.district} onChange={e => handleChange("district", e.target.value)} className={INPUT_CLASS} required />
            </FormField>
          </div>
        </Section>

        {/* B. Meteorological */}
        <Section icon={<CloudRain className="size-4 text-sky-400" />} title="Live Meteorological Sensor Data" badge="Weather Score → 40% weight">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Rainfall" icon={<CloudRain className="size-3.5 text-sky-400" />} hint="mm in last 24h">
              <div className="relative">
                <input type="number" min="0" max="500" step="0.1" placeholder="0.0" value={form.rainfall} onChange={e => handleChange("rainfall", e.target.value)} className={INPUT_CLASS + " pr-9"} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">mm</span>
              </div>
            </FormField>

            <FormField label="Wind Speed" icon={<Wind className="size-3.5 text-cyan-400" />} hint="km/h">
              <div className="relative">
                <input type="number" min="0" max="200" step="0.1" placeholder="0.0" value={form.wind_speed} onChange={e => handleChange("wind_speed", e.target.value)} className={INPUT_CLASS + " pr-14"} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">km/h</span>
              </div>
            </FormField>

            <FormField label="Humidity" icon={<Droplets className="size-3.5 text-blue-400" />} hint="Relative humidity %">
              <div className="relative">
                <input type="number" min="0" max="100" step="1" placeholder="50" value={form.humidity} onChange={e => handleChange("humidity", e.target.value)} className={INPUT_CLASS + " pr-8"} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">%</span>
              </div>
            </FormField>

            <FormField label="Temperature" icon={<Thermometer className="size-3.5 text-orange-400" />} hint="°C at disaster site">
              <div className="relative">
                <input type="number" min="-10" max="55" step="0.1" placeholder="25.0" value={form.temperature} onChange={e => handleChange("temperature", e.target.value)} className={INPUT_CLASS + " pr-8"} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">°C</span>
              </div>
            </FormField>
          </div>
        </Section>

        {/* C. Population & Infrastructure */}
        <Section icon={<Users className="size-4 text-purple-400" />} title="Population Exposure & Infrastructure" badge="Population 25% · Accessibility 10%">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Affected Population" icon={<Users className="size-3.5 text-purple-400" />} hint="Civilians within 5km of epicenter">
              <input type="number" min="1" step="100" placeholder="50000" value={form.population} onChange={e => handleChange("population", e.target.value)} className={INPUT_CLASS} required />
            </FormField>

            <FormField label="Road Density" icon={<Route className="size-3.5 text-yellow-400" />} hint="km of roads per 100km²">
              <div className="relative">
                <input type="number" min="0" max="100" step="0.1" placeholder="40.0" value={form.road_density} onChange={e => handleChange("road_density", e.target.value)} className={INPUT_CLASS + " pr-14"} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">km/100</span>
              </div>
            </FormField>

            <FormField label="Road Connectivity" icon={<Route className="size-3.5 text-yellow-400" />} hint="Network connectivity score (0–100)">
              <input type="number" min="0" max="100" step="1" placeholder="50" value={form.road_connectivity} onChange={e => handleChange("road_connectivity", e.target.value)} className={INPUT_CLASS} required />
            </FormField>

            <FormField label="Highway Distance" icon={<Route className="size-3.5 text-amber-400" />} hint="km to nearest national highway">
              <div className="relative">
                <input type="number" min="0" step="0.1" placeholder="20.0" value={form.highway_distance} onChange={e => handleChange("highway_distance", e.target.value)} className={INPUT_CLASS + " pr-8"} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">km</span>
              </div>
            </FormField>

            <FormField label="Accessibility Score" icon={<ShieldAlert className="size-3.5 text-emerald-400" />} hint="Composite access index (0–80). Enter 0 to auto-estimate.">
              <div className="relative">
                <input type="number" min="0" max="100" step="0.1" placeholder="0 = auto-estimate" value={form.accessibility_score} onChange={e => handleChange("accessibility_score", e.target.value)} className={INPUT_CLASS + " pr-12"} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">/ 100</span>
              </div>
            </FormField>

            <FormField label="Relief Window" icon={<BedDouble className="size-3.5 text-rose-400" />} hint="Days of relief operations to plan for">
              <div className="relative">
                <input type="number" min="1" max="30" step="1" placeholder="5" value={form.relief_days} onChange={e => handleChange("relief_days", e.target.value)} className={INPUT_CLASS + " pr-12"} required />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500">days</span>
              </div>
            </FormField>
          </div>
        </Section>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="text-red-300 font-semibold">All fields marked * are required.</span> After submission, the Dashboard will update to reflect your reported disaster — showing full risk, resource requirements, warehouse details, and infrastructure within 5km.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="flex shrink-0 items-center gap-2 px-7 py-3 rounded-xl text-sm font-black bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ShieldAlert className="size-4" />}
            {loading ? "Processing…" : "Submit & View Result on Dashboard →"}
          </button>
        </div>
      </form>
    </div>
  )
}

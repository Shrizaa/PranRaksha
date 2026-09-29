"use client"

import { useEffect, useState } from "react"
import {
  ShieldAlert,
  Hospital,
  School,
  Tent,
  Droplets,
  Wind,
  Thermometer,
  Layers,
  AlertTriangle,
  MapPin,
  Clock,
  Compass,
} from "lucide-react"
import { useAppLocation } from "@/components/app-provider"
import { useLanguage } from "@/lib/i18n/language-context"
import { callFeature } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface RiskDetailsResponse {
  location: { latitude: number; longitude: number }
  nearest_event?: {
    station: string
    state: string
    river: string
    basin: string
    flood_type: string
    start_date: string
    peak_flood_level: number
    warning_level: number
    danger_level: number
    rainfall_mm: number
    wind_speed_kmh: number
    humidity_percent: number
    temperature_c: number
    distance_km: number
  }
  risk_assessment: {
    risk_score: number
    risk_level: string
    response_priority: string
    weather_score: number
    population_score: number
    vulnerability_score: number
    accessibility_score: number
  }
}

interface InfraResponse {
  station: string
  state: string
  nearby_infrastructure: {
    relief_shelters: number
    hospitals: number
    schools: number
  }
  details?: {
    hospitals: string[]
    schools: string[]
    relief_shelters: string[]
  }
}

export default function DisasterAssessmentPage() {
  const { location } = useAppLocation()
  const { t } = useLanguage()
  const [riskData, setRiskData] = useState<RiskDetailsResponse | null>(null)
  const [infraData, setInfraData] = useState<InfraResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const payload = {
          latitude: location.latitude,
          longitude: location.longitude,
          relief_days: location.relief_days,
        }

        const [risk, infra] = await Promise.all([
          callFeature<RiskDetailsResponse>("risk-assessment", payload),
          callFeature<InfraResponse>("nearby-infrastructure", payload),
        ])

        if (active) {
          setRiskData(risk)
          setInfraData(infra)
          setLoading(false)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to the emergency response service."
          )
          setLoading(false)
        }
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [location])

  const risk = riskData?.risk_assessment
  const event = riskData?.nearest_event

  return (
    <div className="space-y-6">
      <header className="border-b border-border/60 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("Disaster Assessment")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Predictive flood risk scoring and immediate 5km infrastructure vulnerability mapping from INDOFLOODS gauge data.
        </p>
      </header>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="size-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Primary Assessment Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Risk Score
            </span>
            <ShieldAlert className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-extrabold font-mono text-foreground">
            {loading ? "--" : risk?.risk_score.toFixed(1)}
            <span className="text-xs text-muted-foreground font-normal ml-1">/ 100</span>
          </p>
          <span className="mt-2 inline-block rounded-full bg-primary/15 border border-primary/30 px-2.5 py-0.5 text-xs font-bold text-primary">
            {risk?.risk_level ?? "Evaluating"}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Weather Severity
            </span>
            <Droplets className="size-4 text-sky-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold font-mono text-foreground">
            {loading ? "--" : risk?.weather_score.toFixed(1)}
            <span className="text-xs text-muted-foreground font-normal ml-1">/ 100</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Rainfall: {event?.rainfall_mm ?? "--"} mm · Wind: {event?.wind_speed_kmh ?? "--"} km/h
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vulnerability Index
            </span>
            <Layers className="size-4 text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold font-mono text-foreground">
            {loading ? "--" : risk?.vulnerability_score.toFixed(1)}
            <span className="text-xs text-muted-foreground font-normal ml-1">/ 100</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Relative population density impact score
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Accessibility Index
            </span>
            <Compass className="size-4 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold font-mono text-foreground">
            {loading ? "--" : risk?.accessibility_score.toFixed(1)}
            <span className="text-xs text-muted-foreground font-normal ml-1">/ 100</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Road network and transport ingress rating
          </p>
        </div>
      </div>

      {/* Hydrological Details & Infrastructure Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nearest Monitored Event Station Details */}
        <section className="rounded-2xl border border-border bg-card/60 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">Hydrological Event Details</h2>
              <p className="text-xs text-muted-foreground">Nearest gauge station record in INDOFLOODS</p>
            </div>
            <span className="rounded-md bg-card px-2.5 py-1 text-xs font-mono text-primary border border-border">
              {event?.distance_km ?? "--"} km from target
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-background/50 p-3 border border-border/50">
              <span className="text-muted-foreground">Monitoring Station:</span>
              <p className="font-semibold text-foreground mt-0.5 text-sm">{event?.station ?? "--"}</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3 border border-border/50">
              <span className="text-muted-foreground">River Basin:</span>
              <p className="font-semibold text-foreground mt-0.5 text-sm">{event?.river ?? "--"} ({event?.basin ?? "--"})</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3 border border-border/50">
              <span className="text-muted-foreground">Warning Level:</span>
              <p className="font-semibold text-foreground font-mono mt-0.5">{event?.warning_level ?? "--"} m</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3 border border-border/50">
              <span className="text-muted-foreground">Danger Level:</span>
              <p className="font-semibold text-destructive font-mono mt-0.5">{event?.danger_level ?? "--"} m</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3 border border-border/50">
              <span className="text-muted-foreground">Peak Recorded Level:</span>
              <p className="font-semibold text-primary font-mono mt-0.5">{event?.peak_flood_level ?? "--"} m</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3 border border-border/50">
              <span className="text-muted-foreground">Flood Classification:</span>
              <p className="font-semibold text-foreground capitalize mt-0.5">{event?.flood_type ?? "Riverine"}</p>
            </div>
          </div>
        </section>

        {/* Nearby Infrastructure Facilities */}
        <section className="rounded-2xl border border-border bg-card/60 p-6 shadow-xl space-y-4">
          <div className="border-b border-border/60 pb-3">
            <h2 className="text-base font-bold text-foreground">5km Evacuation & Health Infrastructure</h2>
            <p className="text-xs text-muted-foreground">Available facilities within immediate response radius</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-background/50 p-3.5 border border-border/50">
              <Hospital className="size-5 text-rose-400 mx-auto mb-1" />
              <p className="text-2xl font-bold font-mono">{infraData?.nearby_infrastructure.hospitals ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{t("Hospitals")}</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3.5 border border-border/50">
              <School className="size-5 text-amber-400 mx-auto mb-1" />
              <p className="text-2xl font-bold font-mono">{infraData?.nearby_infrastructure.schools ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{t("Schools")}</p>
            </div>
            <div className="rounded-xl bg-background/50 p-3.5 border border-border/50">
              <Tent className="size-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-2xl font-bold font-mono">{infraData?.nearby_infrastructure.relief_shelters ?? 0}</p>
              <p className="text-[11px] text-muted-foreground">{t("Relief Shelters")}</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-semibold text-foreground">Identified Facilities:</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs text-muted-foreground pr-1">
              {infraData?.details?.hospitals?.map((h: any, i) => (
                <div key={`h-${i}`} className="flex items-center gap-2 rounded-lg bg-background/40 p-2 border border-border/30">
                  <Hospital className="size-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{typeof h === "string" ? h : h?.name ?? "Hospital"}</span>
                </div>
              ))}
              {infraData?.details?.relief_shelters?.map((s: any, i) => (
                <div key={`s-${i}`} className="flex items-center gap-2 rounded-lg bg-background/40 p-2 border border-border/30">
                  <Tent className="size-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{typeof s === "string" ? s : s?.name ?? "Relief Shelter"}</span>
                </div>
              ))}
              {!infraData?.details?.hospitals?.length && !infraData?.details?.relief_shelters?.length && (
                <p className="text-xs text-muted-foreground italic">No facility names indexed in immediate 5km zone.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

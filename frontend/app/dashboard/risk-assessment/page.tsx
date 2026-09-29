"use client"

import { getFeature } from "@/lib/features"
import { useFeature } from "@/hooks/use-feature"
import { useLanguage } from "@/lib/i18n/language-context"
import {
  FeatureHeader,
  ErrorState,
  ResultsSkeleton,
} from "@/components/dashboard/feature-shell"
import { CircularGauge, ScoreBar } from "@/components/dashboard/gauge"
import { MapPin } from "lucide-react"

interface RiskResponse {
  nearest_event: {
    station: string
    state: string
    latitude: number
    longitude: number
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

// Vibrant high-contrast colors matching emergency hazard levels
const RISK_COLOR: Record<string, string> = {
  Critical: "#ef4444", // Bright Red
  High: "#f97316",     // Bright Orange
  Moderate: "#f59e0b", // Bright Amber
  Low: "#10b981",      // Bright Emerald Green
}

export default function RiskAssessmentPage() {
  const feature = getFeature("risk-assessment")!
  const { data, error, loading, refresh, location } =
    useFeature<RiskResponse>("risk-assessment")

  return (
    <div className="space-y-6">
      <FeatureHeader
        feature={feature}
        location={location}
        onRefresh={refresh}
        loading={loading}
      />

      {error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <ResultsSkeleton />
      ) : (
        <RiskResult data={data} location={location} />
      )}
    </div>
  )
}

function RiskResult({
  data,
  location,
}: {
  data: RiskResponse
  location: { latitude: number; longitude: number; name?: string }
}) {
  const { t } = useLanguage()
  const r = data.risk_assessment
  const ev = data.nearest_event
  const color = RISK_COLOR[r.risk_level] ?? "#10b981"

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* 1. Main Risk Index Gauge Card */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-card/70 p-7 shadow-xl backdrop-blur-md">
        <CircularGauge value={r.risk_score} label={t("Risk Index") || "Risk Index"} color={color} />

        <div className="mt-6 flex items-center justify-center">
          <span
            className="rounded-full px-4 py-1 text-xs font-black uppercase tracking-wider shadow-sm"
            style={{
              backgroundColor: `${color}25`,
              color: color,
              border: `1px solid ${color}60`,
            }}
          >
            {t(r.risk_level) || r.risk_level} {t("Risk Category") || "Risk Category"}
          </span>
        </div>

        <p className="mt-4 text-center text-xs text-slate-300 leading-relaxed max-w-xs">
          Weighted multi-hazard assessment from weather (40%), population exposure (25%), vulnerability (25%), and accessibility (10%).
        </p>
      </div>

      {/* 2. Breakdown and Nearest Recorded Event */}
      <div className="space-y-6">
        {/* Risk Component Breakdown */}
        <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-xl backdrop-blur-md">
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-sky-400">
            {t("Risk Component Breakdown") || "Risk Component Breakdown"}
          </h3>
          <div className="space-y-3">
            <ScoreBar label={t("Weather severity") || "Weather severity"} value={r.weather_score} color="#38bdf8" />
            <ScoreBar label={t("Population exposure") || "Population exposure"} value={r.population_score} color="#818cf8" />
            <ScoreBar label={t("Vulnerability index") || "Vulnerability index"} value={r.vulnerability_score} color="#fb923c" />
            <ScoreBar label={t("Accessibility factor") || "Accessibility factor"} value={r.accessibility_score} color="#34d399" />
          </div>
        </div>

        {/* Nearest Recorded Flood Event */}
        <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-xl backdrop-blur-md">
          <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-sky-400">
            {t("Nearest Recorded Flood Event Telemetry") || "Nearest Recorded Flood Event Telemetry"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t("Station") || "Station"} value={ev.station || "—"} />
            <Field label={t("State") || "State"} value={ev.state || "—"} />
            <Field label={t("River / Basin") || "River / Basin"} value={`${ev.river || "—"} · ${ev.basin || "—"}`} />
            <Field label={t("Flood type") || "Flood type"} value={ev.flood_type || "—"} />
            <Field label={t("Event date") || "Event date"} value={ev.start_date || "—"} />
            <Field label={t("Peak flood level") || "Peak flood level"} value={`${ev.peak_flood_level.toFixed(2)} m`} />
            <Field label={t("Warning level") || "Warning level"} value={`${ev.warning_level.toFixed(2)} m`} />
            <Field label={t("Danger level") || "Danger level"} value={`${ev.danger_level.toFixed(2)} m`} />
            <Field label={t("Rainfall") || "Rainfall"} value={`${ev.rainfall_mm.toFixed(1)} mm`} />
            <Field label={t("Wind speed") || "Wind speed"} value={`${ev.wind_speed_kmh.toFixed(1)} km/h`} />
            <Field label={t("Humidity") || "Humidity"} value={`${ev.humidity_percent.toFixed(0)}%`} />
            <Field label={t("Temperature") || "Temperature"} value={`${ev.temperature_c.toFixed(1)}°C`} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 border border-white/10 p-3 shadow-sm">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-white mt-1 font-mono">{value}</p>
    </div>
  )
}

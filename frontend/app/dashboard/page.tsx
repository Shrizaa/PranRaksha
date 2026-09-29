"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import {
  ShieldAlert,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  PackageCheck,
  TrendingDown,
  Hospital,
  School,
  Tent,
  Loader2,
  MapPin,
  Layers,
  CheckCircle2,
  Radio,
  Activity,
  CloudRain,
  ExternalLink,
  X,
  Package,
  Droplet,
  HeartPulse,
  BedDouble,
  AlertOctagon,
} from "lucide-react"
import { useAppLocation } from "@/components/app-provider"
import { useLanguage } from "@/lib/i18n/language-context"
import { ReliefGlobe, type MarkerData } from "@/components/three/relief-globe"
import { callFeature } from "@/lib/api-client"
import { PRESET_LOCATIONS } from "@/lib/presets"
import { cn } from "@/lib/utils"

interface RiskResponse {
  risk_assessment: {
    risk_score: number
    risk_level: string
    weather_score: number
    population_score: number
    vulnerability_score: number
    accessibility_score: number
  }
  nearest_event?: {
    station: string
    state: string
    river: string
    basin?: string
    distance_km: number
  }
}

interface WarehouseResponse {
  nearest_warehouse: {
    warehouse_id: string
    warehouse_name: string
    state: string
    city: string
    latitude: number
    longitude: number
    distance_km: number
  }
}

interface ShortageResponse {
  affected_population: number
  relief_days: number
  warehouse_id: string
  warehouse_name: string
  required_resources: {
    food_packets: number
    water_bottles: number
    medkits: number
    blankets: number
  }
  available_resources: {
    food_packets: number
    water_bottles: number
    medkits: number
    blankets: number
  }
  shortage_analysis: {
    shortage: {
      food_packets: number
      water_bottles: number
      medkits: number
      blankets: number
    }
    total_shortage_units: number
    overall_status: string
  }
}

interface InfraItem {
  name: string
  lat?: number
  lon?: number
}

interface InfraResponse {
  nearby_infrastructure: {
    relief_shelters: number
    hospitals: number
    schools: number
  }
  details?: {
    hospitals: InfraItem[]
    schools: InfraItem[]
    relief_shelters: InfraItem[]
  }
}

export default function DashboardOverviewPage() {
  const { location, isAnalyzing, currentStepText, currentStepIndex } = useAppLocation()
  const { t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [riskData, setRiskData] = useState<RiskResponse | null>(null)
  const [warehouseData, setWarehouseData] = useState<WarehouseResponse | null>(null)
  const [shortageData, setShortageData] = useState<ShortageResponse | null>(null)
  const [infraData, setInfraData] = useState<InfraResponse | null>(null)

  // Latest submitted disaster banner
  const LATEST_KEY = "pranraksha_latest_disaster"
  type LatestEntry = {
    id: string; label: string; flood_type: string; state: string
    result: { risk_score: number; risk_level: string }
    resources?: { food_packets: number; water_bottles: number; medkits: number; blankets: number; affected_population: number; relief_days: number }
    warehouse?: { warehouse_name: string; city: string; state: string; distance_km: number }
  }
  const [latestDisaster, setLatestDisaster] = useState<LatestEntry | null>(null)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LATEST_KEY)
      if (raw) {
        setLatestDisaster(JSON.parse(raw))
        // Clear so it only shows once per visit
        localStorage.removeItem(LATEST_KEY)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    let active = true

    async function loadCommandData() {
      setLoading(true)
      setError(null)
      try {
        const payload = {
          latitude: location.latitude,
          longitude: location.longitude,
          relief_days: location.relief_days,
        }

        const [risk, warehouse, shortage, infra] = await Promise.all([
          callFeature<RiskResponse>("risk-assessment", payload),
          callFeature<WarehouseResponse>("nearest-warehouse", payload),
          callFeature<ShortageResponse>("shortage-analysis", payload),
          callFeature<InfraResponse>("nearby-infrastructure", payload),
        ])

        if (active) {
          setRiskData(risk)
          setWarehouseData(warehouse)
          setShortageData(shortage)
          setInfraData(infra)
          setLoading(false)
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to connect to emergency response services. Please verify backend connection."
          )
          setLoading(false)
        }
      }
    }

    loadCommandData()

    return () => {
      active = false
    }
  }, [location])

  // Markers for 3D Globe
  const markers = useMemo<MarkerData[]>(() => {
    return PRESET_LOCATIONS.map((p) => {
      const level =
        p.state === "Assam" || p.state === "Bihar"
          ? "Critical"
          : p.state === "Odisha" || p.state === "Kerala"
          ? "High"
          : "Moderate"
      return {
        id: p.name,
        name: p.name,
        sub: p.state,
        lat: p.latitude,
        lon: p.longitude,
        riskLevel: level,
        type: "disaster",
      }
    })
  }, [])

  const nearestWarehouseCoord = useMemo(() => {
    if (!warehouseData?.nearest_warehouse) return null
    return {
      lat: warehouseData.nearest_warehouse.latitude,
      lon: warehouseData.nearest_warehouse.longitude,
      name: warehouseData.nearest_warehouse.warehouse_name,
    }
  }, [warehouseData])

  const riskLevel = riskData?.risk_assessment.risk_level ?? "Moderate"
  const riskScore = riskData?.risk_assessment.risk_score ?? 45

  function getRiskBadge(level: string) {
    switch (level.toLowerCase()) {
      case "critical":
        return {
          label: t("Critical Threat Zone") || "Critical Threat Zone",
          bg: "bg-red-500/20 text-red-300 border-red-500/40",
          dot: "bg-red-500 shadow-[0_0_8px_#ef4444]",
        }
      case "high":
        return {
          label: t("High Threat Matrix") || "High Threat Matrix",
          bg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
          dot: "bg-orange-500 shadow-[0_0_8px_#f97316]",
        }
      case "moderate":
        return {
          label: t("Elevated Risk") || "Elevated Risk",
          bg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          dot: "bg-amber-500 shadow-[0_0_8px_#f59e0b]",
        }
      default:
        return {
          label: t("Nominal / Low Risk") || "Nominal / Low Risk",
          bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          dot: "bg-emerald-500 shadow-[0_0_8px_#10b981]",
        }
    }
  }

  const badge = getRiskBadge(riskLevel)

  // Combined list of all available infrastructure
  const allFacilities = useMemo(() => {
    const list: { name: string; lat?: number; lon?: number; type: "hospital" | "school" | "shelter" }[] = []
    if (infraData?.details?.hospitals) {
      infraData.details.hospitals.forEach((h) => {
        list.push({
          name: typeof h === "string" ? h : h.name,
          lat: typeof h === "object" ? h.lat : undefined,
          lon: typeof h === "object" ? h.lon : undefined,
          type: "hospital",
        })
      })
    }
    if (infraData?.details?.schools) {
      infraData.details.schools.forEach((s) => {
        list.push({
          name: typeof s === "string" ? s : s.name,
          lat: typeof s === "object" ? s.lat : undefined,
          lon: typeof s === "object" ? s.lon : undefined,
          type: "school",
        })
      })
    }
    if (infraData?.details?.relief_shelters) {
      infraData.details.relief_shelters.forEach((r) => {
        list.push({
          name: typeof r === "string" ? r : r.name,
          lat: typeof r === "object" ? r.lat : undefined,
          lon: typeof r === "object" ? r.lon : undefined,
          type: "shelter",
        })
      })
    }
    return list
  }, [infraData])

  return (
    <div className="space-y-6">
      {/* ── Latest Submitted Disaster Banner ── */}
      {latestDisaster && !bannerDismissed && (() => {
        const rl = latestDisaster.result.risk_level
        const COLOR: Record<string, string> = { Critical: "#ef4444", High: "#f97316", Moderate: "#f59e0b", Low: "#10b981" }
        const c = COLOR[rl] ?? "#38bdf8"
        return (
          <div className="rounded-2xl border p-5 shadow-2xl backdrop-blur-md relative animate-in slide-in-from-top-3 duration-400"
            style={{ borderColor: `${c}40`, background: `linear-gradient(135deg, ${c}10, ${c}05)` }}>
            <button onClick={() => setBannerDismissed(true)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition">
              <X className="size-4" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="size-5" style={{ color: c }} />
              <span className="text-sm font-black text-white">{t("Disaster Reported Successfully")}</span>
              <span className="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider"
                style={{ backgroundColor: `${c}25`, color: c, border: `1px solid ${c}60` }}>
                {t(rl)} {t("Risk")} — {latestDisaster.result.risk_score.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-semibold mb-4">
              <span style={{ color: c }}>{latestDisaster.label}</span>
              {latestDisaster.state ? ` · ${latestDisaster.state}` : ""}
              {" · "}{latestDisaster.flood_type}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {latestDisaster.resources && [
                { label: "Food Packets", value: latestDisaster.resources.food_packets, icon: <Package className="size-3.5 text-orange-400" /> },
                { label: "Water Bottles", value: latestDisaster.resources.water_bottles, icon: <Droplet className="size-3.5 text-sky-400" /> },
                { label: "Medkits", value: latestDisaster.resources.medkits, icon: <HeartPulse className="size-3.5 text-red-400" /> },
                { label: "Blankets", value: latestDisaster.resources.blankets, icon: <BedDouble className="size-3.5 text-indigo-400" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="rounded-xl bg-black/30 border border-white/10 p-3">
                  <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-[11px] font-semibold text-slate-400">{t(label)}</span></div>
                  <p className="text-base font-black text-white tabular-nums">{value.toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
            {latestDisaster.warehouse && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <WarehouseIcon className="size-3.5 text-emerald-400" />
                <span>{t("Nearest Warehouse")}: <strong className="text-emerald-300">{latestDisaster.warehouse.warehouse_name}</strong> · {latestDisaster.warehouse.city}, {latestDisaster.warehouse.state} · <strong className="text-white">{latestDisaster.warehouse.distance_km} km</strong></span>
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/dashboard/risk-assessment" className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold border border-white/10 hover:bg-white/10 text-slate-300 transition">
                <ShieldAlert className="size-3" /> {t("Risk Assessment")}
              </Link>
              <Link href="/dashboard/resource-requirements" className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold border border-white/10 hover:bg-white/10 text-slate-300 transition">
                <Package className="size-3" /> {t("Resources")}
              </Link>
              <Link href="/dashboard/nearby-infrastructure" className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold border border-white/10 hover:bg-white/10 text-slate-300 transition">
                <AlertOctagon className="size-3" /> {t("Infrastructure (5km)")}
              </Link>
              <Link href="/dashboard/nearest-warehouse" className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold border border-white/10 hover:bg-white/10 text-slate-300 transition">
                <WarehouseIcon className="size-3" /> {t("Warehouse")}
              </Link>
              <Link href="/dashboard/disaster-history" className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold border border-white/10 hover:bg-white/10 text-slate-300 transition">
                <ExternalLink className="size-3" /> {t("My Reported Disasters")}
              </Link>
            </div>
          </div>
        )
      })()}

      {/* Backend connection warning banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
          <AlertTriangle className="size-5 shrink-0" />
          <p className="flex-1 font-medium">{error}</p>
        </div>
      )}

      {/* 3D Realistic Tactical Earth Centerpiece */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070f1e] shadow-2xl">
        {/* Active Target Zone Badge with Epicentre Details — matching reference */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col rounded-2xl border border-white/10 bg-[#07111e]/95 px-4 py-3.5 shadow-2xl backdrop-blur-md" style={{ minWidth: 270, maxWidth: 330 }}>
          {/* Header row */}
          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-white" />
              <span className="text-sm font-bold text-white tracking-tight">{t("Active Target Zone")}</span>
            </div>
            <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-black uppercase text-white tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              {riskData?.risk_assessment.risk_level?.toUpperCase() ?? "CRITICAL"}
            </span>
          </div>

          {/* Disaster Epicentre section */}
          <div className="pt-2.5">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{t("Disaster Epicentre")}</p>
            <p className="mt-1 text-[17px] font-black font-mono text-white tracking-wide leading-tight">
              {location.latitude.toFixed(3)}° N,&nbsp;{location.longitude.toFixed(3)}° E
            </p>
          </div>

          {/* Telemetry rows below epicentre */}
          <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] text-slate-400 shrink-0">{t("Station / State")}</span>
              <span className="font-bold text-white font-mono text-[11px] text-right leading-snug">
                {riskData?.nearest_event?.station ?? location.label}
                {riskData?.nearest_event?.state ? <><br /><span className="text-slate-300 font-normal">{riskData.nearest_event.state}</span></> : ""}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 shrink-0">{t("River Basin")}</span>
              <span className="font-bold text-cyan-400 font-mono text-[11px] text-right">
                {riskData?.nearest_event?.river || "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] text-slate-400 shrink-0">{t("Responding Hub")}</span>
              <span className="font-bold text-emerald-400 font-mono text-[11px] text-right leading-snug">
                {warehouseData?.nearest_warehouse.warehouse_name ?? "—"}
                {warehouseData?.nearest_warehouse.distance_km ? <><br /><span className="text-slate-300 font-normal">{warehouseData.nearest_warehouse.distance_km} km away</span></> : ""}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 shrink-0">{t("Affected Pop.")}</span>
              <span className="font-black text-white font-mono text-[12px]">
                {(shortageData?.affected_population ?? 0) > 0
                  ? (shortageData!.affected_population).toLocaleString()
                  : loading ? "—" : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* 3D Moving Globe — auto-rotating on startup */}
        <div className="h-[420px] sm:h-[500px] w-full">
          <ReliefGlobe
            markers={markers}
            activeCoord={{ lat: location.latitude, lon: location.longitude }}
            nearestWarehouseCoord={nearestWarehouseCoord}
            autoRotate={true}
          />
        </div>

        {/* AI Analysis Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md p-6 text-center transition-all animate-in fade-in duration-200">
            <Loader2 className="size-8 animate-spin text-cyan-400 mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1 font-mono">
              {t("Orbital Compute Sequence")} · {t("Step")} {currentStepIndex + 1} {t("of")} 7
            </p>
            <h2 className="text-base sm:text-lg font-bold text-white max-w-xs">
              {currentStepText}
            </h2>
          </div>
        )}
      </section>

      {/* Operational Intelligence Cards Grid (3 Clean Primary Cards) */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 1. Flood Risk Card */}
        <div className="rounded-2xl border border-white/10 bg-card/70 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("Flood Risk Assessment")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ShieldAlert className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-black font-mono tracking-tight text-white drop-shadow">
              {loading ? "--" : riskScore.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="mt-2.5">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold", badge.bg)}>
              <span className={cn("size-2 rounded-full", badge.dot)} />
              {badge.label}
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <p className="text-[10px] text-slate-400">{t("Weather")}</p>
              <p className="font-black text-white font-mono text-sm">
                {riskData?.risk_assessment.weather_score.toFixed(0) ?? "--"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">{t("Vulnerability")}</p>
              <p className="font-black text-white font-mono text-sm">
                {riskData?.risk_assessment.vulnerability_score.toFixed(0) ?? "--"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400">{t("Access")}</p>
              <p className="font-black text-white font-mono text-sm">
                {riskData?.risk_assessment.accessibility_score.toFixed(0) ?? "--"}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Affected Population Card */}
        <div className="rounded-2xl border border-white/10 bg-card/70 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("Affected Population")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
              <Layers className="size-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow">
              {loading
                ? "--"
                : (shortageData?.affected_population ?? 104774).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-400">{t("citizens") || "citizens"}</span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            {t("Calculated within 5km radius of epicenter") || "Calculated within 5km radius of epicenter"}
          </p>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t("Planning Horizon") || "Planning Horizon"}:</span>
            <span className="font-bold text-white font-mono">{location.relief_days} {t("days") || "Days"}</span>
          </div>
        </div>

        {/* 4. Nearest Warehouse Card */}
        <div className="rounded-2xl border border-white/10 bg-card/70 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("Nearest Warehouse")}
            </span>
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <WarehouseIcon className="size-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-base font-bold text-white truncate">
              {warehouseData?.nearest_warehouse.warehouse_name ?? "Guwahati Hub"}
            </p>
            <p className="text-xs text-slate-400 font-mono">
              ID: {warehouseData?.nearest_warehouse.warehouse_id ?? "WH-01"} · {warehouseData?.nearest_warehouse.state}
            </p>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-cyan-400 drop-shadow">
              {warehouseData?.nearest_warehouse.distance_km ?? "--"}
            </span>
            <span className="text-xs font-semibold text-slate-400">{t("km linear transit") || "km linear transit"}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>{t("Network Status") || "Network Status"}:</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="size-3" /> {t("Operational") || "Operational"}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Logistics & Infrastructure Split */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Resource Shortage Analysis Panel */}
        <section className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {t("Shortage Analysis")}
              </h2>
              <p className="text-xs text-slate-400">
                {t("Required vs Available stock at")} {shortageData?.warehouse_name ?? t("Primary Responding Hub")}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-black uppercase border",
                shortageData?.shortage_analysis.total_shortage_units === 0
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/40"
              )}
            >
              {shortageData?.shortage_analysis.overall_status ?? t("Partially Available")}
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                name: t("Food Packets"),
                req: shortageData?.required_resources.food_packets ?? 0,
                avail: shortageData?.available_resources.food_packets ?? 0,
                short: shortageData?.shortage_analysis.shortage.food_packets ?? 0,
              },
              {
                name: t("Water Bottles"),
                req: shortageData?.required_resources.water_bottles ?? 0,
                avail: shortageData?.available_resources.water_bottles ?? 0,
                short: shortageData?.shortage_analysis.shortage.water_bottles ?? 0,
              },
              {
                name: t("Medical Kits"),
                req: shortageData?.required_resources.medkits ?? 0,
                avail: shortageData?.available_resources.medkits ?? 0,
                short: shortageData?.shortage_analysis.shortage.medkits ?? 0,
              },
              {
                name: t("Blankets"),
                req: shortageData?.required_resources.blankets ?? 0,
                avail: shortageData?.available_resources.blankets ?? 0,
                short: shortageData?.shortage_analysis.shortage.blankets ?? 0,
              },
            ].map((item) => {
              const pct = item.req > 0 ? Math.min(100, Math.round((item.avail / item.req) * 100)) : 100
              const hasDeficit = item.short > 0
              return (
                <div key={item.name} className="rounded-xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between mb-2 text-xs">
                    <span className="font-bold text-white text-sm">{item.name}</span>
                    <span
                      className={cn(
                        "rounded px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                        hasDeficit
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      )}
                    >
                      {hasDeficit ? `${t("Deficit:")} -${item.short.toLocaleString()}` : t("Available")}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        pct >= 100 ? "bg-emerald-500" : pct > 50 ? "bg-amber-500" : "bg-red-500"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-300 font-mono">
                    <span>{t("Required:")} <strong className="text-white">{item.req.toLocaleString()}</strong></span>
                    <span>{t("Available:")} <strong className="text-white">{item.avail.toLocaleString()}</strong></span>
                    <span>{t("Coverage:")} <strong className="text-cyan-400">{pct}%</strong></span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Nearby Infrastructure Panel with Full List & 'More' Redirect Button */}
        <section className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-white/10 pb-3 mb-5">
              <h2 className="text-base font-bold text-white tracking-tight">
                {t("Nearby Infrastructure")}
              </h2>
              <p className="text-xs text-slate-400">{t("Facilities mapped within 5km of disaster epicenter")}</p>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 text-center">
                <Hospital className="size-4 text-cyan-400 mx-auto mb-1" />
                <p className="text-xl font-black font-mono text-white">
                  {infraData?.nearby_infrastructure.hospitals ?? 0}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{t("Hospitals")}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 text-center">
                <School className="size-4 text-amber-400 mx-auto mb-1" />
                <p className="text-xl font-black font-mono text-white">
                  {infraData?.nearby_infrastructure.schools ?? 0}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{t("Schools")}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 text-center">
                <Tent className="size-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-xl font-black font-mono text-white">
                  {infraData?.nearby_infrastructure.relief_shelters ?? 0}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">{t("Relief Shelters")}</p>
              </div>
            </div>

            {/* Scrollable list of available facilities with name + coordinates in brackets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
                  {t("AVAILABLE FACILITIES")} ({allFacilities.length})
                </p>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {allFacilities.length > 0 ? (
                  allFacilities.slice(0, 8).map((f, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 rounded-xl bg-slate-900/90 px-3 py-2.5 border border-white/10 shadow-sm"
                    >
                      {f.type === "hospital" ? (
                        <Hospital className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      ) : f.type === "school" ? (
                        <School className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Tent className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-1.5">
                          <span className="font-bold text-white text-xs leading-snug">{f.name}</span>
                          {f.lat !== undefined && f.lon !== undefined && (
                            <span className="text-[11px] font-mono font-bold text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.35)]">
                              ({f.lat.toFixed(4)}°N, {f.lon.toFixed(4)}°E)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic py-3 text-center">
                    {t("No records within 5km")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 'Click on more and redirect to that feature info' Button */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <Link
              href="/dashboard/nearby-infrastructure"
              className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 p-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/25 hover:text-white shadow-sm"
            >
              <span>{t("View Full Infrastructure Directory")} ({allFacilities.length} {t("Facilities")})</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

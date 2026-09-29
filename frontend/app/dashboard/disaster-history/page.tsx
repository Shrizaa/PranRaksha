"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  History,
  AlertOctagon,
  Trash2,
  Search,
  ChevronRight,
  Calendar,
  MapPin,
  CloudRain,
  Users,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Filter,
  BarChart3,
  Download,
  X,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react"
import { useAppLocation } from "@/components/app-provider"
import type { DisasterEntry } from "../new-disaster/page"

const HISTORY_KEY = "pranraksha_disaster_inputs"

function loadHistory(): DisasterEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function clearHistory() {
  localStorage.removeItem(HISTORY_KEY)
}

function deleteEntry(id: string) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const existing: DisasterEntry[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.filter((e) => e.id !== id)))
  } catch { /* ignore */ }
}

const RISK_STYLE: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Critical: { bg: "bg-red-500/15", text: "text-red-300", border: "border-red-500/40", dot: "bg-red-400" },
  High:     { bg: "bg-orange-500/15", text: "text-orange-300", border: "border-orange-500/40", dot: "bg-orange-400" },
  Moderate: { bg: "bg-yellow-500/15", text: "text-yellow-300", border: "border-yellow-500/40", dot: "bg-yellow-400" },
  Low:      { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/40", dot: "bg-emerald-400" },
}

export default function DisasterHistoryPage() {
  const router = useRouter()
  const { setLocation } = useAppLocation()
  const [entries, setEntries] = useState<DisasterEntry[]>([])
  const [search, setSearch] = useState("")
  const [filterLevel, setFilterLevel] = useState<string>("All")
  const [selected, setSelected] = useState<DisasterEntry | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)

  function handleViewOnDashboard(entry: DisasterEntry) {
    const pop = Number(entry.population) || 50000
    const days = Number(entry.relief_days) || 5
    const lat = Number(entry.latitude) || 20.5937
    const lon = Number(entry.longitude) || 78.9629

    const fullEntry: DisasterEntry = {
      ...entry,
      latitude: lat,
      longitude: lon,
      relief_days: days,
      resources: entry.resources || {
        food_packets: pop * days * 3,
        water_bottles: pop * days * 4,
        medkits: Math.ceil(pop / 10),
        blankets: Math.ceil(pop / 2),
        affected_population: pop,
        relief_days: days,
      },
    }

    try {
      localStorage.setItem("pranraksha_latest_disaster", JSON.stringify(fullEntry))
    } catch { /* ignore */ }

    setLocation({
      latitude: lat,
      longitude: lon,
      relief_days: days,
      label: entry.label || `${entry.flood_type} — ${entry.state || "Report"}`,
    })

    router.push("/dashboard")
  }

  useEffect(() => {
    setEntries(loadHistory())
  }, [])

  function refresh() {
    setEntries(loadHistory())
    setSelected(null)
  }

  function handleDelete(id: string) {
    deleteEntry(id)
    refresh()
  }

  function handleClearAll() {
    clearHistory()
    refresh()
    setClearConfirm(false)
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pranraksha_disaster_inputs_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const levels = ["All", "Critical", "High", "Moderate", "Low"]

  const filtered = entries.filter((e) => {
    const matchesSearch =
      e.label.toLowerCase().includes(search.toLowerCase()) ||
      e.state.toLowerCase().includes(search.toLowerCase()) ||
      e.flood_type.toLowerCase().includes(search.toLowerCase())
    const matchesLevel = filterLevel === "All" || e.result.risk_level === filterLevel
    return matchesSearch && matchesLevel
  })

  // Stats according to the application's risk categories (Critical, High, Moderate, Low)
  const stats = {
    total: entries.length,
    critical: entries.filter((e) => e.result.risk_level === "Critical").length,
    high: entries.filter((e) => e.result.risk_level === "High").length,
    moderate: entries.filter((e) => e.result.risk_level === "Moderate").length,
    low: entries.filter((e) => e.result.risk_level === "Low").length,
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl border border-sky-500/40 bg-sky-500/10 shadow-lg shadow-sky-500/20">
            <History className="size-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-foreground">
              My Reported Disasters
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              All disasters you have reported — auto-saved with full AI assessment results
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {entries.length > 0 && (
            <>
              <button
                onClick={exportJson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-card/60 text-slate-300 transition"
              >
                <Download className="size-3.5" />
                Export JSON
              </button>
              <button
                onClick={() => setClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition"
              >
                <Trash2 className="size-3.5" />
                Clear All
              </button>
            </>
          )}
          <button
            onClick={() => router.push("/dashboard/new-disaster")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 transition"
          >
            <AlertOctagon className="size-3.5" />
            + New Report
          </button>
        </div>
      </div>

      {/* Confirm Clear Modal */}
      {clearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-2xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-center gap-3">
              <Trash2 className="size-5 text-red-400" />
              <h3 className="text-base font-black text-white">Clear All History?</h3>
            </div>
            <p className="text-xs text-slate-400">This will permanently delete all {entries.length} disaster entries from local storage. This action cannot be undone.</p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setClearConfirm(false)} className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={handleClearAll} className="flex-1 py-2 rounded-xl bg-red-500 text-xs font-black text-white hover:bg-red-600 transition">Delete All</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Row — Total + Application Risk Categories (Critical, High, Moderate, Low) */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Total Reports */}
          <button
            onClick={() => setFilterLevel("All")}
            className={`text-left rounded-2xl border p-4 backdrop-blur-md transition-all ${
              filterLevel === "All"
                ? "border-sky-500/60 bg-sky-500/10 shadow-lg shadow-sky-500/10"
                : "border-white/10 bg-card/60 hover:border-white/25 hover:bg-card/80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <BarChart3 className="size-4 text-sky-400" />
              <span className="text-2xl font-black tabular-nums text-sky-400">{stats.total}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Reports</p>
          </button>

          {/* Critical */}
          <button
            onClick={() => setFilterLevel(filterLevel === "Critical" ? "All" : "Critical")}
            className={`text-left rounded-2xl border p-4 backdrop-blur-md transition-all ${
              filterLevel === "Critical"
                ? "border-red-500/60 bg-red-500/15 shadow-lg shadow-red-500/20"
                : "border-white/10 bg-card/60 hover:border-red-500/30 hover:bg-card/80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <ShieldAlert className="size-4 text-red-400" />
              <span className="text-2xl font-black tabular-nums text-red-400">{stats.critical}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical</p>
          </button>

          {/* High */}
          <button
            onClick={() => setFilterLevel(filterLevel === "High" ? "All" : "High")}
            className={`text-left rounded-2xl border p-4 backdrop-blur-md transition-all ${
              filterLevel === "High"
                ? "border-orange-500/60 bg-orange-500/15 shadow-lg shadow-orange-500/20"
                : "border-white/10 bg-card/60 hover:border-orange-500/30 hover:bg-card/80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <AlertOctagon className="size-4 text-orange-400" />
              <span className="text-2xl font-black tabular-nums text-orange-400">{stats.high}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">High</p>
          </button>

          {/* Moderate */}
          <button
            onClick={() => setFilterLevel(filterLevel === "Moderate" ? "All" : "Moderate")}
            className={`text-left rounded-2xl border p-4 backdrop-blur-md transition-all ${
              filterLevel === "Moderate"
                ? "border-yellow-500/60 bg-yellow-500/15 shadow-lg shadow-yellow-500/20"
                : "border-white/10 bg-card/60 hover:border-yellow-500/30 hover:bg-card/80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <AlertTriangle className="size-4 text-yellow-400" />
              <span className="text-2xl font-black tabular-nums text-yellow-400">{stats.moderate}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Moderate</p>
          </button>

          {/* Low */}
          <button
            onClick={() => setFilterLevel(filterLevel === "Low" ? "All" : "Low")}
            className={`text-left rounded-2xl border p-4 backdrop-blur-md transition-all ${
              filterLevel === "Low"
                ? "border-emerald-500/60 bg-emerald-500/15 shadow-lg shadow-emerald-500/20"
                : "border-white/10 bg-card/60 hover:border-emerald-500/30 hover:bg-card/80"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span className="text-2xl font-black tabular-nums text-emerald-400">{stats.low}</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Low</p>
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      {entries.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by label, state, flood type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/70 border border-white/10 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-slate-500 shrink-0" />
            {levels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                  filterLevel === lvl
                    ? "bg-primary/20 text-primary border-primary/40"
                    : "border-white/10 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-card/30 py-24 text-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-slate-800 border border-white/10">
            <History className="size-8 text-slate-500" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-base font-bold text-white">No Disaster Reports Yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submit disaster telemetry via the New Disaster Report form. Each assessment is automatically saved here with full AI risk prediction results.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/new-disaster")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/30 transition"
          >
            <AlertOctagon className="size-4" />
            Create First Disaster Report
          </button>
        </div>
      )}

      {/* Grid of entries */}
      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((entry) => {
            const rs = RISK_STYLE[entry.result.risk_level] ?? RISK_STYLE.Low
            const date = new Date(entry.timestamp)
            const isSelected = selected?.id === entry.id
            return (
              <div
                key={entry.id}
                onClick={() => setSelected(isSelected ? null : entry)}
                className={`group relative cursor-pointer rounded-2xl border p-4 backdrop-blur-md transition-all duration-200 ${
                  isSelected
                    ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/20"
                    : "border-white/10 bg-card/60 hover:border-white/25 hover:bg-card/80"
                }`}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }}
                  className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 rounded-lg p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition"
                  aria-label="Delete"
                >
                  <Trash2 className="size-3.5" />
                </button>

                <div className="space-y-3">
                  {/* Title row */}
                  <div className="flex items-start gap-2 pr-6">
                    <span className={`mt-0.5 inline-flex size-2 shrink-0 rounded-full ${rs.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white truncate leading-tight">{entry.label || "Unnamed Report"}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{entry.flood_type}</p>
                    </div>
                  </div>

                  {/* Risk Badge — level + score only, no priority */}
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wider border ${rs.bg} ${rs.text} ${rs.border}`}>
                    <ShieldAlert className="size-3" />
                    {entry.result.risk_level} — Score: {entry.result.risk_score.toFixed(1)}
                  </span>

                  {/* Mini stats */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-300">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="size-3" />
                      {date.toLocaleDateString("en-IN")} {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {entry.state && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-sky-400" />
                        {entry.state}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CloudRain className="size-3 text-sky-400" />
                      {entry.rainfall} mm rain
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3 text-purple-400" />
                      {Number(entry.population).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                    <span className="font-mono text-slate-500">{entry.id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewOnDashboard(entry)
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/20 text-primary border border-primary/40 hover:bg-primary hover:text-primary-foreground shadow-sm transition"
                        title="Load this disaster onto the Dashboard"
                      >
                        <LayoutDashboard className="size-3" />
                        Dashboard →
                      </button>
                      <span className="text-slate-400 hover:text-white font-semibold">
                        {isSelected ? "▲ Hide" : "▼ Details"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* No filter results */}
      {entries.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-slate-400">
          <Search className="size-8 text-slate-600" />
          <span>No results for <strong className="text-white">"{search}"</strong>. Try adjusting the search or filter.</span>
          <button onClick={() => { setSearch(""); setFilterLevel("All") }} className="text-xs text-primary underline">Reset filters</button>
        </div>
      )}

      {/* Slide-in detail panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-white/10 bg-slate-950/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h3 className="text-base font-black text-white truncate max-w-xs">{selected.label || "Report Details"}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{selected.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleViewOnDashboard(selected)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-md shadow-primary/25 transition"
                title="View results on dashboard"
              >
                <LayoutDashboard className="size-3.5" />
                View on Dashboard
              </button>
              <button onClick={() => setSelected(null)} className="rounded-xl p-2 hover:bg-slate-800 text-slate-400 hover:text-white transition">
                <X className="size-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Risk Overview */}
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-sky-400">AI Risk Assessment</h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-4xl font-black text-white tabular-nums">{selected.result.risk_score.toFixed(1)}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Risk Score</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[
                    { label: "Risk Level", value: selected.result.risk_level },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">{label}</span>
                      <span className="font-black text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score bars */}
              <div className="space-y-2 pt-1">
                {[
                  { label: "Weather (40%)", value: selected.result.weather_score, color: "#38bdf8" },
                  { label: "Population (25%)", value: selected.result.population_score, color: "#818cf8" },
                  { label: "Vulnerability (25%)", value: selected.result.vulnerability_score, color: "#fb923c" },
                  { label: "Accessibility (10%)", value: selected.result.accessibility_score, color: "#34d399" },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400 font-semibold">{bar.label}</span>
                      <span style={{ color: bar.color }} className="font-black">{bar.value.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-800">
                      <div className="h-full rounded-full" style={{ width: `${bar.value}%`, backgroundColor: bar.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Location Info */}
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-sky-400">Location & Identification</h4>
              <div className="space-y-2 text-xs">
                {[
                  ["Flood Type", selected.flood_type],
                  ["State / Region", selected.state || "—"],
                  ["GPS Coordinates", `${selected.latitude}°N, ${selected.longitude}°E`],
                  ["Submitted", new Date(selected.timestamp).toLocaleString("en-IN")],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400 font-semibold">{k}</span>
                    <span className="text-white font-mono text-right max-w-[55%] truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meteorological Data */}
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-sky-400">Meteorological Inputs</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ["Rainfall", `${selected.rainfall} mm`],
                  ["Wind Speed", `${selected.wind_speed} km/h`],
                  ["Humidity", `${selected.humidity}%`],
                  ["Temperature", `${selected.temperature}°C`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-slate-800/70 border border-white/10 p-2.5">
                    <p className="text-slate-400 font-semibold">{k}</p>
                    <p className="text-white font-black text-sm mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure */}
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-sky-400">Population & Infrastructure</h4>
              <div className="space-y-2 text-xs">
                {[
                  ["Population", Number(selected.population).toLocaleString("en-IN")],
                  ["Road Density", selected.road_density ? `${selected.road_density} km/100km²` : "—"],
                  ["Road Connectivity", selected.road_connectivity || "—"],
                  ["Highway Distance", selected.highway_distance ? `${selected.highway_distance} km` : "—"],
                  ["Accessibility Score (raw)", selected.accessibility_score || "auto-estimated"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400 font-semibold">{k}</span>
                    <span className="text-white font-mono">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => handleViewOnDashboard(selected)}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/30 transition"
              >
                <LayoutDashboard className="size-4" />
                View on Dashboard & Results
                <ArrowRight className="size-3.5" />
              </button>
              <button
                onClick={() => handleDelete(selected.id)}
                className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition"
              >
                <Trash2 className="size-3.5" />
                Delete This Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

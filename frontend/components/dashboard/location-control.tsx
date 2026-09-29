"use client"

import { useState, useEffect } from "react"
import { MapPin, Crosshair, CalendarDays, Check, Sparkles, Loader2 } from "lucide-react"
import { useAppLocation, type AppLocation } from "@/components/app-provider"
import { PRESET_LOCATIONS } from "@/lib/presets"
import { useLanguage } from "@/lib/i18n/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function LocationControl() {
  const { location, runAssessment, isAnalyzing } = useAppLocation()
  const { t } = useLanguage()
  const [lat, setLat] = useState(String(location.latitude))
  const [lon, setLon] = useState(String(location.longitude))
  const [days, setDays] = useState(String(location.relief_days))
  const [presetLabel, setPresetLabel] = useState<string | undefined>(
    typeof location.label === "string" ? location.label : undefined
  )
  const [open, setOpen] = useState(false)

  // Sync internal state when external location changes
  useEffect(() => {
    setLat(String(location.latitude))
    setLon(String(location.longitude))
    setDays(String(location.relief_days))
    setPresetLabel(typeof location.label === "string" ? location.label : undefined)
  }, [location])

  function handlePresetChange(name: string) {
    const p = PRESET_LOCATIONS.find((x) => x.name === name)
    if (!p) return
    setLat(String(p.latitude))
    setLon(String(p.longitude))
    setPresetLabel(`${p.name}, ${p.state}`)
  }

  function handleLatChange(val: string) {
    setLat(val)
    setPresetLabel(undefined) // Reset preset name on manual editing
  }

  function handleLonChange(val: string) {
    setLon(val)
    setPresetLabel(undefined) // Reset preset name on manual editing
  }

  async function handleApply() {
    const la = Number(lat)
    const lo = Number(lon)
    const d = Math.max(1, Math.floor(Number(days) || 1))
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return

    // Clean label: either matched preset or explicit coordinate string
    const finalLabel =
      presetLabel ?? `${la.toFixed(3)}°N, ${lo.toFixed(3)}°E`

    const newLoc: AppLocation = {
      latitude: la,
      longitude: lo,
      relief_days: d,
      label: finalLabel,
    }

    setOpen(false)
    await runAssessment(newLoc)
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs transition hover:border-primary/40 hover:bg-card"
          aria-label="Location and Relief Days Control"
        >
          <MapPin className="size-3.5 text-primary shrink-0" />
          <span className="font-semibold text-foreground truncate max-w-[170px] sm:max-w-[220px]">
            {typeof location.label === "string" && location.label
              ? location.label
              : `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`}
          </span>
          <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {location.relief_days}d {t("window") || "window"}
          </span>
        </button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => runAssessment()}
          disabled={isAnalyzing}
          className="hidden md:flex h-8 gap-1.5 border-primary/30 bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20"
        >
          {isAnalyzing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {t("Run Assessment")}
        </Button>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full mt-4 z-50 w-[340px] rounded-2xl border border-cyan-500/30 bg-[#071324] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl ring-1 ring-cyan-500/20 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-white">
                {t("Target Disaster Epicentre") || "Target Disaster Epicentre"}
              </p>
              <span className="text-[10px] text-cyan-400 font-mono font-semibold">INDOFLOODS Grid</span>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("Preset Flood Monitoring Station") || "Preset Flood Monitoring Station"}</Label>
                <Select onValueChange={handlePresetChange}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={presetLabel ?? (t("Select monitored station") || "Select monitored station")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {PRESET_LOCATIONS.map((p) => (
                      <SelectItem key={p.name} value={p.name} className="text-xs">
                        {p.name}, {p.state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Crosshair className="size-3 text-primary" /> {t("Latitude") || "Latitude"}
                  </Label>
                  <Input
                    value={lat}
                    onChange={(e) => handleLatChange(e.target.value)}
                    inputMode="decimal"
                    placeholder="e.g. 26.14"
                    className="h-8 text-xs font-mono bg-slate-900/90 border-white/20 text-white font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                    <Crosshair className="size-3 text-cyan-400" /> {t("Longitude") || "Longitude"}
                  </Label>
                  <Input
                    value={lon}
                    onChange={(e) => handleLonChange(e.target.value)}
                    inputMode="decimal"
                    placeholder="e.g. 91.73"
                    className="h-8 text-xs font-mono bg-slate-900/90 border-white/20 text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                  <CalendarDays className="size-3 text-cyan-400" /> {t("Relief Planning Window (Days)") || "Relief Planning Window (Days)"}
                </Label>
                <Input
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  inputMode="numeric"
                  type="number"
                  min={1}
                  max={30}
                  className="h-8 text-xs font-mono bg-slate-900/90 border-white/20 text-white font-semibold"
                />
              </div>

              <Button
                onClick={handleApply}
                disabled={isAnalyzing}
                className="w-full h-9 text-xs font-semibold gap-1.5"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> {t("Analyzing...") || "Analyzing..."}
                  </>
                ) : (
                  <>
                    <Check className="size-3.5" /> {t("Apply Coordinates") || "Apply Coordinates"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

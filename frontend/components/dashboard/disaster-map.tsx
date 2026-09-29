"use client"

import { useEffect, useRef, useState } from "react"
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Compass,
  Radio,
  Crosshair,
  ShieldAlert,
  Navigation,
  Info,
} from "lucide-react"

interface DisasterMapProps {
  disaster: {
    station: string
    state: string
    river: string
    basin?: string
    flood_type: string
    start_date?: string
    peak_flood_level: number
    warning_level: number
    danger_level: number
    rainfall_mm: number
    wind_speed_kmh: number
    latitude: number
    longitude: number
    distance_km: number
  }
  commandLocation: {
    latitude: number
    longitude: number
    name?: string
  }
  riskLevel: string
  riskScore: number
}

// Leaflet tile layer definitions
const TILE_LAYERS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    subdomains: "abcd",
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OSM',
    maxZoom: 19,
    label: "Tactical Dark",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    subdomains: "abc",
    attribution: "&copy; Esri, Maxar, Earthstar",
    maxZoom: 18,
    label: "Satellite",
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    maxZoom: 19,
    label: "Street Nav",
  },
}

const RISK_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Moderate: "#f59e0b",
  Low: "#10b981",
}

export function DisasterSpotMap({
  disaster,
  commandLocation,
  riskLevel,
  riskScore,
}: DisasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite" | "street">("dark")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const disasterLat = disaster.latitude || commandLocation.latitude || 20.2961
  const disasterLon = disaster.longitude || commandLocation.longitude || 85.8245
  const color = RISK_COLORS[riskLevel] ?? "#ef4444"

  // Dynamically load Leaflet and initialize map
  useEffect(() => {
    let isCancelled = false

    async function loadLeaflet() {
      // 1. Inject Leaflet CSS if not already present
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // 2. Load Leaflet JS
      const getLeaflet = (): Promise<any> => {
        if ((window as any).L) return Promise.resolve((window as any).L)
        return new Promise((resolve, reject) => {
          const script = document.createElement("script")
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          script.async = true
          script.onload = () => resolve((window as any).L)
          script.onerror = reject
          document.body.appendChild(script)
        })
      }

      try {
        const L = await getLeaflet()
        if (isCancelled || !mapContainerRef.current) return

        // Destroy previous instance if any
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Initialize Leaflet Map
        const map = L.map(mapContainerRef.current, {
          center: [disasterLat, disasterLon],
          zoom: 11,
          zoomControl: false,
          attributionControl: false,
        })
        mapInstanceRef.current = map

        // Base tile layer
        const config = TILE_LAYERS[mapStyle]
        const tileLayer = L.tileLayer(config.url, {
          subdomains: config.subdomains,
          maxZoom: config.maxZoom,
        }).addTo(map)
        tileLayerRef.current = tileLayer

        // 1. Hazard Impact Zone (5km radius circle)
        L.circle([disasterLat, disasterLon], {
          radius: 5000,
          color: color,
          fillColor: color,
          fillOpacity: 0.15,
          weight: 2,
          dashArray: "6, 6",
        }).addTo(map)

        // Extended Alert Zone (10km)
        L.circle([disasterLat, disasterLon], {
          radius: 10000,
          color: color,
          fillColor: color,
          fillOpacity: 0.05,
          weight: 1,
          dashArray: "3, 6",
        }).addTo(map)

        // 2. Custom Pulsing Disaster Marker
        const disasterIcon = L.divIcon({
          className: "custom-disaster-marker",
          html: `
            <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <span style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${color}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; opacity: 0.8; box-shadow: 0 0 14px ${color};"></span>
              <span style="position: relative; width: 10px; height: 10px; border-radius: 50%; background-color: #ffffff;"></span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const popupContent = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px; margin-bottom: 6px;">
              <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${color}; letter-spacing: 0.05em;">
                ${disaster.flood_type || "Flood Hazard"} Spot
              </span>
              <span style="font-size: 10px; font-weight: 700; background: ${color}25; color: ${color}; padding: 2px 6px; border-radius: 9999px; border: 1px solid ${color}50;">
                ${riskLevel} (${riskScore})
              </span>
            </div>
            <p style="font-size: 13px; font-weight: bold; margin: 0 0 2px 0; color: #f8fafc;">
              ${disaster.station || "Disaster Station"}
            </p>
            <p style="font-size: 11px; color: #94a3b8; margin: 0 0 6px 0;">
              ${disaster.river ? `River: ${disaster.river}` : ""} ${disaster.basin ? `· Basin: ${disaster.basin}` : ""}
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; background: rgba(15,23,42,0.6); padding: 6px; border-radius: 6px;">
              <div><span style="color: #64748b;">Peak Level:</span> <b style="color: #f8fafc;">${disaster.peak_flood_level.toFixed(1)}m</b></div>
              <div><span style="color: #64748b;">Danger:</span> <b style="color: #ef4444;">${disaster.danger_level.toFixed(1)}m</b></div>
              <div><span style="color: #64748b;">Rainfall:</span> <b style="color: #38bdf8;">${disaster.rainfall_mm.toFixed(0)}mm</b></div>
              <div><span style="color: #64748b;">Distance:</span> <b style="color: #e2e8f0;">${disaster.distance_km}km</b></div>
            </div>
            <div style="margin-top: 6px; font-size: 9px; color: #64748b; font-family: monospace;">
              GPS: ${disasterLat.toFixed(4)}°N, ${disasterLon.toFixed(4)}°E
            </div>
          </div>
        `

        const disasterMarker = L.marker([disasterLat, disasterLon], { icon: disasterIcon })
          .addTo(map)
          .bindPopup(popupContent, {
            className: "tactical-leaflet-popup",
            closeButton: false,
          })

        // 3. Command Post Marker (if different from disaster spot)
        const cmdLat = commandLocation.latitude
        const cmdLon = commandLocation.longitude
        if (cmdLat && cmdLon && (Math.abs(cmdLat - disasterLat) > 0.005 || Math.abs(cmdLon - disasterLon) > 0.005)) {
          const cmdIcon = L.divIcon({
            className: "custom-cmd-marker",
            html: `
              <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
                <span style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: #0284c7; opacity: 0.8; box-shadow: 0 0 10px #0284c7;"></span>
                <span style="position: relative; width: 8px; height: 8px; border-radius: 50%; background-color: #ffffff;"></span>
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          })

          L.marker([cmdLat, cmdLon], { icon: cmdIcon })
            .addTo(map)
            .bindPopup(
              `<div style="font-size: 11px; font-weight: bold; color: #f8fafc;">📍 Operations Command Post<br/><span style="font-size: 10px; font-weight: normal; color: #94a3b8;">${commandLocation.name || "Incident HQ"}</span></div>`,
              { className: "tactical-leaflet-popup", closeButton: false }
            )

          // Vector line connecting command to disaster epicenter
          L.polyline([[cmdLat, cmdLon], [disasterLat, disasterLon]], {
            color: "#38bdf8",
            weight: 2,
            opacity: 0.7,
            dashArray: "5, 8",
          }).addTo(map)

          // Fit bounds to show both
          const bounds = L.latLngBounds([[cmdLat, cmdLon], [disasterLat, disasterLon]])
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
        } else {
          disasterMarker.openPopup()
        }

        setIsLoaded(true)
      } catch (err) {
        console.error("Leaflet load error:", err)
      }
    }

    loadLeaflet()

    return () => {
      isCancelled = true
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [disasterLat, disasterLon, commandLocation.latitude, commandLocation.longitude, riskLevel, riskScore, color])

  // Update map tile layer on style change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return
    const L = (window as any).L
    if (!L) return

    mapInstanceRef.current.removeLayer(tileLayerRef.current)
    const config = TILE_LAYERS[mapStyle]
    tileLayerRef.current = L.tileLayer(config.url, {
      subdomains: config.subdomains,
      maxZoom: config.maxZoom,
    }).addTo(mapInstanceRef.current)
  }, [mapStyle])

  // Map controls
  function handleZoomIn() {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn()
  }

  function handleZoomOut() {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut()
  }

  function handleCenterDisaster() {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([disasterLat, disasterLon], 12, { duration: 1 })
    }
  }

  function toggleFullscreen() {
    setIsFullscreen(!isFullscreen)
    setTimeout(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize()
    }, 200)
  }

  return (
    <div
      className={`relative rounded-2xl border border-white/10 bg-slate-950 shadow-2xl overflow-hidden backdrop-blur-md transition-all ${
        isFullscreen
          ? "fixed inset-4 z-50 h-[calc(100vh-2rem)] rounded-2xl"
          : "h-[440px] w-full"
      }`}
    >
      {/* Map Header / HUD Top Bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div
            className="size-2.5 rounded-full animate-ping"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
            <Crosshair className="size-3.5 text-primary" />
            Tactical Disaster Spot Telemetry Map
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${color}20`,
              color: color,
              border: `1px solid ${color}50`,
            }}
          >
            {disaster.station || "Disaster Epicenter"}
          </span>
        </div>

        {/* Layer Switcher & Fullscreen controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg bg-slate-900/80 p-0.5 border border-white/10 text-[11px] font-bold">
            {(["dark", "satellite", "street"] as const).map((style) => (
              <button
                key={style}
                onClick={() => setMapStyle(style)}
                className={`px-2 py-1 rounded-md capitalize transition ${
                  mapStyle === style
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {style}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="rounded-lg border border-white/10 bg-slate-900/80 p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>
        </div>
      </div>

      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="h-full w-full bg-slate-950" />

      {/* HUD Tactical Overlay Controls (Right Side) */}
      <div className="absolute right-3 top-14 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-slate-900/90 text-slate-200 shadow-lg hover:bg-slate-800 hover:text-white transition"
          aria-label="Zoom In"
        >
          <ZoomIn className="size-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-slate-900/90 text-slate-200 shadow-lg hover:bg-slate-800 hover:text-white transition"
          aria-label="Zoom Out"
        >
          <ZoomOut className="size-4" />
        </button>
        <button
          onClick={handleCenterDisaster}
          className="flex size-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/20 text-primary shadow-lg hover:bg-primary/30 transition"
          title="Center on Disaster Spot"
          aria-label="Center on Disaster"
        >
          <Crosshair className="size-4" />
        </button>
      </div>

      {/* HUD Telemetry Bottom Bar */}
      <div className="absolute bottom-2.5 inset-x-3 z-10 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/85 px-3 py-2 text-xs backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
            <Navigation className="size-3 text-primary rotate-45" />
            <span>
              GPS: <b className="text-white">{disasterLat.toFixed(4)}° N, {disasterLon.toFixed(4)}° E</b>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-300">
            <Radio className="size-3 text-sky-400" />
            <span>
              Impact Zone: <b className="text-sky-300">5.0 km Radial Perimeter</b>
            </span>
          </div>

          {disaster.river && (
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-300">
              <span className="text-slate-500">·</span>
              <span>
                River: <b className="text-slate-200">{disaster.river}</b>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider"
            style={{ color: color }}
          >
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
            {riskLevel} Severity
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            ({disaster.distance_km} km away)
          </span>
        </div>
      </div>

      {/* Popup styling injection */}
      <style jsx global>{`
        .tactical-leaflet-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          color: #f8fafc;
        }
        .tactical-leaflet-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

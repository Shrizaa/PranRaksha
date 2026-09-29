"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"

export interface AppLocation {
  latitude: number
  longitude: number
  relief_days: number
  label?: string
}

export const AI_ANALYSIS_STEPS = [
  "Analyzing flood conditions...",
  "Analyzing population impact...",
  "Checking nearby infrastructure...",
  "Calculating resource requirements...",
  "Finding nearest warehouse...",
  "Analyzing resource shortages...",
  "Generating response plan...",
]

interface AppContextValue {
  location: AppLocation
  setLocation: (loc: AppLocation) => void
  isAnalyzing: boolean
  currentStepIndex: number
  currentStepText: string
  runAssessment: (customLoc?: AppLocation) => Promise<void>
}

export const DEFAULT_LOCATION: AppLocation = {
  latitude: 26.1445,
  longitude: 91.7362,
  relief_days: 3,
  label: "Guwahati, Assam",
}

const AppContext = createContext<AppContextValue | null>(null)
const STORAGE_KEY = "pranraksha_location"

/**
 * Sanitize any value from localStorage/state so label is ALWAYS a string
 * and numeric fields are always finite numbers.
 */
export function sanitizeLocation(raw: unknown): AppLocation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_LOCATION
  const r = raw as Record<string, unknown>
  const lat = Number(r.latitude)
  const lon = Number(r.longitude)
  const days = Number(r.relief_days)

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return DEFAULT_LOCATION

  // Ensure label is ALWAYS a string — never let an object through
  let label: string = DEFAULT_LOCATION.label as string
  if (typeof r.label === "string" && r.label.trim()) {
    label = r.label
  } else if (r.label !== null && r.label !== undefined && typeof r.label === "object") {
    // Legacy: label was stored as an object like {name, lat, lon}
    const obj = r.label as Record<string, unknown>
    label = typeof obj.name === "string" && obj.name.trim()
      ? obj.name
      : `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`
  }

  return {
    latitude: lat,
    longitude: lon,
    relief_days: Number.isFinite(days) && days >= 1 ? Math.floor(days) : DEFAULT_LOCATION.relief_days,
    label,
  }
}

/** Read and sanitize location from localStorage, synchronously */
function loadInitialLocation(): AppLocation {
  if (typeof window === "undefined") return DEFAULT_LOCATION
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return sanitizeLocation(JSON.parse(raw))
  } catch {
    /* ignore parse errors */
  }
  return DEFAULT_LOCATION
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Lazy initializer runs synchronously on mount — avoids hydration mismatch AND ensures
  // the label is always a string from the very first render, never an object.
  const [location, setLocationState] = useState<AppLocation>(loadInitialLocation)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)

  // Re-sanitize on every location state update to be extra safe
  const setLocation = useCallback((loc: AppLocation) => {
    const safe = sanitizeLocation(loc)
    setLocationState(safe)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
    } catch {
      /* ignore */
    }
  }, [])

  // Clear any corrupt localStorage on first mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const safe = sanitizeLocation(parsed)
        // If label changed (was an object), rewrite clean version
        if (parsed.label !== safe.label) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe))
          setLocationState(safe)
        }
      }
    } catch {
      /* ignore */
    }
  }, [])

  const runAssessment = useCallback(
    async (newLoc?: AppLocation) => {
      const target = sanitizeLocation(newLoc ?? location)
      setIsAnalyzing(true)
      setCurrentStepIndex(0)

      for (let i = 0; i < AI_ANALYSIS_STEPS.length; i++) {
        setCurrentStepIndex(i)
        await new Promise((resolve) => setTimeout(resolve, 220))
      }

      setLocation(target)
      await new Promise((resolve) => setTimeout(resolve, 150))
      setIsAnalyzing(false)
    },
    [location, setLocation]
  )

  return (
    <AppContext.Provider
      value={{
        location,
        setLocation,
        isAnalyzing,
        currentStepIndex,
        currentStepText: AI_ANALYSIS_STEPS[currentStepIndex] || AI_ANALYSIS_STEPS[0],
        runAssessment,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useAppLocation() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppLocation must be used within AppProvider")
  return ctx
}

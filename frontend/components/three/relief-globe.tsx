"use client"

import React, {
  Component,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Line } from "@react-three/drei"
import * as THREE from "three"
import { useLanguage } from "@/lib/i18n/language-context"

const DEG2RAD = Math.PI / 180

export function latLonToVec3(lat: number, lon: number, radius: number) {
  const phi = (90 - lat) * DEG2RAD
  const theta = (lon + 180) * DEG2RAD
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

export interface MarkerData {
  id: string
  name: string
  sub?: string
  lat: number
  lon: number
  riskLevel?: "Low" | "Moderate" | "High" | "Critical" | string
  riskScore?: number
  population?: number
  priority?: string
  type?: "disaster" | "warehouse" | "hospital" | "shelter"
}

// Glowing Latitude / Longitude Graticule grid (matches Image 2)
function TacticalGraticule({ radius }: { radius: number }) {
  const lines = useMemo(() => {
    const segs: { points: THREE.Vector3[]; isMajor: boolean }[] = []
    // Latitudes (Parallels)
    for (let lat = -75; lat <= 75; lat += 15) {
      const ring: THREE.Vector3[] = []
      for (let lon = -180; lon <= 180; lon += 5) {
        ring.push(latLonToVec3(lat, lon, radius))
      }
      segs.push({ points: ring, isMajor: lat === 0 || Math.abs(lat) === 30 })
    }
    // Longitudes (Meridians)
    for (let lon = -180; lon < 180; lon += 22.5) {
      const ring: THREE.Vector3[] = []
      for (let lat = -90; lat <= 90; lat += 5) {
        ring.push(latLonToVec3(lat, lon, radius))
      }
      segs.push({ points: ring, isMajor: lon === 0 || lon === 90 || lon === -90 })
    }
    return segs
  }, [radius])

  return (
    <group>
      {lines.map((l, i) => (
        <Line
          key={i}
          points={l.points}
          color={l.isMajor ? "#22d3ee" : "#0284c7"}
          transparent
          opacity={l.isMajor ? 0.32 : 0.14}
          lineWidth={l.isMajor ? 1.4 : 0.9}
        />
      ))}
    </group>
  )
}

// Clean tactical marker with subtle pulsing ring and clean badge
function CleanMarker({
  marker,
  radius,
  active,
}: {
  marker: MarkerData
  radius: number
  active?: boolean
}) {
  const isWarehouse = marker.type === "warehouse"
  const color = isWarehouse ? "#38bdf8" : active ? "#22d3ee" : "#7dd3fc"

  const pos = useMemo(
    () => latLonToVec3(marker.lat, marker.lon, radius * 1.01),
    [marker.lat, marker.lon, radius]
  )

  const lookOut = useMemo(() => {
    const m = new THREE.Matrix4()
    m.lookAt(new THREE.Vector3(0, 0, 0), pos, new THREE.Vector3(0, 1, 0))
    return new THREE.Quaternion().setFromRotationMatrix(m)
  }, [pos])

  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t1 = (clock.getElapsedTime() * 1.2) % 1
    if (ring1Ref.current) {
      const s = 1 + t1 * (active ? 3.0 : 2.0)
      ring1Ref.current.scale.set(s, s, s)
      const mat = ring1Ref.current.material as THREE.MeshBasicMaterial
      if (mat) mat.opacity = 0.75 * (1 - t1)
    }
    if (active && ring2Ref.current) {
      const t2 = ((clock.getElapsedTime() * 1.2) + 0.4) % 1
      const s2 = 1 + t2 * 3.5
      ring2Ref.current.scale.set(s2, s2, s2)
      const mat2 = ring2Ref.current.material as THREE.MeshBasicMaterial
      if (mat2) mat2.opacity = 0.4 * (1 - t2)
    }
  })

  return (
    <group position={pos} quaternion={lookOut}>
      {/* Marker core dot — larger & glowing for active */}
      <mesh>
        <sphereGeometry args={[radius * (active ? 0.036 : isWarehouse ? 0.022 : 0.018), 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Inner pulsing ring */}
      <mesh ref={ring1Ref}>
        <ringGeometry args={[radius * 0.022, radius * 0.036, 32]} />
        <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
      </mesh>

      {/* Outer pulsing ring — active only */}
      {active && (
        <mesh ref={ring2Ref}>
          <ringGeometry args={[radius * 0.026, radius * 0.044, 32]} />
          <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

// 3D Moving Globe Mesh (Immediately auto-rotating on startup)
function GlobeMesh({
  radius,
  autoRotate = true,
  markers,
  activeCoord,
  nearestWarehouseCoord,
}: {
  radius: number
  autoRotate?: boolean
  markers: MarkerData[]
  activeCoord?: { lat: number; lon: number } | null
  nearestWarehouseCoord?: { lat: number; lon: number; name?: string } | null
}) {
  const group = useRef<THREE.Group>(null)

  // Continuously 3D moving
  useFrame((_, delta) => {
    if (group.current && autoRotate) {
      group.current.rotation.y += delta * 0.12
    }
  })

  const { t } = useLanguage()

  return (
    <group ref={group} rotation={[0, -Math.PI * 0.4, 0]}>
      {/* 1. Dark Sphere Core */}
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial
          color="#061224"
          emissive="#041a2f"
          emissiveIntensity={0.5}
          specular="#38bdf8"
          shininess={18}
          transparent
          opacity={0.96}
        />
      </mesh>

      {/* 2. Cyan Wireframe Shell (Matches Image 2) */}
      <mesh>
        <sphereGeometry args={[radius * 1.008, 36, 36]} />
        <meshBasicMaterial
          color="#22d3ee"
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>

      {/* 3. Tactical Graticule Lines */}
      <TacticalGraticule radius={radius * 1.004} />

      {/* 4. Active Disaster Epicentre Marker — double pulsing rings */}
      {activeCoord && (
        <CleanMarker
          marker={{
            id: "__active_disaster__",
            name: t("Active Target Zone"),
            sub: t("Disaster Epicentre"),
            lat: activeCoord.lat,
            lon: activeCoord.lon,
            riskLevel: "Critical",
            type: "disaster",
          }}
          radius={radius}
          active
        />
      )}

      {/* 5. Warehouse Markers */}
      {nearestWarehouseCoord && (
        <CleanMarker
          marker={{
            id: "__nearest_warehouse__",
            name: nearestWarehouseCoord.name ? t(nearestWarehouseCoord.name) : t("Warehouse Hub"),
            lat: nearestWarehouseCoord.lat,
            lon: nearestWarehouseCoord.lon,
            type: "warehouse",
          }}
          radius={radius}
        />
      )}

      {/* Additional network markers */}
      {markers.map((m) => (
        <CleanMarker
          key={m.id}
          marker={{
            ...m,
            name: t(m.name),
            sub: m.sub ? t(m.sub) : undefined,
          }}
          radius={radius}
        />
      ))}
    </group>
  )
}

// Fallback boundary
class WebGLBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn("ReliefGlobe WebGL caught error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-[#07111e] rounded-2xl border border-sky-500/20 text-white">
            <p className="text-sm font-semibold">Tactical 2D Emergency Fallback</p>
          </div>
        )
      )
    }
    return this.props.children
  }
}

export interface ReliefGlobeProps {
  markers?: MarkerData[]
  activeCoord?: { lat: number; lon: number } | null
  nearestWarehouseCoord?: { lat: number; lon: number; name?: string } | null
  autoRotate?: boolean
  onSelect?: (marker: MarkerData) => void
  activeId?: string | null
  className?: string
  enableControls?: boolean
}

export function ReliefGlobe({
  markers = [],
  activeCoord = null,
  nearestWarehouseCoord = null,
  autoRotate = true,
  className,
  enableControls = true,
}: ReliefGlobeProps) {
  const radius = 2.1

  return (
    <WebGLBoundary>
      <div className={className ?? "relative h-full w-full min-h-[300px] overflow-hidden rounded-2xl bg-[#070f1e]"}>
        <Canvas
          camera={{ position: [0, 0.8, 5.2], fov: 42 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["#070f1e"]} />

          {/* Clean Lighting */}
          <directionalLight position={[10, 8, 8]} intensity={1.8} color="#ffffff" />
          <ambientLight intensity={0.6} color="#0d2440" />

          {/* Stars */}
          <Stars
            radius={80}
            depth={40}
            count={2200}
            factor={3.5}
            saturation={0}
            fade
            speed={0.5}
          />

          {/* 3D Wireframe Globe with smooth auto-rotation */}
          <GlobeMesh
            radius={radius}
            autoRotate={autoRotate}
            markers={markers}
            activeCoord={activeCoord}
            nearestWarehouseCoord={nearestWarehouseCoord}
          />

          {enableControls && (
            <OrbitControls
              enablePan={false}
              enableZoom
              minDistance={3.0}
              maxDistance={8.5}
              rotateSpeed={0.55}
            />
          )}
        </Canvas>
      </div>
    </WebGLBoundary>
  )
}

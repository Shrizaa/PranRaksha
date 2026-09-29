import * as THREE from "three"

// Generates procedural high-resolution realistic Earth maps for Three.js
// Avoids external image dependencies, ensuring 100% offline reliability & instant load.

interface TextureCache {
  satellite?: THREE.CanvasTexture
  night?: THREE.CanvasTexture
  tactical?: THREE.CanvasTexture
  clouds?: THREE.CanvasTexture
  specular?: THREE.CanvasTexture
}

const cache: TextureCache = {}

// Continent path definitions for realistic geographic representation
// Coordinates mapped to Canvas X [0, W] and Y [0, H]
function drawContinents(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  mode: "satellite" | "night" | "tactical"
) {
  const toX = (lon: number) => ((lon + 180) / 360) * w
  const toY = (lat: number) => ((90 - lat) / 180) * h

  // Helper to draw a closed polygonal landmass
  const drawPolygon = (coords: [number, number][], fillStyle: string, strokeStyle?: string) => {
    ctx.beginPath()
    coords.forEach(([lat, lon], idx) => {
      const x = toX(lon)
      const y = toY(lat)
      if (idx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = fillStyle
    ctx.fill()
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle
      ctx.lineWidth = 1.2
      ctx.stroke()
    }
  }

  // Color palettes based on mode
  const landBase =
    mode === "satellite" ? "#1b3524" : mode === "night" ? "#0a1322" : "#0d2238"
  const landHighlight =
    mode === "satellite" ? "#2d4a34" : mode === "night" ? "#0f1c30" : "#133454"
  const desertColor =
    mode === "satellite" ? "#4a3e26" : mode === "night" ? "#0d1726" : "#122a42"
  const iceColor =
    mode === "satellite" ? "#e2e8f0" : mode === "night" ? "#1e293b" : "#1e3a5f"
  const coastGlow =
    mode === "satellite" ? "#38bdf8" : mode === "night" ? "#0284c7" : "#06b6d4"

  // 1. Indian Subcontinent & South Asia (High Detail for Indian disaster response)
  drawPolygon(
    [
      [35, 74], [32, 78], [28, 88], [26, 92], [28, 96], [24, 94], [21, 89],
      [19, 85], [16, 82], [13, 80], [10, 79], [8, 77.5], [10, 76], [15, 73.5],
      [20, 73], [24, 69], [28, 70], [31, 70], [35, 74]
    ],
    landHighlight,
    coastGlow
  )

  // Sri Lanka
  drawPolygon(
    [[9.8, 80.2], [8.5, 81.2], [6.0, 80.5], [7.0, 79.8], [9.8, 80.2]],
    landHighlight,
    coastGlow
  )

  // 2. Eurasia & East Asia
  drawPolygon(
    [
      [70, 20], [72, 60], [70, 100], [73, 140], [66, 170], [55, 160],
      [45, 145], [35, 130], [25, 120], [15, 108], [5, 100], [10, 98],
      [20, 100], [25, 90], [30, 80], [38, 65], [42, 50], [45, 35],
      [55, 25], [62, 10], [70, 20]
    ],
    landBase,
    coastGlow
  )

  // Himalayas & Tibetan Plateau (High Elevation)
  drawPolygon(
    [
      [36, 75], [35, 85], [32, 98], [28, 97], [27, 88], [30, 80], [36, 75]
    ],
    mode === "satellite" ? "#5a4b32" : landHighlight
  )

  // 3. Africa
  drawPolygon(
    [
      [35, -5], [37, 10], [32, 32], [25, 36], [12, 51], [2, 45],
      [-10, 40], [-25, 32], [-34, 25], [-34, 18], [-20, 12], [-5, 10],
      [5, 8], [5, -2], [15, -16], [28, -12], [35, -5]
    ],
    desertColor,
    coastGlow
  )

  // Madagascar
  drawPolygon(
    [[-12, 49], [-16, 50], [-25, 47], [-25, 44], [-16, 44], [-12, 49]],
    landBase,
    coastGlow
  )

  // 4. Europe & Mediterranean
  drawPolygon(
    [
      [60, -5], [62, 10], [55, 25], [45, 35], [40, 25], [38, 15],
      [36, -5], [43, -9], [48, -4], [55, -2], [60, -5]
    ],
    landHighlight,
    coastGlow
  )

  // Scandinavia
  drawPolygon(
    [[71, 26], [68, 15], [58, 6], [58, 12], [64, 21], [71, 26]],
    landBase,
    coastGlow
  )

  // 5. North America
  drawPolygon(
    [
      [70, -160], [72, -120], [68, -85], [55, -55], [45, -65], [30, -80],
      [25, -80], [22, -97], [15, -92], [20, -105], [32, -117], [48, -125],
      [60, -140], [65, -168], [70, -160]
    ],
    landBase,
    coastGlow
  )

  // 6. South America
  drawPolygon(
    [
      [12, -72], [10, -60], [0, -50], [-5, -35], [-22, -40], [-35, -55],
      [-55, -67], [-50, -75], [-20, -70], [-5, -80], [8, -78], [12, -72]
    ],
    landHighlight,
    coastGlow
  )

  // 7. Australia & Oceania
  drawPolygon(
    [
      [-12, 130], [-15, 136], [-12, 142], [-22, 150], [-34, 151],
      [-38, 145], [-35, 116], [-22, 114], [-18, 122], [-12, 130]
    ],
    desertColor,
    coastGlow
  )

  // 8. Antarctica & Arctic Ice Caps
  drawPolygon(
    [
      [-65, -180], [-65, 180], [-90, 180], [-90, -180], [-65, -180]
    ],
    iceColor
  )
  drawPolygon(
    [
      [80, -180], [80, 180], [90, 180], [90, -180], [80, -180]
    ],
    iceColor
  )

  // 9. Realistic Night City Light Clusters (Golden & Amber Pinpoints)
  if (mode === "night" || mode === "tactical") {
    const lights: [number, number, number, string][] = [
      // India Cluster (Dense Emergency Response Coverage)
      [28.6, 77.2, 5, "#fde047"], // New Delhi
      [19.0, 72.8, 6, "#facc15"], // Mumbai
      [12.9, 77.6, 5, "#38bdf8"], // Bangalore Tech Hub
      [13.0, 80.2, 4, "#fbbf24"], // Chennai
      [22.5, 88.3, 5, "#f59e0b"], // Kolkata
      [17.3, 78.4, 4, "#38bdf8"], // Hyderabad
      [26.1, 91.7, 4, "#38bdf8"], // Guwahati Hub
      [25.6, 85.1, 4, "#fbbf24"], // Patna
      [20.3, 85.8, 4, "#facc15"], // Bhubaneswar
      [9.9, 76.2, 3, "#38bdf8"],  // Kochi
      [23.0, 72.5, 4, "#fbbf24"], // Ahmedabad
      // Major Global Nodes
      [51.5, -0.1, 4, "#fde047"],  // London
      [48.8, 2.3, 4, "#fde047"],   // Paris
      [40.7, -74.0, 5, "#fde047"], // New York
      [34.0, -118.2, 5, "#fde047"],// LA
      [35.6, 139.6, 6, "#fde047"], // Tokyo
      [31.2, 121.4, 6, "#fde047"], // Shanghai
      [1.3, 103.8, 4, "#38bdf8"],  // Singapore
      [25.2, 55.3, 5, "#facc15"],  // Dubai
      [-33.8, 151.2, 4, "#fde047"],// Sydney
    ]

    lights.forEach(([lat, lon, size, col]) => {
      const cx = toX(lon)
      const cy = toY(lat)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 2.5)
      grad.addColorStop(0, col)
      grad.addColorStop(0.3, col)
      grad.addColorStop(1, "transparent")
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, size * 2.5, 0, Math.PI * 2)
      ctx.fill()
    })
  }
}

/**
 * Creates a high-fidelity Earth surface CanvasTexture
 */
export function getRealisticEarthTexture(
  mode: "satellite" | "night" | "tactical" = "satellite"
): THREE.CanvasTexture {
  if (cache[mode]) return cache[mode]!

  const width = 2048
  const height = 1024
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  // 1. Deep Ocean Base with Radial Depth Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height)
  if (mode === "satellite") {
    oceanGrad.addColorStop(0, "#081d33")
    oceanGrad.addColorStop(0.2, "#041527")
    oceanGrad.addColorStop(0.5, "#020d1c")
    oceanGrad.addColorStop(0.8, "#041527")
    oceanGrad.addColorStop(1, "#081d33")
  } else if (mode === "night") {
    oceanGrad.addColorStop(0, "#030812")
    oceanGrad.addColorStop(0.5, "#01040a")
    oceanGrad.addColorStop(1, "#030812")
  } else {
    // Tactical mode
    oceanGrad.addColorStop(0, "#061324")
    oceanGrad.addColorStop(0.5, "#020a14")
    oceanGrad.addColorStop(1, "#061324")
  }
  ctx.fillStyle = oceanGrad
  ctx.fillRect(0, 0, width, height)

  // 2. Subtle Ocean Currents & Bathymetry Grid
  ctx.strokeStyle = "rgba(56, 189, 248, 0.04)"
  ctx.lineWidth = 1
  for (let y = 0; y < height; y += 64) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  for (let x = 0; x < width; x += 64) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // 3. Render Geographically Accurate Continents
  drawContinents(ctx, width, height, mode)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.generateMipmaps = true
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter

  cache[mode] = texture
  return texture
}

/**
 * Creates dynamic, photorealistic cloud cover with soft wispy transparency
 */
export function getRealisticCloudsTexture(): THREE.CanvasTexture {
  if (cache.clouds) return cache.clouds

  const width = 1024
  const height = 512
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!

  // Transparent base
  ctx.clearRect(0, 0, width, height)

  // Procedural cloud bands (Hadley cells & storm spirals)
  const drawCloudBand = (yCenter: number, spread: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const cx = Math.random() * width
      const cy = yCenter + (Math.random() - 0.5) * spread
      const rx = 40 + Math.random() * 90
      const ry = 15 + Math.random() * 35
      const alpha = 0.15 + Math.random() * 0.35

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx)
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
      grad.addColorStop(0.5, `rgba(240, 248, 255, ${alpha * 0.5})`)
      grad.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, Math.random() * 0.4 - 0.2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Tropical convergence zone (Equator)
  drawCloudBand(height * 0.5, 60, 60)
  // Mid-latitude cyclone bands
  drawCloudBand(height * 0.28, 70, 45)
  drawCloudBand(height * 0.72, 70, 45)
  // Cyclone spiral over Bay of Bengal / Indian Ocean
  const bengX = (260 / 360) * width
  const bengY = (75 / 180) * height
  const bengGrad = ctx.createRadialGradient(bengX, bengY, 0, bengX, bengY, 110)
  bengGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)")
  bengGrad.addColorStop(0.6, "rgba(255, 255, 255, 0.2)")
  bengGrad.addColorStop(1, "transparent")
  ctx.fillStyle = bengGrad
  ctx.beginPath()
  ctx.arc(bengX, bengY, 110, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  cache.clouds = texture
  return texture
}

/**
 * Creates atmospheric Fresnel glow shader for realistic Earth horizon halo
 */
export function createAtmosphereMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vEyeVector;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vEyeVector = normalize(-mvPosition.xyz);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vEyeVector;
      uniform vec3 color;
      void main() {
        float factor = 1.0 - max(0.0, dot(vEyeVector, vNormal));
        float intensity = pow(factor, 2.8);
        gl_FragColor = vec4(color, intensity * 0.9);
      }
    `,
    uniforms: {
      color: { value: new THREE.Color("#00d2ff") },
    },
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
  })
}

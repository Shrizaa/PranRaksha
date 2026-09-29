import type { LucideIcon } from "lucide-react"
import {
  ShieldAlert,
  Boxes,
  Warehouse,
  PackageCheck,
  TrendingDown,
  Hospital,
  Globe2,
  BrainCircuit,
} from "lucide-react"

export interface Feature {
  slug: string
  title: string
  short: string
  description: string
  icon: LucideIcon
  accent: string
  group: "operations" | "logistics" | "intelligence"
}

export const FEATURES: Feature[] = [
  {
    slug: "risk-assessment",
    title: "Flood Risk Assessment",
    short: "Risk Assessment",
    description:
      "Predict disaster severity, risk level and response priority from live weather, population and accessibility indicators.",
    icon: ShieldAlert,
    accent: "var(--chart-3)",
    group: "operations",
  },
  {
    slug: "resource-requirements",
    title: "Resource Requirements",
    short: "Requirements",
    description:
      "Compute food, water, medical and shelter needs for the affected population over the relief window.",
    icon: Boxes,
    accent: "var(--chart-1)",
    group: "operations",
  },
  {
    slug: "nearest-warehouse",
    title: "Nearest Warehouse",
    short: "Nearest Warehouse",
    description:
      "Locate the closest relief warehouse and rank the supply network by great-circle distance.",
    icon: Warehouse,
    accent: "var(--chart-1)",
    group: "logistics",
  },
  {
    slug: "resource-availability",
    title: "Resource Availability",
    short: "Availability",
    description:
      "Compare required relief resources against the live stock held at the responding warehouse.",
    icon: PackageCheck,
    accent: "var(--chart-4)",
    group: "logistics",
  },
  {
    slug: "shortage-analysis",
    title: "Shortage Analysis",
    short: "Shortage Analysis",
    description:
      "Quantify supply gaps per resource and flag whether the response is sufficient or under-supplied.",
    icon: TrendingDown,
    accent: "var(--chart-3)",
    group: "logistics",
  },
  {
    slug: "nearby-infrastructure",
    title: "Nearby Infrastructure",
    short: "Infrastructure",
    description:
      "Map hospitals, schools and relief shelters within 5km of the disaster epicentre.",
    icon: Hospital,
    accent: "var(--chart-5)",
    group: "operations",
  },
  {
    slug: "warehouse-network",
    title: "Warehouse Network",
    short: "3D Network",
    description:
      "Explore the national relief warehouse network in an interactive 3D command view.",
    icon: Globe2,
    accent: "var(--chart-1)",
    group: "intelligence",
  },
]

export function getFeature(slug: string) {
  return FEATURES.find((f) => f.slug === slug)
}

"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  ShieldAlert,
  ClipboardList,
  Building2,
  Warehouse,
  PackageCheck,
  TrendingDown,
  AlertOctagon,
  BookOpen,
  Settings,
  LogOut,
  X,
  User,
  ChevronRight,
} from "lucide-react"
import { clearSession, getUser } from "@/lib/api-client"
import { useLanguage } from "@/lib/i18n/language-context"
import { cn } from "@/lib/utils"

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()
  const [user, setUser] = useState<string | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  async function handleLogout() {
    try {
      const { getToken } = await import("@/lib/api-client")

      await fetch("/api/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken() ?? ""}`,
        },
      })
    } catch {
      /* ignore */
    }

    clearSession()
    router.replace("/")
  }

  const disasterIntakeNav = [
    {
      label: t("Report New Disaster"),
      href: "/dashboard/new-disaster",
      icon: AlertOctagon,
      active: pathname.startsWith("/dashboard/new-disaster"),
    },
    {
      label: t("My Reported Disasters"),
      href: "/dashboard/disaster-history",
      icon: BookOpen,
      active: pathname.startsWith("/dashboard/disaster-history"),
    },
  ]

  const operationsNav = [
    {
      label: t("Risk Assessment"),
      href: "/dashboard/risk-assessment",
      icon: ShieldAlert,
      active: pathname.startsWith("/dashboard/risk-assessment"),
    },
    {
      label: t("Requirements"),
      href: "/dashboard/resource-requirements",
      icon: ClipboardList,
      active: pathname.startsWith("/dashboard/resource-requirements"),
    },
    {
      label: t("Infrastructure"),
      href: "/dashboard/nearby-infrastructure",
      icon: Building2,
      active: pathname.startsWith("/dashboard/nearby-infrastructure"),
    },
  ]

  const logisticsNav = [
    {
      label: t("Nearest Warehouse"),
      href: "/dashboard/nearest-warehouse",
      icon: Warehouse,
      active: pathname.startsWith("/dashboard/nearest-warehouse"),
    },
    {
      label: t("Availability"),
      href: "/dashboard/resource-availability",
      icon: PackageCheck,
      active: pathname.startsWith("/dashboard/resource-availability"),
    },
    {
      label: t("Shortage Analysis"),
      href: "/dashboard/shortage-analysis",
      icon: TrendingDown,
      active: pathname.startsWith("/dashboard/shortage-analysis"),
    },
  ]

  const renderNavItems = (
    items: typeof operationsNav,
    accentColor: string = "text-primary",
    borderColor: string = "border-primary/25",
    bgColor: string = "bg-primary/15",
  ) =>
    items.map((item) => {
      const Icon = item.icon

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onClose}
          className={cn(
            "group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
            item.active
              ? `${bgColor} ${accentColor} shadow-sm border ${borderColor} font-semibold`
              : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          )}
        >
          <div className="flex items-center gap-3 truncate">
            <Icon
              className={cn(
                "size-4 shrink-0 transition-colors",
                item.active
                  ? accentColor
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />

            <span className="truncate">{t(item.label)}</span>
          </div>

          {item.active && (
            <ChevronRight
              className={`size-3.5 shrink-0 ${accentColor}`}
            />
          )}
        </Link>
      )
    })

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0 shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between gap-3 border-b border-sidebar-border/80 px-5 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-4 group"
          >
            {/* Large circular PranRaksha logo */}
            <div className="size-16 shrink-0 overflow-hidden rounded-full shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Image
                src="/pwa-512x512.png"
                alt="PranRaksha"
                width={64}
                height={64}
                className="h-full w-full rounded-full object-cover"
              />
            </div>

            {/* Brand text */}
            <div className="flex flex-col">
              <h2 className="text-base font-black tracking-wider uppercase text-foreground leading-none">
                PRANRAKSHA
              </h2>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground leading-tight">
                {t("Emergency Response Platform")}
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-card hover:text-foreground lg:hidden transition"
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">

          {/* Dashboard */}
          <div className="space-y-1">
            <Link
              href="/dashboard"
              onClick={onClose}
              className={cn(
                "group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                pathname === "/dashboard"
                  ? "bg-primary/20 text-primary shadow-sm border border-primary/30 font-bold"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <div className="flex items-center gap-3 truncate">
                <LayoutDashboard
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    pathname === "/dashboard"
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />

                <span className="truncate">
                  {t("Dashboard")}
                </span>
              </div>

              {pathname === "/dashboard" && (
                <span className="size-2 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          </div>

          {/* DISASTER REPORTING */}
          <div className="space-y-1.5">
            <div className="px-3 pb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400/90">
                {t("DISASTER REPORTING")}
              </span>

              <span className="size-1.5 rounded-full bg-red-400/50 animate-pulse" />
            </div>

            {renderNavItems(
              disasterIntakeNav,
              "text-red-300",
              "border-red-500/30",
              "bg-red-500/10",
            )}
          </div>

          {/* OPERATIONS */}
          <div className="space-y-1.5">
            <div className="px-3 pb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                {t("OPERATIONS")}
              </span>

              <span className="size-1.5 rounded-full bg-primary/40" />
            </div>

            {renderNavItems(operationsNav)}
          </div>

          {/* LOGISTICS */}
          <div className="space-y-1.5">
            <div className="px-3 pb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400/80">
                {t("LOGISTICS")}
              </span>

              <span className="size-1.5 rounded-full bg-sky-400/40" />
            </div>

            {renderNavItems(
              logisticsNav,
              "text-sky-400",
              "border-sky-400/30",
              "bg-sky-500/10",
            )}
          </div>

          {/* Settings */}
          <div className="pt-2 border-t border-sidebar-border/50">
            <Link
              href="/dashboard/settings"
              onClick={onClose}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all",
                pathname.startsWith("/dashboard/settings")
                  ? "bg-primary/20 text-primary font-bold border border-primary/30"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Settings className="size-4 shrink-0 text-primary transition-transform group-hover:rotate-45" />

                <span className="truncate">
                  {t("Settings & Preferences")}
                </span>
              </div>

              <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary transition" />
            </Link>
          </div>
        </nav>

        {/* User Profile & Logout */}
        <div className="border-t border-sidebar-border/80 p-3.5 space-y-2">
          <div className="flex items-center gap-3 rounded-xl bg-card/60 border border-border/60 p-2.5 shadow-sm">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold uppercase text-primary ring-1 ring-primary/40">
              <User className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold capitalize text-foreground">
                {user ?? "Relief Commander"}
              </p>

              <p className="text-[10px] text-muted-foreground font-mono flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Session Active
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs font-semibold text-destructive/80 transition hover:bg-destructive/15 hover:text-destructive"
          >
            <LogOut className="size-3.5" />
            <span>{t("Sign out")}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
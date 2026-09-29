"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Settings as SettingsIcon,
  Languages,
  Sun,
  Moon,
  Monitor,
  User,
  CheckCircle2,
  LogOut,
  Check,
  Globe,
} from "lucide-react"
import { useLanguage } from "@/lib/i18n/language-context"
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages"
import { getUser, clearSession, getToken } from "@/lib/api-client"

type ThemeMode = "dark" | "light" | "system"

export default function SettingsPage() {
  const router = useRouter()
  const { lang, setLang, t } = useLanguage()
  const [user, setUser] = useState<string | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [theme, setTheme] = useState<ThemeMode>("system")
  const [savedToast, setSavedToast] = useState<string | null>(null)

  useEffect(() => {
    setUser(getUser())
    setTokenState(getToken())

    try {
      const savedTheme = (localStorage.getItem("theme") as ThemeMode) || "system"
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } catch {
      applyTheme("system")
    }
  }, [])

  function applyTheme(mode: ThemeMode) {
    const root = document.documentElement

    if (mode === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else if (mode === "light") {
      root.classList.add("light")
      root.classList.remove("dark")
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches

      if (prefersDark) {
        root.classList.add("dark")
        root.classList.remove("light")
      } else {
        root.classList.add("light")
        root.classList.remove("dark")
      }
    }
  }

  function handleThemeChange(mode: ThemeMode) {
    setTheme(mode)

    try {
      localStorage.setItem("theme", mode)
    } catch {
      /* ignore */
    }

    applyTheme(mode)

    triggerToast(
      mode === "dark"
        ? "Dark theme applied"
        : mode === "light"
          ? "Light theme applied"
          : "System theme synchronized"
    )
  }

  function handleLanguageChange(code: string) {
    setLang(code)

    const selected = SUPPORTED_LANGUAGES.find((l) => l.code === code)

    triggerToast(
      `Language changed to ${selected?.nativeName || selected?.name}`
    )
  }

  function triggerToast(msg: string) {
    setSavedToast(msg)
    setTimeout(() => setSavedToast(null), 3000)
  }

  async function handleLogout() {
    try {
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

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === lang) ||
    SUPPORTED_LANGUAGES[0]

  const isLight = theme === "light"

  return (
    <div
      className={`space-y-8 max-w-4xl mx-auto pb-16 transition-colors duration-300 ${isLight ? "text-gray-900" : ""
        }`}
    >
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 ${isLight ? "border-gray-200" : "border-border/80"
          }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex size-12 items-center justify-center rounded-2xl border shadow-lg ${isLight
                ? "border-blue-200 bg-blue-50 shadow-blue-100"
                : "border-primary/40 bg-primary/10 shadow-primary/20"
              }`}
          >
            <SettingsIcon
              className={`size-6 ${isLight ? "text-blue-600" : "text-primary"
                }`}
            />
          </div>

          <div>
            <h1
              className={`text-2xl font-black tracking-tight flex items-center gap-2 ${isLight ? "text-gray-900" : "text-foreground"
                }`}
            >
              {t("Settings")}
            </h1>

            <p
              className={`text-xs mt-0.5 ${isLight ? "text-gray-500" : "text-muted-foreground"
                }`}
            >
              Customize language, visual themes, and manage operator login
              session
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {savedToast && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-xs font-semibold backdrop-blur-md shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${isLight
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
            }`}
        >
          <CheckCircle2
            className={`size-4 shrink-0 ${isLight ? "text-emerald-600" : "text-emerald-400"
              }`}
          />
          <span>{savedToast}</span>
        </div>
      )}

      {/* LANGUAGE */}
      <section
        className={`rounded-2xl border p-6 shadow-xl backdrop-blur-md space-y-6 transition-colors ${isLight
            ? "border-gray-200 bg-white shadow-gray-200/70"
            : "border-white/10 bg-card/60"
          }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-4 ${isLight ? "border-gray-200" : "border-white/10"
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 items-center justify-center rounded-xl border ${isLight
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-sky-500/10 border-sky-500/30 text-sky-400"
                }`}
            >
              <Languages className="size-5" />
            </div>

            <div>
              <h2
                className={`text-base font-bold flex items-center gap-2 ${isLight ? "text-gray-900" : "text-foreground"
                  }`}
              >
                Language Preferences
              </h2>

              <p
                className={`text-xs ${isLight ? "text-gray-500" : "text-muted-foreground"
                  }`}
              >
                Select your preferred operational language across all disaster
                dashboards
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${isLight
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-sky-500/30 bg-sky-500/10 text-sky-300"
              }`}
          >
            <Globe className="size-3.5" />
            <span>
              Active: {currentLang.nativeName} ({currentLang.name})
            </span>
          </div>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = lang === item.code

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleLanguageChange(item.code)}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${isLight
                    ? isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md ring-1 ring-blue-400 font-bold"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                    : isSelected
                      ? "border-primary bg-primary/15 text-primary shadow-md ring-1 ring-primary/40 font-bold"
                      : "border-white/10 bg-slate-900/40 text-slate-300 hover:bg-slate-800/80 hover:border-white/20"
                  }`}
              >
                <div>
                  <p
                    className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-slate-100"
                      }`}
                  >
                    {item.nativeName}
                  </p>

                  <p
                    className={`text-[11px] mt-0.5 ${isLight ? "text-gray-500" : "text-slate-400"
                      }`}
                  >
                    {item.name}
                  </p>
                </div>

                {isSelected && (
                  <div
                    className={`flex size-5 items-center justify-center rounded-full shadow-sm ${isLight
                        ? "bg-blue-600 text-white"
                        : "bg-primary text-primary-foreground"
                      }`}
                  >
                    <Check className="size-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* THEME */}
      <section
        className={`rounded-2xl border p-6 shadow-xl backdrop-blur-md space-y-6 transition-colors ${isLight
            ? "border-gray-200 bg-white shadow-gray-200/70"
            : "border-white/10 bg-card/60"
          }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-4 ${isLight ? "border-gray-200" : "border-white/10"
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 items-center justify-center rounded-xl border ${isLight
                  ? "bg-amber-50 border-amber-200 text-amber-600"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}
            >
              <Sun className="size-5" />
            </div>

            <div>
              <h2
                className={`text-base font-bold ${isLight ? "text-gray-900" : "text-foreground"
                  }`}
              >
                System Theme & Appearance
              </h2>

              <p
                className={`text-xs ${isLight ? "text-gray-500" : "text-muted-foreground"
                  }`}
              >
                Choose between Light, Dark, or sync automatically with your
                System preferences
              </p>
            </div>
          </div>
        </div>

        {/* Theme Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              id: "dark" as ThemeMode,
              label: "Dark Mode",
              desc: "Tactical high-contrast dark theme optimized for low light",
              icon: Moon,
              color: isLight
                ? "text-indigo-600 border-indigo-200 bg-indigo-50"
                : "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
            },
            {
              id: "light" as ThemeMode,
              label: "Light Mode",
              desc: "Clean light interface optimized for bright daytime environments",
              icon: Sun,
              color: isLight
                ? "text-amber-600 border-amber-200 bg-amber-50"
                : "text-amber-400 border-amber-500/30 bg-amber-500/10",
            },
            {
              id: "system" as ThemeMode,
              label: "System Theme",
              desc: "Automatically adapts according to your operating system theme",
              icon: Monitor,
              color: isLight
                ? "text-emerald-600 border-emerald-200 bg-emerald-50"
                : "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
            },
          ].map((mode) => {
            const Icon = mode.icon
            const isSelected = theme === mode.id

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleThemeChange(mode.id)}
                className={`flex flex-col justify-between p-5 rounded-2xl border text-left transition-all ${isLight
                    ? isSelected
                      ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-300"
                      : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                    : isSelected
                      ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/40"
                      : "border-white/10 bg-slate-900/40 hover:bg-slate-800/80 hover:border-white/20"
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl border ${mode.color}`}
                    >
                      <Icon className="size-5" />
                    </div>

                    {isSelected && (
                      <span
                        className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isLight
                            ? "text-blue-700 bg-blue-100 border border-blue-200"
                            : "text-primary bg-primary/20 border border-primary/30"
                          }`}
                      >
                        <Check className="size-3.5" />
                        Active
                      </span>
                    )}
                  </div>

                  <h3
                    className={`text-sm font-bold ${isLight ? "text-gray-900" : "text-slate-100"
                      }`}
                  >
                    {mode.label}
                  </h3>

                  <p
                    className={`text-xs mt-1.5 leading-relaxed ${isLight ? "text-gray-500" : "text-slate-400"
                      }`}
                  >
                    {mode.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* USER ACCOUNT */}
      <section
        className={`rounded-2xl border p-6 shadow-xl backdrop-blur-md space-y-6 transition-colors ${isLight
            ? "border-gray-200 bg-white shadow-gray-200/70"
            : "border-white/10 bg-card/60"
          }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-4 ${isLight ? "border-gray-200" : "border-white/10"
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 items-center justify-center rounded-xl border ${isLight
                  ? "bg-purple-50 border-purple-200 text-purple-600"
                  : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                }`}
            >
              <User className="size-5" />
            </div>

            <div>
              <h2
                className={`text-base font-bold ${isLight ? "text-gray-900" : "text-foreground"
                  }`}
              >
                User Login Information
              </h2>

              <p
                className={`text-xs ${isLight ? "text-gray-500" : "text-muted-foreground"
                  }`}
              >
                Manage active session details, operator clearance, and security
                status
              </p>
            </div>
          </div>

          <span
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isLight
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
              }`}
          >
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Session Active
          </span>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`rounded-xl border p-5 space-y-3 ${isLight
                ? "border-gray-200 bg-gray-50"
                : "border-white/10 bg-slate-900/50"
              }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`flex size-12 items-center justify-center rounded-2xl border font-black text-lg ${isLight
                    ? "bg-blue-50 border-blue-200 text-blue-600"
                    : "bg-gradient-to-br from-primary/30 to-purple-600/30 border-primary/40 text-primary"
                  }`}
              >
                {(user ?? "U").substring(0, 2).toUpperCase()}
              </div>

              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-gray-500" : "text-slate-400"
                    }`}
                >
                  Logged In As
                </p>

                <p
                  className={`text-base font-black ${isLight ? "text-gray-900" : "text-slate-100"
                    }`}
                >
                  {user ?? "Relief Commander"}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 ${isLight
                ? "border-gray-200 bg-gray-50"
                : "border-white/10 bg-slate-900/50"
              }`}
          >
            <div>
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? "text-gray-500" : "text-slate-400"
                  }`}
              >
                Session Credential Info
              </p>

              <div
                className={`p-3 rounded-lg border font-mono text-xs flex items-center justify-between ${isLight
                    ? "bg-white border-gray-200 text-gray-700"
                    : "bg-slate-950/80 border-white/10 text-slate-300"
                  }`}
              >
                <span
                  className={`truncate ${isLight ? "text-gray-500" : "text-slate-400"
                    }`}
                >
                  Token:{" "}
                  {token
                    ? `${token.substring(0, 16)}...`
                    : "Authenticated Session"}
                </span>

                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/30 font-sans">
                  VERIFIED
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${isLight
                    ? "border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                  }`}
              >
                <LogOut className="size-4" />
                <span>Log Out Session</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

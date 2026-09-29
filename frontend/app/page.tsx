"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Waves,
  ShieldCheck,
  LockKeyhole,
  User,
  Loader2,
  ArrowRight,
  UserPlus,
  LogIn,
} from "lucide-react"
import { ReliefGlobe } from "@/components/three/relief-globe"
import { PRESET_LOCATIONS } from "@/lib/presets"
import { getToken, login, setSession } from "@/lib/api-client"
import { useLanguage } from "@/lib/i18n/language-context"
import { LanguageMenu } from "@/components/dashboard/language-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (getToken()) router.replace("/dashboard")
  }, [router])

  const markers = PRESET_LOCATIONS.map((p) => ({
    id: p.name,
    name: p.name,
    sub: p.state,
    lat: p.latitude,
    lon: p.longitude,
  }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError("Please enter a username and password.")
      return
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
    }

    setLoading(true)
    try {
      const data = await login(username.trim(), password)
      setSession(data.access_token, data.username)
      router.replace("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
      setLoading(false)
    }
  }

  const isSignup = mode === "signup"

  return (
    <main className="relative grid min-h-screen grid-cols-1 overflow-hidden bg-background lg:grid-cols-[1.15fr_1fr]">
      {/* 3D globe panel */}
      <section className="relative hidden lg:block">
        <div className="absolute inset-0">
          <ReliefGlobe markers={markers} autoRotate enableControls={false} />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background" />

        {/* Brand Header */}
        <div className="pointer-events-none absolute left-10 top-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 glow-primary shadow-lg shadow-primary/20 overflow-hidden p-1">
              <img src="/pwa-512x512.png" alt="PranRaksha Logo" className="size-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
                {t("PranRaksha")}
              </h1>
              <p className="max-w-md text-xs font-normal text-muted-foreground leading-snug">
                {t("AI-powered disaster management and relief operations platform.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth panel */}
      <section className="relative flex flex-col items-center justify-center px-6 py-12">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" />

        {/* Language switch at top right */}
        <div className="absolute top-6 right-6 z-20">
          <LanguageMenu full={false} />
        </div>

        <div className="relative w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="mb-8 flex flex-col gap-2 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 overflow-hidden p-1">
                <img src="/pwa-512x512.png" alt="PranRaksha Logo" className="size-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground uppercase">
                  {t("PranRaksha")}
                </h1>
              </div>
            </div>
            <p className="text-xs font-normal text-muted-foreground leading-snug">
              {t("AI-powered disaster management and relief operations platform.")}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">
              {isSignup ? t("Create an Account") : t("Welcome to PranRaksha")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignup
                ? t("Register to access PranRaksha.")
                : t("Sign in to continue.")}
            </p>
          </div>

          {/* Mode toggle tabs */}
          <div className="mb-4 flex rounded-xl border border-border bg-card/40 p-1">
            <button
              type="button"
              id="tab-signin"
              onClick={() => {
                setMode("signin")
                setError(null)
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${!isSignup
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <LogIn className="size-3.5" />
              Sign In
            </button>
            <button
              type="button"
              id="tab-signup"
              onClick={() => {
                setMode("signup")
                setError(null)
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${isSignup
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <UserPlus className="size-3.5" />
              Sign Up
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card/70 p-6 shadow-xl backdrop-blur transition-all"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("Username")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={isSignup ? "Choose a username" : "Enter your username"}
                    autoComplete="username"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("Password")}</Label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={isSignup ? "Min. 6 characters" : "••••••••"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              {isSignup && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("Confirm Password")}</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              )}

              {error && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button id="btn-submit" type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />{" "}
                    {isSignup ? t("Creating account...") : t("Signing in...")}
                  </>
                ) : (
                  <>
                    {isSignup ? t("Create Account & Sign In") : t("Sign In")}{" "}
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {isSignup ? (
              <>
                {t("Already have an account?")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin")
                    setError(null)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  {t("Sign in instead")}
                </button>
              </>
            ) : (
              <>
                {t("Don't have an account?")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup")
                    setError(null)
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  {t("Sign up")}
                </button>
              </>
            )}
          </p>
        </div>
      </section>
    </main>
  )
}

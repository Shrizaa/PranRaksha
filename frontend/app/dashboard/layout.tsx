"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Menu, Waves } from "lucide-react"
import { AppProvider } from "@/components/app-provider"
import { Sidebar } from "@/components/dashboard/sidebar"
import { LocationControl } from "@/components/dashboard/location-control"
import { LanguageMenu } from "@/components/dashboard/language-menu"
import { getToken } from "@/lib/api-client"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      router.replace("/")
    } else {
      setAuthed(true)
    }
  }, [router])

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Waves className="size-5 animate-pulse text-primary" />
          Establishing secure link…
        </div>
      </div>
    )
  }

  return (
    <AppProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col h-full overflow-y-auto">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-md lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNavOpen(true)}
                className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground lg:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
              <div className="hidden items-center gap-2 text-xs font-medium text-muted-foreground sm:flex">
                <span className="inline-flex size-2 animate-pulse rounded-full bg-emerald-400" />
                Live operations feed
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <LanguageMenu full={false} />
              <LocationControl />
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AppProvider>
  )
}

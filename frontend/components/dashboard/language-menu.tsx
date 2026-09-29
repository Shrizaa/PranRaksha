"use client"

import { Globe, Check, Loader2 } from "lucide-react"
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/languages"
import { useLanguage } from "@/lib/i18n/language-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function LanguageMenu({
  full = false,
  className,
}: {
  full?: boolean
  className?: string
}) {
  const { lang, setLang, translating, language } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-2 border-border bg-card/60 px-2.5 text-xs text-foreground/90 transition hover:border-primary/40 hover:bg-card",
              className
            )}
            aria-label="Select Language"
          >
            {translating ? (
              <Loader2 className="size-3.5 animate-spin text-primary" />
            ) : (
              <Globe className="size-3.5 text-primary" />
            )}
            {full ? (
              <span className="font-medium">
                {language.nativeName} ({language.name})
              </span>
            ) : (
              <span className="font-medium">{language.nativeName}</span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-56 max-h-80 overflow-y-auto"
        data-no-translate="true"
      >
        <DropdownMenuLabel>Select Language / भाषा</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((item) => {
          const active = item.code === lang
          return (
            <DropdownMenuItem
              key={item.code}
              onClick={() => setLang(item.code)}
              className={cn(
                "flex items-center justify-between py-2 text-xs",
                active && "bg-primary/15 font-semibold text-primary"
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">{item.nativeName}</span>
                <span className="text-[10px] text-muted-foreground">
                  {item.name}
                </span>
              </div>
              {active && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

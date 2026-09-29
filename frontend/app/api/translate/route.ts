import { NextRequest, NextResponse } from "next/server"

// ─── BCP-47 and Google Translate code mappings ─────────────────────────────
const SARVAM_LANG_MAP: Record<string, string> = {
  hi: "hi-IN", "hi-IN": "hi-IN",
  bn: "bn-IN", "bn-IN": "bn-IN",
  te: "te-IN", "te-IN": "te-IN",
  mr: "mr-IN", "mr-IN": "mr-IN",
  ta: "ta-IN", "ta-IN": "ta-IN",
  gu: "gu-IN", "gu-IN": "gu-IN",
  kn: "kn-IN", "kn-IN": "kn-IN",
  ml: "ml-IN", "ml-IN": "ml-IN",
  or: "od-IN", od: "od-IN", "od-IN": "od-IN",
  pa: "pa-IN", "pa-IN": "pa-IN",
  as: "as-IN", "as-IN": "as-IN",
  ur: "ur-IN", "ur-IN": "ur-IN",
  en: "en-IN", "en-IN": "en-IN",
}

const SHORT_CODE_MAP: Record<string, string> = {
  "hi-IN": "hi", hi: "hi",
  "te-IN": "te", te: "te",
  "ta-IN": "ta", ta: "ta",
  "bn-IN": "bn", bn: "bn",
  "mr-IN": "mr", mr: "mr",
  "gu-IN": "gu", gu: "gu",
  "kn-IN": "kn", kn: "kn",
  "ml-IN": "ml", ml: "ml",
  "od-IN": "or", od: "or", or: "or",
  "pa-IN": "pa", pa: "pa",
  "as-IN": "as", as: "as",
  "ur-IN": "ur", ur: "ur",
}

// ─── Server-side In-Memory Cache ───────────────────────────────────────────
const serverCache = new Map<string, string>()

// ─── Free Dynamic Translation Helper (Fallback / Keyless) ──────────────────
async function translateViaDynamicProxy(text: string, targetShort: string): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(
      targetShort
    )}&dt=t&q=${encodeURIComponent(text)}`
    
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 4000)
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(timer)

    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const fullTranslation = data[0]
          .map((item: unknown) => (Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""))
          .join("")
          .trim()
        if (fullTranslation) return fullTranslation
      }
    }
  } catch (err) {
    // network timeout or abort
  }
  return null
}

// ─── Sarvam AI API Batch Translation ───────────────────────────────────────
const DELIM = " ⟨⟨|||⟩⟩ "
const MAX_CHARS = 1200

async function translateViaSarvamAI(
  texts: string[],
  bcp47: string,
  apiKey: string
): Promise<Map<number, string>> {
  const sarvamMap = new Map<number, string>()
  const chunks: { indices: number[]; texts: string[] }[] = []
  let cur: { indices: number[]; texts: string[] } = { indices: [], texts: [] }
  let curLen = 0

  for (let i = 0; i < texts.length; i++) {
    const txt = texts[i]
    const needed = curLen === 0 ? txt.length : DELIM.length + txt.length
    if (curLen + needed > MAX_CHARS && cur.texts.length > 0) {
      chunks.push(cur)
      cur = { indices: [], texts: [] }
      curLen = 0
    }
    cur.texts.push(txt)
    cur.indices.push(i)
    curLen += needed
  }
  if (cur.texts.length > 0) chunks.push(cur)

  await Promise.all(
    chunks.map(async (chunk) => {
      const combined = chunk.texts.join(DELIM)
      try {
        const res = await fetch("https://api.sarvam.ai/translate", {
          method: "POST",
          headers: {
            "api-subscription-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: combined,
            source_language_code: "en-IN",
            target_language_code: bcp47,
            mode: "formal",
            model: "mayura:v1",
          }),
        })

        if (res.ok) {
          const data = await res.json()
          const translatedText: string = data.translated_text || ""
          const parts = translatedText.split(DELIM)
          chunk.indices.forEach((origIdx, pi) => {
            const part = parts[pi]?.trim()
            if (part) sarvamMap.set(origIdx, part)
          })
        }
      } catch (err) {
        console.warn("[/api/translate] Sarvam chunk failed:", err)
      }
    })
  )

  return sarvamMap
}

// ─── Main POST Handler ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const texts: string[] = Array.isArray(body.texts) ? body.texts : []
    const rawLang: string = body.target_language || body.targetLang || "hi"

    if (texts.length === 0) {
      return NextResponse.json({ translations: [], provider: "empty" })
    }

    const bcp47 = SARVAM_LANG_MAP[rawLang] || (rawLang.includes("-") ? rawLang : `${rawLang}-IN`)
    const shortLang = SHORT_CODE_MAP[bcp47] || SHORT_CODE_MAP[rawLang] || rawLang.split("-")[0]

    // English target -> return original English directly
    if (bcp47.startsWith("en") || shortLang === "en") {
      return NextResponse.json({ translations: texts, provider: "english" })
    }

    const results: (string | null)[] = new Array(texts.length).fill(null)
    const missing: { idx: number; text: string }[] = []

    // 1. Check in-memory server cache
    for (let i = 0; i < texts.length; i++) {
      const t = texts[i]
      if (typeof t !== "string" || !t.trim()) {
        results[i] = t ?? ""
        continue
      }
      const trimmed = t.trim()
      const ck = `${bcp47}::${trimmed}`
      if (serverCache.has(ck)) {
        results[i] = serverCache.get(ck)!
      } else {
        missing.push({ idx: i, text: trimmed })
      }
    }

    // All cached -> 0ms return
    if (missing.length === 0) {
      return NextResponse.json({
        translations: results as string[],
        provider: "server-cache",
      })
    }

    const apiKey = process.env.SARVAM_API_KEY?.trim()
    let providerUsed = "dynamic"

    // 2. If Sarvam API key is available, call Sarvam AI
    if (apiKey) {
      providerUsed = "sarvam-ai"
      const missingTexts = missing.map((m) => m.text)
      const sarvamMap = await translateViaSarvamAI(missingTexts, bcp47, apiKey)

      const stillMissing: { idx: number; text: string }[] = []
      missing.forEach((item, localIdx) => {
        const trans = sarvamMap.get(localIdx)
        if (trans) {
          results[item.idx] = trans
          serverCache.set(`${bcp47}::${item.text}`, trans)
        } else {
          stillMissing.push(item)
        }
      })

      // If Sarvam missed any chunks or was rate-limited, fall back to dynamic proxy for remainder
      if (stillMissing.length > 0) {
        await Promise.all(
          stillMissing.map(async ({ idx, text }) => {
            const trans = await translateViaDynamicProxy(text, shortLang)
            const resolved = trans || text
            results[idx] = resolved
            serverCache.set(`${bcp47}::${text}`, resolved)
          })
        )
      }
    } else {
      // 3. No Sarvam key -> Translate dynamically via robust proxy in parallel batches
      providerUsed = "dynamic-neural"
      const batchSize = 10
      for (let i = 0; i < missing.length; i += batchSize) {
        const batch = missing.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async ({ idx, text }) => {
            const trans = await translateViaDynamicProxy(text, shortLang)
            const resolved = trans || text
            results[idx] = resolved
            serverCache.set(`${bcp47}::${text}`, resolved)
          })
        )
      }
    }

    const finalTranslations = results.map((r, i) => r ?? texts[i] ?? "")

    return NextResponse.json({
      translations: finalTranslations,
      provider: providerUsed,
    })
  } catch (err) {
    console.error("[/api/translate] Internal error:", err)
    return NextResponse.json(
      {
        translations: [],
        error: String(err),
      },
      { status: 200 }
    )
  }
}

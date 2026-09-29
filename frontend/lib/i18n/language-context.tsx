/* PranRaksha - Global Presentation-Layer Translation System
 *
 * Sits above all feature pages and routes, translating the entire visible application:
 * - Static JSX text & dynamically rendered React text
 * - Content arriving asynchronously from APIs
 * - Cards, tables, forms, buttons, dialogs, loading/empty/error states
 * - Chart and visualization labels (including SVG text)
 * - Translatable attributes (placeholder, title, aria-label, alt)
 *
 * Guarantees:
 * - Always translates from the original English source (never translates an already-translated string).
 * - Restores exact original English when "en" is selected.
 * - Preserves numbers, percentages, coordinates, warehouse/request IDs (WH011, etc.), URLs, emails, dates.
 * - Persistent caching in memory and localStorage with deduplicated network requests.
 * - Detects DOM mutations (APIs, state updates, route changes) via MutationObserver & Next.js router.
 */

"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { DEFAULT_LANGUAGE, getLanguage, type Language } from "./languages"

export interface LanguageContextType {
  lang: string
  language: Language
  setLang: (code: string) => void
  t: (key: string) => string
  translating: boolean
}

const LANG_KEY = "pranraksha_lang"
const CACHE_PREFIX = "prtx_v6_"
const BATCH_SIZE = 40
const DEBOUNCE_MS = 60

/* -------------------------------------------------------------------------- */
/* State Tracking for DOM Nodes & Attributes                                   */
/* -------------------------------------------------------------------------- */

interface NodeState {
  original: string
  currentLang: string
}

interface AttrState {
  original: string
  currentLang: string
}

const nodeStateMap = new WeakMap<Node, NodeState>()
const attributeStateMap = new WeakMap<Element, Map<string, AttrState>>()

/* -------------------------------------------------------------------------- */
/* Caching Layer (Memory + LocalStorage)                                      */
/* -------------------------------------------------------------------------- */

const memCache = new Map<string, string>()

function getCacheKey(lang: string, text: string): string {
  return `${lang}::${text.trim()}`
}

function cacheGet(lang: string, text: string): string | undefined {
  if (!text || !text.trim() || lang === DEFAULT_LANGUAGE) return text
  return memCache.get(getCacheKey(lang, text))
}

function cacheSet(lang: string, text: string, translated: string) {
  const trimmed = text.trim()
  if (!trimmed || !translated) return
  memCache.set(getCacheKey(lang, trimmed), translated.trim())
}

const CORE_TERMS: Record<string, Record<string, string>> = {
  te: {
    "Dashboard": "డాష్‌బోర్డ్",
    "Requirements": "అవసరాలు",
    "Resource Requirements": "వనరుల అవసరాలు",
    "Infrastructure": "మౌలిక సదుపాయాలు",
    "Risk Assessment": "ప్రమాద అంచనా",
    "Flood Risk Assessment": "వరద ప్రమాద అంచనా",
    "Nearest Warehouse": "సమీప గిడ్డంగి",
    "Availability": "లభ్యత",
    "Resource Availability": "వనరుల లభ్యత",
    "Shortage Analysis": "కొరత విశ్లేషణ",
    "Report New Disaster": "కొత్త విపత్తును నివేదించండి",
    "My Reported Disasters": "నా నివేదించిన విపత్తులు",
    "Settings": "సెట్టింగ్‌లు",
    "Settings & Preferences": "సెట్టింగ్‌లు & ప్రాధాన్యతలు",
    "DISASTER REPORTING": "విపత్తు నివేదికలు",
    "OPERATIONS": "ఆపరేషన్స్",
    "LOGISTICS": "లాజిస్టిక్స్",
    "Command Overview": "కమాండ్ అవలోకనం",
    "Run Assessment": "అంచనా వేయండి",
    "Sign out": "సైన్ అవుట్",
    "Hospitals": "ఆసుపత్రులు",
    "Schools": "పాఠశాలలు",
    "Relief Shelters": "సహాయ శిబిరాలు",
    "Nearby Infrastructure": "సమీప మౌలిక సదుపాయాలు",
    "Food Packets": "ఆహార ప్యాకెట్లు",
    "Water Bottles": "నీటి సీసాలు",
    "Medical Kits": "వైద్య కిట్లు",
    "Blankets": "దుప్పట్లు",
    "Partially Available": "పాక్షికంగా అందుబాటులో ఉంది",
    "Available": "అందుబాటులో ఉంది",
    "Active Target Zone": "క్రియాశీల లక్ష్య ప్రాంతం",
    "Disaster Epicentre": "విపత్తు కేంద్రం",
  },
  hi: {
    "Dashboard": "डैशबोर्ड",
    "Requirements": "आवश्यकताएं",
    "Resource Requirements": "संसाधन आवश्यकताएँ",
    "Infrastructure": "आधारभूत संरचना",
    "Risk Assessment": "जोखिम मूल्यांकन",
    "Flood Risk Assessment": "बाढ़ जोखिम मूल्यांकन",
    "Nearest Warehouse": "निकटतम गोदाम",
    "Availability": "उपलब्धता",
    "Resource Availability": "संसाधन उपलब्धता",
    "Shortage Analysis": "कमी विश्लेषण",
    "Report New Disaster": "नई आपदा दर्ज करें",
    "My Reported Disasters": "मेरी दर्ज आपदाएं",
    "Settings": "सेटिंग्स",
    "Settings & Preferences": "सेटिंग्स और प्राथमिकताएं",
    "DISASTER REPORTING": "आपदा रिपोर्टिंग",
    "OPERATIONS": "संचालन",
    "LOGISTICS": "रसद आपूर्ति",
    "Command Overview": "कमांड अवलोकन",
    "Run Assessment": "मूल्यांकन चलाएं",
    "Sign out": "साइन आउट",
    "Hospitals": "अस्पताल",
    "Schools": "स्कूल",
    "Relief Shelters": "राहत शिविर",
    "Nearby Infrastructure": "नजदीकी बुनियादी ढांचा",
    "Food Packets": "भोजन पैकेट",
    "Water Bottles": "पानी की बोतलें",
    "Medical Kits": "चिकित्सा किट",
    "Blankets": "कंबल",
    "Partially Available": "आंशिक रूप से उपलब्ध",
    "Available": "उपलब्ध",
    "Active Target Zone": "सक्रिय लक्ष्य क्षेत्र",
    "Disaster Epicentre": "आपदा केंद्र",
  },
  ta: {
    "Dashboard": "டாஷ்போர்டு",
    "Requirements": "தேவைகள்",
    "Resource Requirements": "வளத் தேவைகள்",
    "Infrastructure": "அடிப்படைக் கட்டமைப்பு",
    "Risk Assessment": "அபாய மதிப்பீடு",
    "Flood Risk Assessment": "வெள்ள அபாய மதிப்பீடு",
    "Nearest Warehouse": "அருகிலுள்ள கிடங்கு",
    "Availability": "கிடைக்கும் தன்மை",
    "Resource Availability": "வளங்கள் இருப்பு",
    "Shortage Analysis": "பற்றாக்குறை பகுப்பாய்வு",
    "Report New Disaster": "புதிய பேரிடரை பதிவு செய்",
    "My Reported Disasters": "எனது பேரிடர் பதிவுகள்",
    "Settings": "அமைப்புகள்",
    "Settings & Preferences": "அமைப்புகள் மற்றும் விருப்பங்கள்",
    "DISASTER REPORTING": "பேரிடர் அறிக்கை",
    "OPERATIONS": "செயல்பாடுகள்",
    "LOGISTICS": "தளவாடங்கள்",
    "Command Overview": "கட்டளை கண்ணோட்டம்",
    "Run Assessment": "மதிப்பீட்டை இயக்கு",
    "Sign out": "வெளியேறு",
    "Hospitals": "மருத்துவமனைகள்",
    "Schools": "பள்ளிகள்",
    "Relief Shelters": "நிவாரண முகாம்கள்",
    "Nearby Infrastructure": "அருகிலுள்ள உள்கட்டமைப்பு",
    "Food Packets": "உணவுப் பொட்டலங்கள்",
    "Water Bottles": "நீர் பாட்டில்கள்",
    "Medical Kits": "மருத்துவக் கருவிகள்",
    "Blankets": "போர்வைகள்",
    "Partially Available": "பகுதியளவு கிடைக்கிறது",
    "Available": "கிடைக்கிறது",
    "Active Target Zone": "செயலில் உள்ள இலக்கு மண்டலம்",
    "Disaster Epicentre": "பேரிடர் மையம்",
  },
}

function hydrateCache(lang: string) {
  if (lang === DEFAULT_LANGUAGE) return

  // 1. Seed core UI terms for immediate 0ms rendering
  const seeded = CORE_TERMS[lang] || CORE_TERMS[lang.split("-")[0]]
  if (seeded) {
    for (const [k, v] of Object.entries(seeded)) {
      cacheSet(lang, k, v)
    }
  }

  // 2. Hydrate dynamic translations saved in localStorage
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + lang)
    if (!raw) return
    const obj = JSON.parse(raw) as Record<string, string>
    for (const [k, v] of Object.entries(obj)) {
      if (k && v) cacheSet(lang, k, v)
    }
  } catch {
    // Ignore storage parse issues
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function queuePersistCache(lang: string) {
  if (lang === DEFAULT_LANGUAGE) return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      const obj: Record<string, string> = {}
      const prefix = `${lang}::`
      for (const [key, value] of memCache.entries()) {
        if (key.startsWith(prefix)) {
          obj[key.slice(prefix.length)] = value
        }
      }
      localStorage.setItem(CACHE_PREFIX + lang, JSON.stringify(obj))
    } catch {
      // Storage quota or private mode
    }
  }, 400)
}

/* -------------------------------------------------------------------------- */
/* Non-Language Tokens to Preserve (Never Translate)                         */
/* -------------------------------------------------------------------------- */

// Pure numbers, digits, symbols, units, percentages
const RE_ONLY_DATA = /^[\s\d.,+\-–—/%$₹€£×·→←↑↓()[\]{}|\\#:]*$/
// Latitude / Longitude coordinates (e.g. "21.170, 72.831" or "21.170° N, 72.831° E")
const RE_COORDINATE = /^-?\d+(?:\.\d+)?°?\s*[NSEW]?(?:\s*,\s*)?-?\d+(?:\.\d+)?°?\s*[NSEW]?$/i
// Machine IDs (e.g. WH011, DIS-001, REQ-104, STN_02)
const RE_ID = /^(?:WH|DIS|REQ|UID|REF|ID|STN)[A-Z0-9_-]+$/i
// URLs and web paths
const RE_URL_OR_PATH = /^(?:https?:\/\/|www\.|\/api\/|\/dashboard\/|mailto:|tel:)/i
// Email addresses
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Hex colors / CSS functions
const RE_COLOR = /^(?:#[0-9a-f]{3,8}|rgba?\(|hsla?\()/i
// Dates and ISO timestamps
const RE_DATE = /^\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}(?:[ T]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?$/

const NEVER_TRANSLATE = new Set([
  "PRANRAKSHA",
  "PranRaksha",
])

export function shouldSkipText(value: string): boolean {
  const text = value.trim()
  if (!text) return true
  if (NEVER_TRANSLATE.has(text)) return true
  if (RE_ONLY_DATA.test(text)) return true
  if (RE_COORDINATE.test(text)) return true
  if (RE_ID.test(text)) return true
  if (RE_URL_OR_PATH.test(text)) return true
  if (RE_EMAIL.test(text)) return true
  if (RE_COLOR.test(text)) return true
  if (RE_DATE.test(text)) return true

  // Must contain at least one English/Latin character to qualify for English->Target translation
  if (!/[a-zA-Z]/.test(text)) return true

  return false
}

const TRANSLATABLE_ATTRIBUTES = [
  "placeholder",
  "title",
  "aria-label",
  "alt",
]

const IGNORED_TAGS = new Set([
  "script",
  "style",
  "noscript",
  "meta",
  "link",
  "head",
  "path",
  "defs",
  "symbol",
  "use",
  "code",
  "pre",
  "kbd",
  "samp",
  "var",
  "canvas",
  "video",
  "audio",
  "iframe",
])

function isIgnoredElement(el: Element | null): boolean {
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  if (IGNORED_TAGS.has(tag)) return true
  if (el.getAttribute("data-no-translate") === "true") return true
  if (el.getAttribute("translate") === "no") return true

  const parent = el.parentElement
  if (parent && parent !== document.body) {
    return isIgnoredElement(parent)
  }
  return false
}

/* -------------------------------------------------------------------------- */
/* Translation Request Batcher & In-Flight Tracking                           */
/* -------------------------------------------------------------------------- */

interface PendingItem {
  text: string
  lang: string
  callbacks: Array<(translated: string) => void>
}

const pendingQueue = new Map<string, PendingItem>()
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let inFlightCount = 0
const batchCompletedListeners = new Set<(lang: string) => void>()

function enqueueTranslation(
  lang: string,
  text: string,
  callback: (translated: string) => void
) {
  const trimmed = text.trim()
  const cached = cacheGet(lang, trimmed)
  if (cached !== undefined) {
    callback(cached)
    return
  }

  const key = getCacheKey(lang, trimmed)
  let item = pendingQueue.get(key)
  if (!item) {
    item = {
      text: trimmed,
      lang,
      callbacks: [],
    }
    pendingQueue.set(key, item)
  }
  item.callbacks.push(callback)

  if (!debounceTimer) {
    debounceTimer = setTimeout(flushTranslationQueue, DEBOUNCE_MS)
  }
}

function flushTranslationQueue() {
  debounceTimer = null
  if (pendingQueue.size === 0) return

  const items = Array.from(pendingQueue.values())
  pendingQueue.clear()

  // Group by language
  const byLang = new Map<string, PendingItem[]>()
  for (const it of items) {
    const arr = byLang.get(it.lang) || []
    arr.push(it)
    byLang.set(it.lang, arr)
  }

  for (const [targetLang, group] of byLang.entries()) {
    for (let i = 0; i < group.length; i += BATCH_SIZE) {
      void sendTranslationBatch(targetLang, group.slice(i, i + BATCH_SIZE))
    }
  }
}

async function sendTranslationBatch(lang: string, items: PendingItem[]) {
  inFlightCount++

  try {
    const textsToSend = items.map((it) => it.text)
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts: textsToSend,
        target_language: lang,
      }),
    })

    const data = res.ok
      ? ((await res.json()) as { translations?: string[] })
      : { translations: [] }

    const translations = Array.isArray(data.translations) ? data.translations : []

    items.forEach((item, index) => {
      const trans =
        typeof translations[index] === "string" && translations[index].trim()
          ? translations[index].trim()
          : item.text

      cacheSet(item.lang, item.text, trans)

      item.callbacks.forEach((cb) => {
        try {
          cb(trans)
        } catch {
          // Callback handler error safeguard
        }
      })
    })

    queuePersistCache(lang)

    batchCompletedListeners.forEach((listener) => {
      try {
        listener(lang)
      } catch {
        // Listener error safeguard
      }
    })
  } catch (err) {
    console.warn("[PranRaksha i18n] Translation batch failed:", err)
    items.forEach((item) => {
      item.callbacks.forEach((cb) => {
        try {
          cb(item.text)
        } catch {
          // Safeguard
        }
      })
    })
  } finally {
    inFlightCount = Math.max(0, inFlightCount - 1)
  }
}

/* -------------------------------------------------------------------------- */
/* DOM Translation Engine                                                     */
/* -------------------------------------------------------------------------- */

let observer: MutationObserver | null = null
let isWritingDOM = false
let currentActiveLang = DEFAULT_LANGUAGE
let scanTimer: ReturnType<typeof setTimeout> | null = null

const OBSERVER_CONFIG: MutationObserverInit = {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
  attributeFilter: TRANSLATABLE_ATTRIBUTES,
}

function withDOMMutation(fn: () => void) {
  isWritingDOM = true
  try {
    fn()
  } finally {
    isWritingDOM = false
  }
}

function applyTextNodeTranslation(node: Text, targetLang: string) {
  const parent = node.parentElement
  if (!parent || isIgnoredElement(parent)) return

  let state = nodeStateMap.get(node)
  const currentVal = node.nodeValue ?? ""

  // If node is unrecorded, its current text is the original English source
  if (!state) {
    state = {
      original: currentVal,
      currentLang: DEFAULT_LANGUAGE,
    }
    nodeStateMap.set(node, state)
  } else if (state.currentLang === DEFAULT_LANGUAGE && currentVal !== state.original) {
    // If React updated the English text value
    state.original = currentVal
  }

  // If already at target language, nothing to do
  if (state.currentLang === targetLang) return

  // If restoring English
  if (targetLang === DEFAULT_LANGUAGE) {
    if (state.original !== currentVal) {
      withDOMMutation(() => {
        node.nodeValue = state!.original
      })
    }
    state.currentLang = DEFAULT_LANGUAGE
    return
  }

  const trimmed = state.original.trim()
  if (shouldSkipText(trimmed)) {
    state.currentLang = targetLang
    return
  }

  // Check cache first for immediate synchronous update
  const cached = cacheGet(targetLang, trimmed)
  if (cached !== undefined) {
    withDOMMutation(() => {
      // Preserve original surrounding whitespace
      const match = state!.original.match(/^(\s*)([\s\S]*?)(\s*)$/)
      const leading = match ? match[1] : ""
      const trailing = match ? match[3] : ""
      node.nodeValue = leading + cached + trailing
      state!.currentLang = targetLang
    })
    return
  }

  // Enqueue for batch translation
  enqueueTranslation(targetLang, trimmed, (translated) => {
    if (!node.isConnected || !node.parentElement || isIgnoredElement(node.parentElement)) return
    if (currentActiveLang !== targetLang) return

    withDOMMutation(() => {
      const match = state!.original.match(/^(\s*)([\s\S]*?)(\s*)$/)
      const leading = match ? match[1] : ""
      const trailing = match ? match[3] : ""
      node.nodeValue = leading + translated + trailing
      state!.currentLang = targetLang
    })
  })
}

function applyAttributeTranslation(element: Element, attrName: string, targetLang: string) {
  if (isIgnoredElement(element)) return
  const currentVal = element.getAttribute(attrName)
  if (!currentVal) return

  let states = attributeStateMap.get(element)
  if (!states) {
    states = new Map()
    attributeStateMap.set(element, states)
  }

  let state = states.get(attrName)
  if (!state) {
    state = {
      original: currentVal,
      currentLang: DEFAULT_LANGUAGE,
    }
    states.set(attrName, state)
  } else if (state.currentLang === DEFAULT_LANGUAGE && currentVal !== state.original) {
    state.original = currentVal
  }

  if (state.currentLang === targetLang) return

  if (targetLang === DEFAULT_LANGUAGE) {
    if (element.getAttribute(attrName) !== state.original) {
      withDOMMutation(() => {
        element.setAttribute(attrName, state!.original)
      })
    }
    state.currentLang = DEFAULT_LANGUAGE
    return
  }

  const trimmed = state.original.trim()
  if (shouldSkipText(trimmed)) {
    state.currentLang = targetLang
    return
  }

  const cached = cacheGet(targetLang, trimmed)
  if (cached !== undefined) {
    withDOMMutation(() => {
      element.setAttribute(attrName, cached)
      state!.currentLang = targetLang
    })
    return
  }

  enqueueTranslation(targetLang, trimmed, (translated) => {
    if (!element.isConnected || isIgnoredElement(element)) return
    if (currentActiveLang !== targetLang) return

    withDOMMutation(() => {
      element.setAttribute(attrName, translated)
      state!.currentLang = targetLang
    })
  })
}

function scanAndTranslateSubtree(root: Node, targetLang: string) {
  if (!root || !document.body) return

  // 1. Walk all Text nodes in subtree
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      if (!parent || isIgnoredElement(parent)) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    },
  })

  const textNodes: Text[] = []
  let n: Node | null
  while ((n = walker.nextNode())) {
    if (n instanceof Text) textNodes.push(n)
  }

  for (const tn of textNodes) {
    applyTextNodeTranslation(tn, targetLang)
  }

  // 2. Scan translatable attributes on root and descendants
  if (root instanceof Element) {
    if (!isIgnoredElement(root)) {
      for (const attr of TRANSLATABLE_ATTRIBUTES) {
        if (root.hasAttribute(attr)) applyAttributeTranslation(root, attr, targetLang)
      }
    }

    const els = root.querySelectorAll?.("*")
    if (els) {
      els.forEach((el) => {
        if (isIgnoredElement(el)) return
        for (const attr of TRANSLATABLE_ATTRIBUTES) {
          if (el.hasAttribute(attr)) applyAttributeTranslation(el, attr, targetLang)
        }
      })
    }
  }
}

function scheduleScan() {
  if (scanTimer) clearTimeout(scanTimer)
  scanTimer = setTimeout(() => {
    scanTimer = null
    if (document.body) {
      scanAndTranslateSubtree(document.body, currentActiveLang)
    }
  }, 40)
}

/* -------------------------------------------------------------------------- */
/* DOM Engine Component                                                      */
/* -------------------------------------------------------------------------- */

function GlobalPresentationTranslationEngine({ lang }: { lang: string }) {
  const pathname = usePathname()

  useEffect(() => {
    currentActiveLang = lang

    if (lang !== DEFAULT_LANGUAGE) {
      hydrateCache(lang)
    }

    // Immediate initial scan of document body
    if (document.body) {
      scanAndTranslateSubtree(document.body, lang)
    }

    // Set up MutationObserver to catch API data, route renders, React state changes
    if (!observer) {
      observer = new MutationObserver((mutations) => {
        if (isWritingDOM) return

        let needsScan = false
        for (const m of mutations) {
          if (m.type === "childList" && m.addedNodes.length > 0) {
            needsScan = true
            break
          }
          if (m.type === "characterData") {
            needsScan = true
            break
          }
          if (
            m.type === "attributes" &&
            TRANSLATABLE_ATTRIBUTES.includes(m.attributeName ?? "")
          ) {
            needsScan = true
            break
          }
        }

        if (needsScan) {
          scheduleScan()
        }
      })

      observer.observe(document.body, OBSERVER_CONFIG)
    }

    const onBatchDone = (updatedLang: string) => {
      if (updatedLang === currentActiveLang) {
        scheduleScan()
      }
    }
    batchCompletedListeners.add(onBatchDone)

    return () => {
      batchCompletedListeners.delete(onBatchDone)
    }
  }, [lang])

  // Trigger scan on route navigation
  useEffect(() => {
    if (document.body) {
      scheduleScan()
    }
  }, [pathname])

  return null
}

/* -------------------------------------------------------------------------- */
/* React Context & Provider                                                   */
/* -------------------------------------------------------------------------- */

const LanguageContext = createContext<LanguageContextType>({
  lang: DEFAULT_LANGUAGE,
  language: getLanguage(DEFAULT_LANGUAGE),
  setLang: () => {},
  t: (key) => key,
  translating: false,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(DEFAULT_LANGUAGE)
  const [translating, setTranslating] = useState(false)
  const [version, setVersion] = useState(0)

  // Initialize from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY)
      if (saved && saved !== DEFAULT_LANGUAGE) {
        currentActiveLang = saved
        setLangState(saved)
      }
    } catch {
      // Storage unavailable
    }
  }, [])

  // Poll in-flight status for UI indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setTranslating(inFlightCount > 0 || pendingQueue.size > 0)
    }, 150)
    return () => clearInterval(timer)
  }, [])

  // Re-render when batches finish to update any t() callers
  useEffect(() => {
    const listener = (updatedLang: string) => {
      if (updatedLang === lang) {
        setVersion((v) => v + 1)
      }
    }
    batchCompletedListeners.add(listener)
    return () => {
      batchCompletedListeners.delete(listener)
    }
  }, [lang])

  const setLang = useCallback((code: string) => {
    currentActiveLang = code
    setLangState(code)
    try {
      localStorage.setItem(LANG_KEY, code)
    } catch {
      // Storage error
    }

    if (code === DEFAULT_LANGUAGE) {
      pendingQueue.clear()
      inFlightCount = 0
      setTranslating(false)
      if (typeof document !== "undefined" && document.body) {
        scanAndTranslateSubtree(document.body, DEFAULT_LANGUAGE)
      }
      setVersion((v) => v + 1)
    } else {
      hydrateCache(code)
      if (typeof document !== "undefined" && document.body) {
        scanAndTranslateSubtree(document.body, code)
      }
      setTranslating(pendingQueue.size > 0 || inFlightCount > 0)
      setVersion((v) => v + 1)
    }
  }, [])

  const t = useCallback(
    (key: string) => {
      if (!key) return ""
      // Clean up accidental raw dot keys (e.g., "settings.title" -> "Settings")
      let clean = key.trim()
      if (clean === "settings.title") clean = "Settings"
      else if (clean === "dashboard.runAssessment") clean = "Run Assessment"
      else if (clean.startsWith("auth.") || clean.startsWith("dashboard.") || clean.startsWith("nav.")) {
        const last = clean.split(".").pop() || clean
        clean = last.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim()
      }

      if (lang === DEFAULT_LANGUAGE) return clean
      if (shouldSkipText(clean)) return clean

      const cached = cacheGet(lang, clean)
      if (cached !== undefined) return cached

      // Register for background fetch
      enqueueTranslation(lang, clean, () => {
        setVersion((v) => v + 1)
      })

      return clean
    },
    [lang, version]
  )

  return (
    <LanguageContext.Provider
      value={{
        lang,
        language: getLanguage(lang),
        setLang,
        t,
        translating,
      }}
    >
      <GlobalPresentationTranslationEngine lang={lang} />

      {translating && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-primary/40 bg-slate-900/90 px-4 py-2.5 text-xs font-semibold text-primary shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 pointer-events-none"
          aria-live="polite"
        >
          <span className="size-2 rounded-full bg-primary animate-pulse" />
          Translating via Sarvam AI…
        </div>
      )}

      {children}
    </LanguageContext.Provider>
  )
}

export const TranslationProvider = LanguageProvider

export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext)
}

export function useTranslation(): LanguageContextType {
  return useContext(LanguageContext)
}

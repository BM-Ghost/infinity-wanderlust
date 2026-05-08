"use client"

const VISITOR_KEY_STORAGE = "iwt_visitor_key"
const ANALYTICS_COUNTERS_STORAGE = "iwt_analytics_counters"
const CLICK_COOLDOWN_PREFIX = "iwt_click_cd_"
const REFERRER_SESSION_KEY = "iwt_referrer_user_id"

const MAX_EVENTS_PER_SESSION = 80
const MAX_PAGE_VISITS_PER_SESSION = 40
const CLICK_COOLDOWN_MS = 4000
const PAGE_VISIT_SAMPLE_RATE = Number(process.env.NEXT_PUBLIC_ANALYTICS_PAGE_SAMPLE_RATE || "1")

export type AnalyticsEventType = "page_visit" | "engagement_click"

type TrackPayload = {
  eventType: AnalyticsEventType
  path: string
  source?: string
  target?: string
  destination?: string
  sessionUserId?: string
  referrerUserId?: string
}

type SessionCounters = {
  all: number
  page: number
  click: number
}

function normalizePathForAnalytics(path: string): string {
  if (!path) return "/"
  const [withoutHash] = path.split("#")
  const [pathnameOnly] = withoutHash.split("?")
  if (!pathnameOnly) return "/"
  return pathnameOnly.startsWith("/") ? pathnameOnly : `/${pathnameOnly}`
}

function isLikelyBot(ua: string): boolean {
  const value = ua.toLowerCase()
  return /bot|crawler|spider|headless|facebookexternalhit|whatsapp|preview/.test(value)
}

function readCounters(): SessionCounters {
  try {
    const raw = window.sessionStorage.getItem(ANALYTICS_COUNTERS_STORAGE)
    if (!raw) return { all: 0, page: 0, click: 0 }
    const parsed = JSON.parse(raw) as Partial<SessionCounters>
    return {
      all: Number(parsed.all || 0),
      page: Number(parsed.page || 0),
      click: Number(parsed.click || 0),
    }
  } catch {
    return { all: 0, page: 0, click: 0 }
  }
}

function writeCounters(next: SessionCounters): void {
  window.sessionStorage.setItem(ANALYTICS_COUNTERS_STORAGE, JSON.stringify(next))
}

// Get referrer user ID from URL parameter
function getReferrerUserIdFromUrl(): string | undefined {
  if (typeof window === "undefined") return
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get("ref") || undefined
  } catch {
    return
  }
}

function getPersistedReferrerUserId(): string | undefined {
  if (typeof window === "undefined") return

  const fromUrl = getReferrerUserIdFromUrl()
  if (fromUrl) {
    window.sessionStorage.setItem(REFERRER_SESSION_KEY, fromUrl)
    return fromUrl
  }

  return window.sessionStorage.getItem(REFERRER_SESSION_KEY) || undefined
}

function allowEvent(payload: TrackPayload): boolean {
  const ua = navigator.userAgent || ""
  if (isLikelyBot(ua)) return false

  if (payload.eventType === "page_visit" && PAGE_VISIT_SAMPLE_RATE < 1) {
    if (Math.random() > Math.max(0, PAGE_VISIT_SAMPLE_RATE)) return false
  }

  const counters = readCounters()
  if (counters.all >= MAX_EVENTS_PER_SESSION) return false
  if (payload.eventType === "page_visit" && counters.page >= MAX_PAGE_VISITS_PER_SESSION) return false

  if (payload.eventType === "engagement_click") {
    const key = `${CLICK_COOLDOWN_PREFIX}${payload.target || "unknown"}:${payload.path}`
    const now = Date.now()
    const last = Number(window.sessionStorage.getItem(key) || "0")
    if (last && now - last < CLICK_COOLDOWN_MS) return false
    window.sessionStorage.setItem(key, String(now))
  }

  writeCounters({
    all: counters.all + 1,
    page: counters.page + (payload.eventType === "page_visit" ? 1 : 0),
    click: counters.click + (payload.eventType === "engagement_click" ? 1 : 0),
  })
  return true
}

export function getVisitorKey(): string {
  if (typeof window === "undefined") return "server"

  const existing = window.localStorage.getItem(VISITOR_KEY_STORAGE)
  if (existing) return existing

  const next =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  window.localStorage.setItem(VISITOR_KEY_STORAGE, next)
  return next
}

export function detectTrafficSource(referrer?: string): string {
  const ref = String(referrer || "").toLowerCase()
  if (!ref) return "direct"
  if (ref.includes("instagram.")) return "instagram"
  if (ref.includes("whatsapp.")) return "whatsapp"
  if (ref.includes("facebook.")) return "facebook"
  if (ref.includes("tiktok.")) return "tiktok"
  if (ref.includes("twitter.") || ref.includes("x.com")) return "x"

  try {
    const currentHost = window.location.hostname
    const refHost = new URL(referrer || "", window.location.origin).hostname
    if (refHost === currentHost) return "internal"
  } catch {
    return "external"
  }

  return "external"
}

export function trackAnalyticsEvent(payload: TrackPayload): void {
  if (typeof window === "undefined") return

  const normalizedPayload: TrackPayload = {
    ...payload,
    path: normalizePathForAnalytics(payload.path),
  }

  if (!allowEvent(normalizedPayload)) return

  const body = JSON.stringify({
    eventType: normalizedPayload.eventType,
    path: normalizedPayload.path,
    source: normalizedPayload.source || detectTrafficSource(document.referrer),
    target: normalizedPayload.target,
    destination: normalizedPayload.destination,
    visitorKey: getVisitorKey(),
    referrer: document.referrer || "",
    userAgent: navigator.userAgent || "",
    sessionUserId: normalizedPayload.sessionUserId,
    referrerUserId: normalizedPayload.referrerUserId || getPersistedReferrerUserId(),
  })

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" })
    navigator.sendBeacon("/api/analytics/track", blob)
    return
  }

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics should never affect user experience.
  })
}

export function trackEngagementClick(input: { path: string; target: string; destination?: string }): void {
  trackAnalyticsEvent({
    eventType: "engagement_click",
    path: input.path,
    target: input.target,
    destination: input.destination,
  })
}

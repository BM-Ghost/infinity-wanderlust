import PocketBase from "pocketbase"
import { NextResponse } from "next/server"
import { getPocketBaseAdmin } from "@/lib/pocketbase"
import { getSecurityLimits } from "@/lib/security-profile"

export const runtime = "edge"

const PB_URL = "https://remain-faceghost.pockethost.io"
const ANALYTICS_COLLECTION = "engagement_metrics"
let collectionReady = false
let ensureCollectionPromise: Promise<void> | null = null
const TRACK_WINDOW_MS = 60 * 1000

type RateCounter = {
  count: number
  resetAt: number
}

const TRACK_RATE_STORE = new Map<string, RateCounter>()

type TrackBody = {
  eventType?: "page_visit" | "engagement_click"
  path?: string
  source?: string
  referrer?: string
  visitorKey?: string
  target?: string
  destination?: string
  userAgent?: string
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const first = forwarded.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip") || ""
  return first || realIp || "unknown"
}

function compactStore(now: number) {
  if (TRACK_RATE_STORE.size < 12000) return
  for (const [key, value] of TRACK_RATE_STORE.entries()) {
    if (value.resetAt <= now) TRACK_RATE_STORE.delete(key)
  }
}

function hitRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  compactStore(now)
  const existing = TRACK_RATE_STORE.get(key)
  if (!existing || existing.resetAt <= now) {
    TRACK_RATE_STORE.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  existing.count += 1
  TRACK_RATE_STORE.set(key, existing)
  return existing.count > limit
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } })
}

async function ensureAnalyticsCollection(adminPb: any) {
  if (collectionReady) return
  if (ensureCollectionPromise) {
    await ensureCollectionPromise
    return
  }

  ensureCollectionPromise = (async () => {
    try {
      await adminPb.collections.getOne(ANALYTICS_COLLECTION)
      collectionReady = true
      return
    } catch (error: any) {
      if (error?.status !== 404) {
        return
      }
    }

    try {
      await adminPb.collections.create({
        name: ANALYTICS_COLLECTION,
        type: "base",
        schema: [
          { name: "event_type", type: "text", required: true },
          { name: "path", type: "text", required: true },
          { name: "source", type: "text", required: false },
          { name: "referrer_host", type: "text", required: false },
          { name: "visitor_key", type: "text", required: false },
          { name: "target", type: "text", required: false },
          { name: "destination", type: "text", required: false },
          { name: "user_id", type: "text", required: false },
          { name: "user_email", type: "text", required: false },
          { name: "user_agent", type: "text", required: false },
        ],
      })
      collectionReady = true
    } catch {
      // Collection likely exists already or creation is not allowed in this runtime.
    }
  })()

  try {
    await ensureCollectionPromise
  } finally {
    ensureCollectionPromise = null
  }
}

async function resolveUserFromToken(request: Request): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim()
  if (!token) return null

  try {
    const userPb = new PocketBase(PB_URL)
    userPb.authStore.save(token, null)
    const auth = await userPb.collection("users").authRefresh()
    return {
      id: auth.record.id,
      email: String(auth.record.email || "").toLowerCase(),
    }
  } catch {
    return null
  }
}

function normalizePath(path: string): string {
  const trimmed = path.trim()
  if (!trimmed) return "/"
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}

function getReferrerHost(referrer: string | undefined): string {
  if (!referrer) return ""
  try {
    return new URL(referrer).hostname.toLowerCase()
  } catch {
    return ""
  }
}

export async function POST(request: Request) {
  try {
    const limits = getSecurityLimits()
    const contentLength = Number(request.headers.get("content-length") || "0")
    if (Number.isFinite(contentLength) && contentLength > limits.analyticsTrackBodyMaxBytes) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413, headers: { "Cache-Control": "no-store" } })
    }

    const body = (await request.json()) as TrackBody
    const eventType = body.eventType
    if (eventType !== "page_visit" && eventType !== "engagement_click") {
      return badRequest("Invalid event type")
    }

    const visitorKey = String(body.visitorKey || "").slice(0, 120)
    if (!visitorKey) {
      return badRequest("Missing visitor key")
    }

    const ip = getClientIp(request)
    if (hitRateLimit(`ip:${ip}`, limits.analyticsTrackPerIpPerMinute, TRACK_WINDOW_MS)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } })
    }
    if (hitRateLimit(`visitor:${visitorKey}`, limits.analyticsTrackPerVisitorPerMinute, TRACK_WINDOW_MS)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } })
    }

    const path = normalizePath(body.path || "")
    if (path.length > 300) {
      return badRequest("Invalid path")
    }

    const user = await resolveUserFromToken(request)
    const adminPb = await getPocketBaseAdmin()
    await ensureAnalyticsCollection(adminPb)

    await adminPb.collection(ANALYTICS_COLLECTION).create({
      event_type: eventType,
      path,
      source: String(body.source || "direct").slice(0, 80),
      referrer_host: getReferrerHost(body.referrer),
      visitor_key: visitorKey,
      target: String(body.target || "").slice(0, 200),
      destination: String(body.destination || "").slice(0, 120),
      user_id: user?.id || "",
      user_email: user?.email || "",
      user_agent: String(body.userAgent || "").slice(0, 500),
    })

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("/api/analytics/track error", error)
    return NextResponse.json({ error: "Failed to track analytics" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  }
}

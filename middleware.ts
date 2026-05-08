import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSecurityLimits, getSecurityProfile, isWriteMethod } from "@/lib/security-profile"

type FixedWindowCounter = {
  count: number
  resetAt: number
}

const RATE_STORE = new Map<string, FixedWindowCounter>()
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
const MAX_KEYS_BEFORE_CLEANUP = 15000
let lastCleanupAt = 0

function cleanupRateStore(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS && RATE_STORE.size < MAX_KEYS_BEFORE_CLEANUP) {
    return
  }
  for (const [key, value] of RATE_STORE.entries()) {
    if (value.resetAt <= now) RATE_STORE.delete(key)
  }
  lastCleanupAt = now
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for") || ""
  const first = forwardedFor.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip") || ""
  return first || realIp || "unknown"
}

function isLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  cleanupRateStore(now)

  const existing = RATE_STORE.get(key)
  if (!existing || existing.resetAt <= now) {
    RATE_STORE.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  existing.count += 1
  if (existing.count > limit) return true
  RATE_STORE.set(key, existing)
  return false
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=(), payment=()")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  response.headers.set("Cross-Origin-Resource-Policy", "same-site")
  response.headers.set("X-Security-Profile", getSecurityProfile())
}

function tooManyRequests() {
  const response = NextResponse.json({ error: "Too many requests" }, { status: 429 })
  applySecurityHeaders(response)
  response.headers.set("Retry-After", "60")
  response.headers.set("Cache-Control", "no-store")
  return response
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method.toUpperCase()
  const ip = getClientIp(request)
  const limits = getSecurityLimits()

  if (pathname.startsWith("/api/")) {
    // General API flood protection.
    if (isLimited(`api:${ip}`, limits.apiPerMinute, 60 * 1000)) {
      return tooManyRequests()
    }

    // Stricter write limits on analytics ingestion endpoint.
    if (pathname === "/api/analytics/track" && method === "POST") {
      if (isLimited(`api:analytics-track:${ip}`, limits.analyticsTrackPerMinute, 60 * 1000)) {
        return tooManyRequests()
      }
    }

    // Tighten common auth and account mutation paths.
    const sensitivePrefix =
      pathname.startsWith("/api/login") ||
      pathname.startsWith("/api/register") ||
      pathname.startsWith("/api/password-reset") ||
      pathname.startsWith("/api/verification") ||
      pathname.startsWith("/api/security")

    if (sensitivePrefix && isWriteMethod(method)) {
      if (isLimited(`api:sensitive:${ip}`, limits.sensitiveApiWritesPerMinute, 60 * 1000)) {
        return tooManyRequests()
      }
    }
  }

  const response = NextResponse.next()
  applySecurityHeaders(response)
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
}

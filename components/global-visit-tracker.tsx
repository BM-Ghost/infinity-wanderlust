"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { trackAnalyticsEvent } from "@/lib/analytics-client"

const VISIT_DEDUPE_TTL_MS = 15 * 60 * 1000

export function GlobalVisitTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const lastTrackedRef = useRef<string>("")

  useEffect(() => {
    if (!pathname) return

    const query = searchParams?.toString() || ""
    const path = query ? `${pathname}?${query}` : pathname
    if (lastTrackedRef.current === path) return
    lastTrackedRef.current = path

    const key = `iwt_last_visit_${path}`
    const now = Date.now()
    const previous = Number(window.sessionStorage.getItem(key) || "0")
    if (previous && now - previous < VISIT_DEDUPE_TTL_MS) return

    window.sessionStorage.setItem(key, String(now))

    // Get referrer user ID from URL (e.g., ?ref=userId)
    const referrerUserId = searchParams?.get("ref") || undefined

    trackAnalyticsEvent({
      eventType: "page_visit",
      path,
      sessionUserId: user?.id,
      referrerUserId,
    })
  }, [pathname, searchParams, user?.id])

  return null
}

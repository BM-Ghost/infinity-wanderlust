"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { trackAnalyticsEvent } from "@/lib/analytics-client"

const VISIT_DEDUPE_TTL_MS = 15 * 60 * 1000
const REFERRER_SESSION_KEY = "iwt_referrer_user_id"

export function GlobalVisitTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const lastTrackedRef = useRef<string>("")

  useEffect(() => {
    if (!pathname) return

    const queryParams = new URLSearchParams(searchParams?.toString() || "")
    const referrerFromUrl = queryParams.get("ref") || undefined

    if (referrerFromUrl) {
      window.sessionStorage.setItem(REFERRER_SESSION_KEY, referrerFromUrl)
      queryParams.delete("ref")

      const cleanedQuery = queryParams.toString()
      const cleanedPath = `${pathname}${cleanedQuery ? `?${cleanedQuery}` : ""}${window.location.hash || ""}`
      window.history.replaceState(window.history.state, "", cleanedPath)
    }

    const query = queryParams.toString()
    const path = query ? `${pathname}?${query}` : pathname
    if (lastTrackedRef.current === path) return
    lastTrackedRef.current = path

    const key = `iwt_last_visit_${path}`
    const now = Date.now()
    const previous = Number(window.sessionStorage.getItem(key) || "0")
    if (previous && now - previous < VISIT_DEDUPE_TTL_MS) return

    window.sessionStorage.setItem(key, String(now))

    const referrerUserId = referrerFromUrl || window.sessionStorage.getItem(REFERRER_SESSION_KEY) || undefined

    trackAnalyticsEvent({
      eventType: "page_visit",
      path,
      sessionUserId: user?.id,
      referrerUserId,
    })
  }, [pathname, searchParams, user?.id])

  return null
}

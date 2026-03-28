"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

type NavigationEventType = {
  from: string
  to: string
  timestamp: number
  duration?: number
}

class NavigationTracker {
  private events: NavigationEventType[] = []
  private lastNavTime: number = 0
  private isEnabled: boolean = false

  constructor() {
    this.isEnabled = process.env.NODE_ENV === "development"
  }

  track(from: string, to: string) {
    if (!this.isEnabled) return

    const now = Date.now()
    const duration = this.lastNavTime ? now - this.lastNavTime : undefined
    
    this.events.push({
      from,
      to,
      timestamp: now,
      duration,
    })

    this.lastNavTime = now

    if (this.events.length > 50) {
      this.events = this.events.slice(-50)
    }

    console.group(`🧭 Navigation: ${from} → ${to}`)
    if (duration) console.log(`⏱️ Duration: ${duration}ms`)
    console.log(`📍 Events in session: ${this.events.length}`)
    console.groupEnd()
  }

  getEvents() {
    return this.events
  }

  clear() {
    this.events = []
    this.lastNavTime = 0
  }
}

const navTracker = new NavigationTracker()

// Make it available globally for debugging
if (typeof window !== "undefined") {
  (window as any).__navTracker = navTracker
}

export function useNavigationTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const prev = sessionStorage.getItem("prevPathname") || "/"
    navTracker.track(prev, pathname)
    sessionStorage.setItem("prevPathname", pathname)
  }, [pathname])

  return navTracker
}

export { navTracker }

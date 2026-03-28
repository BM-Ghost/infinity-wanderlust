"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

export function useSafeNavigate() {
  const router = useRouter()

  const navigate = useCallback((path: string) => {
    try {
      router.push(path)
    } catch (error) {
      console.error(`Navigation to ${path} failed:`, error)
      // Fallback to window.location for critical navigation
      window.location.href = path
    }
  }, [router])

  const startTransition = useCallback((callback: () => void) => {
    try {
      // React 18+ startTransition for pending states
      if ((window as any).React?.startTransition) {
        (window as any).React.startTransition(callback)
      } else {
        callback()
      }
    } catch (error) {
      console.error("Navigation transition failed:", error)
      callback()
    }
  }, [])

  return { navigate, startTransition }
}

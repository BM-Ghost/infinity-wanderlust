"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Link as LinkIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const DISMISS_KEY = "in_app_browser_notice_dismissed_v1"

function isInAppBrowser(userAgent: string) {
  const ua = userAgent.toLowerCase()
  return (
    ua.includes("instagram") ||
    ua.includes("whatsapp") ||
    ua.includes("fbav") ||
    ua.includes("fban") ||
    ua.includes("line/") ||
    ua.includes("wv")
  )
}

function getHostLabel(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (ua.includes("instagram")) return "Instagram"
  if (ua.includes("whatsapp")) return "WhatsApp"
  if (ua.includes("fbav") || ua.includes("fban")) return "Facebook"
  return "this app"
}

function getDeviceLabel(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return "ios"
  if (ua.includes("android")) return "android"
  return "other"
}

function getOpenInstructions(device: string) {
  if (device === "ios") {
    return "Tap the share button or the menu, then choose Open in Safari for the full site experience."
  }

  if (device === "android") {
    return "Tap the menu, then choose Open in Chrome or your default browser to browse freely."
  }

  return "Use your browser menu to open this page outside the in-app view for full navigation."
}

export function InAppBrowserNotice() {
  const [visible, setVisible] = useState(false)
  const [hostLabel, setHostLabel] = useState("this app")
  const [deviceLabel, setDeviceLabel] = useState("other")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1"
    const ua = window.navigator.userAgent || ""

    if (!dismissed && isInAppBrowser(ua)) {
      setHostLabel(getHostLabel(ua))
      setDeviceLabel(getDeviceLabel(ua))
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISMISS_KEY, "1")
    }
    setVisible(false)
  }

  const handleCopyLink = async () => {
    if (typeof window === "undefined") return
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Ignore clipboard failures in restricted webviews.
    }
  }

  const handleOpenInBrowser = async () => {
    if (typeof window === "undefined") return

    const opened = window.open(window.location.href, "_blank", "noopener,noreferrer")
    if (!opened) {
      await handleCopyLink()
    }
  }

  return (
    <div className="sticky top-0 z-[70] border-b border-amber-200 bg-amber-50/95 backdrop-blur supports-[backdrop-filter]:bg-amber-50/80">
      <div className="container flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-amber-900">Limited navigation inside {hostLabel} browser</p>
          <p className="text-xs text-amber-800">{getOpenInstructions(deviceLabel)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" size="sm" className="h-8 bg-amber-900 text-white hover:bg-amber-800" onClick={handleOpenInBrowser}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Open in browser
          </Button>
          <Button type="button" size="sm" variant="outline" className="h-8" onClick={handleCopyLink}>
            <LinkIcon className="mr-1.5 h-3.5 w-3.5" />
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 text-amber-900 hover:bg-amber-100 hover:text-amber-900" onClick={handleDismiss}>
            Dismiss
          </Button>
          <button
            type="button"
            aria-label="Close notice"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-amber-900 hover:bg-amber-100"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

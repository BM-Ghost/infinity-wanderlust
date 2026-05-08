"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { BarChart3, MousePointerClick, RefreshCcw, Users, Eye, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getPocketBase } from "@/lib/pocketbase"

type Summary = {
  visits: number
  uniqueVisitors: number
  engagementClicks: number
  engagementRate: number
  shareLandingVisits: number
  topPaths: Array<{ key: string; count: number }>
  topSources: Array<{ key: string; count: number }>
  topTargets: Array<{ key: string; count: number }>
}

type SummaryResponse = {
  ok: boolean
  source?: string
  providers?: {
    cloudflare?: boolean
    pocketbase?: boolean
  }
  providerBreakdown?: {
    summary1d?: {
      cloudflare?: { visits: number; uniqueVisitors: number } | null
      pocketbase?: { visits: number; engagementClicks: number } | null
    }
    summary7d?: {
      cloudflare?: { visits: number; uniqueVisitors: number } | null
      pocketbase?: { visits: number; engagementClicks: number } | null
    }
    summary30d?: {
      cloudflare?: { visits: number; uniqueVisitors: number } | null
      pocketbase?: { visits: number; engagementClicks: number } | null
    }
    summary90d?: {
      cloudflare?: { visits: number; uniqueVisitors: number } | null
      pocketbase?: { visits: number; engagementClicks: number } | null
    }
    pocketbaseScan?: {
      processed: number
      capped: boolean
      cap: number
    }
  }
  summary1d: Summary
  summary7d: Summary
  summary30d: Summary
  summary90d: Summary
  generatedAt: string
}

type WindowKey = "1d" | "7d" | "30d" | "90d"

function MetricTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon: ReactNode
}) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </div>
  )
}

function TopList({ title, items }: { title: string; items: Array<{ key: string; count: number }> }) {
  return (
    <div className="rounded-lg border bg-background/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          items.slice(0, 5).map((item) => (
            <div key={`${title}-${item.key}`} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-muted-foreground" title={item.key}>{item.key}</span>
              <span className="font-semibold">{item.count}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function ProviderDebugRows({
  label,
  cloudflare,
  pocketbase,
}: {
  label: string
  cloudflare?: { visits: number; uniqueVisitors: number } | null
  pocketbase?: { visits: number; engagementClicks: number } | null
}) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-2">
      <p className="text-[11px] font-semibold text-white/90">{label}</p>
      <p className="text-[11px] text-white/70">
        CF visits: {cloudflare?.visits ?? 0} | CF uniques: {cloudflare?.uniqueVisitors ?? 0}
      </p>
      <p className="text-[11px] text-white/70">
        PB visits: {pocketbase?.visits ?? 0} | PB clicks: {pocketbase?.engagementClicks ?? 0}
      </p>
    </div>
  )
}

export function AdminPerformancePanel() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<SummaryResponse | null>(null)
  const [windowKey, setWindowKey] = useState<WindowKey>("7d")

  const selectedSummary = useMemo(() => {
    if (!data) return null
    switch (windowKey) {
      case "1d":
        return data.summary1d
      case "7d":
        return data.summary7d
      case "30d":
        return data.summary30d
      case "90d":
        return data.summary90d
      default:
        return data.summary7d
    }
  }, [data, windowKey])

  const loadSummary = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const pb = getPocketBase()
      const token = pb?.authStore?.token || ""
      if (!token) throw new Error("Missing admin session")

      const response = await fetch("/api/analytics/summary", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(response.status === 403 ? "Access denied" : "Could not fetch analytics")
      }

      const payload = (await response.json()) as SummaryResponse
      setData(payload)
    } catch (err: any) {
      setError(err?.message || "Failed to load performance data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  return (
    <Card className="mt-6 border-white/20 bg-black/30 text-white backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <BarChart3 className="h-4 w-4" />
            Private Performance Insights
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={windowKey === "1d" ? "secondary" : "ghost"}
              className="h-8"
              onClick={() => setWindowKey("1d")}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={windowKey === "7d" ? "secondary" : "ghost"}
              className="h-8"
              onClick={() => setWindowKey("7d")}
            >
              7d
            </Button>
            <Button
              size="sm"
              variant={windowKey === "30d" ? "secondary" : "ghost"}
              className="h-8"
              onClick={() => setWindowKey("30d")}
            >
              30d
            </Button>
            <Button
              size="sm"
              variant={windowKey === "90d" ? "secondary" : "ghost"}
              className="h-8"
              onClick={() => setWindowKey("90d")}
            >
              90d
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => void loadSummary(true)}
              disabled={refreshing}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-white/80">Loading insights...</p>
        ) : error ? (
          <p className="text-sm text-rose-200">{error}</p>
        ) : selectedSummary ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MetricTile label="Visits" value={selectedSummary.visits} icon={<Eye className="h-3.5 w-3.5" />} />
              <MetricTile label="Unique Visitors" value={selectedSummary.uniqueVisitors} icon={<Users className="h-3.5 w-3.5" />} />
              <MetricTile label="Engagement Clicks" value={selectedSummary.engagementClicks} icon={<MousePointerClick className="h-3.5 w-3.5" />} />
              <MetricTile label="Engagement Rate" value={`${selectedSummary.engagementRate}%`} icon={<ExternalLink className="h-3.5 w-3.5" />} />
              <MetricTile label="Share Landing Visits" value={selectedSummary.shareLandingVisits} icon={<BarChart3 className="h-3.5 w-3.5" />} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <TopList title="Top Pages" items={selectedSummary.topPaths} />
              <TopList title="Top Sources" items={selectedSummary.topSources} />
              <TopList title="Top Targets" items={selectedSummary.topTargets} />
            </div>

            <p className="text-[11px] text-white/60">
              Visible only to admin. Updated {data?.generatedAt ? new Date(data.generatedAt).toLocaleString("en-US") : "just now"}.
            </p>
            <p className="text-[11px] text-white/60">
              Data providers: Cloudflare {data?.providers?.cloudflare ? "connected" : "offline"} | PocketBase {data?.providers?.pocketbase ? "connected" : "offline"}
            </p>

            {data?.providerBreakdown && (
              <div className="rounded-lg border border-white/20 bg-black/20 p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Provider Debug</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <ProviderDebugRows
                    label="Today"
                    cloudflare={data.providerBreakdown.summary1d?.cloudflare}
                    pocketbase={data.providerBreakdown.summary1d?.pocketbase}
                  />
                  <ProviderDebugRows
                    label="7d"
                    cloudflare={data.providerBreakdown.summary7d?.cloudflare}
                    pocketbase={data.providerBreakdown.summary7d?.pocketbase}
                  />
                  <ProviderDebugRows
                    label="30d"
                    cloudflare={data.providerBreakdown.summary30d?.cloudflare}
                    pocketbase={data.providerBreakdown.summary30d?.pocketbase}
                  />
                  <ProviderDebugRows
                    label="90d"
                    cloudflare={data.providerBreakdown.summary90d?.cloudflare}
                    pocketbase={data.providerBreakdown.summary90d?.pocketbase}
                  />
                </div>
                <p className="text-[11px] text-white/60">
                  PocketBase scan: {data.providerBreakdown.pocketbaseScan?.processed ?? 0} records
                  {data.providerBreakdown.pocketbaseScan?.capped ? ` (capped at ${data.providerBreakdown.pocketbaseScan.cap})` : ""}
                </p>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

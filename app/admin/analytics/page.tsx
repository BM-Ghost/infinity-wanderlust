"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import {
  ArrowLeft,
  Eye,
  Users,
  Pointer,
  Share2,
  Download,
  Printer,
  Link2,
  Sparkles,
  Target,
  TrendingUp,
  Heart,
  Megaphone,
  Lightbulb,
} from "lucide-react"
import { getPocketBase } from "@/lib/pocketbase"

const ADMIN_EMAIL = "infinitywanderlusttravels@gmail.com"
const COLORS = ["#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#22c55e"]

type Timeframe = "1d" | "7d" | "30d" | "90d"

interface AnalyticsSummary {
  visits: number
  uniqueVisitors: number
  engagementClicks: number
  engagementRate: number
  shareLandingVisits: number
  topPaths: Array<{ key: string; count: number }>
  topSources: Array<{ key: string; count: number }>
  topTargets: Array<{ key: string; count: number }>
  topReferrers: Array<{ key: string; count: number; userId: string; conversions: number }>
  topEngagedUsers: Array<{ key: string; visits: number; clicks: number; userId: string; engagementRate: number }>
}

interface AnalyticsResponse {
  ok: boolean
  summary1d: AnalyticsSummary
  summary7d: AnalyticsSummary
  summary30d: AnalyticsSummary
  summary90d: AnalyticsSummary
  generatedAt: string
}

interface BusinessMetricsResponse {
  topInfluencers: Array<{
    username: string
    name?: string
    influenceScore: number
    referralsCreated: number
    sponsorshipReadiness: string
    recommendedCompensation: string
  }>
  topContent: Array<{
    path: string
    viralityScore: number
    engagementRate: number
    monetizationPotential: string
  }>
  userSegments: Array<{
    tier: string
    count: number
    avgEngagementRate: number
    avgLifetimeValue: number
    characteristics?: string[]
    recommendedAction?: string
  }>
  opportunities: Array<{
    type: string
    title: string
    description: string
    confidence: number
    evidence?: string
    relatedPaths?: string[]
  }>
  underperformingPages?: Array<{
    path: string
    visits: number
    engagementRate: number
  }>
  generatedAt?: string
}

function formatPeriod(period: Timeframe): string {
  if (period === "1d") return "Today"
  if (period === "7d") return "Last 7 Days"
  if (period === "30d") return "Last 30 Days"
  return "Last 90 Days"
}

function toneForPotential(potential: string): "default" | "secondary" | "outline" {
  if (potential === "high") return "default"
  if (potential === "medium") return "secondary"
  return "outline"
}

function toneForConfidence(score: number): "default" | "secondary" | "outline" {
  if (score >= 85) return "default"
  if (score >= 65) return "secondary"
  return "outline"
}

function readableMemberName(label: string, userId: string, rank: number): string {
  if (!label) return `Member ${rank + 1}`
  const looksLikeRecordId = /^[a-z0-9]{15}$/i.test(label)
  if (looksLikeRecordId || label === userId) {
    return `Member ${rank + 1}`
  }
  return label
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [timeframe, setTimeframe] = useState<Timeframe>("7d")
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [business, setBusiness] = useState<BusinessMetricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBoardroomMode, setIsBoardroomMode] = useState(false)
  const [isExternalShareMode, setIsExternalShareMode] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const timeframeParam = url.searchParams.get("timeframe")
    const modeParam = url.searchParams.get("mode")

    if (timeframeParam === "1d" || timeframeParam === "7d" || timeframeParam === "30d" || timeframeParam === "90d") {
      setTimeframe(timeframeParam)
    }

    if (modeParam === "boardroom") {
      setIsBoardroomMode(true)
    }

    if (modeParam === "external") {
      setIsExternalShareMode(true)
      setIsBoardroomMode(false)
    }
  }, [])

  useEffect(() => {
    if (!actionFeedback) return
    const timeout = window.setTimeout(() => setActionFeedback(null), 3500)
    return () => window.clearTimeout(timeout)
  }, [actionFeedback])

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      router.push("/profile")
    }
  }, [isAuthLoading, isAdmin, router])

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const pb = getPocketBase()
        const token = pb?.authStore?.token
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

        const [summaryResponse, businessResponse] = await Promise.all([
          fetch("/api/analytics/summary", { headers }),
          fetch("/api/analytics/business-intelligence", { headers }),
        ])

        if (!summaryResponse.ok) {
          const summaryError = await summaryResponse.json().catch(() => ({}))
          throw new Error(summaryError?.error || "Unable to load performance summary")
        }

        if (!businessResponse.ok) {
          const businessError = await businessResponse.json().catch(() => ({}))
          throw new Error(businessError?.error || "Unable to load growth recommendations")
        }

        const summaryData = (await summaryResponse.json()) as AnalyticsResponse
        const businessData = (await businessResponse.json()) as BusinessMetricsResponse

        setAnalytics(summaryData)
        setBusiness(businessData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    if (isAdmin) {
      fetchAllData()
    }
  }, [isAdmin])

  const summaryKey = `summary${timeframe}` as keyof AnalyticsResponse
  const summary = analytics?.[summaryKey] as AnalyticsSummary | undefined

  const patternData = useMemo(() => {
    if (!analytics) return []

    return [
      { period: "Today", visits: analytics.summary1d.visits, actions: analytics.summary1d.engagementClicks },
      { period: "7 Days", visits: analytics.summary7d.visits, actions: analytics.summary7d.engagementClicks },
      { period: "30 Days", visits: analytics.summary30d.visits, actions: analytics.summary30d.engagementClicks },
      { period: "90 Days", visits: analytics.summary90d.visits, actions: analytics.summary90d.engagementClicks },
    ]
  }, [analytics])

  const storyHighlights = useMemo(() => {
    if (!summary) {
      return {
        audienceStory: "Audience summary will appear once data is available.",
        engagementStory: "Engagement summary will appear once data is available.",
        sharingStory: "Sharing summary will appear once data is available.",
      }
    }

    const visitDepth = summary.uniqueVisitors > 0 ? summary.visits / summary.uniqueVisitors : 0
    const actionRate = summary.visits > 0 ? (summary.engagementClicks / summary.visits) * 100 : 0
    const shareRate = summary.visits > 0 ? (summary.shareLandingVisits / summary.visits) * 100 : 0

    const audienceStory = `${summary.uniqueVisitors.toLocaleString()} unique visitor${summary.uniqueVisitors === 1 ? "" : "s"} generated ${summary.visits.toLocaleString()} total visits (${visitDepth.toFixed(1)} visits per person).`

    const engagementStory =
      actionRate >= 40
        ? `High interaction performance: ${summary.engagementClicks.toLocaleString()} actions from ${summary.visits.toLocaleString()} visits (${actionRate.toFixed(1)}% action rate).`
        : actionRate >= 15
          ? `Moderate interaction performance: ${summary.engagementClicks.toLocaleString()} actions from ${summary.visits.toLocaleString()} visits (${actionRate.toFixed(1)}% action rate).`
          : `Early interaction stage: ${summary.engagementClicks.toLocaleString()} actions from ${summary.visits.toLocaleString()} visits (${actionRate.toFixed(1)}% action rate).`

    const sharingStory =
      summary.shareLandingVisits > 0
        ? `${summary.shareLandingVisits.toLocaleString()} visits came from shared links (${shareRate.toFixed(1)}% of total traffic).`
        : "Shared-link contribution is currently 0%, based on tracked traffic in this period."

    return { audienceStory, engagementStory, sharingStory }
  }, [summary, timeframe])

  const executiveMetrics = useMemo(() => {
    if (!summary) {
      return {
        actionRate: 0,
        shareContribution: 0,
      }
    }

    return {
      actionRate: summary.visits > 0 ? (summary.engagementClicks / summary.visits) * 100 : 0,
      shareContribution: summary.visits > 0 ? (summary.shareLandingVisits / summary.visits) * 100 : 0,
    }
  }, [summary])

  const nonEmptySegments = useMemo(() => {
    if (!business?.userSegments) return []
    return business.userSegments.filter((segment) => segment.count > 0)
  }, [business])

  const reportPayload = useMemo(() => {
    if (!analytics || !business || !summary) return null

    return {
      reportName: "Infinity Wanderlust Growth Studio",
      period: formatPeriod(timeframe),
      generatedAt: analytics.generatedAt || business.generatedAt || new Date().toISOString(),
      snapshot: {
        visits: summary.visits,
        uniqueVisitors: summary.uniqueVisitors,
        engagementClicks: summary.engagementClicks,
        engagementRate: executiveMetrics.actionRate,
        shareLandingVisits: summary.shareLandingVisits,
        shareContributionRate: executiveMetrics.shareContribution,
      },
      analytics,
      business,
      storyHighlights,
    }
  }, [analytics, business, summary, timeframe, executiveMetrics, storyHighlights])

  function downloadBlob(filename: string, content: string, contentType: string) {
    const blob = new Blob([content], { type: contentType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function buildReportUrl() {
    const url = new URL(window.location.href)
    url.searchParams.set("timeframe", timeframe)
    if (isExternalShareMode) {
      url.searchParams.set("mode", "external")
    } else if (isBoardroomMode) {
      url.searchParams.set("mode", "boardroom")
    } else {
      url.searchParams.delete("mode")
    }
    return url.toString()
  }

  function buildExternalReportUrl() {
    const url = new URL(window.location.href)
    url.searchParams.set("timeframe", timeframe)
    url.searchParams.set("mode", "external")
    return url.toString()
  }

  async function handleShareReport() {
    if (!reportPayload) return

    const shareUrl = buildReportUrl()
    const shareText = `Infinity Wanderlust report for ${formatPeriod(timeframe)}: ${summary?.visits.toLocaleString() || 0} visits, ${summary?.uniqueVisitors.toLocaleString() || 0} people reached.`

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Infinity Wanderlust Growth Report",
          text: shareText,
          url: shareUrl,
        })
        setActionFeedback("Report shared successfully.")
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      setActionFeedback("Share link copied to clipboard.")
    } catch {
      setActionFeedback("Sharing was cancelled or unavailable.")
    }
  }

  async function handleShareExternalReport() {
    if (!reportPayload || !summary) return

    const shareUrl = buildExternalReportUrl()
    const shareText = `Infinity Wanderlust engagement snapshot (${formatPeriod(timeframe)}): ${summary.visits.toLocaleString()} visits, ${summary.uniqueVisitors.toLocaleString()} unique visitors, ${executiveMetrics.actionRate.toFixed(1)}% action rate.`

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Infinity Wanderlust Engagement Snapshot",
          text: shareText,
          url: shareUrl,
        })
        setActionFeedback("External report shared successfully.")
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      setActionFeedback("External report link copied to clipboard.")
    } catch {
      setActionFeedback("External sharing was cancelled or unavailable.")
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(buildReportUrl())
      setActionFeedback("Report link copied.")
    } catch {
      setActionFeedback("Could not copy the report link.")
    }
  }

  async function handleCopyExternalLink() {
    try {
      await navigator.clipboard.writeText(buildExternalReportUrl())
      setActionFeedback("External report link copied.")
    } catch {
      setActionFeedback("Could not copy the external report link.")
    }
  }

  function handleDownloadJson() {
    if (!reportPayload) return
    const dateLabel = new Date().toISOString().slice(0, 10)
    downloadBlob(
      `infinity-wanderlust-report-${timeframe}-${dateLabel}.json`,
      JSON.stringify(reportPayload, null, 2),
      "application/json"
    )
    setActionFeedback("JSON report downloaded.")
  }

  function handleDownloadHtml() {
    if (!reportPayload) return

    const dateLabel = new Date().toISOString().slice(0, 10)
    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Infinity Wanderlust Growth Report</title>
    <style>
      body { font-family: Segoe UI, Arial, sans-serif; margin: 32px; color: #0f172a; }
      h1 { margin-bottom: 6px; }
      .meta { color: #475569; margin-bottom: 20px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
      .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; }
      .k { color: #64748b; font-size: 12px; }
      .v { font-size: 22px; font-weight: 700; margin-top: 6px; }
      .section { margin-top: 22px; }
      ul { margin-top: 8px; }
      li { margin: 6px 0; }
    </style>
  </head>
  <body>
    <h1>Infinity Wanderlust Growth Report</h1>
    <div class="meta">Period: ${reportPayload.period} | Generated: ${new Date(reportPayload.generatedAt).toLocaleString()}</div>

    <div class="grid">
      <div class="card"><div class="k">Total Visits</div><div class="v">${reportPayload.snapshot.visits.toLocaleString()}</div></div>
      <div class="card"><div class="k">People Reached</div><div class="v">${reportPayload.snapshot.uniqueVisitors.toLocaleString()}</div></div>
      <div class="card"><div class="k">Actions Taken</div><div class="v">${reportPayload.snapshot.engagementClicks.toLocaleString()}</div></div>
      <div class="card"><div class="k">Shared-Link Visits</div><div class="v">${reportPayload.snapshot.shareLandingVisits.toLocaleString()}</div></div>
    </div>

    <div class="section">
      <h2>Top Highlights</h2>
      <ul>
        <li>${reportPayload.storyHighlights.audienceStory}</li>
        <li>${reportPayload.storyHighlights.engagementStory}</li>
        <li>${reportPayload.storyHighlights.sharingStory}</li>
      </ul>
    </div>

    <div class="section">
      <h2>Top Referrers</h2>
      <ul>
        ${summary?.topReferrers.slice(0, 5).map((r) => `<li>${r.key}: ${r.count} visits, ${r.conversions} actions</li>`).join("") || "<li>No data</li>"}
      </ul>
    </div>

    <div class="section">
      <h2>Recommended Next Moves</h2>
      <ul>
        ${business?.opportunities.slice(0, 5).map((o) => `<li>${o.title}: ${o.description}</li>`).join("") || "<li>No data</li>"}
      </ul>
    </div>
  </body>
</html>`

    downloadBlob(`infinity-wanderlust-report-${timeframe}-${dateLabel}.html`, html, "text/html")
    setActionFeedback("Presentation report downloaded.")
  }

  function handlePrintReport() {
    if (!isExternalShareMode) {
      setIsBoardroomMode(true)
    }
    setActionFeedback("Print dialog opened. Choose Save as PDF to download.")
    window.print()
  }

  if (isAuthLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.12),transparent_42%),radial-gradient(circle_at_100%_0%,rgba(20,184,166,0.12),transparent_40%),linear-gradient(to_bottom,rgba(15,23,42,0.03),transparent_30%)] print:bg-white">
      <div className="container py-8 space-y-8">
        <section className="rounded-2xl border bg-card/80 backdrop-blur-sm p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground print:hidden">
                <Sparkles className="h-3.5 w-3.5" />
                Executive View
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="print:hidden" onClick={() => router.push("/profile")}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Infinity Wanderlust Growth Studio</h1>
              </div>

              <p className="text-muted-foreground text-base md:text-lg">
                A single presentation page for performance, visit patterns, referrals, business opportunities, and next best actions.
              </p>

              <div className="flex flex-wrap gap-2 print:hidden">
                <Badge variant="secondary">Audience</Badge>
                <Badge variant="secondary">Engagement</Badge>
                <Badge variant="secondary">Referrals</Badge>
                <Badge variant="secondary">Business Intelligence</Badge>
              </div>
            </div>

            <div className="rounded-xl border bg-background p-4 min-w-[260px]">
              <p className="text-xs text-muted-foreground">Reporting Window</p>
              <p className="text-lg font-semibold mt-1">{formatPeriod(timeframe)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Updated {new Date(analytics?.generatedAt || business?.generatedAt || Date.now()).toLocaleString()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 print:hidden">
                <Button
                  size="sm"
                  variant={isBoardroomMode ? "default" : "outline"}
                  onClick={() => {
                    setIsExternalShareMode(false)
                    setIsBoardroomMode((v) => !v)
                  }}
                >
                  Boardroom Mode
                </Button>
                <Button
                  size="sm"
                  variant={isExternalShareMode ? "default" : "outline"}
                  onClick={() => {
                    setIsExternalShareMode((v) => !v)
                    setIsBoardroomMode(false)
                  }}
                >
                  External Share View
                </Button>
                <Button size="sm" variant="outline" onClick={handleShareReport}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button size="sm" variant="outline" onClick={handleShareExternalReport}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share External Report
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyExternalLink}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Copy External Link
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadHtml}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
                <Button size="sm" variant="outline" onClick={handleDownloadJson}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Data
                </Button>
                <Button size="sm" variant="outline" onClick={handlePrintReport}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print / PDF
                </Button>
              </div>
              {actionFeedback && <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-300">{actionFeedback}</p>}
            </div>
          </div>
        </section>

        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        <section className="rounded-xl border bg-card/80 p-4 print:hidden">
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as Timeframe)}>
            <TabsList>
              <TabsTrigger value="1d">Today</TabsTrigger>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </section>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, idx) => (
              <Skeleton key={idx} className="h-32" />
            ))}
          </div>
        ) : summary && business ? (
          <>
            {isBoardroomMode && (
              <section className="rounded-xl border bg-gradient-to-r from-sky-50 via-white to-teal-50 dark:from-sky-950/20 dark:via-background dark:to-teal-950/20 p-5">
                <h2 className="text-xl font-semibold mb-3">Boardroom Key Takeaways</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border bg-background p-3">
                    <p className="font-medium">Performance</p>
                    <p className="text-muted-foreground mt-1">{summary.visits.toLocaleString()} visits from {summary.uniqueVisitors.toLocaleString()} people.</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="font-medium">Engagement</p>
                    <p className="text-muted-foreground mt-1">{summary.engagementClicks.toLocaleString()} actions with a {executiveMetrics.actionRate.toFixed(1)}% action rate.</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="font-medium">Referral Impact</p>
                    <p className="text-muted-foreground mt-1">{summary.shareLandingVisits.toLocaleString()} visits came from shared links.</p>
                  </div>
                </div>
              </section>
            )}

            {isExternalShareMode && (
              <section className="rounded-xl border bg-gradient-to-r from-indigo-50 via-white to-cyan-50 dark:from-indigo-950/20 dark:via-background dark:to-cyan-950/20 p-5">
                <h2 className="text-xl font-semibold mb-2">External Growth Snapshot</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Neutral, partner-friendly view focused on traction and engagement signals.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border bg-background p-3">
                    <p className="font-medium">Audience Traction</p>
                    <p className="text-muted-foreground mt-1">{summary.uniqueVisitors.toLocaleString()} unique visitors and {summary.visits.toLocaleString()} visits in {formatPeriod(timeframe).toLowerCase()}.</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="font-medium">Interaction Depth</p>
                    <p className="text-muted-foreground mt-1">{summary.engagementClicks.toLocaleString()} measurable actions with {executiveMetrics.actionRate.toFixed(1)}% conversion from visit to action.</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="font-medium">Share-led Reach</p>
                    <p className="text-muted-foreground mt-1">{summary.shareLandingVisits.toLocaleString()} visits came via shared links ({executiveMetrics.shareContribution.toFixed(1)}% of traffic).</p>
                  </div>
                </div>
              </section>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-sky-50 to-white dark:from-sky-950/30 dark:to-background">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Visits</p>
                      <p className="mt-2 text-3xl font-bold">{summary.visits.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Traffic volume</p>
                    </div>
                    <Eye className="h-6 w-6 text-sky-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/30 dark:to-background">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">People Reached</p>
                      <p className="mt-2 text-3xl font-bold">{summary.uniqueVisitors.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">Unique audience</p>
                    </div>
                    <Users className="h-6 w-6 text-teal-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-background">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Actions Taken</p>
                      <p className="mt-2 text-3xl font-bold">{summary.engagementClicks.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">{executiveMetrics.actionRate.toFixed(1)}% action rate</p>
                    </div>
                    <Pointer className="h-6 w-6 text-amber-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-background">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Shared-Link Visits</p>
                      <p className="mt-2 text-3xl font-bold">{summary.shareLandingVisits.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">{executiveMetrics.shareContribution.toFixed(1)}% of visits</p>
                    </div>
                    <Share2 className="h-6 w-6 text-violet-600" />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5" />
                    Visit Pattern Story
                  </CardTitle>
                  <CardDescription>Short-term and long-term momentum in one view.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={290}>
                    <LineChart data={patternData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="visits" name="Visits" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="actions" name="Actions" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Executive Summary</CardTitle>
                  <CardDescription>Metric-based narrative generated from tracked performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg bg-sky-50 p-3 dark:bg-sky-950/40">
                    <p className="font-semibold text-sky-900 dark:text-sky-300">Audience Metrics</p>
                    <p className="text-sky-800 dark:text-sky-300 mt-1">{storyHighlights.audienceStory}</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40">
                    <p className="font-semibold text-emerald-900 dark:text-emerald-300">Engagement Metrics</p>
                    <p className="text-emerald-800 dark:text-emerald-300 mt-1">{storyHighlights.engagementStory}</p>
                  </div>
                  <div className="rounded-lg bg-violet-50 p-3 dark:bg-violet-950/40">
                    <p className="font-semibold text-violet-900 dark:text-violet-300">Sharing Metrics</p>
                    <p className="text-violet-800 dark:text-violet-300 mt-1">{storyHighlights.sharingStory}</p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Visited Pages</CardTitle>
                  <CardDescription>Where people spend the most time</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topPaths.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summary.topPaths}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="key" angle={-35} textAnchor="end" height={82} fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No page data for this window yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How Visitors Arrived</CardTitle>
                  <CardDescription>Source mix for discovery and reach</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topSources.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={summary.topSources}
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          dataKey="count"
                          label={({ key, percent }) => `${key} ${(percent * 100).toFixed(0)}%`}
                        >
                          {summary.topSources.map((_, index) => (
                            <Cell key={`source-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No source distribution yet.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Action Hotspots
                  </CardTitle>
                  <CardDescription>What people click most after arriving</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topTargets.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summary.topTargets} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="key" type="category" width={140} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No hotspot data yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Content With Business Potential
                  </CardTitle>
                  <CardDescription>Top pages ranked by momentum and value potential</CardDescription>
                </CardHeader>
                <CardContent>
                  {business.topContent.length > 0 ? (
                    <div className="space-y-3">
                      {business.topContent.slice(0, 5).map((item, index) => (
                        <div key={item.path + index} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm truncate">{item.path}</p>
                            <Badge variant={toneForPotential(item.monetizationPotential)}>{item.monetizationPotential}</Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-2 text-xs text-muted-foreground">
                            <span>Virality: {item.viralityScore.toFixed(0)}/100</span>
                            <span>Engagement: {item.engagementRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No content insights yet.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            {!isExternalShareMode && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5" />
                    Referral Champions
                  </CardTitle>
                  <CardDescription>Users who bring visitors and drive action</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topReferrers.length > 0 ? (
                    <div className="space-y-3">
                      {summary.topReferrers.slice(0, 6).map((referrer, index) => (
                        <div key={referrer.userId + index} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{readableMemberName(referrer.key, referrer.userId, index)}</p>
                              <p className="text-xs text-muted-foreground">{referrer.count} referral visits</p>
                            </div>
                          </div>
                          <Badge variant="secondary">{referrer.conversions} actions</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No referral champions yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Most Active Community Members
                  </CardTitle>
                  <CardDescription>Users with strongest activity and interaction behavior</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topEngagedUsers.length > 0 ? (
                    <div className="space-y-3">
                      {summary.topEngagedUsers.slice(0, 6).map((member, index) => (
                        <div key={member.userId + index} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{readableMemberName(member.key, member.userId, index)}</p>
                              <p className="text-xs text-muted-foreground">{member.visits} visits</p>
                            </div>
                          </div>
                          <Badge variant="outline">{member.engagementRate}% activity rate</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No activity leaders yet.</p>
                  )}
                </CardContent>
              </Card>
            </section>
            )}

            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Recommended Next Moves
                  </CardTitle>
                  <CardDescription>Objective recommendations with direct supporting data</CardDescription>
                </CardHeader>
                <CardContent>
                  {business.opportunities.length > 0 ? (
                    <div className="space-y-3">
                      {business.opportunities.slice(0, 5).map((opportunity, index) => (
                        <div key={opportunity.title + index} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{opportunity.title}</p>
                              <p className="text-xs text-muted-foreground">{opportunity.type}</p>
                            </div>
                            <Badge variant={toneForConfidence(opportunity.confidence)}>
                              {opportunity.confidence}% confidence
                            </Badge>
                          </div>

                          <p className="mt-2 text-sm text-muted-foreground">{opportunity.description}</p>

                          {opportunity.evidence && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Evidence: {opportunity.evidence}
                            </p>
                          )}

                          {opportunity.relatedPaths && opportunity.relatedPaths.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {opportunity.relatedPaths.map((path) => (
                                <Button
                                  key={path}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(path)}
                                >
                                  Open {path}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No recommendations yet.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            <section>
              <Card>
                <CardHeader>
                  <CardTitle>Fan Segments Overview</CardTitle>
                  <CardDescription>Only segments with real member activity are shown</CardDescription>
                </CardHeader>
                <CardContent>
                  {nonEmptySegments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {nonEmptySegments.map((segment) => (
                        <div key={segment.tier} className="rounded-lg border p-4 bg-muted/30">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="font-semibold capitalize">{segment.tier}</p>
                            <Badge variant={segment.tier === "vip" ? "default" : "secondary"}>{segment.count}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">Avg engagement: {segment.avgEngagementRate.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Avg value score: {segment.avgLifetimeValue.toFixed(0)}/100</p>
                          {segment.recommendedAction && (
                            <p className="text-xs mt-2 text-foreground/80">{segment.recommendedAction}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Not enough repeat behavior yet to form reliable fan segments.</p>
                  )}
                </CardContent>
              </Card>
            </section>

            {isExternalShareMode && (
              <section>
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Signals For Partners</CardTitle>
                    <CardDescription>Anonymized indicators focused on traction and market interest</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground">Top referral conversions</p>
                        <p className="text-2xl font-semibold mt-1">
                          {summary.topReferrers.reduce((sum, row) => sum + row.conversions, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground">Active content pages</p>
                        <p className="text-2xl font-semibold mt-1">{summary.topPaths.length.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg border p-3 bg-muted/30">
                        <p className="text-xs text-muted-foreground">Tracked interaction targets</p>
                        <p className="text-2xl font-semibold mt-1">{summary.topTargets.length.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import {
  Users,
  TrendingUp,
  Share2,
  MouseClick,
  Eye,
  UserCheck,
  Zap,
  Target,
  ArrowLeft,
} from "lucide-react"

const ADMIN_EMAIL = "infinitywanderlusttravels@gmail.com"

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

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4"]

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const [timeframe, setTimeframe] = useState<"1d" | "7d" | "30d" | "90d">("7d")
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  useEffect(() => {
    if (!isAuthLoading && !isAdmin) {
      router.push("/profile")
    }
  }, [isAuthLoading, isAdmin, router])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/analytics/summary")
        if (!response.ok) throw new Error("Failed to fetch analytics")
        const data = (await response.json()) as AnalyticsResponse
        setAnalytics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (isAuthLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const summaryKey = `summary${timeframe}` as keyof AnalyticsResponse
  const summary = analytics?.[summaryKey] as AnalyticsSummary | undefined

  const StatCard = ({ icon: Icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string | number; subtext?: string }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
            {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
          </div>
          <div className="text-primary/60">{Icon}</div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.push("/profile")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            </div>
            <p className="text-muted-foreground mt-2">Performance insights and user behavior metrics</p>
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(analytics?.generatedAt || Date.now()).toLocaleTimeString()}
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Timeframe Selector */}
        <div className="mb-6">
          <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
            <TabsList>
              <TabsTrigger value="1d">Today</TabsTrigger>
              <TabsTrigger value="7d">7 Days</TabsTrigger>
              <TabsTrigger value="30d">30 Days</TabsTrigger>
              <TabsTrigger value="90d">90 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : summary ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Eye className="h-6 w-6" />}
                label="Total Visits"
                value={summary.visits}
                subtext={`${summary.uniqueVisitors} unique visitors`}
              />
              <StatCard
                icon={<MouseClick className="h-6 w-6" />}
                label="Engagement Clicks"
                value={summary.engagementClicks}
                subtext={`${summary.engagementRate}% engagement rate`}
              />
              <StatCard
                icon={<Share2 className="h-6 w-6" />}
                label="Share Landing Visits"
                value={summary.shareLandingVisits}
                subtext={`From shared links`}
              />
              <StatCard
                icon={<Zap className="h-6 w-6" />}
                label="Conversion Rate"
                value={`${summary.visits > 0 ? ((summary.engagementClicks / summary.visits) * 100).toFixed(1) : 0}%`}
                subtext={`Clicks per visit`}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Pages */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                  <CardDescription>Most visited pages</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topPaths.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summary.topPaths}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="key" angle={-45} textAnchor="end" height={100} fontSize={12} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Traffic Sources */}
              <Card>
                <CardHeader>
                  <CardTitle>Traffic Sources</CardTitle>
                  <CardDescription>Where visitors come from</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topSources.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={summary.topSources}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ key, count }) => `${key} (${count})`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {summary.topSources.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Referrers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Top Referrers
                  </CardTitle>
                  <CardDescription>Users who shared links and drove engagement</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topReferrers && summary.topReferrers.length > 0 ? (
                    <div className="space-y-3">
                      {summary.topReferrers.map((referrer, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20 text-primary font-semibold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{referrer.key}</p>
                              <p className="text-xs text-muted-foreground">{referrer.count} shares</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{referrer.conversions}</p>
                            <p className="text-xs text-muted-foreground">clicks</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No referral data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Top Engaged Users */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Most Engaged Users
                  </CardTitle>
                  <CardDescription>Users with highest interaction rate</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topEngagedUsers && summary.topEngagedUsers.length > 0 ? (
                    <div className="space-y-3">
                      {summary.topEngagedUsers.map((user, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 font-semibold text-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.key}</p>
                              <p className="text-xs text-muted-foreground">{user.visits} visits</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{user.engagementRate}%</p>
                            <p className="text-xs text-muted-foreground">{user.clicks} clicks</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No engagement data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Engagement Targets */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Top Engagement Targets
                  </CardTitle>
                  <CardDescription>Most clicked content and sections</CardDescription>
                </CardHeader>
                <CardContent>
                  {summary.topTargets && summary.topTargets.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summary.topTargets} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="key" type="category" width={120} fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No engagement target data yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Insights Card */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Data-driven observations about user behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">👥 Audience Size</p>
                    <p className="text-xs text-blue-800 dark:text-blue-400">
                      You have {summary.uniqueVisitors} unique visitor
                      {summary.uniqueVisitors !== 1 ? "s" : ""} with {summary.visits} total visits in this period.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">✨ Engagement Health</p>
                    <p className="text-xs text-green-800 dark:text-green-400">
                      {summary.engagementRate > 50
                        ? "Excellent engagement! Users are highly interactive with your content."
                        : summary.engagementRate > 20
                          ? "Good engagement. Consider promoting more interactive content."
                          : "Engagement is low. Focus on creating compelling calls-to-action."}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">📢 Social Reach</p>
                    <p className="text-xs text-purple-800 dark:text-purple-400">
                      {summary.shareLandingVisits > 0
                        ? `${summary.shareLandingVisits} visits came from shared links. Encourage more sharing!`
                        : "No shared link visits yet. Encourage users to share interesting content."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}

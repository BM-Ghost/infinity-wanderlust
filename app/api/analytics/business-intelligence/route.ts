import { NextResponse } from "next/server"
import {
  calculateLoyaltyIndex,
  calculateLifetimeValue,
  calculateViralityScore,
  detectTrend,
  generateRecommendations,
  getMonetizationPotential,
  getUserTier,
  type ContentPerformance,
  type EngagementMetric,
  type UserEngagementProfile,
} from "@/lib/advanced-analytics"
import { getPocketBaseAdmin } from "@/lib/pocketbase"

export const runtime = "edge"

const ANALYTICS_COLLECTION = "engagement_metrics"
const PB_PAGE_SIZE = 500
const PB_MAX_SCAN_RECORDS = 60000

type RecordWithExpand = EngagementMetric & {
  expand?: {
    session_user_id?: { id: string; username?: string; name?: string }
    referrer_user_id?: { id: string; username?: string; name?: string }
  }
}

function toNumber(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Number(value.toFixed(2))
}

function normalizeUserId(value: unknown): string {
  if (!value) return ""
  if (Array.isArray(value)) return String(value[0] || "")
  return String(value)
}

async function listRecentRecords() {
  const adminPb = await getPocketBaseAdmin()
  const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const records: RecordWithExpand[] = []
  let page = 1

  while (true) {
    const pageResult = await adminPb.collection(ANALYTICS_COLLECTION).getList(page, PB_PAGE_SIZE, {
      filter: `created >= "${since90}"`,
      sort: "-created",
      fields: "id,created,event_type,path,source,visitor_key,target,referrer_user_id,session_user_id",
      expand: "session_user_id,referrer_user_id",
      skipTotal: true,
      $autoCancel: false,
    })

    const items = (pageResult.items || []) as RecordWithExpand[]
    if (items.length === 0) break

    records.push(...items)
    if (records.length >= PB_MAX_SCAN_RECORDS || items.length < PB_PAGE_SIZE) break

    page += 1
  }

  return records.slice(0, PB_MAX_SCAN_RECORDS)
}

function buildUserProfiles(records: RecordWithExpand[]): UserEngagementProfile[] {
  const userStats = new Map<
    string,
    {
      username: string
      name?: string
      visits: number
      clicks: number
      lastActive: string
      contentPreferences: Map<string, number>
      referralsCreated: number
      referralConversions: number
      referredUsers: Set<string>
    }
  >()

  for (const record of records) {
    const sessionUserId = normalizeUserId(record.session_user_id)
    const referrerUserId = normalizeUserId(record.referrer_user_id)

    if (sessionUserId) {
      const current = userStats.get(sessionUserId) || {
        username: record.expand?.session_user_id?.username || sessionUserId,
        name: record.expand?.session_user_id?.name,
        visits: 0,
        clicks: 0,
        lastActive: record.created,
        contentPreferences: new Map<string, number>(),
        referralsCreated: 0,
        referralConversions: 0,
        referredUsers: new Set<string>(),
      }

      if (record.event_type === "page_visit") {
        current.visits += 1
        current.contentPreferences.set(record.path, (current.contentPreferences.get(record.path) || 0) + 1)
      }

      if (record.event_type === "engagement_click") {
        current.clicks += 1
      }

      if (record.created > current.lastActive) {
        current.lastActive = record.created
      }

      userStats.set(sessionUserId, current)
    }

    if (referrerUserId) {
      const current = userStats.get(referrerUserId) || {
        username: record.expand?.referrer_user_id?.username || referrerUserId,
        name: record.expand?.referrer_user_id?.name,
        visits: 0,
        clicks: 0,
        lastActive: record.created,
        contentPreferences: new Map<string, number>(),
        referralsCreated: 0,
        referralConversions: 0,
        referredUsers: new Set<string>(),
      }

      current.referralsCreated += 1
      if (sessionUserId) {
        current.referredUsers.add(sessionUserId)
      }
      if (record.event_type === "engagement_click") {
        current.referralConversions += 1
      }

      userStats.set(referrerUserId, current)
    }
  }

  const engagementByUser = new Map<string, number>()
  for (const [userId, stats] of userStats.entries()) {
    const rate = stats.visits > 0 ? (stats.clicks / stats.visits) * 100 : 0
    engagementByUser.set(userId, rate)
  }

  const profiles: UserEngagementProfile[] = []

  for (const [userId, stats] of userStats.entries()) {
    const repeatVisitRate = stats.visits <= 1 ? 0 : Math.min(100, ((stats.visits - 1) / stats.visits) * 100)

    const recencyDays = Math.max(
      0,
      Math.floor((Date.now() - new Date(stats.lastActive).getTime()) / (1000 * 60 * 60 * 24))
    )

    const engagementRate = engagementByUser.get(userId) || 0

    let averageQualityScore = 0
    if (stats.referredUsers.size > 0) {
      let qualityTotal = 0
      for (const referredUser of stats.referredUsers) {
        qualityTotal += engagementByUser.get(referredUser) || 0
      }
      averageQualityScore = qualityTotal / stats.referredUsers.size
    }

    const loyaltyIndex = calculateLoyaltyIndex(repeatVisitRate, engagementRate, recencyDays)
    const lifetimeValueScore = calculateLifetimeValue(
      engagementRate,
      stats.referralConversions,
      loyaltyIndex,
      stats.referralsCreated > 0
    )

    const tier = getUserTier(stats.visits, engagementRate, lifetimeValueScore)

    const sortedPrefs = Array.from(stats.contentPreferences.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([type, count]) => ({ type, count }))

    profiles.push({
      userId,
      username: stats.username,
      name: stats.name,
      totalVisits: stats.visits,
      totalClicks: stats.clicks,
      engagementRate: toNumber(engagementRate),
      repeatVisitRate: toNumber(repeatVisitRate),
      averageSessionDepth: toNumber(stats.visits > 0 ? stats.clicks / stats.visits : 0),
      contentPreferences: sortedPrefs,
      referralStats: {
        referralsCreated: stats.referralsCreated,
        referralConversions: stats.referralConversions,
        averageQualityScore: toNumber(averageQualityScore),
      },
      loyaltyIndex: toNumber(loyaltyIndex),
      lifetimeValueScore: toNumber(lifetimeValueScore),
      tier,
      lastActive: stats.lastActive,
      trendingDirection: "stable",
    })
  }

  return profiles
}

function buildContentPerformance(records: RecordWithExpand[]): ContentPerformance[] {
  const now = Date.now()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  const stats = new Map<
    string,
    {
      visits: number
      clicks: number
      uniqueVisitors: Set<string>
      visitorVisitCounts: Map<string, number>
      referralClicks: number
      recentVisits: number
      olderVisits: number
    }
  >()

  for (const record of records) {
    const key = record.path || "/"
    const current = stats.get(key) || {
      visits: 0,
      clicks: 0,
      uniqueVisitors: new Set<string>(),
      visitorVisitCounts: new Map<string, number>(),
      referralClicks: 0,
      recentVisits: 0,
      olderVisits: 0,
    }

    const sessionUserId = normalizeUserId(record.session_user_id)
    const recordTime = new Date(record.created).getTime()

    if (record.event_type === "page_visit") {
      current.visits += 1
      if (sessionUserId) {
        current.uniqueVisitors.add(sessionUserId)
        current.visitorVisitCounts.set(sessionUserId, (current.visitorVisitCounts.get(sessionUserId) || 0) + 1)
      }
      if (now - recordTime <= thirtyDaysMs) {
        current.recentVisits += 1
      } else {
        current.olderVisits += 1
      }
    }

    if (record.event_type === "engagement_click") {
      current.clicks += 1
      if (normalizeUserId(record.referrer_user_id)) {
        current.referralClicks += 1
      }
    }

    stats.set(key, current)
  }

  return Array.from(stats.entries()).map(([path, metric]) => {
    const uniqueVisitors = metric.uniqueVisitors.size
    const repeatVisitorCount = Array.from(metric.visitorVisitCounts.values()).filter((count) => count > 1).length
    const repeatVisitRate = uniqueVisitors > 0 ? (repeatVisitorCount / uniqueVisitors) * 100 : 0
    const engagementRate = metric.visits > 0 ? (metric.clicks / metric.visits) * 100 : 0
    const averageClicksPerSession = metric.visits > 0 ? metric.clicks / metric.visits : 0
    const viralityScore = calculateViralityScore(uniqueVisitors, engagementRate, metric.referralClicks, Math.max(metric.visits, 1))

    return {
      path,
      totalVisits: metric.visits,
      totalClicks: metric.clicks,
      engagementRate: toNumber(engagementRate),
      uniqueVisitors,
      repeatVisitorCount,
      repeatVisitRate: toNumber(repeatVisitRate),
      averageClicksPerSession: toNumber(averageClicksPerSession),
      viralityScore: toNumber(viralityScore),
      monetizationPotential: getMonetizationPotential(engagementRate, uniqueVisitors, metric.visits),
      revenueIndicator: toNumber(metric.visits * 0.2 + engagementRate * 0.8 + viralityScore * 0.5),
      trendingDirection: detectTrend(metric.recentVisits, metric.olderVisits),
    } satisfies ContentPerformance
  })
}

export async function GET() {
  try {
    const records = await listRecentRecords()
    const users = buildUserProfiles(records)
    const content = buildContentPerformance(records)
    const businessIntelligence = generateRecommendations(users, content)

    const topInfluencers = businessIntelligence.topSponsorsshipOpportunities.map((item) => ({
      username: item.username,
      name: item.name,
      influenceScore: toNumber(item.influenceScore),
      referralsCreated: item.referralStats.referralsCreated,
      sponsorshipReadiness: item.sponsorshipReadiness,
      recommendedCompensation: item.recommendedCompensation,
    }))

    const topContent = content
      .sort((a, b) => b.viralityScore - a.viralityScore)
      .slice(0, 5)
      .map((item) => ({
        path: item.path,
        viralityScore: toNumber(item.viralityScore),
        engagementRate: toNumber(item.engagementRate),
        monetizationPotential: item.monetizationPotential,
      }))

    const opportunities = businessIntelligence.growthOpportunities.map((item) => ({
      type: item.type,
      title: item.type,
      description: item.opportunity,
      confidence: toNumber(item.confidence),
    }))

    return NextResponse.json({
      topInfluencers,
      topContent,
      userSegments: businessIntelligence.fanRewardSegmentation,
      opportunities,
      businessIntelligence,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Business intelligence error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to calculate business intelligence" },
      { status: 500 }
    )
  }
}

import PocketBase from "pocketbase"
import { NextResponse } from "next/server"
import { getPocketBaseAdmin } from "@/lib/pocketbase"
import { getCloudflareTrafficSummary, type AnalyticsSummary } from "@/lib/cloudflare-analytics"

export const runtime = "edge"

const PB_URL = "https://remain-faceghost.pockethost.io"
const ANALYTICS_COLLECTION = "engagement_metrics"
const ADMIN_EMAIL = "infinitywanderlusttravels@gmail.com"
const PB_PAGE_SIZE = 500
const PB_MAX_SCAN_RECORDS = 60000
let collectionReady = false
let ensureCollectionPromise: Promise<void> | null = null

async function ensureAnalyticsCollection(adminPb: any) {
  if (collectionReady) return
  if (ensureCollectionPromise) {
    await ensureCollectionPromise
    return
  }

  ensureCollectionPromise = (async () => {
    try {
      await adminPb.collections.getOne(ANALYTICS_COLLECTION)
      collectionReady = true
      return
    } catch (error: any) {
      if (error?.status !== 404) {
        return
      }
    }

    try {
      await adminPb.collections.create({
        name: ANALYTICS_COLLECTION,
        type: "base",
        schema: [
          { name: "event_type", type: "text", required: true },
          { name: "path", type: "text", required: true },
          { name: "source", type: "text", required: false },
          { name: "referrer_host", type: "text", required: false },
          { name: "visitor_key", type: "text", required: false },
          { name: "target", type: "text", required: false },
          { name: "destination", type: "text", required: false },
          { name: "user_id", type: "text", required: false },
          { name: "user_email", type: "text", required: false },
          { name: "user_agent", type: "text", required: false },
        ],
      })
      collectionReady = true
    } catch {
      // Collection likely exists already or creation is not allowed in this runtime.
    }
  })()

  try {
    await ensureCollectionPromise
  } finally {
    ensureCollectionPromise = null
  }
}

type AnalyticsRecord = {
  id: string
  created: string
  event_type: "page_visit" | "engagement_click"
  path: string
  source?: string
  visitor_key?: string
  target?: string
  referrer_user_id?: string
  session_user_id?: string
  expand?: {
    referrer_user_id?: { id: string; username: string; name?: string }
    session_user_id?: { id: string; username: string; name?: string }
  }
}

type WindowBuckets = {
  summary1d: AnalyticsRecord[]
  summary7d: AnalyticsRecord[]
  summary30d: AnalyticsRecord[]
  summary90d: AnalyticsRecord[]
}

type PocketBaseAggregateResult = {
  summary1d: ReturnType<typeof summarize>
  summary7d: ReturnType<typeof summarize>
  summary30d: ReturnType<typeof summarize>
  summary90d: ReturnType<typeof summarize>
  processed: number
  capped: boolean
}

function toTopEntries(map: Map<string, number>, limit = 5) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }))
}

function summarize(records: AnalyticsRecord[]) {
  const visitRecords = records.filter((r) => r.event_type === "page_visit")
  const clickRecords = records.filter((r) => r.event_type === "engagement_click")

  const uniqueVisitors = new Set(visitRecords.map((r) => r.visitor_key).filter(Boolean))

  const topPathsMap = new Map<string, number>()
  const sourceMap = new Map<string, number>()
  const topTargetsMap = new Map<string, number>()
  const topReferrersMap = new Map<string, { count: number; username?: string; name?: string }>()
  const userEngagementMap = new Map<string, { visits: number; clicks: number; username?: string; name?: string }>()
  const referralConversionsMap = new Map<string, number>() // referrer user ID -> conversion count

  for (const record of visitRecords) {
    const path = record.path || "/"
    topPathsMap.set(path, (topPathsMap.get(path) || 0) + 1)

    const source = record.source || "direct"
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1)

    // Track referrer users
    if (record.referrer_user_id) {
      const current = topReferrersMap.get(record.referrer_user_id) || { count: 0 }
      current.count += 1
      if (record.expand?.referrer_user_id) {
        current.username = record.expand.referrer_user_id.username
        current.name = record.expand.referrer_user_id.name
      }
      topReferrersMap.set(record.referrer_user_id, current)
    }

    // Track session user engagement
    if (record.session_user_id) {
      const current = userEngagementMap.get(record.session_user_id) || { visits: 0, clicks: 0 }
      current.visits += 1
      if (record.expand?.session_user_id) {
        current.username = record.expand.session_user_id.username
        current.name = record.expand.session_user_id.name
      }
      userEngagementMap.set(record.session_user_id, current)
    }
  }

  for (const record of clickRecords) {
    const target = record.target || "unknown"
    topTargetsMap.set(target, (topTargetsMap.get(target) || 0) + 1)

    // Track clicks for session user
    if (record.session_user_id) {
      const current = userEngagementMap.get(record.session_user_id) || { visits: 0, clicks: 0 }
      current.clicks += 1
      userEngagementMap.set(record.session_user_id, current)
    }

    // Track conversions from referrals
    if (record.referrer_user_id) {
      referralConversionsMap.set(
        record.referrer_user_id,
        (referralConversionsMap.get(record.referrer_user_id) || 0) + 1
      )
    }
  }

  // Format top referrers with conversion data
  const topReferrers = Array.from(topReferrersMap.entries())
    .map(([userId, data]) => ({
      key: data.name || data.username || userId,
      count: data.count,
      userId,
      conversions: referralConversionsMap.get(userId) || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  // Format top engaged users
  const topEngagedUsers = Array.from(userEngagementMap.entries())
    .map(([userId, data]) => ({
      key: data.name || data.username || userId,
      visits: data.visits,
      clicks: data.clicks,
      userId,
      engagementRate: data.visits > 0 ? Number(((data.clicks / data.visits) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 6)

  const visits = visitRecords.length
  const clicks = clickRecords.length

  return {
    visits,
    uniqueVisitors: uniqueVisitors.size,
    engagementClicks: clicks,
    engagementRate: visits > 0 ? Number(((clicks / visits) * 100).toFixed(2)) : 0,
    shareLandingVisits: visitRecords.filter((r) => r.path.startsWith("/articles/") || r.path.startsWith("/reviews/")).length,
    topPaths: toTopEntries(topPathsMap, 6),
    topSources: toTopEntries(sourceMap, 6),
    topTargets: toTopEntries(topTargetsMap, 6),
    topReferrers,
    topEngagedUsers,
  }
}

function mergeSummary(
  cloudflare: AnalyticsSummary | null,
  pocketbase: ReturnType<typeof summarize> | null,
): AnalyticsSummary {
  if (cloudflare && pocketbase) {
    const visits = cloudflare.visits
    const engagementClicks = pocketbase.engagementClicks
    return {
      visits,
      uniqueVisitors: cloudflare.uniqueVisitors,
      engagementClicks,
      engagementRate: visits > 0 ? Number(((engagementClicks / visits) * 100).toFixed(2)) : 0,
      shareLandingVisits: cloudflare.shareLandingVisits || pocketbase.shareLandingVisits,
      topPaths: cloudflare.topPaths,
      topSources: cloudflare.topSources,
      topTargets: pocketbase.topTargets,
      topReferrers: pocketbase.topReferrers || [],
      topEngagedUsers: pocketbase.topEngagedUsers || [],
    }
  }

  if (cloudflare) {
    return {
      ...cloudflare,
      topReferrers: [],
      topEngagedUsers: [],
    }
  }

  if (pocketbase) {
    return {
      visits: pocketbase.visits,
      uniqueVisitors: pocketbase.uniqueVisitors,
      engagementClicks: pocketbase.engagementClicks,
      engagementRate: pocketbase.engagementRate,
      shareLandingVisits: pocketbase.shareLandingVisits,
      topPaths: pocketbase.topPaths,
      topSources: pocketbase.topSources,
      topTargets: pocketbase.topTargets,
      topReferrers: pocketbase.topReferrers || [],
      topEngagedUsers: pocketbase.topEngagedUsers || [],
    }
  }

  return {
    visits: 0,
    uniqueVisitors: 0,
    engagementClicks: 0,
    engagementRate: 0,
    shareLandingVisits: 0,
    topPaths: [],
    topSources: [],
    topTargets: [],
    topReferrers: [],
    topEngagedUsers: [],
  }
}

async function aggregatePocketBaseSummaries(
  adminPb: any,
  since1: Date,
  since7: Date,
  since30: Date,
  since90: Date,
): Promise<PocketBaseAggregateResult> {
  const windows: WindowBuckets = {
    summary1d: [],
    summary7d: [],
    summary30d: [],
    summary90d: [],
  }

  let page = 1
  let processed = 0
  let capped = false

  while (true) {
    const pageResult = await adminPb.collection(ANALYTICS_COLLECTION).getList(page, PB_PAGE_SIZE, {
      filter: `created >= "${since90.toISOString()}"`,
      sort: "-created",
      fields: "id,created,event_type,path,source,visitor_key,target,referrer_user_id,session_user_id",
      expand: "referrer_user_id.username,referrer_user_id.name,session_user_id.username,session_user_id.name",
      skipTotal: true,
      $autoCancel: false,
    })

    const items = (pageResult.items || []) as AnalyticsRecord[]
    if (items.length === 0) break

    for (const record of items) {
      processed += 1
      windows.summary90d.push(record)
      if (record.created >= since30.toISOString()) windows.summary30d.push(record)
      if (record.created >= since7.toISOString()) windows.summary7d.push(record)
      if (record.created >= since1.toISOString()) windows.summary1d.push(record)

      if (processed >= PB_MAX_SCAN_RECORDS) {
        capped = true
        break
      }
    }

    if (capped || items.length < PB_PAGE_SIZE) break
    page += 1
  }

  return {
    summary1d: summarize(windows.summary1d),
    summary7d: summarize(windows.summary7d),
    summary30d: summarize(windows.summary30d),
    summary90d: summarize(windows.summary90d),
    processed,
    capped,
  }
}

async function requireAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim()
  if (!token) return false

  try {
    const userPb = new PocketBase(PB_URL)
    userPb.authStore.save(token, null)
    const auth = await userPb.collection("users").authRefresh()
    return String(auth.record.email || "").toLowerCase() === ADMIN_EMAIL
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  try {
    const isAdmin = await requireAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } })
    }

    const url = new URL(request.url)
    const sourceMode = (url.searchParams.get("source") || "hybrid").toLowerCase()

    // Calculate date ranges
    const since90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const since1 = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const now = new Date()

    const useCloudflare = sourceMode === "hybrid" || sourceMode === "cloudflare"
    const usePocketBase = sourceMode === "hybrid" || sourceMode === "pocketbase"

    const [cf1d, cf7d, cf30d, cf90d] = useCloudflare
      ? await Promise.all([
          getCloudflareTrafficSummary(since1, now),
          getCloudflareTrafficSummary(since7, now),
          getCloudflareTrafficSummary(since30, now),
          getCloudflareTrafficSummary(since90, now),
        ])
      : [null, null, null, null]

    let pb1d: ReturnType<typeof summarize> | null = null
    let pb7d: ReturnType<typeof summarize> | null = null
    let pb30d: ReturnType<typeof summarize> | null = null
    let pb90d: ReturnType<typeof summarize> | null = null

    let pbProcessed = 0
    let pbCapped = false

    if (usePocketBase) {
      try {
        const adminPb = await getPocketBaseAdmin()
        await ensureAnalyticsCollection(adminPb)

        const aggregated = await aggregatePocketBaseSummaries(adminPb, since1, since7, since30, since90)
        pb1d = aggregated.summary1d
        pb7d = aggregated.summary7d
        pb30d = aggregated.summary30d
        pb90d = aggregated.summary90d
        pbProcessed = aggregated.processed
        pbCapped = aggregated.capped
      } catch (pbError) {
        console.warn("[Analytics] PocketBase summary unavailable", pbError)
      }
    }

    const summary1d = mergeSummary(cf1d, pb1d)
    const summary7d = mergeSummary(cf7d, pb7d)
    const summary30d = mergeSummary(cf30d, pb30d)
    const summary90d = mergeSummary(cf90d, pb90d)

    const hasAnyData =
      summary1d.visits > 0 ||
      summary7d.visits > 0 ||
      summary30d.visits > 0 ||
      summary90d.visits > 0 ||
      summary90d.engagementClicks > 0

    if (!hasAnyData) {
      return NextResponse.json({ error: "No analytics data available yet" }, { status: 404, headers: { "Cache-Control": "no-store" } })
    }

    return NextResponse.json({
      ok: true,
      source: sourceMode,
      providers: {
        cloudflare: Boolean(cf1d || cf7d || cf30d || cf90d),
        pocketbase: Boolean(pb1d || pb7d || pb30d || pb90d),
      },
      providerBreakdown: {
        summary1d: {
          cloudflare: cf1d ? { visits: cf1d.visits, uniqueVisitors: cf1d.uniqueVisitors } : null,
          pocketbase: pb1d ? { visits: pb1d.visits, engagementClicks: pb1d.engagementClicks } : null,
        },
        summary7d: {
          cloudflare: cf7d ? { visits: cf7d.visits, uniqueVisitors: cf7d.uniqueVisitors } : null,
          pocketbase: pb7d ? { visits: pb7d.visits, engagementClicks: pb7d.engagementClicks } : null,
        },
        summary30d: {
          cloudflare: cf30d ? { visits: cf30d.visits, uniqueVisitors: cf30d.uniqueVisitors } : null,
          pocketbase: pb30d ? { visits: pb30d.visits, engagementClicks: pb30d.engagementClicks } : null,
        },
        summary90d: {
          cloudflare: cf90d ? { visits: cf90d.visits, uniqueVisitors: cf90d.uniqueVisitors } : null,
          pocketbase: pb90d ? { visits: pb90d.visits, engagementClicks: pb90d.engagementClicks } : null,
        },
        pocketbaseScan: {
          processed: pbProcessed,
          capped: pbCapped,
          cap: PB_MAX_SCAN_RECORDS,
        },
      },
      summary1d,
      summary7d,
      summary30d,
      summary90d,
      generatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("/api/analytics/summary error", error)
    return NextResponse.json({ error: "Failed to load analytics summary" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  }
}

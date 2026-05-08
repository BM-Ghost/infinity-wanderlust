type TopEntry = { key: string; count: number }

export type AnalyticsSummary = {
  visits: number
  uniqueVisitors: number
  engagementClicks: number
  engagementRate: number
  shareLandingVisits: number
  topPaths: TopEntry[]
  topSources: TopEntry[]
  topTargets: TopEntry[]
}

type CloudflareUriBucket = {
  uri?: string
  requests?: {
    all?: number
    cached?: number
    uncached?: number
  }
}

type CloudflareSummaryBucket = {
  requests?: {
    all?: number
  }
  uniques?: {
    all?: number
  }
  pageviews?: {
    all?: number
  }
}

type CloudflareReferrerBucket = {
  referrer?: string
  requests?: {
    all?: number
  }
}

type ZoneLookupResponse = {
  success: boolean
  result?: Array<{ id: string; name: string }>
}

type AnalyticsByUriResponse = {
  success: boolean
  result?: {
    rows?: CloudflareUriBucket[]
  }
}

type AnalyticsDashboardResponse = {
  success: boolean
  result?: {
    totals?: {
      requests?: {
        all?: number
      }
      uniques?: {
        all?: number
      }
      pageviews?: {
        all?: number
      }
    }
  }
}

type ReferrersResponse = {
  success: boolean
  result?: {
    referrers?: CloudflareReferrerBucket[]
  }
}

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"
const DEFAULT_DOMAIN = "infinity-wanderlust.com"

function isoNoMs(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/, "Z")
}

function toTopEntries(map: Map<string, number>, limit = 6): TopEntry[] {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }))
}

function simplifyReferrer(referrer: string): string {
  const lowered = referrer.toLowerCase()
  if (!lowered || lowered === "(none)" || lowered === "direct") return "direct"
  if (lowered.includes("instagram")) return "instagram"
  if (lowered.includes("whatsapp")) return "whatsapp"
  if (lowered.includes("facebook")) return "facebook"
  if (lowered.includes("t.co") || lowered.includes("twitter") || lowered.includes("x.com")) return "x"
  if (lowered.includes("google")) return "google"
  return lowered
}

async function cfFetch<T>(
  apiToken: string,
  endpoint: string,
  searchParams?: Record<string, string>
): Promise<T | null> {
  const url = new URL(`${CLOUDFLARE_API_BASE}${endpoint}`)
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const body = await response.text().catch(() => "")
    console.error("[Cloudflare] request failed", endpoint, response.status, body)
    return null
  }

  return (await response.json()) as T
}

async function getZoneId(apiToken: string, domain: string): Promise<string | null> {
  const data = await cfFetch<ZoneLookupResponse>(apiToken, "/zones", { name: domain, per_page: "1" })
  if (!data?.success) return null
  return data.result?.[0]?.id || null
}

function normalizePath(rawPath: string): string {
  if (!rawPath) return "/"
  const withoutQuery = rawPath.split("?")[0]
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`
}

export async function getCloudflareTrafficSummary(
  since: Date,
  until: Date = new Date()
): Promise<AnalyticsSummary | null> {
  const apiToken = process.env.CLOUDFLARE_ANALYTICS_TOKEN
  const domain = process.env.CLOUDFLARE_DOMAIN || DEFAULT_DOMAIN

  if (!apiToken) return null

  try {
    const zoneId = await getZoneId(apiToken, domain)
    if (!zoneId) {
      console.warn("[Cloudflare] zone lookup returned no zone id")
      return null
    }

    const sinceIso = isoNoMs(since)
    const untilIso = isoNoMs(until)

    const [byUri, dashboard, referrers] = await Promise.all([
      cfFetch<AnalyticsByUriResponse>(apiToken, `/zones/${zoneId}/analytics/dashboard/http_requests/by_uri`, {
        since: sinceIso,
        until: untilIso,
      }),
      cfFetch<AnalyticsDashboardResponse>(apiToken, `/zones/${zoneId}/analytics/dashboard`, {
        since: sinceIso,
        until: untilIso,
      }),
      cfFetch<ReferrersResponse>(apiToken, `/zones/${zoneId}/analytics/dashboard/referrers`, {
        since: sinceIso,
        until: untilIso,
      }),
    ])

    if (!byUri?.success || !dashboard?.success) {
      return null
    }

    const uriRows = byUri.result?.rows || []
    const topPathMap = new Map<string, number>()
    let shareLandingVisits = 0

    for (const row of uriRows) {
      const path = normalizePath(row.uri || "/")
      const count = row.requests?.all || 0
      if (count <= 0) continue
      topPathMap.set(path, (topPathMap.get(path) || 0) + count)

      if (path.startsWith("/articles/") || path.startsWith("/reviews/")) {
        shareLandingVisits += count
      }
    }

    const sourceMap = new Map<string, number>()
    const refRows = referrers?.result?.referrers || []
    for (const row of refRows) {
      const key = simplifyReferrer(row.referrer || "direct")
      const count = row.requests?.all || 0
      if (count <= 0) continue
      sourceMap.set(key, (sourceMap.get(key) || 0) + count)
    }

    const totals = dashboard.result?.totals
    const visits = totals?.requests?.all || 0
    const uniqueVisitors = totals?.uniques?.all || 0

    const summary: AnalyticsSummary = {
      visits,
      uniqueVisitors,
      engagementClicks: 0,
      engagementRate: 0,
      shareLandingVisits,
      topPaths: toTopEntries(topPathMap, 6),
      topSources: toTopEntries(sourceMap, 6),
      topTargets: [],
    }

    return summary
  } catch (error) {
    console.error("[Cloudflare] analytics fetch failed", error)
    return null
  }
}

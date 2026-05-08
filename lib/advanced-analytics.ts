/**
 * Advanced Analytics - Extract maximum business value from engagement data
 * Used for: Endorsements, Fan Rewards, Growth Partnerships, Monetization
 */

export interface EngagementMetric {
  id: string
  created: string
  event_type: "page_visit" | "engagement_click"
  path: string
  source?: string
  visitor_key?: string
  target?: string
  referrer_user_id?: string
  session_user_id?: string
}

export interface UserEngagementProfile {
  userId: string
  username: string
  name?: string
  totalVisits: number
  totalClicks: number
  engagementRate: number
  repeatVisitRate: number // % of users who return
  averageSessionDepth: number // avg clicks per visit
  contentPreferences: Array<{ type: string; count: number }>
  referralStats: {
    referralsCreated: number
    referralConversions: number // clicks from referrals
    averageQualityScore: number // avg quality of users they referred
  }
  loyaltyIndex: number // 0-100: likelihood to return and engage
  lifetimeValueScore: number // 0-100: business value indicator
  tier: "vip" | "premium" | "regular" | "casual"
  lastActive: string
  trendingDirection: "increasing" | "stable" | "declining" // engagement trend
}

export interface ContentPerformance {
  path: string
  totalVisits: number
  totalClicks: number
  engagementRate: number
  uniqueVisitors: number
  repeatVisitorCount: number
  repeatVisitRate: number
  averageClicksPerSession: number
  viralityScore: number // 0-100: how much it's shared/clicked
  monetizationPotential: "high" | "medium" | "low"
  revenueIndicator: number // estimated value
  trendingDirection: "viral" | "stable" | "declining"
}

export interface UserSegment {
  tier: "vip" | "premium" | "regular" | "casual"
  count: number
  avgEngagementRate: number
  avgLifetimeValue: number
  characteristics: string[]
  recommendedAction: string
}

export interface InfluencerProfile extends UserEngagementProfile {
  influenceScore: number // 0-100: combined score for sponsorship
  audienceQuality: number // 0-100: are their referrals engaged?
  sponsorshipReadiness: string // "ready" | "developing" | "early"
  recommendedCompensation: "high" | "medium" | "low" | "partnership"
}

export interface BusinessIntelligence {
  topSponsorsshipOpportunities: InfluencerProfile[]
  contentMonetizationRecommendations: Array<{
    path: string
    recommendation: string
    confidence: number
    estimatedValue: string
  }>
  fanRewardSegmentation: UserSegment[]
  growthOpportunities: Array<{
    type: string
    opportunity: string
    confidence: number
  }>
}

// Calculate loyalty index: Will user return and engage?
export function calculateLoyaltyIndex(
  repeatVisitRate: number,
  engagementRate: number,
  lastActiveRecency: number // days ago
): number {
  const recencyScore = Math.max(0, 100 - lastActiveRecency * 5) // decays over time
  const loyaltyScore =
    (repeatVisitRate * 0.4 + engagementRate * 0.4 + recencyScore * 0.2)
  return Math.min(100, Math.max(0, loyaltyScore))
}

// Calculate lifetime value: How much business value will this user bring?
export function calculateLifetimeValue(
  engagementRate: number,
  referralConversions: number,
  loyaltyIndex: number,
  isReferrer: boolean
): number {
  const baseValue = engagementRate * 0.5 // engaged users are valuable
  const referralValue = Math.min(30, referralConversions * 2) // referrers are very valuable
  const loyaltyBonus = loyaltyIndex * 0.2 // repeat visitors worth more
  const influencerBonus = isReferrer ? 15 : 0

  return Math.min(
    100,
    Math.max(0, baseValue + referralValue + loyaltyBonus + influencerBonus)
  )
}

// Segment users into tiers for reward programs
export function getUserTier(
  visits: number,
  engagementRate: number,
  lifetimeValue: number
): "vip" | "premium" | "regular" | "casual" {
  if (visits >= 10 && engagementRate >= 50 && lifetimeValue >= 70) return "vip"
  if (visits >= 5 && engagementRate >= 20 && lifetimeValue >= 40) return "premium"
  if (visits >= 2 && lifetimeValue >= 20) return "regular"
  return "casual"
}

// Calculate virality: How much does content spread?
export function calculateViralityScore(
  uniqueVisitors: number,
  engagementRate: number,
  referralClicks: number,
  pageVisits: number
): number {
  const shareVelocity = Math.min(30, referralClicks * 3) // shared content
  const engagementBoost = engagementRate * 0.5 // engaged users share more
  const reachScore = Math.min(40, (uniqueVisitors / pageVisits) * 100) // reach per visit

  return Math.min(
    100,
    Math.max(0, shareVelocity + engagementBoost + reachScore)
  )
}

// Calculate influence score for sponsorship opportunities
export function calculateInfluenceScore(
  referralsCreated: number,
  audienceQuality: number, // 0-100
  engagementRate: number,
  repeatVisitRate: number
): number {
  const reachScore = Math.min(40, referralsCreated * 2) // size of audience
  const qualityScore = audienceQuality * 0.4 // are they referring quality users?
  const trustScore = (engagementRate + repeatVisitRate) * 0.2 // do their referrals stay engaged?

  return Math.min(100, Math.max(0, reachScore + qualityScore + trustScore))
}

// Monetization potential based on engagement and reach
export function getMonetizationPotential(
  engagementRate: number,
  uniqueVisitors: number,
  pageVisits: number
): "high" | "medium" | "low" {
  if (engagementRate >= 40 && uniqueVisitors >= 50) return "high"
  if (engagementRate >= 20 && uniqueVisitors >= 20) return "medium"
  return "low"
}

// Estimate content value for sponsorship/partnerships
export function estimateContentValue(
  pageVisits: number,
  engagementRate: number,
  viralityScore: number
): string {
  const baseValue = pageVisits * 0.1
  const engagementBonus = engagementRate * 2
  const viralBonus = viralityScore * 0.5

  const totalValue = baseValue + engagementBonus + viralBonus

  if (totalValue > 500) return "High-Value Content"
  if (totalValue > 200) return "Premium Content"
  if (totalValue > 50) return "Standard Content"
  return "Emerging Content"
}

// Detect trending content
export function detectTrend(
  recent: number,
  older: number
): "viral" | "stable" | "declining" {
  const change = (recent - older) / (older || 1)
  if (change > 0.2) return "viral"
  if (change < -0.2) return "declining"
  return "stable"
}

// Generate business recommendations
export function generateRecommendations(
  users: UserEngagementProfile[],
  content: ContentPerformance[]
): BusinessIntelligence {
  // Top sponsorship opportunities
  const topSponsorsshipOpportunities = users
    .filter((u) => u.referralStats.referralsCreated > 0)
    .sort((a, b) => {
      const scoreA = calculateInfluenceScore(
        a.referralStats.referralsCreated,
        a.referralStats.averageQualityScore,
        a.engagementRate,
        a.repeatVisitRate
      )
      const scoreB = calculateInfluenceScore(
        b.referralStats.referralsCreated,
        b.referralStats.averageQualityScore,
        b.engagementRate,
        b.repeatVisitRate
      )
      return scoreB - scoreA
    })
    .slice(0, 5)
    .map((u) => ({
      ...u,
      influenceScore: calculateInfluenceScore(
        u.referralStats.referralsCreated,
        u.referralStats.averageQualityScore,
        u.engagementRate,
        u.repeatVisitRate
      ),
      audienceQuality: u.referralStats.averageQualityScore,
      sponsorshipReadiness:
        u.referralStats.referralsCreated > 10
          ? "ready"
          : u.referralStats.referralsCreated > 3
            ? "developing"
            : "early",
      recommendedCompensation:
        u.referralStats.referralsCreated > 10
          ? "high"
          : u.referralStats.referralsCreated > 5
            ? "medium"
            : "partnership",
    }))

  // Content monetization recommendations
  const contentMonetizationRecommendations = content
    .filter((c) => c.engagementRate >= 30)
    .sort((a, b) => b.viralityScore - a.viralityScore)
    .slice(0, 5)
    .map((c) => ({
      path: c.path,
      recommendation: `${c.path} is performing ${c.trendingDirection}. Consider ${
        c.trendingDirection === "viral"
          ? "promoting and sponsoring"
          : "optimizing for engagement"
      }.`,
      confidence: Math.min(
        100,
        (c.engagementRate + c.viralityScore) / 2
      ),
      estimatedValue: estimateContentValue(
        c.totalVisits,
        c.engagementRate,
        c.viralityScore
      ),
    }))

  // Fan reward segmentation
  const segments = ["vip", "premium", "regular", "casual"] as const
  const fanRewardSegmentation: UserSegment[] = segments.map((tier) => {
    const tierUsers = users.filter((u) => u.tier === tier)
    return {
      tier,
      count: tierUsers.length,
      avgEngagementRate:
        tierUsers.reduce((sum, u) => sum + u.engagementRate, 0) /
        (tierUsers.length || 1),
      avgLifetimeValue:
        tierUsers.reduce((sum, u) => sum + u.lifetimeValueScore, 0) /
        (tierUsers.length || 1),
      characteristics: {
        vip: [
          "Highly engaged",
          "Frequent returners",
          "Natural promoters",
        ],
        premium: [
          "Consistently engaged",
          "Regular visitors",
          "Good content sharers",
        ],
        regular: ["Occasional visitors", "Moderate engagement"],
        casual: ["First-time or infrequent", "Low engagement"],
      }[tier],
      recommendedAction: {
        vip: "VIP rewards program, exclusive access, sponsor opportunities",
        premium:
          "Loyalty rewards, early content access, referral incentives",
        regular: "Welcome back offers, engagement incentives",
        casual: "Onboarding content, value proposition reinforcement",
      }[tier],
    }
  })

  // Growth opportunities
  const growthOpportunities = [
    {
      type: "Content Gap",
      opportunity:
        content.length > 0
          ? `${content.filter((c) => c.engagementRate < 10).length} underperforming pages - opportunity to refresh or remove`
          : "Analyze content performance",
      confidence: 85,
    },
    {
      type: "Referral Acceleration",
      opportunity:
        users.filter((u) => u.referralStats.referralsCreated === 0).length > 0
          ? "Incentivize non-referrers to share content"
          : "Expand referral incentives",
      confidence: 75,
    },
    {
      type: "Retention Opportunity",
      opportunity:
        users.filter((u) => u.tier === "casual").length > users.length / 2
          ? "High casual user ratio - focus on engagement and return incentives"
          : "Strong retention - maintain momentum",
      confidence: 80,
    },
  ]

  return {
    topSponsorsshipOpportunities,
    contentMonetizationRecommendations,
    fanRewardSegmentation,
    growthOpportunities,
  }
}

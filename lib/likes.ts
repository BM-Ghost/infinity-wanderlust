export type LikeItemType = "review" | "comment" | "upload"

/**
 * Toggle a like for an item. Returns the new liked state and count.
 * Calls the server action via the /api/likes/toggle edge route.
 */
export async function toggleItemLike(
  itemId: string,
  itemType: LikeItemType,
  userId: string,
): Promise<{ liked: boolean; count: number }> {
  const res = await fetch("/api/likes/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, itemType, userId }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Failed to toggle like")
  }

  return res.json()
}

/**
 * Fetch the list of item IDs that the given user has liked.
 * Used on page mount to initialise liked state.
 * Cached with localStorage for instant subsequent loads.
 */
export async function getUserLikedItems(
  userId: string,
  itemType: LikeItemType,
): Promise<string[]> {
  try {
    // Check cache first for instant load
    const cacheKey = `likes_cache_${userId}_${itemType}`
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null
    if (cached) {
      const { items, timestamp } = JSON.parse(cached)
      // Use cache if less than 5 minutes old
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return items
      }
    }

    const res = await fetch(
      `/api/likes/user?userId=${encodeURIComponent(userId)}&itemType=${encodeURIComponent(itemType)}`,
    )
    if (!res.ok) return cached ? JSON.parse(cached).items : []
    
    const data = await res.json()
    const items = data.itemIds || []

    // Cache the result
    if (typeof window !== "undefined") {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          items,
          timestamp: Date.now(),
        }),
      )
    }

    return items
  } catch {
    // Return empty array or cached data on error
    const cacheKey = `likes_cache_${userId}_${itemType}`
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null
    return cached ? JSON.parse(cached).items : []
  }
}

/**
 * Invalidate cache for a user's likes to force refetch
 * Call this after toggling a like to keep cache in sync
 */
export function invalidateLikesCache(userId: string, itemType: LikeItemType): void {
  if (typeof window === "undefined") return
  const cacheKey = `likes_cache_${userId}_${itemType}`
  localStorage.removeItem(cacheKey)
}

/**
 * Batch fetch like counts for multiple items
 * More efficient than fetching one by one
 */
export async function getBatchItemCounts(
  itemIds: string[],
  itemType: LikeItemType,
): Promise<Record<string, number>> {
  try {
    const res = await fetch("/api/likes/batch-counts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds, itemType }),
    })

    if (!res.ok) return {}
    const data = await res.json()
    return data.counts || {}
  } catch {
    return {}
  }
}


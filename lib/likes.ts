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
 */
export async function getUserLikedItems(
  userId: string,
  itemType: LikeItemType,
): Promise<string[]> {
  try {
    const res = await fetch(
      `/api/likes/user?userId=${encodeURIComponent(userId)}&itemType=${encodeURIComponent(itemType)}`,
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.itemIds || []
  } catch {
    return []
  }
}

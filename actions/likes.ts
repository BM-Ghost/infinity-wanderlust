"use server"

import { getPocketBaseAdmin } from "@/lib/pocketbase"
import { notifyReviewLike, notifyCommentLike } from "@/lib/notifications"

export type LikeItemType = "review" | "comment" | "upload"

const LIKES_COLLECTION = "likes"

function pbEsc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/~/g, "\\~").replace(/"/g, '\\"')
}

async function ensureLikesCollection(adminPb: any) {
  try {
    await adminPb.collections.getOne(LIKES_COLLECTION)
  } catch (error: any) {
    if (error?.status !== 404) return
    await adminPb.collections.create({
      name: LIKES_COLLECTION,
      type: "base",
      schema: [
        { name: "user_id", type: "text", required: true },
        { name: "item_id", type: "text", required: true },
        { name: "item_type", type: "text", required: true },
      ],
    })
  }
}

export async function toggleLike(
  itemId: string,
  itemType: LikeItemType,
  userId: string,
): Promise<{ liked: boolean; count: number }> {
  if (!itemId || !itemType || !userId) {
    throw new Error("Invalid parameters")
  }

  const adminPb = await getPocketBaseAdmin()
  await ensureLikesCollection(adminPb)

  const collectionName =
    itemType === "comment" ? "comments" : itemType === "upload" ? "uploads" : "reviews"

  // Check for an existing like by this user on this item
  let existingLike: any = null
  try {
    existingLike = await adminPb.collection(LIKES_COLLECTION).getFirstListItem(
      `user_id="${pbEsc(userId)}" && item_id="${pbEsc(itemId)}" && item_type="${pbEsc(itemType)}"`,
    )
  } catch {
    // No existing like found — that's fine
  }

  if (existingLike) {
    // Unlike: remove the like record and decrement the counter
    await adminPb.collection(LIKES_COLLECTION).delete(existingLike.id)
    const item = await adminPb.collection(collectionName).getOne(itemId)
    const newCount = Math.max(0, (item.likes_count || 0) - 1)
    await adminPb.collection(collectionName).update(itemId, { likes_count: newCount })
    return { liked: false, count: newCount }
  }

  // Like: create the record and increment the counter
  await adminPb.collection(LIKES_COLLECTION).create({
    user_id: userId,
    item_id: itemId,
    item_type: itemType,
  })
  const item = await adminPb.collection(collectionName).getOne(itemId)
  const newCount = (item.likes_count || 0) + 1
  await adminPb.collection(collectionName).update(itemId, { likes_count: newCount })

  // Send notifications (non-fatal)
  try {
    if (itemType === "review") {
      await notifyReviewLike(itemId, item.reviewer)
    } else if (itemType === "comment") {
      await notifyCommentLike(item.review, itemId, item.user)
    }
  } catch {
    // ignore notification errors
  }

  return { liked: true, count: newCount }
}

export async function getUserLikedItemIds(
  userId: string,
  itemType: LikeItemType,
): Promise<string[]> {
  if (!userId || !itemType) return []

  try {
    const adminPb = await getPocketBaseAdmin()
    await ensureLikesCollection(adminPb)
    const likes = await adminPb.collection(LIKES_COLLECTION).getFullList({
      filter: `user_id="${pbEsc(userId)}" && item_type="${pbEsc(itemType)}"`,
      fields: "item_id",
      $autoCancel: false,
    })
    return likes.map((l: any) => l.item_id as string)
  } catch {
    return []
  }
}

/**
 * Delete all likes for a specific item (called when item is deleted)
 * Cleans up orphaned like records and updates related counts
 */
export async function deleteItemLikes(
  itemId: string,
  itemType: LikeItemType,
): Promise<number> {
  if (!itemId || !itemType) return 0

  try {
    const adminPb = await getPocketBaseAdmin()
    await ensureLikesCollection(adminPb)

    // Get all likes for this item
    const likes = await adminPb.collection(LIKES_COLLECTION).getFullList({
      filter: `item_id="${pbEsc(itemId)}" && item_type="${pbEsc(itemType)}"`,
      fields: "id",
      $autoCancel: false,
    })

    // Delete each like record
    let deletedCount = 0
    for (const like of likes) {
      try {
        await adminPb.collection(LIKES_COLLECTION).delete(like.id)
        deletedCount++
      } catch {
        // Continue on individual like deletion errors
      }
    }

    // Update the item's like count to 0
    const collectionName =
      itemType === "comment" ? "comments" : itemType === "upload" ? "uploads" : "reviews"
    try {
      const item = await adminPb.collection(collectionName).getOne(itemId)
      if (item) {
        await adminPb.collection(collectionName).update(itemId, { likes_count: 0 })
      }
    } catch {
      // Item may already be deleted, that's fine
    }

    return deletedCount
  } catch (error) {
    console.error(`Error deleting likes for ${itemType} ${itemId}:`, error)
    return 0
  }
}

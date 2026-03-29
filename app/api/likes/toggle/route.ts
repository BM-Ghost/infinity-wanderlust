import { NextResponse } from "next/server"
import { toggleLike } from "@/actions/likes"
import type { LikeItemType } from "@/actions/likes"

export const runtime = "edge"

const TOGGLE_THROTTLE_MS = 750
const recentToggleMap = new Map<string, number>()

export async function POST(request: Request) {
  try {
    const { itemId, itemType, userId } = await request.json()

    if (!itemId || !itemType || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const throttleKey = `${userId}:${itemType}:${itemId}`
    const now = Date.now()
    const lastToggleAt = recentToggleMap.get(throttleKey) || 0

    if (now - lastToggleAt < TOGGLE_THROTTLE_MS) {
      return NextResponse.json(
        { error: "Please wait a moment before toggling again." },
        { status: 429 },
      )
    }

    recentToggleMap.set(throttleKey, now)

    // Lightweight map cleanup to avoid unbounded growth in long-lived instances.
    if (recentToggleMap.size > 2000) {
      const cutoff = now - TOGGLE_THROTTLE_MS * 4
      for (const [key, ts] of recentToggleMap.entries()) {
        if (ts < cutoff) {
          recentToggleMap.delete(key)
        }
      }
    }

    const result = await toggleLike(itemId, itemType as LikeItemType, userId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to toggle like" },
      { status: 500 },
    )
  }
}

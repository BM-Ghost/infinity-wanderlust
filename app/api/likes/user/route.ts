import { NextResponse } from "next/server"
import { getUserLikedItemIds } from "@/actions/likes"
import type { LikeItemType } from "@/actions/likes"

export const runtime = "edge"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const itemType = searchParams.get("itemType")

    if (!userId || !itemType) {
      return NextResponse.json({ itemIds: [] })
    }

    const itemIds = await getUserLikedItemIds(userId, itemType as LikeItemType)
    return NextResponse.json({ itemIds })
  } catch {
    return NextResponse.json({ itemIds: [] })
  }
}

import { getPocketBaseAdmin } from "@/lib/pocketbase"

export const runtime = "edge"

export type LikeItemType = "review" | "comment" | "upload"

export async function POST(request: Request) {
  try {
    const { itemIds, itemType } = await request.json()

    if (!Array.isArray(itemIds) || !itemType) {
      return Response.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const adminPb = await getPocketBaseAdmin()
    const collectionName =
      itemType === "comment" ? "comments" : itemType === "upload" ? "uploads" : "reviews"

    const counts: Record<string, number> = {}

    // Fetch all items in batch
    const filter = itemIds.map((id) => `id = "${id}"`).join(" || ")
    if (filter) {
      const records = await adminPb.collection(collectionName).getFullList({
        filter,
        fields: "id,likes_count",
        $autoCancel: false,
      })

      records.forEach((record: any) => {
        counts[record.id] = record.likes_count || 0
      })
    }

    // Fill in missing items with 0
    itemIds.forEach((id) => {
      if (!(id in counts)) {
        counts[id] = 0
      }
    })

    return Response.json({ counts })
  } catch (error) {
    console.error("Error fetching batch counts:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

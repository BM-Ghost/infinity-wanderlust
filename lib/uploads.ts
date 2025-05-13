import { getPocketBase } from "@/lib/pocketbase"

export type Upload = {
  id: string
  image: string[]
  imageUrl: string
  caption: string
  destination: string
  uploaded_by: string
  uploader_name?: string
  tagged_users: string[]
  review?: string
  likes_count: number
  comments_count: number
  created: string
  updated: string
}

export async function fetchUploads(): Promise<Upload[]> {
  const pb = getPocketBase()

  try {
    // Fetch uploads from PocketBase
    const records = await pb.collection("uploads").getFullList({
      sort: "-created",
      expand: "uploaded_by",
    })

    return records.map((record) => ({
      id: record.id,
      image: record.image || [],
      imageUrl:
        record.image && record.image.length > 0
          ? `https://remain-faceghost.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.image[0]}`
          : "/placeholder.svg?height=600&width=800",
      caption: record.caption || "Untitled",
      destination: record.destination || "Unknown location",
      uploaded_by: record.uploaded_by || "",
      uploader_name: record.expand?.uploaded_by?.name || "Anonymous",
      tagged_users: record.tagged_users || [],
      review: record.review || "",
      likes_count: record.likes_count || 0,
      comments_count: record.comments_count || 0,
      created: record.created,
      updated: record.updated,
    }))
  } catch (error) {
    console.error("Error fetching uploads:", error)

    // Return fallback data if the collection doesn't exist or there's an error
    return [
      {
        id: "fallback_1",
        image: ["placeholder.jpg"],
        imageUrl: "/placeholder.svg?height=600&width=800",
        caption: "Beautiful mountain landscape",
        destination: "Rocky Mountains, USA",
        uploaded_by: "system",
        uploader_name: "System",
        tagged_users: [],
        likes_count: 45,
        comments_count: 7,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
      {
        id: "fallback_2",
        image: ["placeholder.jpg"],
        imageUrl: "/placeholder.svg?height=600&width=800",
        caption: "Tropical beach sunset",
        destination: "Maldives",
        uploaded_by: "system",
        uploader_name: "System",
        tagged_users: [],
        likes_count: 72,
        comments_count: 12,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
      {
        id: "fallback_3",
        image: ["placeholder.jpg"],
        imageUrl: "/placeholder.svg?height=600&width=800",
        caption: "Historic city streets",
        destination: "Prague, Czech Republic",
        uploaded_by: "system",
        uploader_name: "System",
        tagged_users: [],
        likes_count: 38,
        comments_count: 5,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    ]
  }
}

export async function createUpload(
  image: File,
  caption: string,
  destination: string,
  taggedUsers: string[] = [],
): Promise<Upload | null> {
  const pb = getPocketBase()

  if (!pb.authStore.isValid) {
    console.error("User not authenticated")
    throw new Error("You must be logged in to upload images")
  }

  try {
    const formData = new FormData()
    formData.append("image", image)
    formData.append("caption", caption)
    formData.append("destination", destination)
    formData.append("uploaded_by", pb.authStore.model?.id)

    if (taggedUsers.length > 0) {
      taggedUsers.forEach((userId) => {
        formData.append("tagged_users", userId)
      })
    }

    const record = await pb.collection("uploads").create(formData)

    return {
      id: record.id,
      image: record.image || [],
      imageUrl:
        record.image && record.image.length > 0
          ? `https://remain-faceghost.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.image[0]}`
          : "/placeholder.svg?height=600&width=800",
      caption: record.caption || "Untitled",
      destination: record.destination || "Unknown location",
      uploaded_by: record.uploaded_by || "",
      tagged_users: record.tagged_users || [],
      likes_count: 0,
      comments_count: 0,
      created: record.created,
      updated: record.updated,
    }
  } catch (error) {
    console.error("Error creating upload:", error)
    throw error
  }
}

export async function likeUpload(uploadId: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb.authStore.isValid) {
    console.error("User not authenticated")
    return false
  }

  try {
    // Skip for fallback images
    if (uploadId.startsWith("fallback_")) {
      return false
    }

    const record = await pb.collection("uploads").getOne(uploadId)
    const likes = (record.likes_count || 0) + 1

    await pb.collection("uploads").update(uploadId, { likes_count: likes })
    return true
  } catch (error) {
    console.error("Error liking upload:", error)
    return false
  }
}

export async function commentOnUpload(uploadId: string, comment: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb.authStore.isValid) {
    console.error("User not authenticated")
    return false
  }

  try {
    // Skip for fallback images
    if (uploadId.startsWith("fallback_")) {
      return false
    }

    const record = await pb.collection("uploads").getOne(uploadId)
    const comments = (record.comments_count || 0) + 1

    // In a real app, you would store the actual comment in a comments collection
    // For now, we'll just increment the count
    await pb.collection("uploads").update(uploadId, { comments_count: comments })
    return true
  } catch (error) {
    console.error("Error commenting on upload:", error)
    return false
  }
}

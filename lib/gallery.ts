import { getPocketBase } from "@/lib/pocketbase"

export type GalleryImage = {
  id: string
  src: string
  url?: string
  alt: string
  title?: string
  location: string
  date: string
  likes: number
  comments: number
  isInstagram: boolean
  instagramUrl?: string
  userId?: string
  tags?: string[]
  type?: string
  description?: string
}

// Update the fetchGalleryImages function to handle the case where the collection doesn't exist
export async function fetchGalleryImages(): Promise<GalleryImage[]> {
  const pb = getPocketBase()

  try {
    // Check if the collection exists first
    try {
      // Fetch gallery images from PocketBase
      const records = await pb.collection("gallery").getFullList({
        sort: "-created",
        expand: "user",
      })

      return records.map((record) => ({
        id: record.id,
        src: `https://remain-faceghost.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.image}`,
        url: `https://remain-faceghost.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.image}`,
        alt: record.title || "Gallery image",
        title: record.title || "Gallery image",
        location: record.location || "Unknown location",
        date: new Date(record.created).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        likes: record.likes || 0,
        comments: record.comments?.length || 0,
        isInstagram: record.isInstagram || false,
        instagramUrl: record.instagramUrl,
        userId: record.user,
        tags: record.tags || [],
        type: record.isInstagram ? "instagram" : "upload",
        description: record.description || "",
      }))
    } catch (error) {
      console.log("Gallery collection might not exist yet, using fallback data")
      // Return fallback data if the collection doesn't exist
      return [
        {
          id: "fallback_1",
          src: "/placeholder.svg?height=600&width=800",
          url: "/placeholder.svg?height=600&width=800",
          alt: "Beautiful mountain landscape",
          title: "Beautiful mountain landscape",
          location: "Rocky Mountains, USA",
          date: "March 15, 2025",
          likes: 45,
          comments: 7,
          isInstagram: false,
          userId: "system",
          tags: ["mountains", "nature", "landscape"],
          type: "upload",
          description: "A breathtaking view of the Rocky Mountains during spring.",
        },
        {
          id: "fallback_2",
          src: "/placeholder.svg?height=600&width=800",
          url: "/placeholder.svg?height=600&width=800",
          alt: "Tropical beach sunset",
          title: "Tropical beach sunset",
          location: "Maldives",
          date: "February 28, 2025",
          likes: 72,
          comments: 12,
          isInstagram: false,
          userId: "system",
          tags: ["beach", "sunset", "tropical"],
          type: "upload",
          description: "Golden sunset over the crystal clear waters of the Maldives.",
        },
        {
          id: "fallback_3",
          src: "/placeholder.svg?height=600&width=800",
          url: "/placeholder.svg?height=600&width=800",
          alt: "Historic city streets",
          title: "Historic city streets",
          location: "Prague, Czech Republic",
          date: "January 10, 2025",
          likes: 38,
          comments: 5,
          isInstagram: false,
          userId: "system",
          tags: ["city", "history", "architecture"],
          type: "upload",
          description: "Walking through the charming historic streets of Prague.",
        },
      ]
    }
  } catch (error) {
    console.error("Error fetching gallery images:", error)
    return []
  }
}

// Function to fetch Instagram images
export async function fetchInstagramImages(): Promise<GalleryImage[]> {
  // In a real app, you would use the Instagram API or a service like Graph API
  // For this demo, we'll return mock Instagram data

  const mockInstagramImages: GalleryImage[] = [
    {
      id: "insta_1",
      src: "/placeholder.svg?height=600&width=800",
      alt: "Sunset at Bali beach",
      location: "Bali, Indonesia",
      date: "January 15, 2025",
      likes: 124,
      comments: 18,
      isInstagram: true,
      instagramUrl: "https://www.instagram.com/p/example1/",
    },
    {
      id: "insta_2",
      src: "/placeholder.svg?height=600&width=800",
      alt: "Mountain hiking in Switzerland",
      location: "Swiss Alps, Switzerland",
      date: "February 22, 2025",
      likes: 98,
      comments: 12,
      isInstagram: true,
      instagramUrl: "https://www.instagram.com/p/example2/",
    },
    {
      id: "insta_3",
      src: "/placeholder.svg?height=600&width=800",
      alt: "Safari adventure in Kenya",
      location: "Maasai Mara, Kenya",
      date: "March 10, 2025",
      likes: 156,
      comments: 24,
      isInstagram: true,
      instagramUrl: "https://www.instagram.com/p/example3/",
    },
  ]

  return mockInstagramImages
}

// Update the uploadGalleryImage function to handle the case where the collection doesn't exist
export async function uploadGalleryImage(file: File, title: string, location: string): Promise<GalleryImage | null> {
  const pb = getPocketBase()

  if (!pb.authStore.isValid) {
    console.error("User not authenticated")
    return null
  }

  try {
    try {
      const formData = new FormData()
      formData.append("image", file)
      formData.append("title", title)
      formData.append("location", location)
      formData.append("user", pb.authStore.model?.id)
      formData.append("isInstagram", "false")

      const record = await pb.collection("gallery").create(formData)

      return {
        id: record.id,
        src: `https://remain-faceghost.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.image}`,
        alt: record.title || "Gallery image",
        location: record.location || "Unknown location",
        date: new Date(record.created).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        likes: 0,
        comments: 0,
        isInstagram: false,
        userId: record.user,
      }
    } catch (error) {
      console.error("Gallery collection might not exist yet:", error)
      throw new Error("The gallery collection does not exist yet. Please create it in PocketBase first.")
    }
  } catch (error) {
    console.error("Error uploading gallery image:", error)
    return null
  }
}

// Update the likeGalleryImage function to handle the case where the collection doesn't exist
export async function likeGalleryImage(imageId: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb.authStore.isValid) {
    console.error("User not authenticated")
    return false
  }

  try {
    // Check if the image ID is a fallback image
    if (imageId.startsWith("fallback_") || imageId.startsWith("insta_")) {
      console.log("Cannot like a fallback or Instagram image")
      return false
    }

    try {
      const record = await pb.collection("gallery").getOne(imageId)
      const likes = (record.likes || 0) + 1

      await pb.collection("gallery").update(imageId, { likes })
      return true
    } catch (error) {
      console.error("Gallery collection or record might not exist:", error)
      return false
    }
  } catch (error) {
    console.error("Error liking gallery image:", error)
    return false
  }
}

// Update the addGalleryComment function to handle the case where the collection doesn't exist
export async function addGalleryComment(imageId: string, comment: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb.authStore.isValid) {
    console.error("User not authenticated")
    return false
  }

  try {
    // Check if the image ID is a fallback image
    if (imageId.startsWith("fallback_") || imageId.startsWith("insta_")) {
      console.log("Cannot comment on a fallback or Instagram image")
      return false
    }

    try {
      const record = await pb.collection("gallery").getOne(imageId)
      const comments = record.comments || []

      comments.push({
        userId: pb.authStore.model?.id,
        userName: pb.authStore.model?.name,
        text: comment,
        date: new Date().toISOString(),
      })

      await pb.collection("gallery").update(imageId, { comments })
      return true
    } catch (error) {
      console.error("Gallery collection or record might not exist:", error)
      return false
    }
  } catch (error) {
    console.error("Error adding gallery comment:", error)
    return false
  }
}

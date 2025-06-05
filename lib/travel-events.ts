import { getPocketBase } from "@/lib/pocketbase"
import { act } from "react"

export interface TravelEvent {
  id: string
  title: string
  subtitle?: string
  description: string
  destination: string
  start_date: string
  end_date: string
  price: String
  currency: string
  total_spots: number
  spots_left: number
  imageUrl?: string
  location_address: string
  latitude: number
  longitude: number
  creator: string
  collaborators: string[]
  created: string
  updated: string
  is_featured?: boolean
  event_url?: string
  expand?: {
    creator?: {
      id: string
      name: string
      username: string
      avatar?: string
    }
    collaborators?: Array<{
      id: string
      name: string
      username: string
      avatar?: string
    }>
  }
}

// Function to create a new travel event
export async function createEvent(
  data: {
    title: string
    destination: string
    description: string
    start_date: string
    end_date: string
    total_spots?: number
    price: String
    currency?: string
    status?: string
    slug?: string
    event_url?: string
    latitude: number
    longitude: number
    creator?: string
    collaborators?: string[]
    location_address?: string
    location_name?: string
    tags?: string[]
    activities?: JSON
    difficulty_level?: string
    packing_list?: JSON
    images?: File | File[] // Accept single image or array of images
  },
): Promise<TravelEvent | null> {
  const pb = getPocketBase()
  const formData = new FormData()

  

  // Normalize image(s) and append them
  const imageList = Array.isArray(data.images)
    ? data.images
    : data.images
    ? [data.images]
    : []

  imageList.forEach((file) => {
    if (file instanceof File) {
      formData.append("images", file, file.name)
    }
  })

  try {
    const record = await pb.collection("travel_events").create(data)
    console.log("📅 Creating New Event", formData)
    console.log("✅ Event created successfully:", record)
    return formatEvent(record)
  } catch (apiError: any) {
    console.error("❌ PocketBase API Error:", apiError)
    return null
  }
}


// Function to get upcoming events
export async function getUpcomingEvents(limit = 3): Promise<TravelEvent[]> {
  const pb = getPocketBase()
  if (!pb) {
    console.error("❌ PocketBase connection failed")
    return []
  }
  try {
    console.group("📅 Fetching Upcoming Events")
    console.log("🔍 Query parameters:", { limit, filter: "start_date >= now" })
    console.time("⏱️ API Request Duration")

    const now = new Date().toISOString()
    const records = await pb.collection("travel_events").getList(1, limit, {
      filter: `start_date >= "${now}"`,
      sort: "start_date",
      expand: "creator,collaborators",
    })

    console.timeEnd("⏱️ API Request Duration")
    console.log(`✅ Retrieved ${records.items.length} upcoming events`)
    console.groupEnd()

    return records.items.map((record) => formatEvent(record))
  } catch (error) {
    console.group("❌ Error Fetching Upcoming Events")
    console.error("Error details:", error)
    console.groupEnd()

    return []
  }
}

// Alias for backward compatibility
export const fetchUpcomingEvents = getUpcomingEvents

// Helper function to format event data
function formatEvent(record: any): TravelEvent {
  const baseUrl = "https://remain-faceghost.pockethost.io/api/files/"

  const creatorName = record.expand?.creator?.name || "Unknown"
  const creatorAvatar = record.expand?.creator?.avatar
    ? `${baseUrl}${record.expand.creator.collectionId}/${record.expand.creator.id}/${record.expand.creator.avatar}`
    : null

  const collaborators =
    record.expand?.collaborators?.map((collaborator: any) => ({
      id: collaborator.id,
      name: collaborator.name || collaborator.username,
      username: collaborator.username,
      avatar: collaborator.avatar
        ? `${baseUrl}${collaborator.collectionId}/${collaborator.id}/${collaborator.avatar}`
        : null,
    })) || []

  const formattedEvent = {
    ...record,
    creator: record.creator,
    creator_name: creatorName,
    creator_avatar: creatorAvatar,
    collaborators: record.collaborators || [],
    collaborator_names: collaborators.map((c: any) => c.name),
    imageUrl:
      record.image && record.image.length > 0
        ? `${baseUrl}${record.collectionId}/${record.id}/${record.image[0]}`
        : undefined,
    spots_left: record.spots_left || record.total_spots - (record.bookings_count || 0),
  }

  return formattedEvent
}

// Fetch all travel events
export async function fetchTravelEvents(options?: { expand?: string }): Promise<TravelEvent[]> {
  const pb = getPocketBase()
  if (!pb) {
    console.error("❌ PocketBase connection failed")
    return []
  }
  try {
    console.group("🌍 Fetching All Travel Events")
    console.log("🔍 Query parameters:", options || "default")
    console.time("⏱️ API Request Duration")

    const records = await pb.collection("travel_events").getFullList({
      sort: "-created",
      expand: options?.expand || "creator,collaborators",
    })

    console.timeEnd("⏱️ API Request Duration")
    console.log(`✅ Retrieved ${records.length} events`)
    console.groupEnd()

    return records.map((record) => formatEvent(record))
  } catch (error) {
    console.group("❌ Error Fetching Travel Events")
    console.error("Error details:", error)
    console.groupEnd()

    return []
  }
}

// Function to get nearby events
export async function getNearbyEvents(
  latitude: number,
  longitude: number,
  radiusInMeters: number,
): Promise<TravelEvent[]> {
  const pb = getPocketBase()
  if (!pb) {
    console.error("❌ PocketBase connection failed")
    return []
  }
  try {
    console.group("📍 Fetching Nearby Events")
    console.log("🔍 Query parameters:", {
      latitude,
      longitude,
      radiusInMeters,
    })
    console.time("⏱️ API Request Duration")

    const records = await pb.collection("travel_events").getList(1, 50, {
      filter: `geodistance("location", ${latitude}, ${longitude}) <= ${radiusInMeters}`,
      sort: "geodistance('location', ${latitude}, ${longitude})",
    })

    console.timeEnd("⏱️ API Request Duration")
    console.log(`✅ Retrieved ${records.items.length} nearby events`)
    console.groupEnd()

    return records.items.map((record) => formatEvent(record))
  } catch (error) {
    console.group("❌ Error Fetching Nearby Events")
    console.error("Error details:", error)
    console.groupEnd()

    return []
  }
}

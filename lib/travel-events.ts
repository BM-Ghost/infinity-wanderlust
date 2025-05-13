import { getPocketBase } from "@/lib/pocketbase"

export interface TravelEvent {
  id: string
  title: string
  subtitle?: string
  description: string
  destination: string
  start_date: string
  end_date: string
  price: number
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
    description: string
    destination: string
    start_date: string
    end_date: string
    price: number
    total_spots: number
    duration: string
    location_address: string
    latitude: number
    longitude: number
    tags?: string[]
    activities?: string[]
    difficulty_level?: string
  },
  images?: File[],
): Promise<TravelEvent | null> {
  const pb = getPocketBase()

  console.group("🔍 EVENT CREATION DEBUGGING")
  console.log("📌 Function called with data:", JSON.stringify(data, null, 2))

  // Check PocketBase connection
  if (!pb) {
    console.error("❌ PocketBase connection failed")
    console.groupEnd()
    throw new Error("Failed to connect to PocketBase")
  }
  console.log("✅ PocketBase connection established")

  // Check authentication
  console.log("🔐 Auth store state:", {
    isValid: pb?.authStore?.isValid,
    token: pb?.authStore?.token ? "Present" : "Missing",
    model: pb?.authStore?.model ? "Present" : "Missing",
    userId: pb?.authStore?.model?.id || "None",
  })

  if (!pb?.authStore?.isValid) {
    console.error("❌ Authentication invalid - User not logged in")
    console.groupEnd()
    throw new Error("You must be signed in to create an event")
  }
  console.log("✅ User authenticated successfully")

  try {
    console.log("📋 Preparing form data for API submission")

    // Validate latitude is within range
    if (data.latitude < -90 || data.latitude > 90) {
      console.error("❌ Invalid latitude value:", data.latitude)
      throw new Error("Latitude must be between -90 and 90 degrees")
    }

    // Validate longitude is within range
    if (data.longitude < -180 || data.longitude > 180) {
      console.error("❌ Invalid longitude value:", data.longitude)
      throw new Error("Longitude must be between -180 and 180 degrees")
    }

    // Calculate duration_days from start and end date
    const startDate = new Date(data.start_date)
    const endDate = new Date(data.end_date)
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Create a plain object first to match exactly what PocketBase expects
    const eventData = {
      title: data.title,
      subtitle: data.title, // Using title as subtitle
      description: data.description,
      destination: data.destination,
      start_date: data.start_date,
      end_date: data.end_date,
      duration_days: durationDays,
      spots_left: data.total_spots, // Initially, all spots are available
      price: data.price,
      currency: "USD", // Default currency
      is_featured: false, // Default not featured
      status: "upcoming", // Default status
      slug: data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      event_url: "",
      latitude: data.latitude,
      longitude: data.longitude,
      creator: pb.authStore.model?.id,
      collaborators: [],
    }

    console.log("📤 Event data prepared:", eventData)

    // Now create FormData for file upload support
    const formData = new FormData()

    // Add all fields from eventData to formData
    for (const [key, value] of Object.entries(eventData)) {
      if (value !== undefined && value !== null) {
        if (typeof value === "object") {
          formData.append(key, JSON.stringify(value))
        } else {
          formData.append(key, String(value))
        }
      }
    }

    // Add image if provided
    if (images && images.length > 0) {
      console.log("🖼️ Adding image:", {
        name: images[0].name,
        type: images[0].type,
        size: `${(images[0].size / 1024).toFixed(2)} KB`,
      })
      formData.append("image", images[0])
    } else {
      console.log("ℹ️ No image provided")
    }

    // Log all form data entries for debugging
    console.log("📤 Form data entries:")
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: [File] ${value.name} (${(value.size / 1024).toFixed(2)} KB)`)
      } else {
        console.log(`  ${key}: ${value}`)
      }
    }

    console.log("🔄 Sending request to PocketBase API...")
    console.time("⏱️ API Request Duration")

    let record
    try {
      // Try creating with the exact payload structure
      record = await pb.collection("travel_events").create(formData)
      console.timeEnd("⏱️ API Request Duration")
      console.log("✅ Event created successfully:", record)
    } catch (apiError: any) {
      console.timeEnd("⏱️ API Request Duration")
      console.error("❌ PocketBase API Error:", apiError)

      // Check if the error contains a record ID, which would indicate the record was actually created
      if (apiError.data && apiError.data.id) {
        console.log("⚠️ Event was created despite error, using returned record")
        record = apiError.data
      } else {
        // Log detailed API error information
        if (apiError.status) console.error("  Status code:", apiError.status)
        if (apiError.data) {
          console.error("  Error data:", apiError.data)

          // Check for field validation errors
          if (apiError.data.data) {
            console.error("  Field validation errors:")
            for (const [field, errors] of Object.entries(apiError.data.data)) {
              console.error(`    ${field}:`, errors)
            }
          }
        }

        // Try a fallback approach with direct JSON payload
        console.log("🔄 Attempting fallback with direct JSON payload...")

        try {
          // Try creating with direct JSON payload
          record = await pb.collection("travel_events").create(eventData)
          console.log("✅ Event created successfully with fallback method:", record)
        } catch (fallbackError: any) {
          console.error("❌ Fallback method also failed:", fallbackError)
          throw apiError // Throw the original error
        }
      }
    }

    // If we got here, we have a record (either from successful creation or from error data)
    if (record) {
      const formattedEvent = {
        id: record.id,
        title: record.title,
        subtitle: record.subtitle || "",
        description: record.description,
        destination: record.destination,
        start_date: record.start_date,
        end_date: record.end_date,
        price: record.price,
        currency: record.currency || "USD",
        total_spots: record.total_spots || record.spots_left,
        spots_left: record.spots_left,
        imageUrl:
          record.image && record.image.length > 0
            ? `https://remain-faceghost.pockethost.io/api/files/${record.collectionId}/${record.id}/${record.image[0]}`
            : undefined,
        location_address: record.location_address || data.location_address,
        latitude: record.latitude,
        longitude: record.longitude,
        creator: record.creator,
        collaborators: record.collaborators || [],
        created: record.created,
        updated: record.updated,
      }

      console.log("🔄 Formatted event data:", formattedEvent)
      console.groupEnd()
      return formattedEvent
    }

    throw new Error("Failed to create event - no record returned")
  } catch (error: any) {
    console.error("❌ Error creating event:", error)
    console.error("  Error message:", error.message)
    console.error("  Error stack:", error.stack)
    console.groupEnd()
    throw new Error(error.message || "Failed to create event. Please try again.")
  }
}

// Helper function to format date
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " bytes"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / 1048576).toFixed(1) + " MB"
}

// Simulate getting weather forecast
async function getWeatherForecast(lat: number, lng: number, date: Date): Promise<any> {
  // In a real app, this would call a weather API
  console.log("🌤️ Fetching weather forecast for coordinates:", lat, lng)

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  const month = date.getMonth()
  let forecast

  // Generate seasonal weather based on month
  if (month >= 2 && month <= 4) {
    // Spring
    forecast = { condition: "Partly Cloudy", high: 75, low: 55, precipitation: 20 }
  } else if (month >= 5 && month <= 7) {
    // Summer
    forecast = { condition: "Sunny", high: 85, low: 65, precipitation: 10 }
  } else if (month >= 8 && month <= 10) {
    // Fall
    forecast = { condition: "Cloudy", high: 65, low: 45, precipitation: 30 }
  } else {
    // Winter
    forecast = { condition: "Rainy", high: 55, low: 35, precipitation: 60 }
  }

  return forecast
}

// Simulate getting nearby attractions
async function getNearbyAttractions(lat: number, lng: number): Promise<any[]> {
  // In a real app, this would call a places API
  console.log("🏛️ Fetching nearby attractions for coordinates:", lat, lng)

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  // Return some dummy attractions
  return [
    { name: "Local Museum", type: "museum", distance: 1.2 },
    { name: "City Park", type: "park", distance: 0.8 },
    { name: "Historic Building", type: "landmark", distance: 1.5 },
    { name: "Popular Restaurant", type: "food", distance: 0.5 },
  ]
}

// Generate packing suggestions based on activities and dates
function generatePackingSuggestions(activities: string[] = [], startDate: Date, endDate: Date): string[] {
  const suggestions = ["Passport", "Travel insurance", "Comfortable shoes", "Phone charger"]

  // Add season-specific items
  const month = startDate.getMonth()
  if (month >= 5 && month <= 8) {
    // Summer
    suggestions.push("Sunscreen", "Sunglasses", "Hat", "Swimwear")
  } else if (month >= 11 || month <= 1) {
    // Winter
    suggestions.push("Warm jacket", "Gloves", "Scarf", "Boots")
  } else {
    // Spring/Fall
    suggestions.push("Light jacket", "Umbrella", "Layers")
  }

  // Add activity-specific items
  if (activities.includes("hiking")) {
    suggestions.push("Hiking boots", "Backpack", "Water bottle", "First aid kit")
  }
  if (activities.includes("beach")) {
    suggestions.push("Beach towel", "Swimwear", "Flip flops", "Beach bag")
  }
  if (activities.includes("photography")) {
    suggestions.push("Camera", "Extra memory cards", "Camera charger", "Tripod")
  }

  return suggestions
}

// Function to get upcoming events
export async function getUpcomingEvents(limit = 3): Promise<TravelEvent[]> {
  const pb = getPocketBase()
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

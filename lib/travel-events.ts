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
  price: string
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
  creator_name?: string
  creator_avatar?: string | null
  collaborator_names?: string[]
  expand?: {
    creator?: {
      id: string
      name: string
      username: string
      avatar?: string
      collectionId?: string
    }
    collaborators?: Array<{
      id: string
      name: string
      username: string
      avatar?: string
      collectionId?: string
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
    spots_left?: number
    end_date: string
    total_spots?: number
    price: string
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
    activities?: Record<string, unknown> | string
    difficulty_level?: string
    packing_list?: Record<string, unknown> | string
    images?: File | File[] // Accept single image or array of images
    is_featured?: boolean
  },
): Promise<TravelEvent> {
  const pb = getPocketBase()
  if (!pb) {
    throw new Error("PocketBase client is not available");
  }
  
  const formData = new FormData();
  
  // Add all non-file fields to formData
  const {
    images,
    activities,
    packing_list,
    ...restData
  } = data;
  
  // Add all non-file fields to formData
  Object.entries(restData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array fields like tags and collaborators
        value.forEach((item, index) => {
          formData.append(`${key}.${index}`, String(item));
        });
      } else if (typeof value === 'object') {
        // Stringify object fields like activities and packing_list
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Normalize image(s) and append them
  const imageList = Array.isArray(images) ? images : images ? [images] : [];
  
  imageList.forEach((file) => {
    if (file instanceof File) {
      formData.append("images", file, file.name);
    }
  });
  
  // Handle activities if provided
  if (activities) {
    formData.append(
      "activities",
      typeof activities === 'string' ? activities : JSON.stringify(activities)
    );
  }
  
  // Handle packing_list if provided
  if (packing_list) {
    formData.append(
      "packing_list",
      typeof packing_list === 'string' ? packing_list : JSON.stringify(packing_list)
    );
  }

  try {
    // Create the event with the form data
    const record = await pb.collection("travel_events").create(formData);
    console.log("📅 Creating New Event with data:", Object.fromEntries(formData.entries()));
    console.log("✅ Event created successfully:", record);
    
    // Format and return the created event
    return formatEvent(record);
  } catch (apiError: any) {
    console.error("❌ PocketBase API Error:", apiError);
    throw apiError; // Re-throw the error to be handled by the caller
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
  if (!record) {
    throw new Error("Invalid record: record is null or undefined");
  }

  const baseUrl = "https://remain-faceghost.pockethost.io/api/files/"
  
  try {
    const creatorName = record.expand?.creator?.name || "Unknown"
    const creatorAvatar = record.expand?.creator?.avatar && record.expand.creator.collectionId && record.expand.creator.id
      ? `${baseUrl}${record.expand.creator.collectionId}/${record.expand.creator.id}/${record.expand.creator.avatar}`
      : null

    const collaborators = record.expand?.collaborators?.map((collaborator: any) => ({
      id: collaborator.id,
      name: collaborator.name || collaborator.username,
      username: collaborator.username,
      avatar: collaborator.avatar && collaborator.collectionId && collaborator.id
        ? `${baseUrl}${collaborator.collectionId}/${collaborator.id}/${collaborator.avatar}`
        : null,
    })) || [];

    const imageUrl = (() => {
      try {
        return record.image?.[0] && record.collectionId && record.id
          ? `${baseUrl}${record.collectionId}/${record.id}/${record.image[0]}`
          : undefined;
      } catch (error) {
        console.error("Error generating image URL:", error);
        return undefined;
      }
    })();

    return {
      ...record,
      creator: record.creator || "",
      creator_name: creatorName,
      creator_avatar: creatorAvatar,
      collaborators: Array.isArray(record.collaborators) ? record.collaborators : [],
      collaborator_names: collaborators.map((c: any) => c.name).filter(Boolean),
      imageUrl,
      spots_left: record.spots_left || (record.total_spots - (record.bookings_count || 0)),
    };
  } catch (error) {
    console.error("Error formatting event:", error);
    // Return a minimal valid event object with required fields
    return {
      id: record.id || "",
      title: record.title || "Unknown Event",
      description: record.description || "",
      destination: record.destination || "",
      start_date: record.start_date || new Date().toISOString(),
      end_date: record.end_date || new Date().toISOString(),
      price: record.price || "0",
      currency: record.currency || "USD",
      total_spots: record.total_spots || 0,
      spots_left: record.spots_left || 0,
      location_address: record.location_address || "",
      latitude: record.latitude || 0,
      longitude: record.longitude || 0,
      creator: record.creator || "",
      collaborators: Array.isArray(record.collaborators) ? record.collaborators : [],
      created: record.created || new Date().toISOString(),
      updated: record.updated || new Date().toISOString(),
    };
  }
}

export interface FetchEventsResult {
  items: TravelEvent[];
  totalItems: number;
  totalPages: number;
  error?: string; // Optional error message
}

export interface FetchTravelEventsOptions {
  page?: number;
  perPage?: number;
  sort?: string;
  filter?: string;
  expand?: string;
}

// Fetch paginated travel events
export async function fetchTravelEvents({
  page = 1,
  perPage = 10,
  sort = "-created",
  filter = "",
  expand = "creator,collaborators"
}: FetchTravelEventsOptions = {}): Promise<FetchEventsResult> {
  const pb = getPocketBase()
  if (!pb) {
    const errorMessage = "PocketBase connection failed";
    console.error(`❌ ${errorMessage}`);
    return { 
      items: [], 
      totalItems: 0, 
      totalPages: 0,
      error: errorMessage
    };
  }
  
  try {
    console.group("🌍 Fetching Travel Events");
    console.log("🔍 Query parameters:", { page, perPage, sort, filter, expand });
    console.time("⏱️ API Request Duration");

    const result = await pb.collection("travel_events").getList(page, perPage, {
      sort,
      filter,
      expand,
    });

    console.timeEnd("⏱️ API Request Duration");
    console.log(`✅ Retrieved ${result.items.length} of ${result.totalItems} events`);
    console.groupEnd();

    // Format each event and filter out any null/undefined results
    const formattedItems = result.items
      .map((record) => {
        try {
          return formatEvent(record);
        } catch (error) {
          console.error("Error formatting event:", error);
          return null;
        }
      })
      .filter((item): item is TravelEvent => item !== null);

    // If any items failed to format, include a warning in the error message
    const hasFormattingErrors = formattedItems.length < result.items.length;
    const errorMessage = hasFormattingErrors 
      ? `Warning: ${result.items.length - formattedItems.length} events could not be formatted` 
      : undefined;

    return {
      items: formattedItems,
      totalItems: result.totalItems,
      totalPages: Math.ceil(result.totalItems / perPage),
      ...(errorMessage && { error: errorMessage })
    };
  } catch (error) {
    console.group("❌ Error Fetching Travel Events");
    
    // Extract meaningful error message
    let errorMessage = "An unknown error occurred while fetching events";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle PocketBase specific errors
      if ('status' in error && 'data' in error) {
        const pbError = error as { status: number; data: any };
        console.error(`API Error (${pbError.status}):`, pbError.data);
        errorMessage = pbError.data?.message || errorMessage;
      }
    }
    
    console.error("Error details:", error);
    console.groupEnd();
    
    // Log to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
    
    // Return empty result on error to prevent UI crashes
    return { 
      items: [], 
      totalItems: 0, 
      totalPages: 0,
      error: errorMessage // Include error message for debugging
    };
  }
}

// Function to get nearby events
export async function getNearbyEvents(
  latitude: number,
  longitude: number,
  radiusInMeters: number,
  options: {
    limit?: number;
    expand?: string;
  } = {}
): Promise<{ events: TravelEvent[]; error?: string }> {
  const { limit = 50, expand = "creator,collaborators" } = options;
  const pb = getPocketBase();
  
  if (!pb) {
    const errorMessage = "PocketBase connection failed";
    console.error(`❌ ${errorMessage}`);
    return { events: [], error: errorMessage };
  }
  
  try {
    console.group("📍 Fetching Nearby Events");
    console.log("🔍 Query parameters:", {
      latitude,
      longitude,
      radiusInMeters,
      limit,
      expand
    });
    console.time("⏱️ API Request Duration");

    const records = await pb.collection("travel_events").getList(1, limit, {
      filter: `geodistance(\"location\", ${latitude}, ${longitude}) <= ${radiusInMeters}`,
      sort: `geodistance(\"location\", ${latitude}, ${longitude})`,
      expand
    });

    console.timeEnd("⏱️ API Request Duration");
    console.log(`✅ Retrieved ${records.items.length} nearby events`);
    console.groupEnd();

    // Format events and handle any formatting errors
    const formattedEvents: TravelEvent[] = [];
    const formattingErrors: Error[] = [];

    for (const record of records.items) {
      try {
        formattedEvents.push(formatEvent(record));
      } catch (error) {
        console.error("Error formatting event:", error);
        if (error instanceof Error) {
          formattingErrors.push(error);
        }
      }
    }

    // If any events failed to format, include a warning
    let errorMessage: string | undefined;
    if (formattingErrors.length > 0) {
      errorMessage = `Warning: ${formattingErrors.length} of ${records.items.length} events could not be formatted`;
      console.warn(errorMessage);
    }

    return {
      events: formattedEvents,
      ...(errorMessage && { error: errorMessage })
    };
  } catch (error) {
    let errorMessage = "An unknown error occurred while fetching nearby events";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Handle PocketBase specific errors
      if ('status' in error && 'data' in error) {
        const pbError = error as { status: number; data: any };
        console.error(`API Error (${pbError.status}):`, pbError.data);
        errorMessage = pbError.data?.message || errorMessage;
      }
    }
    
    console.group("❌ Error Fetching Nearby Events");
    console.error("Error details:", error);
    console.groupEnd();
    
    // Log to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
    
    return { 
      events: [],
      error: errorMessage
    };
  }
}

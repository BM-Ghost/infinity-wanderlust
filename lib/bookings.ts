import { getPocketBase } from "@/lib/pocketbase"
import type { TravelEvent } from "@/lib/travel-events"

// Define the Booking type
export type Booking = {
  id: string
  booking_id: string
  user_id: string
  event_id: string
  event_name: string
  event_image: string
  event_date: string
  location: string
  participants: number
  price_per_person: number
  total_amount: number
  payment_method: string
  payment_status: string
  status: string
  created: string
  updated: string
  cancelled_at?: string
  event?: TravelEvent
}

/**
 * Fetch bookings for a specific user
 * @param userId The ID of the user to fetch bookings for
 * @returns Array of booking objects
 */
export async function fetchBookings(userId: string): Promise<Booking[]> {
  try {
    const pb = getPocketBase()
    if (!pb) {
      throw new Error("PocketBase connection failed")
    }

    // In a real implementation, you would fetch from PocketBase like this:
    // const bookingsData = await pb.collection("bookings").getList(1, 50, {
    //   filter: `user_id = "${userId}"`,
    //   sort: "-created",
    //   expand: "event_id"
    // })
    // return bookingsData.items.map(item => {
    //   const event = item.expand?.event_id
    //   return {
    //     id: item.id,
    //     booking_id: item.booking_id,
    //     user_id: item.user_id,
    //     event_id: item.event_id,
    //     event_name: event ? event.title : item.event_name,
    //     event_image: event && event.image && event.image.length > 0
    //       ? `https://remain-faceghost.pockethost.io/api/files/${event.collectionId}/${event.id}/${event.image[0]}`
    //       : item.event_image,
    //     event_date: event ? event.start_date : item.event_date,
    //     location: event ? event.destination : item.location,
    //     participants: item.participants,
    //     price_per_person: event ? event.price : item.price_per_person,
    //     total_amount: item.total_amount,
    //     payment_method: item.payment_method,
    //     payment_status: item.payment_status,
    //     status: item.status,
    //     created: item.created,
    //     updated: item.updated,
    //     cancelled_at: item.cancelled_at,
    //     event: event ? {
    //       id: event.id,
    //       title: event.title,
    //       subtitle: event.subtitle,
    //       destination: event.destination,
    //       description: event.description,
    //       start_date: event.start_date,
    //       end_date: event.end_date,
    //       duration_days: event.duration_days,
    //       spots_left: event.spots_left,
    //       price: event.price,
    //       currency: event.currency,
    //       is_featured: event.is_featured,
    //       status: event.status,
    //       image: event.image,
    //       imageUrl: event.image && event.image.length > 0
    //         ? `https://remain-faceghost.pockethost.io/api/files/${event.collectionId}/${event.id}/${event.image[0]}`
    //         : "/placeholder.svg?height=600&width=800",
    //       slug: event.slug,
    //       event_url: event.event_url,
    //       latitude: event.latitude,
    //       longitude: event.longitude,
    //       creator: event.creator,
    //       collaborators: event.collaborators,
    //       created: event.created,
    //       updated: event.updated
    //     } : undefined
    //   }
    // })

    // Mock data for demonstration
    return getMockBookings(userId)
  } catch (error) {
    console.error("Error fetching bookings:", error)
    throw error
  }
}

/**
 * Create a new booking for an event
 * @param data Booking data
 * @returns The created booking
 */
export async function createBooking(data: {
  user_id: string
  event_id: string
  participants: number
  payment_method: string
}): Promise<Booking> {
  try {
    const pb = getPocketBase()
    if (!pb) {
      throw new Error("PocketBase connection failed")
    }

    // Fetch the event details
    const event = await pb.collection("travel_events").getOne(data.event_id)

    if (!event) {
      throw new Error("Event not found")
    }

    // Calculate total amount
    const totalAmount = event.price * data.participants

    // Generate a booking ID
    const bookingId = "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase()

    // Create the booking
    const bookingData = {
      booking_id: bookingId,
      user_id: data.user_id,
      event_id: data.event_id,
      event_name: event.title,
      event_image:
        event.image && event.image.length > 0
          ? `https://remain-faceghost.pockethost.io/api/files/${event.collectionId}/${event.id}/${event.image[0]}`
          : "",
      event_date: event.start_date,
      location: event.destination,
      participants: data.participants,
      price_per_person: event.price,
      total_amount: totalAmount,
      payment_method: data.payment_method,
      payment_status: "Paid", // In a real app, this would depend on payment processing
      status: "confirmed",
    }

    // In a real implementation, you would create the booking in PocketBase:
    // const record = await pb.collection("bookings").create(bookingData)

    // For demo purposes, we'll just return the mock data
    return {
      id: "mock_id",
      ...bookingData,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error creating booking:", error)
    throw error
  }
}

/**
 * Cancel a booking
 * @param bookingId The ID of the booking to cancel
 * @returns The updated booking
 */
export async function cancelBooking(bookingId: string): Promise<Booking> {
  try {
    const pb = getPocketBase()
    if (!pb) {
      throw new Error("PocketBase connection failed")
    }

    // In a real implementation, you would update the booking in PocketBase:
    // const record = await pb.collection("bookings").update(bookingId, {
    //   status: "cancelled",
    //   cancelled_at: new Date().toISOString()
    // })

    // For demo purposes, we'll just return mock data
    return {
      id: bookingId,
      booking_id: "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      user_id: "user_id",
      event_id: "event_id",
      event_name: "Mock Event",
      event_image: "/images/alps-bg.jpg",
      event_date: new Date().toISOString(),
      location: "Mock Location",
      participants: 2,
      price_per_person: 149.99,
      total_amount: 299.98,
      payment_method: "Credit Card",
      payment_status: "Refunded",
      status: "cancelled",
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      cancelled_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error cancelling booking:", error)
    throw error
  }
}

/**
 * Generate mock booking data for demonstration purposes
 * In a real application, this would be replaced with actual database queries
 */
function getMockBookings(userId: string): Booking[] {
  const today = new Date()

  // Create dates for upcoming and past events
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  const nextMonth = new Date(today)
  nextMonth.setDate(today.getDate() + 30)

  const lastWeek = new Date(today)
  lastWeek.setDate(today.getDate() - 7)

  const lastMonth = new Date(today)
  lastMonth.setDate(today.getDate() - 30)

  // Mock booking data
  return [
    {
      id: "mock1",
      booking_id: "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      user_id: userId,
      event_id: "evt1",
      event_name: "Alpine Hiking Adventure",
      event_image: "/images/alps-bg.jpg",
      event_date: nextWeek.toISOString(),
      location: "Swiss Alps, Switzerland",
      participants: 2,
      price_per_person: 149.99,
      total_amount: 299.98,
      payment_method: "Credit Card",
      payment_status: "Paid",
      status: "confirmed",
      created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      event: {
        id: "evt1",
        title: "Alpine Hiking Adventure",
        subtitle: "Experience the majestic Swiss Alps",
        destination: "Swiss Alps, Switzerland",
        description:
          "Join us for an unforgettable hiking adventure through the stunning Swiss Alps. Breathe in the fresh mountain air and take in panoramic views of snow-capped peaks.",
        start_date: nextWeek.toISOString(),
        end_date: new Date(nextWeek.getTime() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        duration_days: 5,
        spots_left: 8,
        price: 149.99,
        currency: "USD",
        is_featured: true,
        status: "upcoming",
        image: ["alps.jpg"],
        imageUrl: "/images/alps-bg.jpg",
        slug: "alpine-hiking-adventure",
        event_url: "",
        latitude: 46.8182,
        longitude: 8.2275,
        creator: "creator1",
        creator_name: "Adventure Guides",
        collaborators: [],
        collaborator_names: [],
        created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      },
    },
    {
      id: "mock2",
      booking_id: "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      user_id: userId,
      event_id: "evt2",
      event_name: "Tropical Beach Retreat",
      event_image: "/images/beach-bg.jpg",
      event_date: nextMonth.toISOString(),
      location: "Bali, Indonesia",
      participants: 1,
      price_per_person: 299.99,
      total_amount: 299.99,
      payment_method: "PayPal",
      payment_status: "Paid",
      status: "confirmed",
      created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
      updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      event: {
        id: "evt2",
        title: "Tropical Beach Retreat",
        subtitle: "Relax in paradise",
        destination: "Bali, Indonesia",
        description:
          "Escape to the tropical paradise of Bali for a relaxing beach retreat. Enjoy pristine beaches, luxurious accommodations, and authentic cultural experiences.",
        start_date: nextMonth.toISOString(),
        end_date: new Date(nextMonth.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        duration_days: 7,
        spots_left: 4,
        price: 299.99,
        currency: "USD",
        is_featured: true,
        status: "upcoming",
        image: ["beach.jpg"],
        imageUrl: "/images/beach-bg.jpg",
        slug: "tropical-beach-retreat",
        event_url: "",
        latitude: -8.4095,
        longitude: 115.1889,
        creator: "creator2",
        creator_name: "Island Escapes",
        collaborators: ["collab1"],
        collaborator_names: ["Bali Tours"],
        created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(),
        updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      },
    },
    {
      id: "mock3",
      booking_id: "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      user_id: userId,
      event_id: "evt3",
      event_name: "Rainforest Expedition",
      event_image: "/images/forest-bg.jpg",
      event_date: lastWeek.toISOString(),
      location: "Amazon Rainforest, Brazil",
      participants: 3,
      price_per_person: 199.99,
      total_amount: 599.97,
      payment_method: "Credit Card",
      payment_status: "Paid",
      status: "completed",
      created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days ago
      updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 6).toISOString(),
      event: {
        id: "evt3",
        title: "Rainforest Expedition",
        subtitle: "Explore the Amazon",
        destination: "Amazon Rainforest, Brazil",
        description:
          "Embark on an expedition into the heart of the Amazon rainforest. Discover incredible biodiversity, meet indigenous communities, and navigate the mighty Amazon River.",
        start_date: lastWeek.toISOString(),
        end_date: new Date(lastWeek.getTime() + 1000 * 60 * 60 * 24 * 6).toISOString(),
        duration_days: 6,
        spots_left: 0,
        price: 199.99,
        currency: "USD",
        is_featured: false,
        status: "completed",
        image: ["forest.jpg"],
        imageUrl: "/images/forest-bg.jpg",
        slug: "rainforest-expedition",
        event_url: "",
        latitude: -3.4653,
        longitude: -62.2159,
        creator: "creator3",
        creator_name: "Rainforest Explorers",
        collaborators: ["collab2", "collab3"],
        collaborator_names: ["Wildlife Experts", "Indigenous Guides"],
        created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      },
    },
    {
      id: "mock4",
      booking_id: "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      user_id: userId,
      event_id: "evt4",
      event_name: "Desert Safari Adventure",
      event_image: "/images/sunset-bg.jpg",
      event_date: lastMonth.toISOString(),
      location: "Sahara Desert, Morocco",
      participants: 2,
      price_per_person: 179.99,
      total_amount: 359.98,
      payment_method: "Bank Transfer",
      payment_status: "Paid",
      status: "completed",
      created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
      updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 45).toISOString(),
      event: {
        id: "evt4",
        title: "Desert Safari Adventure",
        subtitle: "Journey through the Sahara",
        destination: "Sahara Desert, Morocco",
        description:
          "Experience the magic of the Sahara Desert on this unforgettable safari adventure. Ride camels across golden dunes, sleep under the stars in traditional Berber camps, and witness breathtaking desert sunsets.",
        start_date: lastMonth.toISOString(),
        end_date: new Date(lastMonth.getTime() + 1000 * 60 * 60 * 24 * 4).toISOString(),
        duration_days: 4,
        spots_left: 0,
        price: 179.99,
        currency: "USD",
        is_featured: false,
        status: "completed",
        image: ["desert.jpg"],
        imageUrl: "/images/sunset-bg.jpg",
        slug: "desert-safari-adventure",
        event_url: "",
        latitude: 31.7917,
        longitude: -7.0926,
        creator: "creator4",
        creator_name: "Desert Nomads",
        collaborators: [],
        collaborator_names: [],
        created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      },
    },
    {
      id: "mock5",
      booking_id: "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      user_id: userId,
      event_id: "evt5",
      event_name: "Northern Lights Tour",
      event_image: "/images/hero-bg.jpg",
      event_date: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days from now
      location: "Tromsø, Norway",
      participants: 4,
      price_per_person: 249.99,
      total_amount: 999.96,
      payment_method: "Credit Card",
      payment_status: "Pending",
      status: "pending",
      created: new Date(today.getTime() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
      updated: new Date(today.getTime() - 1000 * 60 * 60 * 1).toISOString(),
      event: {
        id: "evt5",
        title: "Northern Lights Tour",
        subtitle: "Chase the aurora in Norway",
        destination: "Tromsø, Norway",
        description:
          "Witness the spectacular Northern Lights dancing across the Arctic sky on this magical tour to Tromsø, Norway. Includes expert guides, photography tips, and cozy accommodations.",
        start_date: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 14).toISOString(),
        end_date: new Date(today.getTime() + 1000 * 60 * 60 * 24 * 19).toISOString(),
        duration_days: 5,
        spots_left: 6,
        price: 249.99,
        currency: "USD",
        is_featured: true,
        status: "upcoming",
        image: ["northern-lights.jpg"],
        imageUrl: "/images/hero-bg.jpg",
        slug: "northern-lights-tour",
        event_url: "",
        latitude: 69.6492,
        longitude: 18.9553,
        creator: "creator5",
        creator_name: "Arctic Adventures",
        collaborators: ["collab4"],
        collaborator_names: ["Aurora Photographers"],
        created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
      },
    },
    {
      id: "mock6",
      booking_id: "BK-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      user_id: userId,
      event_id: "evt6",
      event_name: "Mountain Biking Weekend",
      event_image: "/images/alps-bg.jpg",
      event_date: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
      location: "Rocky Mountains, USA",
      participants: 1,
      price_per_person: 129.99,
      total_amount: 129.99,
      payment_method: "Credit Card",
      payment_status: "Refunded",
      status: "cancelled",
      created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 20).toISOString(), // 20 days ago
      updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      cancelled_at: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
      event: {
        id: "evt6",
        title: "Mountain Biking Weekend",
        subtitle: "Thrilling trails in the Rockies",
        destination: "Rocky Mountains, USA",
        description:
          "Get your adrenaline pumping on this mountain biking weekend in the Rocky Mountains. Tackle challenging trails with expert guides and enjoy stunning mountain scenery.",
        start_date: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        end_date: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 8).toISOString(),
        duration_days: 3,
        spots_left: 12,
        price: 129.99,
        currency: "USD",
        is_featured: false,
        status: "completed",
        image: ["biking.jpg"],
        imageUrl: "/images/alps-bg.jpg",
        slug: "mountain-biking-weekend",
        event_url: "",
        latitude: 39.5501,
        longitude: -105.7821,
        creator: "creator6",
        creator_name: "Mountain Riders",
        collaborators: [],
        collaborator_names: [],
        created: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 40).toISOString(),
        updated: new Date(today.getTime() - 1000 * 60 * 60 * 24 * 25).toISOString(),
      },
    },
  ]
}

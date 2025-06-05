import { getPocketBase } from "@/lib/pocketbase"
import type { TravelEvent } from "@/lib/travel-events"

export interface TravelBooking {
  id: string
  collectionId: string
  collectionName: string
  created: string
  updated: string
  user: string
  event: string
  status: string
  num_guests: number
  booking_time: string
  notes?: string
  check_in_time?: string
  expand?: {
    user?: {
      id: string
      name: string
      email: string
    }
    event?: TravelEvent
  }
}

// Fetch all bookings for a user
export async function fetchUserBookings(userId: string): Promise<TravelBooking[]> {
  try {
    const pb = getPocketBase()

    // Fetch bookings with expanded event data
    const bookings = await pb.collection("travel_bookings").getFullList({
      sort: "-created",
      filter: `user = "${userId}"`,
      expand: "event",
    })

    console.log("Fetched bookings:", bookings)

    return bookings as unknown as TravelBooking[]
  } catch (error) {
    console.error("Error fetching user bookings:", error)
    throw new Error("Failed to fetch bookings")
  }
}

// Fetch a single booking by ID
export async function fetchBookingById(bookingId: string): Promise<TravelBooking> {
  try {
    const pb = getPocketBase()

    const booking = await pb.collection("travel_bookings").getOne(bookingId, {
      expand: "event,user",
    })

    return booking as unknown as TravelBooking
  } catch (error) {
    console.error("Error fetching booking:", error)
    throw new Error("Failed to fetch booking details")
  }
}

// Create a new booking
export async function createBooking(data: {
  event: string
  num_guests: number
  notes?: string
}): Promise<TravelBooking> {
  try {
    console.group("📚 BOOKING CREATION")
    console.log("📌 Function called with data:", data)

    const pb = getPocketBase()

    if (!pb.authStore.isValid) {
      console.error("❌ Authentication invalid - User not logged in")
      console.groupEnd()
      throw new Error("You must be logged in to create a booking")
    }

    console.log("✅ User authenticated successfully")
    console.log("👤 User ID:", pb.authStore.model?.id)

    const userId = pb.authStore.model?.id

    // First, get the current event to check availability
    console.log("🔍 Fetching event details to check availability")
    const event = await pb.collection("travel_events").getOne(data.event)

    console.log("📊 Current spots left:", event.spots_left)

    // Check if enough spots are available
    if (event.spots_left < data.num_guests) {
      console.error("❌ Not enough spots available")
      console.groupEnd()
      throw new Error(`Only ${event.spots_left} spots available, but ${data.num_guests} requested`)
    }

    // Create the booking
    const bookingData = {
      user: userId,
      event: data.event,
      status: "pending",
      num_guests: data.num_guests,
      booking_time: new Date().toISOString(),
      notes: data.notes || "",
    }

    console.log("📋 Booking data prepared:", bookingData)
    console.log("🔄 Sending booking creation request to PocketBase API...")
    console.time("⏱️ Booking Creation Duration")

    // Create the booking record
    const booking = await pb.collection("travel_bookings").create(bookingData)

    console.timeEnd("⏱️ Booking Creation Duration")
    console.log("✅ Booking created successfully:", booking)

    // Update the event's spots_left
    const newSpotsLeft = event.spots_left - data.num_guests
    console.log("🔄 Updating event spots_left from", event.spots_left, "to", newSpotsLeft)
    console.time("⏱️ Event Update Duration")

    try {
      await pb.collection("travel_events").update(data.event, {
        spots_left: newSpotsLeft,
      })
      console.timeEnd("⏱️ Event Update Duration")
      console.log("✅ Event spots_left updated successfully")
    } catch (updateError) {
      console.error("⚠️ Failed to update event spots_left:", updateError)
      console.log("⚠️ Booking was created but event spots were not updated")
      // We don't throw here because the booking was created successfully
    }

    console.groupEnd()
    return booking as unknown as TravelBooking
  } catch (error: any) {
    console.error("❌ Error creating booking:", error)

    // Log detailed API error information if available
    if (error.data) {
      console.error("  Error data:", error.data)

      // Check for field validation errors
      if (error.data.data) {
        console.error("  Field validation errors:")
        for (const [field, errors] of Object.entries(error.data.data)) {
          console.error(`    ${field}:`, errors)
        }
      }
    }

    console.groupEnd()
    throw new Error(error.message || "Failed to create booking")
  }
}

// Update a booking
export async function updateBooking(
  bookingId: string,
  data: Partial<
    Omit<TravelBooking, "id" | "collectionId" | "collectionName" | "created" | "updated" | "user" | "event">
  >,
): Promise<TravelBooking> {
  try {
    console.group("📝 BOOKING UPDATE")
    console.log("📌 Updating booking:", bookingId)
    console.log("📌 Update data:", data)

    const pb = getPocketBase()

    if (!pb.authStore.isValid) {
      console.error("❌ Authentication invalid - User not logged in")
      console.groupEnd()
      throw new Error("You must be logged in to update a booking")
    }

    // Get the current booking to check if we need to update event spots
    const currentBooking = await pb.collection("travel_bookings").getOne(bookingId, {
      expand: "event",
    })

    console.log("📊 Current booking:", currentBooking)

    // Check if number of guests is changing
    const guestsChanging = data.num_guests !== undefined && data.num_guests !== currentBooking.num_guests

    // Check if status is changing to cancelled
    const beingCancelled = data.status === "cancelled" && currentBooking.status !== "cancelled"

    // If guests are changing or booking is being cancelled, we need to update event spots
    if (guestsChanging || beingCancelled) {
      const event = await pb.collection("travel_events").getOne(currentBooking.event)
      console.log("📊 Current event spots left:", event.spots_left)

      let newSpotsLeft = event.spots_left

      if (beingCancelled) {
        // If cancelling, add all guests back to available spots
        newSpotsLeft += currentBooking.num_guests
        console.log("🔄 Cancelling booking, returning", currentBooking.num_guests, "spots")
      } else if (guestsChanging) {
        // If changing guest count, adjust the difference
        const guestDifference = currentBooking.num_guests - (data.num_guests || 0)
        newSpotsLeft += guestDifference
        console.log(
          "🔄 Changing guests from",
          currentBooking.num_guests,
          "to",
          data.num_guests,
          "difference:",
          guestDifference,
        )
      }

      console.log("🔄 Updating event spots_left from", event.spots_left, "to", newSpotsLeft)

      try {
        await pb.collection("travel_events").update(currentBooking.event, {
          spots_left: newSpotsLeft,
        })
        console.log("✅ Event spots_left updated successfully")
      } catch (updateError) {
        console.error("⚠️ Failed to update event spots_left:", updateError)
        // Continue with booking update even if event update fails
      }
    }

    // Update the booking
    console.log("🔄 Updating booking record...")
    const booking = await pb.collection("travel_bookings").update(bookingId, data)
    console.log("✅ Booking updated successfully")

    console.groupEnd()
    return booking as unknown as TravelBooking
  } catch (error) {
    console.error("❌ Error updating booking:", error)
    console.groupEnd()
    throw new Error("Failed to update booking")
  }
}

// Cancel a booking
export async function cancelBooking(bookingId: string): Promise<TravelBooking> {
  try {
    console.group("❌ BOOKING CANCELLATION")
    console.log("📌 Cancelling booking:", bookingId)

    const pb = getPocketBase()

    if (!pb.authStore.isValid) {
      console.error("❌ Authentication invalid - User not logged in")
      console.groupEnd()
      throw new Error("You must be logged in to cancel a booking")
    }

    // Get the current booking
    const currentBooking = await pb.collection("travel_bookings").getOne(bookingId)
    console.log("📊 Current booking:", currentBooking)

    // Only update spots if the booking wasn't already cancelled
    if (currentBooking.status !== "cancelled") {
      // Get the event to update spots
      const event = await pb.collection("travel_events").getOne(currentBooking.event)
      console.log("📊 Current event spots left:", event.spots_left)

      // Calculate new spots left
      const newSpotsLeft = event.spots_left + currentBooking.num_guests
      console.log("🔄 Returning", currentBooking.num_guests, "spots to event")
      console.log("🔄 Updating event spots_left from", event.spots_left, "to", newSpotsLeft)

      try {
        // Update the event spots
        await pb.collection("travel_events").update(currentBooking.event, {
          spots_left: newSpotsLeft,
        })
        console.log("✅ Event spots_left updated successfully")
      } catch (updateError) {
        console.error("⚠️ Failed to update event spots_left:", updateError)
        // Continue with booking cancellation even if event update fails
      }
    } else {
      console.log("ℹ️ Booking was already cancelled, not updating event spots")
    }

    // Update the booking status to cancelled
    console.log("🔄 Updating booking status to cancelled...")
    const booking = await pb.collection("travel_bookings").update(bookingId, {
      status: "cancelled",
    })
    console.log("✅ Booking cancelled successfully")

    console.groupEnd()
    return booking as unknown as TravelBooking
  } catch (error) {
    console.error("❌ Error cancelling booking:", error)
    console.groupEnd()
    throw new Error("Failed to cancel booking")
  }
}

// Delete a booking
export async function deleteBooking(bookingId: string): Promise<void> {
  try {
    console.group("🗑️ BOOKING DELETION")
    console.log("📌 Deleting booking:", bookingId)

    const pb = getPocketBase()

    if (!pb.authStore.isValid) {
      console.error("❌ Authentication invalid - User not logged in")
      console.groupEnd()
      throw new Error("You must be logged in to delete a booking")
    }

    // Get the current booking before deletion
    const currentBooking = await pb.collection("travel_bookings").getOne(bookingId)
    console.log("📊 Current booking:", currentBooking)

    // Only update spots if the booking wasn't cancelled
    if (currentBooking.status !== "cancelled") {
      // Get the event to update spots
      const event = await pb.collection("travel_events").getOne(currentBooking.event)
      console.log("📊 Current event spots left:", event.spots_left)

      // Calculate new spots left
      const newSpotsLeft = event.spots_left + currentBooking.num_guests
      console.log("🔄 Returning", currentBooking.num_guests, "spots to event")
      console.log("🔄 Updating event spots_left from", event.spots_left, "to", newSpotsLeft)

      try {
        // Update the event spots
        await pb.collection("travel_events").update(currentBooking.event, {
          spots_left: newSpotsLeft,
        })
        console.log("✅ Event spots_left updated successfully")
      } catch (updateError) {
        console.error("⚠️ Failed to update event spots_left:", updateError)
        // Continue with booking deletion even if event update fails
      }
    } else {
      console.log("ℹ️ Booking was already cancelled, not updating event spots")
    }

    // Delete the booking
    console.log("🔄 Deleting booking record...")
    await pb.collection("travel_bookings").delete(bookingId)
    console.log("✅ Booking deleted successfully")

    console.groupEnd()
  } catch (error) {
    console.error("❌ Error deleting booking:", error)
    console.groupEnd()
    throw new Error("Failed to delete booking")
  }
}

// Get booking count for an event
export async function getEventBookingCount(eventId: string): Promise<number> {
  try {
    const pb = getPocketBase()

    const resultList = await pb.collection("travel_bookings").getList(1, 1, {
      filter: `event = "${eventId}" && status != "cancelled"`,
      skipTotal: false,
    })

    return resultList.totalItems
  } catch (error) {
    console.error("Error getting booking count:", error)
    return 0
  }
}

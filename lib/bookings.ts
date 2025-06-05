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


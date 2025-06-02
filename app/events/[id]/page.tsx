"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, MapPin, Users, DollarSign, Share2, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import type { TravelEvent } from "@/lib/travel-events"
import { useAuth } from "@/components/auth-provider"
import { createBooking } from "@/lib/travel-bookings"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: isAuthLoading } = useAuth()

  const [event, setEvent] = useState<TravelEvent | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [numGuests, setNumGuests] = useState(1)
  const [notes, setNotes] = useState("")
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const pb = await import("@/lib/pocketbase").then((mod) => mod.getPocketBase())
        const eventId = params.id as string

        const record = await pb.collection("travel_events").getOne(eventId, {
          expand: "creator",
        })

        // Format the event data
        const formattedEvent: TravelEvent = {
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
              : "/placeholder.svg?height=400&width=600",
          location_address: record.location_address || "",
          latitude: record.latitude,
          longitude: record.longitude,
          creator: record.creator,
          collaborators: record.collaborators || [],
          created: record.created,
          updated: record.updated,
          expand: {
            creator: record.expand?.creator,
          },
        }

        setEvent(formattedEvent)
      } catch (error) {
        console.error("Error fetching event details:", error)
        toast({
          title: "Error",
          description: "Failed to load event details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchEventDetails()
    }
  }, [params.id, toast])

  const handleBookNow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be signed in to book an event.",
        variant: "destructive",
      })
      router.push(`/login?redirect=/events/${params.id}`)
      return
    }

    if (!event) return

    // Validate number of guests
    if (numGuests <= 0) {
      toast({
        title: "Invalid guest count",
        description: "Number of guests must be at least 1.",
        variant: "destructive",
      })
      return
    }

    // Check if enough spots are available
    if (numGuests > event.spots_left) {
      toast({
        title: "Not enough spots available",
        description: `Only ${event.spots_left} spots available, but ${numGuests} requested.`,
        variant: "destructive",
      })
      return
    }

    setIsBooking(true)

    try {
      console.log("Creating booking for event:", event.id)
      console.log("Number of guests:", numGuests)
      console.log("Notes:", notes)

      const booking = await createBooking({
        event: event.id,
        num_guests: numGuests,
        notes: notes,
      })

      console.log("Booking created successfully:", booking)

      // Update local event state to reflect the new spots_left count
      setEvent((prev) => {
        if (!prev) return null
        return {
          ...prev,
          spots_left: prev.spots_left - numGuests,
        }
      })

      setBookingSuccess(true)
      toast({
        title: "Booking successful",
        description: "Your booking has been confirmed!",
      })

      // Close dialog after a short delay
      setTimeout(() => {
        setBookingDialogOpen(false)
        // Redirect to my bookings page
        router.push("/my-bookings")
      }, 2000)
    } catch (error: any) {
      console.error("Error creating booking:", error)
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="flex flex-col justify-center items-center h-[60vh]">
            <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/events")}>Browse Events</Button>
          </div>
        </div>
      </div>
    )
  }

  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  const formattedStartDate = format(startDate, "MMMM d, yyyy")
  const formattedEndDate = format(endDate, "MMMM d, yyyy")
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-background">
      <div className="relative">
        {/* Hero image */}
        <div className="w-full h-[40vh] bg-muted relative overflow-hidden">
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: `url(${event.imageUrl || "/placeholder.svg?height=400&width=800"})`,
              filter: "brightness(0.7)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

          <div className="container relative h-full flex flex-col justify-end pb-8">
            <div className="max-w-3xl">
              <Badge className="mb-2">{event.destination}</Badge>
              <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
              {event.subtitle && <p className="text-xl text-white/90">{event.subtitle}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Everything you need to know about this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <h3 className="font-medium">Date</h3>
                      <p className="text-sm text-muted-foreground">
                        {formattedStartDate} - {formattedEndDate}
                      </p>
                      <p className="text-sm text-muted-foreground">({durationDays} days)</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-sm text-muted-foreground">{event.location_address || event.destination}</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <h3 className="font-medium">Availability</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.spots_left} spots left out of {event.total_spots}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <h3 className="font-medium">Price</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.price} {event.currency} per person
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <p>{event.description}</p>
                  </div>
                </div>

                {event.expand?.creator && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-2">Organized by</h3>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                          {event.expand.creator.avatar ? (
                            <img
                              src={event.expand.creator.avatar || "/placeholder.svg"}
                              alt={event.expand.creator.name || "Organizer"}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{event.expand.creator.name || "Unknown Organizer"}</p>
                          <p className="text-sm text-muted-foreground">Event Organizer</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Map section */}
            {event.latitude && event.longitude && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBMH3hsoOQG5Kb9-1459-7hXNM0AY8_VEA&q=${event.latitude},${event.longitude}&zoom=13`}
                      allowFullScreen
                    ></iframe>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {event.location_address || `${event.latitude}, ${event.longitude}`}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Book Your Spot</CardTitle>
                <CardDescription>
                  {event.spots_left > 0 ? `${event.spots_left} spots remaining` : "This event is fully booked"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-md">
                    <div className="flex justify-between mb-2">
                      <span>Price per person</span>
                      <span className="font-medium">
                        {event.price} {event.currency}
                      </span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>Total from</span>
                      <span>
                        {event.price} {event.currency}
                      </span>
                    </div>
                  </div>

                  <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={event.spots_left <= 0 || isAuthLoading}
                        onClick={() => {
                          if (!user) {
                            toast({
                              title: "Authentication required",
                              description: "You must be signed in to book an event.",
                              variant: "destructive",
                            })
                            router.push(`/login?redirect=/events/${params.id}`)
                            return
                          }
                          setBookingDialogOpen(true)
                        }}
                      >
                        {event.spots_left > 0 ? "Book Now" : "Sold Out"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Book Your Adventure</DialogTitle>
                        <DialogDescription>Complete your booking for {event.title}</DialogDescription>
                      </DialogHeader>

                      {bookingSuccess ? (
                        <div className="py-6">
                          <div className="flex flex-col items-center justify-center text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
                            <p className="text-muted-foreground mb-4">
                              Your booking has been successfully created. You'll be redirected to your bookings page
                              shortly.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="num-guests">Number of Guests</Label>
                              <Input
                                id="num-guests"
                                type="number"
                                min="1"
                                max={event.spots_left}
                                value={numGuests}
                                onChange={(e) => setNumGuests(Number.parseInt(e.target.value) || 1)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Maximum {event.spots_left} guests available
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="notes">Special Requests (Optional)</Label>
                              <Textarea
                                id="notes"
                                placeholder="Any dietary requirements or special requests?"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                            </div>

                            <div className="p-3 bg-muted rounded-md">
                              <div className="flex justify-between mb-1">
                                <span>Price per person</span>
                                <span>
                                  {event.price} {event.currency}
                                </span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span>Number of guests</span>
                                <span>× {numGuests}</span>
                              </div>
                              <Separator className="my-2" />
                              <div className="flex justify-between font-medium">
                                <span>Total</span>
                                <span>
                                  {event.price * numGuests} {event.currency}
                                </span>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleBookNow} disabled={isBooking} className="w-full">
                              {isBooking ? (
                                <>
                                  <span className="animate-spin mr-2">⟳</span> Processing...
                                </>
                              ) : (
                                "Confirm Booking"
                              )}
                            </Button>
                          </DialogFooter>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // Copy the current URL to clipboard
                    navigator.clipboard.writeText(window.location.href)
                    toast({
                      title: "Link copied",
                      description: "Event link copied to clipboard",
                    })
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Event
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-lg mr-2">🌍</span>
                    <span>Explore {event.destination}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-lg mr-2">🗓️</span>
                    <span>{durationDays} days of adventure</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-lg mr-2">👥</span>
                    <span>Meet like-minded travelers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-lg mr-2">📸</span>
                    <span>Create unforgettable memories</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

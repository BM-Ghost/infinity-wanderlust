"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  CalendarX,
  CalendarCheck,
  Loader2,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  Trash2,
} from "lucide-react"
import { getPocketBase } from "@/lib/pocketbase"
import { fetchUserBookings, cancelBooking, deleteBooking, type TravelBooking } from "@/lib/travel-bookings"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { JSX } from "react"

export default function MyBookingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const isMounted = useRef(true)

  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<TravelBooking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<TravelBooking[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedBooking, setSelectedBooking] = useState<TravelBooking | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Set up cleanup when component unmounts
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  // Fetch bookings data
  useEffect(() => {
    const loadBookings = async () => {
      if (!isMounted.current) return
      setIsLoading(true)

      // Check if user is logged in
      const pb = getPocketBase()
      if (!pb || !pb.authStore.isValid) {
        router.push("/login?redirect=/my-bookings")
        return
      }

      try {
        const userId = pb.authStore.model?.id

        if (!userId) {
          throw new Error("User ID not found")
        }

        // Fetch real bookings from PocketBase
        const bookingsData = await fetchUserBookings(userId)

        if (!isMounted.current) return

        setBookings(bookingsData)
        setFilteredBookings(bookingsData)
      } catch (error) {
        console.error("Error loading bookings:", error)
        if (isMounted.current && !error.toString().includes("autocancelled")) {
          toast({
            variant: "destructive",
            title: "Error loading bookings",
            description: "Could not load your bookings. Please try again.",
          })
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    loadBookings()
  }, [user, router, toast])

  // Filter bookings based on search query and status filter
  useEffect(() => {
    if (!bookings.length) return

    let filtered = [...bookings]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((booking) => {
        const eventTitle = booking.expand?.event?.title || ""
        const eventDestination = booking.expand?.event?.destination || ""
        return (
          eventTitle.toLowerCase().includes(query) ||
          eventDestination.toLowerCase().includes(query) ||
          booking.id.toLowerCase().includes(query)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }, [searchQuery, statusFilter, bookings])

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    setIsCancelling(true)
    try {
      // Cancel booking in PocketBase
      await cancelBooking(selectedBooking.id)

      // Update local state
      const updatedBookings = bookings.map((booking) => {
        if (booking.id === selectedBooking.id) {
          return {
            ...booking,
            status: "cancelled",
            updated: new Date().toISOString(),
          }
        }
        return booking
      })

      setBookings(updatedBookings)
      setFilteredBookings(
        updatedBookings.filter((booking) => statusFilter === "all" || booking.status === statusFilter),
      )

      toast({
        title: "Booking cancelled",
        description: `Your booking for ${selectedBooking.expand?.event?.title || "this event"} has been cancelled.`,
      })
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
      })
    } finally {
      setIsCancelling(false)
      setShowCancelDialog(false)
      setSelectedBooking(null)
    }
  }

  // Handle booking deletion
  const handleDeleteBooking = async () => {
    if (!selectedBooking) return

    setIsDeleting(true)
    try {
      // Delete booking in PocketBase
      await deleteBooking(selectedBooking.id)

      // Update local state
      const updatedBookings = bookings.filter((booking) => booking.id !== selectedBooking.id)
      setBookings(updatedBookings)
      setFilteredBookings(
        updatedBookings.filter((booking) => statusFilter === "all" || booking.status === statusFilter),
      )

      toast({
        title: "Booking deleted",
        description: `Your booking for ${selectedBooking.expand?.event?.title || "this event"} has been deleted.`,
      })
    } catch (error) {
      console.error("Error deleting booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete booking. Please try again.",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setSelectedBooking(null)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "cancelled":
        return (
          <Badge variant="outline" className="text-red-500 border-red-500">
            Cancelled
          </Badge>
        )
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  // Calculate days remaining until event
  const getDaysRemaining = (eventDate: string) => {
    const today = new Date()
    const event = new Date(eventDate)
    const diffTime = event.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />

      <div className="container py-8 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
            <p className="text-muted-foreground">Manage your travel reservations and bookings</p>
          </div>
          <Button asChild>
            <Link href="/events">Browse Events</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search bookings..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>
                  Status:{" "}
                  {statusFilter === "all" ? "All" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>Confirmed</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>Cancelled</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>Completed</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span>Upcoming</span>
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <CalendarX className="h-4 w-4" />
              <span>Past</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>All Bookings</span>
            </TabsTrigger>
          </TabsList>

          {/* Upcoming Bookings */}
          <TabsContent value="upcoming">
            {filteredBookings.filter(
              (booking) =>
                booking.expand?.event &&
                new Date(booking.expand.event.start_date) > new Date() &&
                booking.status !== "cancelled",
            ).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings
                  .filter(
                    (booking) =>
                      booking.expand?.event &&
                      new Date(booking.expand.event.start_date) > new Date() &&
                      booking.status !== "cancelled",
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.expand?.event?.start_date || "").getTime() -
                      new Date(b.expand?.event?.start_date || "").getTime(),
                  )
                  .map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onViewDetails={() => {
                        setSelectedBooking(booking)
                        setShowDetailsDialog(true)
                      }}
                      onCancel={() => {
                        setSelectedBooking(booking)
                        setShowCancelDialog(true)
                      }}
                      onDelete={() => {
                        setSelectedBooking(booking)
                        setShowDeleteDialog(true)
                      }}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getStatusBadge={getStatusBadge}
                      getDaysRemaining={getDaysRemaining}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No upcoming bookings"
                description="You don't have any upcoming travel bookings."
                buttonText="Browse Events"
                buttonLink="/events"
              />
            )}
          </TabsContent>

          {/* Past Bookings */}
          <TabsContent value="past">
            {filteredBookings.filter(
              (booking) =>
                booking.expand?.event &&
                (new Date(booking.expand.event.end_date) < new Date() || booking.status === "completed"),
            ).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings
                  .filter(
                    (booking) =>
                      booking.expand?.event &&
                      (new Date(booking.expand.event.end_date) < new Date() || booking.status === "completed"),
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.expand?.event?.start_date || "").getTime() -
                      new Date(a.expand?.event?.start_date || "").getTime(),
                  )
                  .map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onViewDetails={() => {
                        setSelectedBooking(booking)
                        setShowDetailsDialog(true)
                      }}
                      onCancel={null} // Cannot cancel past bookings
                      onDelete={() => {
                        setSelectedBooking(booking)
                        setShowDeleteDialog(true)
                      }}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getStatusBadge={getStatusBadge}
                      getDaysRemaining={getDaysRemaining}
                      isPast={true}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No past bookings"
                description="You don't have any past travel bookings."
                buttonText="Browse Events"
                buttonLink="/events"
              />
            )}
          </TabsContent>

          {/* All Bookings */}
          <TabsContent value="all">
            {filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings
                  .sort(
                    (a, b) =>
                      new Date(a.expand?.event?.start_date || "").getTime() -
                      new Date(b.expand?.event?.start_date || "").getTime(),
                  )
                  .map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onViewDetails={() => {
                        setSelectedBooking(booking)
                        setShowDetailsDialog(true)
                      }}
                      onCancel={
                        booking.expand?.event &&
                        new Date(booking.expand.event.start_date) > new Date() &&
                        booking.status !== "cancelled"
                          ? () => {
                              setSelectedBooking(booking)
                              setShowCancelDialog(true)
                            }
                          : null
                      }
                      onDelete={() => {
                        setSelectedBooking(booking)
                        setShowDeleteDialog(true)
                      }}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getStatusBadge={getStatusBadge}
                      getDaysRemaining={getDaysRemaining}
                      isPast={booking.expand?.event && new Date(booking.expand.event.end_date) < new Date()}
                    />
                  ))}
              </div>
            ) : (
              <EmptyState
                title="No bookings found"
                description="You don't have any travel bookings yet."
                buttonText="Browse Events"
                buttonLink="/events"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Dialog */}
      {selectedBooking && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>Booking ID: {selectedBooking.id}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              {/* Event Image */}
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={selectedBooking.expand?.event?.imageUrl || "/placeholder.svg?height=400&width=600"}
                  alt={selectedBooking.expand?.event?.title || "Event"}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Event Details */}
              <div>
                <h3 className="text-xl font-bold">{selectedBooking.expand?.event?.title || "Event"}</h3>
                <div className="flex items-center text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{selectedBooking.expand?.event?.destination || "Location"}</span>
                </div>
              </div>

              <Separator />

              {/* Booking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedBooking.expand?.event?.start_date || "")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{formatTime(selectedBooking.expand?.event?.start_date || "")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Participants</p>
                  <p className="font-medium">
                    {selectedBooking.num_guests} {selectedBooking.num_guests === 1 ? "person" : "people"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
              </div>

              <Separator />

              {/* Payment Details */}
              <div>
                <h4 className="font-medium mb-2">Payment Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price per person</p>
                    <p className="font-medium">${selectedBooking.expand?.event?.price.toFixed(2) || "0.00"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total amount</p>
                    <p className="font-bold">
                      ${((selectedBooking.expand?.event?.price || 0) * selectedBooking.num_guests).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment method</p>
                    <p className="font-medium">Credit Card</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment status</p>
                    <p className="font-medium">{selectedBooking.status === "cancelled" ? "Refunded" : "Paid"}</p>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              {selectedBooking.status !== "cancelled" &&
                selectedBooking.expand?.event &&
                new Date(selectedBooking.expand.event.start_date) > new Date() && (
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Cancellation Policy</p>
                        <p className="text-xs text-muted-foreground">
                          Free cancellation up to 48 hours before the event. After that, a 50% cancellation fee applies.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            <DialogFooter className="flex justify-end gap-2">
              {selectedBooking.status !== "cancelled" &&
                selectedBooking.expand?.event &&
                new Date(selectedBooking.expand.event.start_date) > new Date() && (
                  <Button
                    variant="outline"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setShowDetailsDialog(false)
                      setShowCancelDialog(true)
                    }}
                  >
                    Cancel Booking
                  </Button>
                )}
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Cancel Booking Dialog */}
      {selectedBooking && (
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your booking for "{selectedBooking.expand?.event?.title || "this event"}
                " on {formatDate(selectedBooking.expand?.event?.start_date || "")}?
                {selectedBooking.expand?.event && getDaysRemaining(selectedBooking.expand.event.start_date) <= 2 && (
                  <div className="mt-2 text-red-500 font-medium">
                    This booking is within 48 hours of the event. A 50% cancellation fee will apply.
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="bg-red-500 hover:bg-red-600"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel Booking"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Booking Dialog */}
      {selectedBooking && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Booking</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to permanently delete your booking for "
                {selectedBooking.expand?.event?.title || "this event"}" on{" "}
                {formatDate(selectedBooking.expand?.event?.start_date || "")}?
                <div className="mt-2 font-medium">
                  This action cannot be undone. The booking will be permanently removed from your history.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBooking}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Booking"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Footer />
    </div>
  )
}

// Booking Card Component
function BookingCard({
  booking,
  onViewDetails,
  onCancel,
  onDelete,
  formatDate,
  formatTime,
  getStatusBadge,
  getDaysRemaining,
  isPast = false,
}: {
  booking: TravelBooking
  onViewDetails: () => void
  onCancel: (() => void) | null
  onDelete: () => void
  formatDate: (date: string) => string
  formatTime: (date: string) => string
  getStatusBadge: (status: string) => JSX.Element
  getDaysRemaining: (date: string) => number
  isPast?: boolean
}) {
  const event = booking.expand?.event
  if (!event) return null

  const daysRemaining = getDaysRemaining(event.start_date)

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      <div className="relative h-48">
        <Image
          src={event.imageUrl || "/placeholder.svg?height=400&width=600"}
          alt={event.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 right-3">{getStatusBadge(booking.status)}</div>
      </div>
      <CardContent className="pt-6 flex-1">
        <h3 className="text-lg font-bold mb-1">{event.title}</h3>
        <div className="flex items-center text-muted-foreground mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span className="text-sm">{event.destination}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formatDate(event.start_date)}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{formatTime(event.start_date)}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>
              {booking.num_guests} {booking.num_guests === 1 ? "person" : "people"}
            </span>
          </div>
        </div>

        {!isPast && booking.status !== "cancelled" && daysRemaining > 0 && (
          <div className="mt-4 bg-primary/10 p-2 rounded text-sm text-center">
            <span className="font-medium">{daysRemaining}</span> {daysRemaining === 1 ? "day" : "days"} until your event
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between gap-2 pt-2 pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onViewDetails}>
            View Details
          </Button>
          {onCancel && (
            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

// Empty State Component
function EmptyState({
  title,
  description,
  buttonText,
  buttonLink,
}: {
  title: string
  description: string
  buttonText: string
  buttonLink: string
}) {
  return (
    <div className="text-center py-16 bg-muted/30 rounded-lg">
      <CalendarCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      <Button asChild>
        <Link href={buttonLink}>{buttonText}</Link>
      </Button>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, MapPin, Users, Search, Filter, Plus, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { type TravelEvent, fetchTravelEvents } from "@/lib/travel-events"
import { useAuth } from "@/components/auth-provider"

export default function EventsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [events, setEvents] = useState<TravelEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<TravelEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const allEvents = await fetchTravelEvents()
        setEvents(allEvents)
        setFilteredEvents(allEvents)
      } catch (error) {
        console.error("Error loading events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])

  // Filter events based on search query and active tab
  useEffect(() => {
    let filtered = [...events]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.destination.toLowerCase().includes(query),
      )
    }

    // Apply tab filter
    if (activeTab === "upcoming") {
      const now = new Date()
      filtered = filtered.filter((event) => new Date(event.start_date) > now)
    } else if (activeTab === "past") {
      const now = new Date()
      filtered = filtered.filter((event) => new Date(event.end_date) < now)
    }

    setFilteredEvents(filtered)
  }, [events, searchQuery, activeTab])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // The filtering is already handled by the useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="bg-muted py-12">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Discover Amazing Travel Events</h1>
            <p className="text-muted-foreground mb-6">Find and join exciting travel adventures around the world</p>

            <form onSubmit={handleSearch} className="flex w-full max-w-lg mx-auto mb-6">
              <Input
                type="text"
                placeholder="Search destinations, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-r-none"
              />
              <Button type="submit" className="rounded-l-none">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>

            <div className="flex justify-center">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All Events</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="past">Past Events</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">
            {filteredEvents.length}{" "}
            {activeTab === "all" ? "Events" : activeTab === "upcoming" ? "Upcoming Events" : "Past Events"}
          </h2>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>

            {user && (
              <Button size="sm" onClick={() => router.push("/create-event")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `No events match your search for "${searchQuery}"`
                : "There are no events available at this time"}
            </p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setActiveTab("all")
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden flex flex-col h-full">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={event.imageUrl || "/placeholder.svg?height=200&width=400"}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      {event.price} {event.currency}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2">{event.destination}</Badge>
                      <CardTitle className="mb-1">{event.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>

                <CardContent className="pb-2 flex-grow">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{format(new Date(event.start_date), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span className="truncate">{event.destination}</span>
                    </div>
                    <div className="flex items-center col-span-2">
                      <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{event.spots_left} spots left</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button className="w-full" onClick={() => router.push(`/events/${event.id}`)}>
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

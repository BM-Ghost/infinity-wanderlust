"use client"

import { useState } from "react"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Users, Clock, DollarSign, Search } from "lucide-react"
import { useTranslation } from "@/lib/translations"

export default function EventsPage() {
  const { t } = useTranslation()
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Sample events data
  const events = [
    {
      id: 1,
      title: "Tropical Island Retreat",
      location: "Maldives",
      date: "June 15-22, 2025",
      duration: "8 days",
      price: 2499,
      image: "/placeholder.svg?height=400&width=600",
      spots: 8,
      description:
        "Escape to paradise on this exclusive island retreat. Enjoy crystal clear waters, white sandy beaches, and luxurious overwater bungalows. Activities include snorkeling, sunset cruises, and beachside yoga sessions.",
      includes: [
        "Accommodation",
        "Daily breakfast and dinner",
        "Airport transfers",
        "Guided excursions",
        "Snorkeling equipment",
      ],
      itinerary: [
        {
          day: 1,
          title: "Arrival",
          description: "Welcome to the Maldives! Transfer to your overwater bungalow and enjoy a welcome dinner.",
        },
        {
          day: 2,
          title: "Island Exploration",
          description: "After breakfast, explore the island and enjoy a guided snorkeling tour.",
        },
        {
          day: 3,
          title: "Relaxation Day",
          description: "Free day to relax on the beach or enjoy optional spa treatments.",
        },
        // More days would be included in a real application
      ],
    },
    {
      id: 2,
      title: "Safari Adventure",
      location: "Kenya",
      date: "August 10-20, 2025",
      duration: "11 days",
      price: 3299,
      image: "/placeholder.svg?height=400&width=600",
      spots: 6,
      description:
        "Experience the magic of an African safari in Kenya's most famous national parks. Witness the Big Five in their natural habitat and enjoy comfortable accommodations in luxury tented camps.",
      includes: ["Accommodation", "All meals", "Safari drives", "Park entrance fees", "English-speaking guide"],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Nairobi",
          description: "Welcome to Kenya! Transfer to your hotel in Nairobi for an overnight stay.",
        },
        {
          day: 2,
          title: "Amboseli National Park",
          description:
            "Drive to Amboseli National Park, famous for its large elephant herds and views of Mount Kilimanjaro.",
        },
        {
          day: 3,
          title: "Game Drives",
          description:
            "Full day of game drives in Amboseli, with opportunities to see elephants, lions, cheetahs, and more.",
        },
        // More days would be included in a real application
      ],
    },
    {
      id: 3,
      title: "Cultural Japan Tour",
      location: "Japan",
      date: "April 5-15, 2025",
      duration: "11 days",
      price: 2899,
      image: "/placeholder.svg?height=400&width=600",
      spots: 10,
      description:
        "Immerse yourself in Japanese culture and history on this comprehensive tour. Visit Tokyo, Kyoto, Osaka, and Hiroshima, experiencing both modern and traditional Japan. Highlights include cherry blossoms (seasonal), temple visits, and authentic culinary experiences.",
      includes: ["Accommodation", "Breakfast daily", "Bullet train passes", "Guided tours", "Cultural activities"],
      itinerary: [
        {
          day: 1,
          title: "Arrival in Tokyo",
          description: "Welcome to Japan! Transfer to your hotel in Tokyo and enjoy a welcome dinner.",
        },
        {
          day: 2,
          title: "Tokyo Exploration",
          description: "Full day tour of Tokyo, including Meiji Shrine, Harajuku, and the Tokyo Skytree.",
        },
        {
          day: 3,
          title: "Day Trip to Nikko",
          description:
            "Day trip to the UNESCO World Heritage site of Nikko, famous for its elaborate temples and shrines.",
        },
        // More days would be included in a real application
      ],
    },
    {
      id: 4,
      title: "Mediterranean Cruise",
      location: "Greece & Italy",
      date: "September 8-18, 2025",
      duration: "11 days",
      price: 2699,
      image: "/placeholder.svg?height=400&width=600",
      spots: 12,
      description:
        "Sail the beautiful Mediterranean Sea, visiting iconic destinations in Greece and Italy. Explore ancient ruins, charming coastal towns, and enjoy delicious Mediterranean cuisine.",
      includes: ["Cruise accommodation", "All meals on board", "Port excursions", "Entertainment", "Transfers"],
      itinerary: [
        {
          day: 1,
          title: "Embarkation in Athens",
          description: "Board your cruise ship in Athens and settle into your cabin.",
        },
        {
          day: 2,
          title: "Santorini",
          description: "Explore the stunning island of Santorini with its white-washed buildings and blue domes.",
        },
        { day: 3, title: "Mykonos", description: "Discover the charming streets and beaches of Mykonos." },
        // More days would be included in a real application
      ],
    },
  ]

  // Filter events based on search query
  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="mountain-lake-bg min-h-screen">
      <Navbar />

      <div className="container py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("eventsTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("eventsSubtitle")}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events by destination or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="upcoming" className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past Events</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <div className="relative h-64">
                <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                    {event.spots} spots left
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle>{event.title}</CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {event.location}
                  </span>
                  <span className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    {event.date}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {event.duration}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">{event.description}</p>
                <div className="mt-4 flex items-center">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-xl font-bold">${event.price}</span>
                  <span className="text-muted-foreground ml-1">per person</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedEvent(event.id)}>
                  View Details
                </Button>
                <Button>Book Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No events found matching your search.</p>
          </div>
        )}

        <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-4xl">
            {selectedEvent && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{events.find((e) => e.id === selectedEvent)?.title}</DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {events.find((e) => e.id === selectedEvent)?.location}
                    </span>
                    <span className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      {events.find((e) => e.id === selectedEvent)?.date}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {events.find((e) => e.id === selectedEvent)?.spots} spots left
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <Image
                      src={events.find((e) => e.id === selectedEvent)?.image || ""}
                      alt={events.find((e) => e.id === selectedEvent)?.title || ""}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">About This Event</h3>
                    <p className="text-muted-foreground mb-4">
                      {events.find((e) => e.id === selectedEvent)?.description}
                    </p>

                    <div className="flex items-center mb-4">
                      <DollarSign className="h-5 w-5 text-primary mr-1" />
                      <span className="text-xl font-bold">${events.find((e) => e.id === selectedEvent)?.price}</span>
                      <span className="text-muted-foreground ml-1">per person</span>
                    </div>

                    <h3 className="text-lg font-medium mb-2">What's Included</h3>
                    <ul className="grid grid-cols-2 gap-2 mb-4">
                      {events
                        .find((e) => e.id === selectedEvent)
                        ?.includes.map((item, index) => (
                          <li key={index} className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-primary mr-2"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                            <span className="text-sm">{item}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Itinerary</h3>
                  <div className="space-y-4">
                    {events
                      .find((e) => e.id === selectedEvent)
                      ?.itinerary.map((day) => (
                        <div key={day.day} className="flex">
                          <div className="mr-4 flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                              {day.day}
                            </div>
                            {day.day < (events.find((e) => e.id === selectedEvent)?.itinerary.length || 0) && (
                              <div className="w-0.5 h-full bg-border mt-2"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{day.title}</h4>
                            <p className="text-muted-foreground text-sm">{day.description}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-4 sm:gap-0">
                  <div className="flex items-center text-muted-foreground mr-auto">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      Only {events.find((e) => e.id === selectedEvent)?.spots} spots remaining
                    </span>
                  </div>
                  <Button size="lg">Book This Event</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  )
}


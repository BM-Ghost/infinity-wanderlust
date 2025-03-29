"use client"

import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Star, ArrowRight } from "lucide-react"
import { useTranslation } from "@/lib/translations"

export default function HomePage() {
  const { t } = useTranslation()

  // Sample featured destinations
  const featuredDestinations = [
    {
      id: 1,
      title: "Kyoto, Japan",
      description: "Experience traditional Japanese culture among historic temples and beautiful gardens.",
      image: "/placeholder.svg?height=400&width=600",
      rating: 4.9,
    },
    {
      id: 2,
      title: "Santorini, Greece",
      description: "Enjoy breathtaking views of the Aegean Sea from white-washed buildings on volcanic cliffs.",
      image: "/placeholder.svg?height=400&width=600",
      rating: 4.8,
    },
    {
      id: 3,
      title: "Machu Picchu, Peru",
      description: "Explore the ancient Incan citadel set against a backdrop of stunning mountain scenery.",
      image: "/placeholder.svg?height=400&width=600",
      rating: 4.9,
    },
  ]

  // Sample upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: "Tropical Island Retreat",
      location: "Maldives",
      date: "June 15-22, 2025",
      image: "/placeholder.svg?height=300&width=400",
      spots: 8,
    },
    {
      id: 2,
      title: "Safari Adventure",
      location: "Kenya",
      date: "August 10-20, 2025",
      image: "/placeholder.svg?height=300&width=400",
      spots: 6,
    },
  ]

  // Sample reviews
  const latestReviews = [
    {
      id: 1,
      name: "Sarah Johnson",
      destination: "Japan Tour",
      date: "March 10, 2025",
      content:
        "The Japan tour was absolutely incredible! Our guide was knowledgeable and the itinerary was perfect. We visited Tokyo, Kyoto, and Osaka, experiencing both modern city life and traditional Japanese culture.",
      rating: 5,
    },
    {
      id: 2,
      name: "Michael Chen",
      destination: "Peru Expedition",
      date: "February 22, 2025",
      content:
        "Machu Picchu was a dream come true. The local experiences arranged by Infinity Wanderlust made this trip special and authentic. We stayed with a local family in the Sacred Valley and learned about traditional weaving techniques.",
      rating: 4,
    },
  ]

  return (
    <div className="homepage-bg min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section with Rainforest Sunset Background */}
      <section className="homepage-section-1 relative py-24 md:py-32">
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">{t("heroTitle")}</h1>
            <p className="text-xl text-white/90 mb-8">{t("heroSubtitle")}</p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/gallery">{t("exploreButton")}</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                <Link href="/about">{t("learnMoreButton")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations with Sunset Background */}
      <section className="homepage-section-2 py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-white">{t("featuredDestinations")}</h2>
            <Button variant="ghost" asChild className="text-white hover:text-white/80">
              <Link href="/gallery" className="flex items-center">
                {t("viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDestinations.map((destination) => (
              <Card key={destination.id} className="overflow-hidden bg-background/90 backdrop-blur-sm">
                <div className="relative h-64">
                  <Image
                    src={destination.image || "/placeholder.svg"}
                    alt={destination.title}
                    fill
                    className="object-cover transition-transform hover:scale-105 duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="text-xs font-medium">{destination.rating}</span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{destination.title}</h3>
                  <p className="text-muted-foreground mb-4">{destination.description}</p>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/gallery?destination=${encodeURIComponent(destination.title)}`}>
                      {t("exploreButton")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events with Beach Background */}
      <section className="homepage-section-3 py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-white">{t("upcomingEvents")}</h2>
            <Button variant="ghost" asChild className="text-white hover:text-white/80">
              <Link href="/events" className="flex items-center">
                {t("viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden bg-background/90 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row">
                  <div className="relative w-full md:w-1/3 h-48 md:h-auto">
                    <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
                  </div>
                  <CardContent className="flex-1 p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                        <div className="flex flex-col gap-1 mb-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            {event.date}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">
                        {event.spots} spots left
                      </Badge>
                    </div>
                    <div className="mt-auto">
                      <Button asChild className="w-full">
                        <Link href={`/events/${event.id}`}>{t("bookNow")}</Link>
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reviews */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">{t("latestReviews")}</h2>
            <Button variant="ghost" asChild>
              <Link href="/reviews" className="flex items-center">
                {t("viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {latestReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium mr-3">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium">{review.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{review.destination}</span>
                      <span className="mx-2">•</span>
                      <span>{review.date}</span>
                    </div>
                  </div>
                  <div className="ml-auto flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-muted-foreground line-clamp-3">{review.content}</p>
                <Button variant="link" asChild className="mt-2 px-0">
                  <Link href={`/reviews/${review.id}`}>{t("readMore")}</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}


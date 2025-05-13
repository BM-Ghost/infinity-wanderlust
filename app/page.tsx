"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Star, ArrowRight, ChevronRight, ChevronLeft } from "lucide-react"
import { useTranslation } from "@/lib/translations"
import { fetchFeaturedDestinations } from "@/lib/destinations"
import { getUpcomingEvents } from "@/lib/travel-events"
import { fetchLatestReviews } from "@/lib/reviews"
import { ImageCollage } from "@/components/image-collage"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

export default function HomePage() {
  const { t } = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [featuredDestinations, setFeaturedDestinations] = useState<any[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [latestReviews, setLatestReviews] = useState<any[]>([])
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(true)
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    async function loadDestinations() {
      try {
        setIsLoadingDestinations(true)
        const destinations = await fetchFeaturedDestinations(10)
        setFeaturedDestinations(destinations)
      } catch (error) {
        console.error("Error loading destinations:", error)
      } finally {
        setIsLoadingDestinations(false)
      }
    }

    async function loadEvents() {
      try {
        const events = await getUpcomingEvents(2)
        setUpcomingEvents(events)
      } catch (error) {
        console.error("Error loading events:", error)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    async function loadReviews() {
      try {
        const reviews = await fetchLatestReviews(2)
        setLatestReviews(reviews)
      } catch (error) {
        console.error("Error loading reviews:", error)
      } finally {
        setIsLoadingReviews(false)
      }
    }

    loadDestinations()
    loadEvents()
    loadReviews()
  }, [])

  // Check scroll position to update navigation buttons
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10) // 10px buffer
  }

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollPosition)
      // Initial check
      checkScrollPosition()

      return () => {
        scrollContainer.removeEventListener("scroll", checkScrollPosition)
      }
    }
  }, [featuredDestinations])

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" })
  }

  const scrollRight = () => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" })
  }

  // Animation variants for cards
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  }

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

          <div className="relative">
            {/* Scroll left button */}
            {canScrollLeft && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
                onClick={scrollLeft}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            {/* Scroll right button */}
            {canScrollRight && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg bg-background/80 backdrop-blur-sm"
                onClick={scrollRight}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}

            {/* Scrollable container */}
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {isLoadingDestinations ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="min-w-[300px] md:min-w-[350px] lg:min-w-[400px] flex-shrink-0 px-3 snap-start"
                  >
                    <Card className="overflow-hidden bg-background/90 backdrop-blur-sm h-full">
                      <Skeleton className="h-64 w-full" />
                      <CardContent className="p-6">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-4" />
                        <Skeleton className="h-10 w-full" />
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : featuredDestinations.length === 0 ? (
                <div className="w-full text-center py-10">
                  <p className="text-white text-lg">No destinations found. Be the first to review a destination!</p>
                  <Button asChild className="mt-4">
                    <Link href="/reviews/new">Write a Review</Link>
                  </Button>
                </div>
              ) : (
                featuredDestinations.map((destination, index) => (
                  <motion.div
                    key={index}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="min-w-[300px] md:min-w-[350px] lg:min-w-[400px] flex-shrink-0 px-3 snap-start"
                  >
                    <Card className="overflow-hidden bg-background/90 backdrop-blur-sm h-full group">
                      <div className="relative">
                        <ImageCollage images={destination.images} alt={destination.name} />
                        <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-xs font-medium">{destination.rating}</span>
                          <span className="text-xs text-muted-foreground ml-1">({destination.reviewCount})</span>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {destination.name}
                        </h3>
                        <p className="text-muted-foreground mb-4 line-clamp-3">{destination.description}</p>
                        <Button asChild className="w-full">
                          <Link
                            href={`/reviews/${destination.topReviewId}`}
                            className="flex items-center justify-center"
                          >
                            <span>Explore Destination</span>
                            <ChevronRight className="ml-1 h-4 w-4 group-hover:ml-2 transition-all" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
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
            {isLoadingEvents ? (
              // Loading skeletons
              Array.from({ length: 2 }).map((_, index) => (
                <Card key={`event-skeleton-${index}`} className="overflow-hidden bg-background/90 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row">
                    <Skeleton className="w-full md:w-1/3 h-48" />
                    <CardContent className="flex-1 p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </div>
                </Card>
              ))
            ) : upcomingEvents.length === 0 ? (
              <div className="col-span-2 text-center py-10">
                <p className="text-white text-lg">No upcoming events found.</p>
                <Button asChild className="mt-4">
                  <Link href="/create-event">Create an Event</Link>
                </Button>
              </div>
            ) : (
              upcomingEvents.map((event) => (
                <Card key={event.id} className="overflow-hidden bg-background/90 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative w-full md:w-1/3 h-48 md:h-auto">
                      <Image
                        src={event.imageUrl || "/placeholder.svg?height=400&width=600"}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <CardContent className="flex-1 p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                          <div className="flex flex-col gap-1 mb-4">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 mr-1" />
                              {event.destination}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.start_date).toLocaleDateString()} -{" "}
                              {new Date(event.end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/10">
                          {event.spots_left} spots left
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
              ))
            )}
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
            {isLoadingReviews ? (
              // Loading skeletons
              Array.from({ length: 2 }).map((_, index) => (
                <Card key={`review-skeleton-${index}`} className="p-6">
                  <div className="flex items-center mb-4">
                    <Skeleton className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-1/3 mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="w-24 h-4" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-8 w-24" />
                </Card>
              ))
            ) : latestReviews.length === 0 ? (
              <div className="col-span-2 text-center py-10">
                <p className="text-lg">No reviews found. Be the first to write a review!</p>
                <Button asChild className="mt-4">
                  <Link href="/reviews/new">Write a Review</Link>
                </Button>
              </div>
            ) : (
              latestReviews.map((review) => (
                <Card key={review.id} className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium mr-3">
                      {review.expand?.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="font-medium">{review.expand?.user?.name || "Anonymous"}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span>{review.destination}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(review.created).toLocaleDateString()}</span>
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
              ))
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

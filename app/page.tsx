import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Star, Clock, ArrowRight } from "lucide-react"

export default function HomePage() {
  // Featured destinations
  const destinations = [
    {
      id: 1,
      title: "Bali Paradise",
      location: "Bali, Indonesia",
      image: "/placeholder.svg?height=400&width=600",
      rating: 4.9,
      description: "Experience the serene beaches and vibrant culture of Bali.",
    },
    {
      id: 2,
      title: "Swiss Alps Adventure",
      location: "Interlaken, Switzerland",
      image: "/placeholder.svg?height=400&width=600",
      rating: 4.8,
      description: "Breathtaking mountain views and thrilling outdoor activities.",
    },
    {
      id: 3,
      title: "Santorini Sunset",
      location: "Santorini, Greece",
      image: "/placeholder.svg?height=400&width=600",
      rating: 4.7,
      description: "Iconic white buildings and stunning Mediterranean sunsets.",
    },
  ]

  // Upcoming events
  const events = [
    {
      id: 1,
      title: "Tropical Island Retreat",
      location: "Maldives",
      date: "June 15-22, 2025",
      image: "/placeholder.svg?height=300&width=500",
      spots: 8,
    },
    {
      id: 2,
      title: "Safari Adventure",
      location: "Kenya",
      date: "August 10-20, 2025",
      image: "/placeholder.svg?height=300&width=500",
      spots: 6,
    },
  ]

  // Latest reviews
  const reviews = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Japan Tour",
      date: "March 10, 2025",
      rating: 5,
      comment:
        "The Japan tour was absolutely incredible! Our guide was knowledgeable and the itinerary was perfect. Can't wait to travel with Infinity Wanderlust again!",
    },
    {
      id: 2,
      name: "Michael Chen",
      avatar: "/placeholder.svg?height=100&width=100",
      location: "Peru Expedition",
      date: "February 22, 2025",
      rating: 4,
      comment:
        "Machu Picchu was a dream come true. The local experiences arranged by Infinity Wanderlust made this trip special and authentic.",
    },
  ]

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[90vh] hero-section">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
        <div className="container relative h-full flex flex-col justify-center items-start">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-white">Explore the World with Infinity Wanderlust</h1>
            <p className="text-xl text-white/90">
              Discover breathtaking destinations and unforgettable experiences with our curated travel adventures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="font-medium">
                Explore Destinations
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-background/20 backdrop-blur-sm border-white/20 text-white hover:bg-white hover:text-primary"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16 bg-background leafy-pattern">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Featured Destinations</h2>
              <p className="text-muted-foreground mt-2">Explore our handpicked destinations for your next adventure</p>
            </div>
            <Button variant="link" className="mt-4 md:mt-0" asChild>
              <Link href="/gallery">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((destination) => (
              <Card key={destination.id} className="overflow-hidden group">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={destination.image || "/placeholder.svg"}
                    alt={destination.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{destination.rating}</span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>{destination.title}</CardTitle>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {destination.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{destination.description}</p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    Explore
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Upcoming Events</h2>
              <p className="text-muted-foreground mt-2">Join our guided travel experiences</p>
            </div>
            <Button variant="link" className="mt-4 md:mt-0" asChild>
              <Link href="/events">
                View All Events <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden flex flex-col md:flex-row">
                <div className="relative h-48 md:h-auto md:w-1/2">
                  <Image src={event.image || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
                </div>
                <div className="flex flex-col p-6 md:w-1/2">
                  <h3 className="text-xl font-bold">{event.title}</h3>
                  <div className="flex items-center mt-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center mt-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    <span>{event.date}</span>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {event.spots} spots left
                    </Badge>
                  </div>
                  <div className="mt-auto pt-4">
                    <Button className="w-full">Book Now</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Reviews */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Latest Reviews</h2>
              <p className="text-muted-foreground mt-2">What our travelers say about their experiences</p>
            </div>
            <Button variant="link" className="mt-4 md:mt-0" asChild>
              <Link href="/reviews">
                View All Reviews <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Image
                    src={review.avatar || "/placeholder.svg"}
                    alt={review.name}
                    width={50}
                    height={50}
                    className="rounded-full"
                  />
                  <div>
                    <CardTitle className="text-lg">{review.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>{review.location}</span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {review.date}
                      </span>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready for Your Next Adventure?</h2>
          <p className="text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Join our community of passionate travelers and discover the world with Infinity Wanderlust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="font-medium" asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 hover:bg-primary-foreground hover:text-primary font-medium"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}


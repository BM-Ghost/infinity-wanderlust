"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  MapPin,
  Calendar,
  Star,
  ArrowRight,
  ChevronRight,
  Instagram,
  Camera,
  Heart,
  Globe,
  Play,
  Sparkles,
} from "lucide-react"
import { useTranslation } from "@/lib/translations"
import { ImageCollage } from "@/components/image-collage"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useReviews } from "@/hooks/useReviews"
import { useEvents } from "@/hooks/useEvents"
import { useArticles } from "@/hooks/useArticles"
import { InstagramFeed } from "@/components/instagram-feed"
import { AboutPreview } from "@/components/about-preview"

export default function HomePage() {
  const { t } = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const { data: reviewsData, isLoading } = useReviews({
    page: 1,
    perPage: 4,
    enabled: true,
  })
  const reviews = reviewsData?.items || []

  const { data: eventsData, isLoading: isLoadingEvents } = useEvents({
    page: 1,
    perPage: 10,
    enabled: true,
    sort: "start_date",
    filter: `start_date > "${new Date().toISOString().split("T")[0]}"`,
  })

  const upcomingEvents = eventsData?.items.slice(0, 3) || []

  const { data: articlesData, isLoading: isLoadingArticles } = useArticles({
    page: 1,
    perPage: 1,
    enabled: true,
  })
  const latestArticle = articlesData?.items?.[0] || null

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollPosition)
      checkScrollPosition()
      return () => {
        scrollContainer.removeEventListener("scroll", checkScrollPosition)
      }
    }
  }, [reviews])

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" })
  }

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

  const getEventImageUrl = (event: any): string => {
    if (event.imageUrl) return event.imageUrl
    if (event.images?.length) {
      return `https://remain-faceghost.pockethost.io/api/files/${event.collectionId}/${event.id}/${event.images[0]}`
    }
    return "/placeholder.svg"
  }

  const getReviewImageUrl = (review: any, photoIndex: number): string => {
    if (review.photos && review.photos.length > 0) {
      return `https://remain-faceghost.pockethost.io/api/files/${review.collectionId}/${review.id}/${review.photos[photoIndex]}`
    }
    return "/placeholder.svg"
  }

  const latestReviews = Array.isArray(reviews) ? reviews.slice(0, 3) : []

  return (
    <div className="homepage-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-emerald-950/60 via-black to-black" />
      <div className="pointer-events-none absolute -top-32 -right-16 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-20 h-[420px] w-[420px] rounded-full bg-emerald-400/8 blur-3xl" />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/samburu_plane.jpg"
            alt="Travel Adventure"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-transparent" />
        </div>

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-white space-y-8"
              >

                <h1 className="text-6xl md:text-7xl lg:text-8xl font-light leading-tight tracking-tight">
                  Travel with me.
                  <br />
                  Explore beyond the ordinary.
                </h1>

                <p className="text-xl md:text-2xl text-white/85 font-light leading-relaxed max-w-2xl">
                  Short reels, long stories, late-night edits, and sunrise runs to the gate. I show up as a traveler first, vlogger second—so you feel the trip, not the script.
                </p>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-white/90 font-light px-8"
                    asChild
                  >
                    <Link href="/reviews" className="flex items-center gap-2">
                      Read stories
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light px-8"
                    asChild
                  >
                    <Link href="/reviews">Write your own</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light px-8"
                    asChild
                  >
                    <Link href="/contact">Plan a trip</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-white hover:bg-white/5 font-light px-8"
                    asChild
                  >
                    <Link href="/about">About her</Link>
                  </Button>
                </div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-10 pt-10"
                >
                  <div>
                    <div className="text-3xl font-light text-white">{reviews.length || 50}+</div>
                    <div className="text-xs text-white/50 uppercase tracking-widest mt-2">Stories</div>
                  </div>
                  <div className="w-px bg-white/10 hidden sm:block" />
                  <div>
                    <div className="text-3xl font-light text-white">{upcomingEvents.length || 12}+</div>
                    <div className="text-xs text-white/50 uppercase tracking-widest mt-2">Adventures</div>
                  </div>
                  <div className="w-px bg-white/10 hidden sm:block" />
                  <div>
                    <div className="text-3xl font-light text-white">50+</div>
                    <div className="text-xs text-white/50 uppercase tracking-widest mt-2">Countries</div>
                  </div>
                  <div className="w-px bg-white/10 hidden sm:block" />
                  <div>
                    <div className="text-3xl font-light text-white">24/7</div>
                    <div className="text-xs text-white/50 uppercase tracking-widest mt-2">Community</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:flex justify-end"
            >
            </motion.div>
          </div>
        </div>
      </section>

      

      {/* Upcoming Events */}
      {!isLoadingEvents && upcomingEvents?.length > 0 && (
        <section className="py-30">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl md:text-6xl font-light text-white mb-20 leading-tight">
                Join an adventure
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {upcomingEvents.map((event, i) => (
                  <motion.div
                    key={event.id}
                    initial="hidden"
                    whileInView="visible"
                    variants={cardVariants}
                    custom={i}
                  >
                    <Link href={`/events/${event.id}`}>
                      <Card className="overflow-hidden bg-white/5 border-white/10 hover:bg-white/8 transition-all duration-300 cursor-pointer h-full">
                        <div className="relative h-64 overflow-hidden">
                          <Image
                            src={getEventImageUrl(event) || "/placeholder.svg"}
                            alt={event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 text-white">
                            <h3 className="text-xl font-light">{event.title}</h3>
                            <p className="text-sm text-white/70 mt-2">{event.destination}</p>
                          </div>
                        </div>

                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Calendar className="w-4 h-4" />
                            <span className="font-light">
                              {new Date(event.start_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              -{" "}
                              {new Date(event.end_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-white/60 font-light">
                              {event.spots_left} spots left
                            </span>
                            <Button
                              size="sm"
                              className="bg-white text-black hover:bg-white/90 font-light h-8"
                            >
                              Book
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="text-center mt-16">
                <Button
                  variant="outline"
                  className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light"
                  asChild
                >
                  <Link href="/events" className="flex items-center gap-2">
                    View all adventures
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Community & Contact */}
      <section className="py-28 bg-gradient-to-b from-black/75 via-black/70 to-black/80">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-6xl space-y-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">Community first</p>
                <h2 className="text-5xl md:text-6xl font-light text-white leading-tight">
                  Travel with me, contribute, and co-create.
                </h2>
                <p className="text-lg text-white/60 font-light max-w-2xl leading-relaxed">
                  Every reel, review, and itinerary is shaped with the community. Share your voice, plan your own adventure, and stay close on socials.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-white text-black hover:bg-white/90 font-light">
                  <Link href="/reviews">Tell your story</Link>
                </Button>
                <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light">
                  <Link href="/contact">Design an itinerary</Link>
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors duration-300 h-full">
                <CardContent className="p-6 space-y-4 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-light text-white">Follow & engage</h3>
                    <p className="text-white/60 text-sm font-light leading-relaxed">
                      Live reels, comment threads, DMs open. Let me know where to fly next.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="bg-white text-black hover:bg-white/90 font-light h-9 px-4">
                      <Link href="https://www.instagram.com/infinity_wanderlust/" target="_blank" rel="noreferrer">Instagram</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light h-9 px-4">
                      <Link href="https://www.tiktok.com/@infinity_wanderlust" target="_blank" rel="noreferrer">TikTok</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors duration-300 h-full">
                <CardContent className="p-6 space-y-4 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-light text-white">Share your story</h3>
                    <p className="text-white/60 text-sm font-light leading-relaxed">
                      Write reviews, drop photos, add tips. Your memories help the next traveler move.
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-white text-black hover:bg-white/90 font-light h-9 px-4 w-fit">
                    <Link href="/reviews">Start writing</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors duration-300 h-full">
                <CardContent className="p-6 space-y-4 h-full flex flex-col">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-light text-white">Plan together</h3>
                    <p className="text-white/60 text-sm font-light leading-relaxed">
                      Need a custom itinerary or want to join a hosted trip? Let's build it side-by-side.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="bg-white text-black hover:bg-white/90 font-light h-9 px-4">
                      <Link href="/contact">Contact</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light h-9 px-4">
                      <Link href="/events">See trips</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Section */}
      <section className="py-30 bg-white/2">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h2 className="text-5xl md:text-6xl font-light text-white leading-tight">Follow the journey</h2>
                <p className="text-lg text-white/60 font-light mt-3 max-w-2xl">
                  Daily reels, live stories, and behind-the-scenes clips. See it as it happens.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-white text-black hover:bg-white/90 font-light px-8"
                >
                  <Link
                    href="https://www.instagram.com/infinity_wanderlust/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light px-8"
                >
                  <Link
                    href="https://www.tiktok.com/@infinity_wanderlust"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    TikTok
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-[2fr_1fr] gap-8 items-stretch">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-xl min-h-[360px]">
                <InstagramFeed />
              </div>

              <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/15 min-h-[360px]">
                <Image
                  src="/images/glow_red.jpg"
                  alt="TikTok teaser"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/55 to-black/20" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                      <Play className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-sm uppercase tracking-wide text-white/70">TikTok Spotlight</div>
                      <div className="text-xl font-light">Behind-the-scenes reels</div>
                    </div>
                  </div>
                  <p className="text-white/70 font-light mb-4">
                    Quick cuts from flights, markets, sunsets, and candid moments you won't see elsewhere.
                  </p>
                  <Button
                    asChild
                    className="bg-white text-black hover:bg-white/90 font-light w-fit"
                  >
                    <Link
                      href="https://www.tiktok.com/@infinity_wanderlust"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Watch on TikTok
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Highlights */}
      {!isLoadingArticles && latestArticle && (
        <section className="py-28 bg-white/2">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-5xl space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="space-y-3">
                  <h2 className="text-5xl md:text-6xl font-light text-white leading-tight">Latest blog</h2>
                  <p className="text-white/65 font-light text-lg max-w-3xl">
                    Deep dives, itineraries, and long-form stories—her main focus. Catch up on the newest post before you plan.
                  </p>
                </div>
                <Button asChild className="bg-white text-black hover:bg-white/90 font-light">
                  <Link href="/articles">Read the blog</Link>
                </Button>
              </div>

              <Card className="bg-white/5 border-white/10 hover:bg-white/8 transition-colors duration-300 overflow-hidden">
                {latestArticle.photos && (Array.isArray(latestArticle.photos) ? latestArticle.photos.length > 0 : latestArticle.photos) && (
                  <div className="relative h-64 w-full overflow-hidden">
                    <ImageCollage
                      images={
                        Array.isArray(latestArticle.photos)
                          ? latestArticle.photos.map((photo: string) => {
                              if (typeof latestArticle.collectionId === 'string' && typeof latestArticle.id === 'string') {
                                return `https://remain-faceghost.pockethost.io/api/files/${latestArticle.collectionId}/${latestArticle.id}/${photo}`
                              }
                              return photo
                            })
                          : []
                      }
                      alt={latestArticle.destination || 'Blog featured image'}
                    />
                  </div>
                )}
                <CardContent className="p-8 space-y-4">
                  <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm font-light">
                    <span className="bg-white/10 px-3 py-1 rounded-full">Featured</span>
                    <span>Stories • Community • Tips</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-light text-white">{latestArticle.destination}</h3>
                  <p className="text-white/70 font-light leading-relaxed">
                    {latestArticle.review_text && latestArticle.review_text.length > 250
                      ? latestArticle.review_text.substring(0, 250) + '...'
                      : latestArticle.review_text}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-white/50 font-light">
                    <span>
                      {new Date(latestArticle.created).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="w-px h-4 bg-white/15" />
                    <Link href={`/articles/${latestArticle.id}`} className="underline underline-offset-4 decoration-white/40 hover:text-white">Read full article</Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      )}

      {/* Stories, Why Follow, Community Destinations (ordered after Social) */}
      <section className="py-28 bg-gradient-to-b from-black/70 via-black/65 to-black/80">
        <div className="container space-y-20">
          {!isLoading && latestReviews?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <h2 className="text-5xl md:text-6xl font-light text-white leading-tight">Recent stories</h2>
                <Button
                  variant="outline"
                  className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light"
                  asChild
                >
                  <Link href="/reviews" className="flex items-center gap-2">
                    View all stories
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {latestReviews.map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial="hidden"
                    whileInView="visible"
                    variants={cardVariants}
                    custom={i}
                  >
                    <Link href={`/reviews/${review.id}`}>
                      <Card className="bg-white/5 border-white/10 hover:bg-white/8 transition-all duration-300 cursor-pointer h-full">
                        <CardContent className="p-8 space-y-6 h-full flex flex-col">
                          <div className="flex items-start gap-4 flex-1">
                            <Avatar className="h-10 w-10 flex-shrink-0">
                              <AvatarImage src={review.authorAvatar ?? undefined} />
                              <AvatarFallback>
                                {review.authorName?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-light text-white text-sm">{review.authorName}</h3>
                              <p className="text-xs text-white/50 mt-1">{review.destination}</p>
                            </div>
                          </div>

                          <p className="text-white/70 font-light leading-relaxed line-clamp-3 text-sm">
                            {review.review_text}
                          </p>

                          <div className="flex gap-1">
                            {Array.from({ length: Math.min(review.rating, 5) }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-white text-white" />
                            ))}
                          </div>

                          <span className="text-xs text-white/40 mt-auto">
                            {review.formattedDate}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-5xl md:text-6xl font-light text-white mb-14 leading-tight">
              Why follow <br /> this journey
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
              <Card className="bg-white/5 border-white/10 backdrop-blur p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-light text-white">Authentic Stories</h3>
                <p className="text-white/70 font-light leading-relaxed">
                  Unfiltered moments, close-up interviews, and raw field notes so you feel the ground under every step.
                </p>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-light text-white">Cultural Depth</h3>
                <p className="text-white/70 font-light leading-relaxed">
                  Markets, rituals, kitchens, and conversations—stories built with locals, not just about them.
                </p>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur p-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-light text-white">Join Adventures</h3>
                <p className="text-white/70 font-light leading-relaxed">
                  Hosted trips and meetups where the community hikes, eats, and creates new reels together.
                </p>
              </Card>
            </div>
          </motion.div>

          {!isLoading && reviews?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h2 className="text-5xl md:text-6xl font-light text-white leading-tight">
                    Community destinations
                  </h2>
                  <p className="text-white/65 font-light mt-3 max-w-2xl">
                    A living stream of spots loved by you and by me—fresh reviews, shared itineraries, and places our crew keeps returning to.
                  </p>
                </div>
                <Button asChild variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/5 font-light">
                  <Link href="/reviews">Add your destination</Link>
                </Button>
              </div>

              <div className="relative">
                <div
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto pb-4 gap-3 hide-scrollbar snap-x snap-mandatory"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {isLoading
                    ? Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={`skeleton-${index}`}
                          className="min-w-[280px] md:min-w-[320px] flex-shrink-0 snap-start"
                        >
                          <Skeleton className="h-96 w-full rounded-2xl" />
                        </div>
                      ))
                    : reviews.map((review: any, index: number) => (
                        <motion.div
                          key={review.id}
                          initial="hidden"
                          whileInView="visible"
                          variants={cardVariants}
                          custom={index}
                          className="min-w-[260px] md:min-w-[300px] flex-shrink-0 snap-start"
                        >
                          <Link href={`/reviews/${review.id}`}>
                            <div className="group cursor-pointer space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-lg text-white font-light">{review.destination}</h3>
                                  <p className="text-xs text-white/50">by {review.authorName}</p>
                                </div>
                                <div className="flex gap-1">
                                  {Array.from({ length: Math.min(review.rating, 5) }).map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-white text-white" />
                                  ))}
                                </div>
                              </div>

                              <div className="relative h-80 overflow-hidden rounded-2xl">
                                <ImageCollage
                                  images={
                                    Array.isArray(review.photos)
                                      ? review.photos.map((photo: string, idx: number) =>
                                          getReviewImageUrl(review, idx)
                                        )
                                      : []
                                  }
                                  alt={review.destination}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                </div>

                {canScrollRight && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -right-6 top-1/3 text-white hover:bg-white/10"
                    onClick={scrollRight}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/explore.jpg"
            alt="Join the adventure"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/75" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl"
          >
            <h2 className="text-5xl md:text-7xl font-light text-white mb-8 leading-tight">
              Ready to wander?
            </h2>

            <p className="text-lg text-white/70 font-light mb-10 max-w-2xl leading-relaxed">
              Start your own adventure. Discover destinations through authentic stories and connect with fellow travelers.
            </p>

            <Button
              size="lg"
              className="bg-white text-black hover:bg-white/90 font-light px-10"
              asChild
            >
              <Link href="/reviews" className="flex items-center gap-2">
                Explore now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* About Preview Section - Only on homepage for sitelinks */}
      <AboutPreview />
    </div>
  )
}

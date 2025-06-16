"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Star,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useTranslation } from "@/lib/translations";
import { ImageCollage } from "@/components/image-collage";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useQuery,
} from "@tanstack/react-query";
import { useReviews } from "@/hooks/useReviews";
import { useEvents } from "@/hooks/useEvents";

export default function HomePage() {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const baseUrl = "https://remain-faceghost.pockethost.io/api/files/_pb_users_auth_"

  const { data: reviews, isLoading, isError } = useReviews(1)
  const { data: events, isLoading: isLoadingEvents } = useEvents(1);
  const upcomingEvents = events?.filter((event: any) => {
    const now = new Date();
    return new Date(event.start_date) > now;
  });

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollPosition);
      checkScrollPosition();

      return () => {
        scrollContainer.removeEventListener("scroll", checkScrollPosition);
      };
    }
  }, [reviews]);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" });
  };

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
  };

  const getEventImageUrl = (event: any): string => {
    if (event.imageUrl) return event.imageUrl
    if (event.images?.length) {
      return `https://remain-faceghost.pockethost.io/api/files/${event.collectionId}/${event.id}/${event.images[0]}`
    }
    return "/placeholder.svg"
  }

  const getReviewImageUrl = (review: any, photoIndex: number): string => {
    console.log("review:", review);
    if (review.photos && review.photos.length > 0) {
      const imageUrl = `https://remain-faceghost.pockethost.io/api/files/${review.collectionId}/${review.id}/${review.photos[photoIndex]}`;
      console.log("getReviewImageUrl:", imageUrl);
      return imageUrl;
    }
    return "/placeholder.svg";
  };

  console.log("Featured Destinations:", reviews);

  // Get the latest 6 reviews (or fewer if not enough)
  const latestReviews = Array.isArray(reviews) ? reviews.slice(0, 6) : [];

  return (
    <>
      {/* Hero Section with Rainforest Sunset Background */}
      <section className="homepage-section-1 relative py-24 md:py-32">
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {t("heroTitle")}
            </h1>
            <p className="text-xl text-white/90 mb-8">{t("heroSubtitle")}</p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/gallery">{t("exploreButton")}</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 text-white border-white/30 hover:bg-white/20"
              >
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
            <h2 className="text-3xl font-bold text-white">
              {t("featuredDestinations")}
            </h2>
            <Button
              variant="ghost"
              asChild
              className="text-white hover:text-white/80"
            >
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
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="min-w-[300px] md:min-w-[350px] lg:min-w-[400px] flex-shrink-0 px-3 snap-start"
                  >
                    <Card className="bg-background/90 backdrop-blur-sm">
                      <Skeleton className="h-64 w-full" />
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16 mt-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : reviews?.length === 0 && isError ? (
                <div className="w-full text-center py-10">
                  <p className="text-white text-lg">
                    No featured destinations found. Be the first to share your photos!
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/reviews/">Share Your Photos</Link>
                  </Button>
                </div>
              ) : (
                reviews?.map((review) => (
                  <motion.div
                    key={review.id}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    className="min-w-[300px] md:min-w-[350px] lg:min-w-[400px] flex-shrink-0 px-3 snap-start"
                  >
                    <Card className="bg-transparent hover:bg-gradient-to-br hover:from-green-900/90 hover:via-green-800/90 hover:to-green-700/90 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg max-w-[350px] min-w-[320px] w-full mx-auto transition-colors duration-300">
                      {review.photos && review.photos.length > 0 && (
                        <div className="relative">
                          <ImageCollage
                            images={
                              Array.isArray(review.photos)
                                ? review.photos.map((photo: string, idx: number) => getReviewImageUrl(review, idx))
                                : []
                            }
                            alt={review.destination}
                          />
                          {/* Top overlays */}
                          <div className="absolute top-3 left-3 flex items-center z-10">
                            {/* Avatar */}
                            <Avatar className="h-10 w-10 border-2 border-green-300/60 shadow-lg bg-green-900/80">
                              <AvatarImage src={review.authorAvatar ?? undefined} />
                              <AvatarFallback>{review.authorName?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            {/* Destination pill */}
                            <span className="ml-2 bg-transparent text-white-100 text-xs font-semibold px-3 py-1 backdrop-blur-sm rounded-full shadow border border-green-500/40">
                              {review.destination}
                            </span>
                          </div>
                          {/* Rating badge top-right */}
                          <div className="absolute top-3 right-3 z-10">
                            <div className="bg-yellow-400/90 rounded-full px-3 py-1 flex items-center shadow">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 mr-1" />
                              <span className="text-sm font-bold text-gray-900">{review.rating}</span>
                            </div>
                          </div>
                          {/* Optional: dark overlay for better text contrast */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none rounded-xl" />
                        </div>
                      )}
                      {/* CTA below image, visually outside card */}
                      <div className="flex justify-center">
                        <Link href={`/reviews/${review.id}`}>
                          <span
                            className={` block w-fit italic text-green-200 bg-transparent hover:bg-green-900/90 active:bg-green-900 hover:text-green-50 transition rounded-lg px-4 py-2 cursor-pointer whitespace-normal break-words shadow-lg backdrop-blur-smborder border-green-900/10 -mt-8z-20`}
                            style={{
                              backgroundColor: "transparent",
                              fontStyle: "italic",
                              boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
                              position: "relative",
                            }}
                          >
                            Read more about {review.destination} as reviewed by {review.authorName}
                          </span>
                        </Link>
                      </div>
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
            <h2 className="text-3xl font-bold text-white">
              {t("upcomingEvents")}
            </h2>
            <Button
              variant="ghost"
              asChild
              className="text-white hover:text-white/80"
            >
              <Link href="/events" className="flex items-center">
                {t("viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingEvents ? (
              // Loading skeletons
              Array.from({ length: 2 }).map((_, index) => (
                <Card
                  key={`event-skeleton-${index}`}
                  className="overflow-hidden bg-background/90 backdrop-blur-sm"
                >
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
            ) : (upcomingEvents ?? []).length === 0 ? (
              <div className="col-span-2 text-center py-10">
                <p className="text-white text-lg">No upcoming events found.</p>
                <Button asChild className="mt-4">
                  <Link href="/create-event">Create an Event</Link>
                </Button>
              </div>
            ) : (
              (upcomingEvents ?? []).map((event) => (
<Card 
  key={event.id}
  className="overflow-hidden rounded-2xl shadow-md bg-transparent backdrop-blur-sm transition-colors duration-300 hover:bg-green-500/20"
>
  {/* Image with Overlays */}
  <div className="relative w-full aspect-[3/2] overflow-hidden">
    <Image
      src={
        getEventImageUrl(event) || "/placeholder.svg?height=400&width=600"
      }
      alt={event.title}
      fill
      className="object-cover object-center transition-transform duration-300 hover:scale-105"
    />

    {/* Top-left Location */}
    <div className="absolute top-3 left-3 bg-background/80 text-sm px-3 py-1 rounded-full shadow-md flex items-center gap-1 text-muted-foreground">
      <MapPin className="h-4 w-4" />
      {event.destination}
    </div>

    {/* Top-right Spots Left */}
    <div className="absolute top-3 right-3">
      <Badge variant="outline" className="bg-primary/50 text-white shadow-md">
        {event.spots_left} spots left
      </Badge>
    </div>

    {/* Bottom-center Book Button */}
    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
      <Button
        asChild
        size="sm"
        className="rounded-full px-5 shadow-lg backdrop-blur bg-green-500/50 hover:bg-green-500 transition-colors"
      >
        <Link href={`/events/${event.id}`}>{t("bookNow")}</Link>
      </Button>
    </div>
  </div>

  {/* Content */}
  <CardContent className="p-4 pt-5 space-y-2">
    <h3 className="text-lg font-semibold">{event.title}</h3>

    <div className="flex items-center text-sm text-muted-foreground gap-1">
      <Calendar className="h-4 w-4" />
      {new Date(event.start_date).toLocaleDateString()} -{" "}
      {new Date(event.end_date).toLocaleDateString()}
    </div>

    {/* Days left */}
    <div className="text-sm text-white font-medium">
      {
        (() => {
          const today = new Date();
          const start = new Date(event.start_date);
          const timeDiff = start.getTime() - today.getTime();
          const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          return daysLeft > 0
            ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} to event`
            : "Event has started or passed";
        })()
      }
    </div>
  </CardContent>
</Card>


              ))
            )}
          </div>
        </div>
      </section>
      {/* Latest Reviews */}
      {/* Latest Reviews Section */}
      <section className="homepage-section-4 py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-white">{t("latestReviews")}</h2>
            <Button variant="ghost" asChild className="text-white hover:text-white/80">
              <Link href="/reviews" className="flex items-center">
                {t("viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card
                  key={`loading-review-${i}`}
                  className="bg-background/80 backdrop-blur-sm p-4"
                >
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <div className="flex items-center gap-3 mt-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))
            ) : latestReviews?.length === 0 ? (
              <div className="col-span-full text-center py-10">
                <p className="text-white text-lg">
                  No recent reviews. Be the first to share your experience!
                </p>
                <Button asChild className="mt-4">
                  <Link href="/reviews/">Write a Review</Link>
                </Button>
              </div>
            ) : (
              latestReviews.map((review, i) => {
                return (
                  <motion.div
                    key={review.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                  >

                    <Card className="bg-background/80 backdrop-blur-sm p-4 hover:shadow-xl transition-shadow rounded-lg">
                      <div className="flex items-center mb-4">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <Avatar className="h-12 w-12 border-2 border-white/20 shadow-md">
                            <AvatarImage
                              src={review.authorAvatar ?? undefined}
                              className="object-cover h-12 w-12 rounded-full"
                            />
                            <AvatarFallback className="h-12 w-12 flex items-center justify-center text-lg bg-muted rounded-full">
                              {review.authorName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        {/* Author & meta */}
                        <div className="ml-4 flex flex-col justify-center">
                          <h3 className="font-semibold text-white leading-tight">{review.authorName}</h3>
                          {review.destination && (
                            <span className="inline-block bg-white-100/10 text-white-300 text-xs px-2 py-0.5 rounded-full mt-1 mb-0.5 w-fit">
                              {review.destination}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground mt-0.5">{review.formattedDate}</span>
                        </div>
                        {/* Stars */}
                        <div className="ml-auto flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground line-clamp-3 mb-1">
                        “{review.review_text}”
                      </p>
                      <Button variant="link" asChild className="mt-2 px-0 text-white hover:text-white/80">
                        <Link href={`/reviews`}>{t("readMore")}</Link>
                      </Button>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

    </>
  );
}
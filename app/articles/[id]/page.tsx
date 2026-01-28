"use client"
export const runtime = 'edge'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/translations"
import { useAuth } from "@/components/auth-provider"
import { ImageCollage } from "@/components/image-collage";
import {
  Star,
  MapPin,
  Calendar,
  Heart,
  MessageSquare,
  Share2,
  ArrowLeft,
  ChevronRight,
  Camera,
  User,
  Bookmark,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReviews } from "@/hooks/useReviews"
import { useQueryClient } from "@tanstack/react-query"

export default function ReviewDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()

  const [review, setReview] = useState<any>(null)
  const [relatedReviews, setRelatedReviews] = useState<any[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  const { data: reviewsData, isLoading, isError } = useReviews({
    page: 1,
    perPage: 10,
    enabled: true
  })
  const reviews = reviewsData?.items || []

  // Load review and related reviews when data is available
  useEffect(() => {
    if (reviews && id) {
      const foundReview = reviews.find((review: any) => review.id === id) || null
      if (foundReview) {
        setReview(foundReview)
        setRelatedReviews(reviews.filter((r: any) => r.id !== id).slice(0, 3)) // Limit to 3 related reviews
      } else if (!isLoading) {
        // If review not found and not loading, redirect to articles page
        router.push('/articles')
      }
    }
  }, [reviews, id, isLoading, router])

  // Handle like action
  const handleLike = () => {
    setIsLiked(!isLiked)
    if (!isLiked) {
      setReview({
        ...review,
        likes_count: review.likes_count + 1,
      })
    } else {
      setReview({
        ...review,
        likes_count: Math.max(0, review.likes_count - 1),
      })
    }
  }

  // Handle bookmark action
  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8 md:py-12">
          <div className="mb-8">
            <Skeleton className="h-8 w-40" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-[400px] w-full rounded-lg mb-6" />
              <div className="flex items-center mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="ml-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <div>
              <Skeleton className="h-[200px] w-full rounded-lg mb-4" />
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !review) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-muted p-8 rounded-lg">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Review Not Found</h2>
              <p className="text-muted-foreground mb-6">
                {isError || "This review doesn't exist or may have been removed."}
              </p>
              <Button asChild>
                <Link href="/articles">Browse Aticles</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getReviewImageUrl = (review: any, photoIndex: number = 0): string => {
    try {
      if (!review) return "/placeholder.svg";
      
      // Handle case where photos is a string (JSON)
      let photosArray: string[] = [];
      if (typeof review.photos === 'string') {
        try {
          photosArray = JSON.parse(review.photos);
          if (!Array.isArray(photosArray)) photosArray = [];
        } catch (e) {
          console.error('Error parsing photos JSON:', e);
          photosArray = [];
        }
      } else if (Array.isArray(review.photos)) {
        photosArray = review.photos;
      }

      // If we have valid photos
      if (photosArray.length > 0 && photosArray[photoIndex]) {
        const photo = photosArray[photoIndex];
        if (typeof photo !== 'string') return "/placeholder.svg";
        
        // If it's already a full URL, return it as is
        if (photo.startsWith('http')) return photo;
        
        // Otherwise, construct the URL
        return `https://remain-faceghost.pockethost.io/api/files/${review.collectionId || 'reviews'}/${review.id}/${photo}`;
      }
      
      // Fallback to placeholder if no valid photo found
      return "/placeholder.svg";
    } catch (error) {
      console.error('Error in getReviewImageUrl:', error);
      return "/placeholder.svg";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 md:py-12">
        {/* Breadcrumb navigation */}
        <div className="flex items-center mb-8 text-sm">
          <Button variant="ghost" size="sm" className="p-0 h-auto" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
          <Link href="/articles" className="text-muted-foreground hover:text-foreground">
            Articles
          </Link>
          <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
          <span className="font-medium truncate max-w-[200px]">{review.destination}</span>
        </div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main content */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Card>
              <CardContent className="p-6 md:p-8">
                {/* Author info */}
                <div className="flex items-center mb-6">
                  <Avatar className="h-12 w-12 border">
                    <AvatarImage src={review.authorAvatar || ""} alt={review.authorName} />
                    <AvatarFallback>{review.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="font-medium">{review.authorName}</div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {review.formattedDate}
                    </div>
                  </div>
                </div>

                {/* Review content */}
                <h2 className="text-2xl font-bold mb-4">My experience in {review.destination}</h2>

                <div className="space-y-4 mb-6">
                  {review.review_text.split("\n\n").map((paragraph: string, i: number) => (
                    <p key={i} className="text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Photo gallery */}
                {review.photoUrl && (
                  <div className="mb-6">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={review.photoUrl || "/placeholder.svg"}
                        alt={`Photo of ${review.destination}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center">
                        <Camera className="h-3 w-3 mr-1" />
                        Photo by {review.authorName}
                      </div>
                    </div>
                  </div>
                )}

                {/* Review metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {review.destination}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {review.formattedDate}
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                    {review.rating}/5 rating
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                    className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-white" : ""}`} />
                    {isLiked ? "Liked" : "Like"} ({review.likes_count})
                  </Button>

                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/articles?destination=${encodeURIComponent(review.destination)}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comments ({review.comments_count})
                    </Link>
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleBookmark}>
                    <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                    {isBookmarked ? "Saved" : "Save"}
                  </Button>

                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={itemVariants}>
            {/* Destination info */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-4">About {review.destination}</h3>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Discover more about this amazing destination and plan your next adventure to {review.destination}.
                  </p>

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
                      {/* Optional: dark overlay for better text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none rounded-xl" />
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <div className="font-medium">Average Rating</div>
                      <div className="flex mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                              }`}
                          />
                        ))}
                      </div>
                    </div>

                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {relatedReviews.length + 1} Reviews
                    </Badge>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/articles?destination=${encodeURIComponent(review.destination)}`}>Read all my articles</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related articles */}
            {relatedReviews.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">More Articles of {review.destination}</h3>
                  <div className="space-y-4">
                    {relatedReviews.map((relatedReview, index) => (
                      <Link key={relatedReview.id} href={`/articles/${relatedReview.id}`} className="block">
                        <div className="flex items-start gap-3 group">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={relatedReview.authorAvatar || ""} alt={relatedReview.authorName} />
                            <AvatarFallback>{relatedReview.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                {relatedReview.authorName}
                              </div>
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < relatedReview.rating
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-muted-foreground"
                                      }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {relatedReview.review_text}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                {relatedReview.likes_count}
                              </span>
                              <span className="flex items-center">
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {relatedReview.comments_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </motion.div>

        {/* Call to action */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to experience {review.destination}?</h3>
            <p className="text-muted-foreground mb-6">
              Join our community of travelers and share your own adventures or plan your next trip to this amazing
              destination.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/reviews/new">Write Your Review</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href={`/gallery?destination=${encodeURIComponent(review.destination)}`}>Explore Gallery</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

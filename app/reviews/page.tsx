"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, ThumbsUp, Calendar, MapPin, Camera } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/lib/translations"

export default function ReviewsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [destination, setDestination] = useState("")
  const [reviewImages, setReviewImages] = useState<string[]>([])

  // Sample reviews data
  const reviews = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "/placeholder.svg?height=100&width=100",
      destination: "Japan Tour",
      date: "March 10, 2025",
      rating: 5,
      content:
        "The Japan tour was absolutely incredible! Our guide was knowledgeable and the itinerary was perfect. We visited Tokyo, Kyoto, and Osaka, experiencing both modern city life and traditional Japanese culture. The accommodations were excellent and the food was amazing. Can't wait to travel with Infinity Wanderlust again!",
      images: ["/placeholder.svg?height=300&width=400", "/placeholder.svg?height=300&width=400"],
      likes: 42,
    },
    {
      id: 2,
      name: "Michael Chen",
      avatar: "/placeholder.svg?height=100&width=100",
      destination: "Peru Expedition",
      date: "February 22, 2025",
      rating: 4,
      content:
        "Machu Picchu was a dream come true. The local experiences arranged by Infinity Wanderlust made this trip special and authentic. We stayed with a local family in the Sacred Valley and learned about traditional weaving techniques. The hike along the Inca Trail was challenging but rewarding with breathtaking views. The only downside was that some parts of the trip felt a bit rushed.",
      images: ["/placeholder.svg?height=300&width=400"],
      likes: 28,
    },
    {
      id: 3,
      name: "Emma Wilson",
      avatar: "/placeholder.svg?height=100&width=100",
      destination: "Safari Adventure",
      date: "January 15, 2025",
      rating: 5,
      content:
        "The safari in Kenya exceeded all my expectations! We saw the Big Five within the first three days, and our guide was exceptional at spotting wildlife. The tented camps were luxurious yet authentic, and falling asleep to the sounds of the savanna was magical. The hot air balloon ride over the Maasai Mara at sunrise was the highlight of the trip. Highly recommend!",
      images: [
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
      ],
      likes: 56,
    },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map((file) => URL.createObjectURL(file))
      setReviewImages([...reviewImages, ...newImages])
    }
  }

  const handleSubmitReview = () => {
    // In a real app, you would submit the review to your backend
    console.log({
      rating,
      destination,
      content: reviewText,
      images: reviewImages,
    })

    // Reset form and close dialog
    setRating(0)
    setDestination("")
    setReviewText("")
    setReviewImages([])
    setReviewDialogOpen(false)
  }

  return (
    <>
      <Navbar />

      <div className="container py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("reviewsTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("reviewsSubtitle")}</p>

          <div className="mt-8">
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" disabled={!user}>
                  {t("writeReview")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{t("writeReview")}</DialogTitle>
                  <DialogDescription>Share your travel experience with the community</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="destination">{t("destination")}</Label>
                    <Input
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Bali, Indonesia"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                          <Star
                            className={`h-6 w-6 ${
                              star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review">Your Review</Label>
                    <Textarea
                      id="review"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience..."
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add Photos</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {reviewImages.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={`Review image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                            onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== index))}
                          >
                            <span className="sr-only">Remove</span>
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
                              className="text-white"
                            >
                              <path d="M18 6 6 18" />
                              <path d="m6 6 12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {reviewImages.length < 5 && (
                        <label
                          htmlFor="image-upload"
                          className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Add Photo</span>
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={handleImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setReviewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleSubmitReview} disabled={!rating || !destination || !reviewText}>
                    Submit Review
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full mb-8">
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-3">
            <TabsTrigger value="all">All Reviews</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="top">Top Rated</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-8">
          {reviews.map((review) => (
            <Card key={review.id} className="overflow-hidden">
              <CardHeader className="flex flex-row items-start gap-4">
                <Image
                  src={review.avatar || "/placeholder.svg"}
                  alt={review.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <CardTitle className="text-lg">{review.name}</CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {review.destination}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {review.date}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{review.content}</p>

                {review.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {review.images.map((img, index) => (
                      <div key={index} className="relative aspect-video rounded-md overflow-hidden">
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`${review.name}'s travel photo ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  <span>{review.likes}</span>
                </Button>
                <Button variant="ghost" size="sm">
                  Reply
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </>
  )
}


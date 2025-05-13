import { getPocketBase } from "@/lib/pocketbase"

export type FeaturedDestination = {
  name: string
  description: string
  images: string[]
  rating: number
  reviewCount: number
  topReviewId: string
}

// Function to fetch featured destinations based on reviews
export async function fetchFeaturedDestinations(limit = 10): Promise<FeaturedDestination[]> {
  try {
    const pb = getPocketBase()
    if (!pb) throw new Error("Failed to connect to PocketBase")

    // Disable auto-cancellation for this request
    const options = {
      $autoCancel: false,
    }

    // First, get all unique destinations with their average ratings
    const destinations = await pb.collection("reviews").getList(1, 200, {
      fields: "destination,rating",
      sort: "-rating",
      ...options,
    })

    // Group by destination and calculate average rating
    const destinationMap = new Map<string, { totalRating: number; count: number }>()

    destinations.items.forEach((review: any) => {
      if (!destinationMap.has(review.destination)) {
        destinationMap.set(review.destination, { totalRating: 0, count: 0 })
      }

      const dest = destinationMap.get(review.destination)!
      dest.totalRating += review.rating
      dest.count += 1
    })

    // Convert to array and sort by average rating
    const sortedDestinations = Array.from(destinationMap.entries())
      .map(([name, stats]) => ({
        name,
        avgRating: stats.totalRating / stats.count,
        reviewCount: stats.count,
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, limit)

    // Now fetch details for each top destination
    const featuredDestinations: FeaturedDestination[] = []

    for (const dest of sortedDestinations) {
      try {
        const pb = getPocketBase()
        if (!pb) throw new Error("Failed to connect to PocketBase")

        // Get reviews for this destination to extract images and a description
        const reviews = await pb.collection("reviews").getList(1, 5, {
          filter: `destination = "${dest.name}"`,
          sort: "-rating",
          ...options,
        })

        // Extract images from all reviews
        const images: string[] = []
        reviews.items.forEach((review: any) => {
          if (review.photo) {
            const photoUrl = `https://remain-faceghost.pockethost.io/api/files/${review.collectionId}/${review.id}/${review.photo}`
            images.push(photoUrl)
          }
        })

        // Use the highest rated review's text as the description and store its ID
        let description = ""
        let topReviewId = ""

        if (reviews.items.length > 0) {
          const topReview = reviews.items[0] as any
          topReviewId = topReview.id
          // Extract a short description from the review text
          description =
            topReview.review_text && topReview.review_text.length > 120
              ? topReview.review_text.substring(0, 120) + "..."
              : topReview.review_text || ""
        }

        // If no images were found, use a placeholder
        if (images.length === 0) {
          images.push(`/placeholder.svg?height=400&width=600&text=${encodeURIComponent(dest.name)}`)
        }

        featuredDestinations.push({
          name: dest.name,
          description,
          images,
          rating: Number.parseFloat(dest.avgRating.toFixed(1)),
          reviewCount: dest.reviewCount,
          topReviewId,
        })
      } catch (error) {
        console.error(`Error fetching details for destination ${dest.name}:`, error)
        // Continue with the next destination
      }
    }

    return featuredDestinations
  } catch (error) {
    console.error("Error fetching featured destinations:", error)
    return []
  }
}

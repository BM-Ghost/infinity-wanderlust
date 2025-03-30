import { getPocketBase } from "@/lib/pocketbase"

export type Review = {
  id: string
  created: string
  updated: string
  photos: string | null
  reviewer: string
  destination: string
  rating: number
  review_text: string
  tagged_users: string[]
  likes_count: number
  comments_count: number
  expand?: {
    reviewer?: {
      id: string
      username: string
      name?: string
      avatar?: string
      email: string
    }
    tagged_users?: Array<{
      id: string
      username: string
      name?: string
    }>
  }
}

export type ReviewWithAuthor = Review & {
  authorName: string
  authorAvatar: string | null
  photoUrl: string | null
  formattedDate: string
  hasLiked?: boolean
}

// Fetch reviews with pagination
export async function fetchReviews(
  page = 1,
  perPage = 10,
  sort = "-created",
  filter = "",
): Promise<{ items: ReviewWithAuthor[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase()

  try {
    const resultList = await pb.collection("reviews").getList(page, perPage, {
      sort,
      filter,
      expand: "reviewer,tagged_users",
    })

    const formattedReviews = resultList.items.map(formatReview)

    return {
      items: formattedReviews,
      totalItems: resultList.totalItems,
      totalPages: resultList.totalPages,
    }
  } catch (error) {
    console.error("Error fetching reviews:", error)
    // Return empty data instead of fallback data
    return { items: [], totalItems: 0, totalPages: 0 }
  }
}

// Fetch a single review by ID
export async function fetchReviewById(id: string): Promise<ReviewWithAuthor | null> {
  const pb = getPocketBase()

  try {
    const record = await pb.collection("reviews").getOne(id, {
      expand: "reviewer,tagged_users",
    })

    return formatReview(record)
  } catch (error) {
    console.error(`Error fetching review with ID ${id}:`, error)
    return null
  }
}

// Create a new review - requires authentication
export async function createReview(
  data: {
    destination: string
    rating: number
    review_text: string
    tagged_users?: string[]
  },
  photos?: File[],
): Promise<ReviewWithAuthor | null> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to create a review")
  }

  try {
    const formData = new FormData()
    formData.append("destination", data.destination)
    formData.append("rating", data.rating.toString())
    formData.append("review_text", data.review_text)
    formData.append("reviewer", pb.authStore.model?.id)

    if (data.tagged_users && data.tagged_users.length > 0) {
      data.tagged_users.forEach((userId) => {
        formData.append("tagged_users", userId)
      })
    }

    if (photos && photos.length > 0) {
      // PocketBase supports multiple files for a single field
      photos.forEach((photo) => {
        formData.append("photos", photo)
      })
    }

    const record = await pb.collection("reviews").create(formData, {
      expand: "reviewer,tagged_users",
    })

    return formatReview(record)
  } catch (error: any) {
    console.error("Error creating review:", error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to create reviews. Please sign in first.")
    }

    throw new Error(error.message || "Failed to create review. Please try again.")
  }
}

// Update an existing review - requires authentication and ownership
export async function updateReview(
  id: string,
  data: {
    destination?: string
    rating?: number
    review_text?: string
    tagged_users?: string[]
  },
  photos?: File[],
): Promise<ReviewWithAuthor | null> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to update a review")
  }

  try {
    // First check if the user owns this review
    const existingReview = await pb.collection("reviews").getOne(id)
    if (existingReview.reviewer !== pb.authStore.model?.id) {
      throw new Error("You can only edit your own reviews")
    }

    const formData = new FormData()

    if (data.destination) formData.append("destination", data.destination)
    if (data.rating) formData.append("rating", data.rating.toString())
    if (data.review_text) formData.append("review_text", data.review_text)

    if (data.tagged_users) {
      data.tagged_users.forEach((userId) => {
        formData.append("tagged_users", userId)
      })
    }

    if (photos && photos.length > 0) {
      photos.forEach((photo) => {
        formData.append("photos", photo)
      })
    }

    const record = await pb.collection("reviews").update(id, formData, {
      expand: "reviewer,tagged_users",
    })

    return formatReview(record)
  } catch (error: any) {
    console.error(`Error updating review with ID ${id}:`, error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to update this review")
    }

    throw new Error(error.message || "Failed to update review. Please try again.")
  }
}

// Delete a review - requires authentication and ownership
export async function deleteReview(id: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to delete a review")
  }

  try {
    // First check if the user owns this review
    const existingReview = await pb.collection("reviews").getOne(id)
    if (existingReview.reviewer !== pb.authStore.model?.id) {
      throw new Error("You can only delete your own reviews")
    }

    await pb.collection("reviews").delete(id)
    return true
  } catch (error: any) {
    console.error(`Error deleting review with ID ${id}:`, error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to delete this review")
    }

    throw new Error(error.message || "Failed to delete review. Please try again.")
  }
}

// Add a function to like a review
export async function likeReview(reviewId: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to like a review")
  }

  try {
    const review = await pb.collection("reviews").getOne(reviewId)
    const likesCount = (review.likes_count || 0) + 1

    await pb.collection("reviews").update(reviewId, { likes_count: likesCount })
    return true
  } catch (error) {
    console.error("Error liking review:", error)
    return false
  }
}

// Update the comments count of a review
export async function updateReviewCommentsCount(reviewId: string, increment = 1): Promise<boolean> {
  const pb = getPocketBase()

  try {
    const review = await pb.collection("reviews").getOne(reviewId)
    const commentsCount = (review.comments_count || 0) + increment

    await pb.collection("reviews").update(reviewId, { comments_count: Math.max(0, commentsCount) })
    return true
  } catch (error) {
    console.error("Error updating comments count:", error)
    return false
  }
}

// Helper function to format a review record
function formatReview(record: any): ReviewWithAuthor {
  const baseUrl = "https://remain-faceghost.pockethost.io/api/files/"

  // Format the date
  const date = new Date(record.created)
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Get author info
  let authorName = "Unknown User"
  let authorAvatar = null

  if (record.expand?.reviewer) {
    authorName = record.expand.reviewer.name || record.expand.reviewer.username
    if (record.expand.reviewer.avatar) {
      authorAvatar = `${baseUrl}${record.expand.reviewer.collectionId}/${record.expand.reviewer.id}/${record.expand.reviewer.avatar}`
    }
  }

  // Get photo URL
  let photoUrl = null
  if (record.photos) {
    photoUrl = `${baseUrl}${record.collectionId}/${record.id}/${record.photos}`
  }

  return {
    ...record,
    authorName,
    authorAvatar,
    photoUrl,
    formattedDate,
    likes_count: record.likes_count || 0,
    comments_count: record.comments_count || 0,
  }
}


import { getPocketBase } from "@/lib/pocketbase"
import { useQuery } from "@tanstack/react-query"

export type Review = {
  id: string
  created: string
  updated: string
  destination: string
  rating: number
  review_text: string
  reviewer: string
  photos?: string
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
  }
}

export type ReviewWithAuthor = Review & {
  authorName: string
  authorAvatar: string | null
  formattedDate: string
  photoUrl: string | null
}

// Update the fetchReviews function to handle auto-cancellation properly and properly expand relations
export async function fetchReviews(
  page = 1,
  perPage = 10,
  sort = "-created",
  filter = "",
): Promise<{ items: ReviewWithAuthor[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase()
  if (!pb) throw new Error("Failed to connect to PocketBase")

  try {
    // Add proper error handling for authentication
    if (filter.includes("reviewer =") && !pb?.authStore?.isValid) {
      console.log("User not authenticated but trying to fetch their reviews")
      return { items: [], totalItems: 0, totalPages: 0 }
    }

    // Create a custom options object with a unique AbortController signal
    const options = {
      signal: new AbortController().signal,
      $autoCancel: false, // Disable auto-cancellation for this specific request
    }

    // Explicitly request the reviewer expansion
    const resultList = await pb.collection("reviews").getList(page, perPage, {
      sort,
      filter,
      expand: "reviewer", // Make sure reviewer relation is expanded
      ...options,
    })

    // Debug: Log the first item to see its structure
    if (resultList.items.length > 0) {
      console.log("First review item:", JSON.stringify(resultList.items[0], null, 2))
      console.log("Reviewer data:", resultList.items[0].expand?.reviewer)
    }

    // Format reviews
    const formattedReviews = resultList.items.map(formatReview)

    return {
      items: formattedReviews,
      totalItems: resultList.totalItems,
      totalPages: resultList.totalPages,
    }
  } catch (error: any) {
    // Check if this is an auto-cancellation error
    if (error.name === "AbortError" || error.message?.includes("autocancelled")) {
      console.log("Request was cancelled, likely due to component unmounting or new request starting")
      return { items: [], totalItems: 0, totalPages: 0 }
    }

    console.error("Error fetching reviews:", error)
    return { items: [], totalItems: 0, totalPages: 0 }
  }
}

// Create a new review
export async function createReview(
  data: { destination: string; rating: number; review_text: string; photos?: File[]; },
): Promise<ReviewWithAuthor | null> {
  const pb = getPocketBase()
  if (!pb) throw new Error("Failed to connect to PocketBase")

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to create a review")
  }

  console.log("photos:", data.photos)
  try {
    const record = await pb.collection("reviews").create(data, {
      expand: "reviewer", // Make sure to expand reviewer relation
    })

    // Debug: Log the created record
    console.log("Created review:", JSON.stringify(record, null, 2))
    console.log("Reviewer data:", record.expand?.reviewer)

    return formatReview(record)
  } catch (error: any) {
    console.error("Error creating review:", error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to create a review. Please sign in first.")
    }

    throw new Error(error.message || "Failed to create review. Please try again.")
  }
}

// Update a review
export async function updateReview(
  id: string,
  data: { destination: string; rating: number; review_text: string; photos?: File[]; },
): Promise<ReviewWithAuthor | null> {
  const pb = getPocketBase()
  if (!pb) throw new Error("Failed to connect to PocketBase")

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to update a review")
  }

  console.log("photos:", data.photos)

  try {
    // First check if the user owns this review
    const existingReview = await pb.collection("reviews").getOne(id)
    if (existingReview.reviewer !== pb.authStore.model?.id) {
      throw new Error("You can only edit your own reviews")
    }

    const record = await pb.collection("reviews").update(id, data, {
      expand: "reviewer", // Make sure to expand reviewer relation
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

// Delete a review
export async function deleteReview(id: string): Promise<boolean> {
  const pb = getPocketBase()
  if (!pb) throw new Error("Failed to connect to PocketBase")

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

// Like a review
export async function likeReview(reviewId: string): Promise<boolean> {
  const pb = getPocketBase()
  if (!pb) throw new Error("Failed to connect to PocketBase")

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to like a review")
  }

  try {
    const review = await pb.collection("reviews").getOne(reviewId)
    const likesCount = (review.likes_count || 0) + 1

    await pb.collection("reviews").update(reviewId, { likes_count: likesCount })
    return true
  } catch (error: any) {
    console.error(`Error liking review with ID ${reviewId}:`, error)
    throw new Error(error.message || "Failed to like review. Please try again.")
  }
}

// Update the formatReview function to correctly use the reviewer field
function formatReview(record: any): ReviewWithAuthor {
  const baseUrl = "https://remain-faceghost.pockethost.io/api/files/"

  // Format the date
  const date = new Date(record.created)
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Get author info - ensure we always get the best available name
  let authorName = "Unknown User"
  let authorAvatar = null

  // Debug: Log the record structure to see what we're working with
  console.log("Formatting review:", record.id)
  console.log("Record expand:", record.expand)

  // Try multiple approaches to get the reviewer information
  if (record.expand?.reviewer) {
    console.log("Found expanded reviewer:", record.expand.reviewer)

    // Use the name or username from the expanded relation
    if (record.expand.reviewer.name) {
      authorName = record.expand.reviewer.name
      console.log("Using reviewer name:", authorName)
    } else if (record.expand.reviewer.username) {
      authorName = record.expand.reviewer.username
      console.log("Using reviewer username:", authorName)
    }

    // Get avatar if available
    if (record.expand.reviewer.avatar) {
      authorAvatar = `${baseUrl}${record.expand.reviewer.collectionId}/${record.expand.reviewer.id}/${record.expand.reviewer.avatar}`
    }
  } else {
    console.log("No expanded reviewer found for review:", record.id)

    // Try to get the reviewer ID at least
    if (record.reviewer) {
      console.log("Reviewer ID:", record.reviewer)
    }
  }

  // Get photo URL
  let photoUrl = null
  if (record.photo) {
    photoUrl = `${baseUrl}${record.collectionId}/${record.id}/${record.photo}`
  }

  const formattedReview = {
    ...record,
    authorName,
    authorAvatar,
    formattedDate,
    photoUrl,
    likes_count: record.likes_count || 0,
    comments_count: record.comments_count || 0,
  }

  console.log("Formatted review author:", formattedReview.authorName)
  return formattedReview
}

// Add the fetchLatestReviews function after the existing functions

// Fetch latest reviews
export async function fetchLatestReviews(limit = 2) {
  const pb = getPocketBase()
  if (!pb) throw new Error("Failed to connect to PocketBase")

try {
  const reviews = await pb.collection("reviewsView").getList(1, limit, {
    sort: "-created",
  });

  return {
    page: reviews.page,
    perPage: reviews.perPage,
    totalItems: reviews.totalItems,
    totalPages: reviews.totalPages,
    items: reviews.items.map((review: any) => ({
      id: review.id,
      destination: review.destination,
      collectionId: review.collectionId,
      content: review.review_text,
      rating: review.rating,
      created: review.created,
      expand: review.expand,
      comments_count: review.comments_count,
      likes_count: review.likes_count,
      photos: review.photos,
      reviewer_avatar: review.reviewer_avatar,
      reviewer_email: review.reviewer_email,
      reviewer_name: review.reviewer_name,
      tagged_users: review.tagged_users,
      updated: review.updated,
      user_id: review.user_id,
    })),
  };
} catch (error) {
  console.error("Error fetching latest reviews:", error);
  return {
    page: 1,
    perPage: limit,
    totalItems: 0,
    totalPages: 0,
    items: [],
  };
}
}

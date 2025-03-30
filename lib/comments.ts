import { getPocketBase } from "@/lib/pocketbase"
import { updateReviewCommentsCount } from "@/lib/reviews"

export type Comment = {
  id: string
  created: string
  updated: string
  content: string
  user: string
  review: string
  upload?: string
  likes_count: number
  parent_comment?: string
  tagged_users: string[]
  expand?: {
    user?: {
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
      avatar?: string
    }>
    parent_comment?: Comment
  }
}

export type CommentWithAuthor = Comment & {
  authorName: string
  authorAvatar: string | null
  formattedDate: string
  taggedUserNames: string[]
  replyingTo?: string
}

// Fetch comments for a specific review
export async function fetchComments(
  reviewId: string,
  page = 1,
  perPage = 50,
): Promise<{ items: CommentWithAuthor[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase()

  try {
    const resultList = await pb.collection("comments").getList(page, perPage, {
      sort: "created",
      filter: `review = "${reviewId}"`,
      expand: "user,tagged_users,parent_comment.user",
    })

    // Format comments
    const formattedComments = resultList.items.map(formatComment)

    return {
      items: formattedComments,
      totalItems: resultList.totalItems,
      totalPages: resultList.totalPages,
    }
  } catch (error) {
    console.error("Error fetching comments:", error)
    return { items: [], totalItems: 0, totalPages: 0 }
  }
}

// Create a new comment
export async function createComment(
  reviewId: string,
  content: string,
  parentCommentId?: string,
  taggedUserIds: string[] = [],
): Promise<CommentWithAuthor | null> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to comment")
  }

  try {
    const data: any = {
      content,
      user: pb.authStore.model?.id,
      review: reviewId,
      likes_count: 0,
    }

    if (parentCommentId) {
      data.parent_comment = parentCommentId
    }

    // Add tagged users if any
    if (taggedUserIds.length > 0) {
      data.tagged_users = taggedUserIds
    }

    const record = await pb.collection("comments").create(data, {
      expand: "user,tagged_users,parent_comment.user",
    })

    // Increment the review's comment count
    await updateReviewCommentsCount(reviewId, 1)

    return formatComment(record)
  } catch (error: any) {
    console.error("Error creating comment:", error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to comment. Please sign in first.")
    }

    throw new Error(error.message || "Failed to create comment. Please try again.")
  }
}

// Update an existing comment
export async function updateComment(
  commentId: string,
  content: string,
  taggedUserIds: string[] = [],
): Promise<CommentWithAuthor | null> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to update a comment")
  }

  try {
    // First check if the user owns this comment
    const existingComment = await pb.collection("comments").getOne(commentId)
    if (existingComment.user !== pb.authStore.model?.id) {
      throw new Error("You can only edit your own comments")
    }

    const data: any = {
      content,
    }

    // Update tagged users if provided
    if (taggedUserIds.length > 0) {
      data.tagged_users = taggedUserIds
    }

    const record = await pb.collection("comments").update(commentId, data, {
      expand: "user,tagged_users,parent_comment.user",
    })

    return formatComment(record)
  } catch (error: any) {
    console.error(`Error updating comment with ID ${commentId}:`, error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to update this comment")
    }

    throw new Error(error.message || "Failed to update comment. Please try again.")
  }
}

// Delete a comment
export async function deleteComment(commentId: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to delete a comment")
  }

  try {
    // First check if the user owns this comment
    const existingComment = await pb.collection("comments").getOne(commentId)
    if (existingComment.user !== pb.authStore.model?.id) {
      throw new Error("You can only delete your own comments")
    }

    const reviewId = existingComment.review

    await pb.collection("comments").delete(commentId)

    // Decrement the review's comment count
    await updateReviewCommentsCount(reviewId, -1)

    return true
  } catch (error: any) {
    console.error(`Error deleting comment with ID ${commentId}:`, error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to delete this comment")
    }

    throw new Error(error.message || "Failed to delete comment. Please try again.")
  }
}

// Like a comment
export async function likeComment(commentId: string): Promise<boolean> {
  const pb = getPocketBase()

  if (!pb?.authStore?.isValid) {
    throw new Error("You must be signed in to like a comment")
  }

  try {
    const comment = await pb.collection("comments").getOne(commentId)
    const likesCount = (comment.likes_count || 0) + 1

    await pb.collection("comments").update(commentId, { likes_count: likesCount })
    return true
  } catch (error: any) {
    console.error(`Error liking comment with ID ${commentId}:`, error)
    throw new Error(error.message || "Failed to like comment. Please try again.")
  }
}

// Search for users (for tagging)
export async function searchUsers(
  query: string,
): Promise<Array<{ id: string; name: string; username: string; avatar?: string }>> {
  if (!query || query.length < 2) return []

  const pb = getPocketBase()

  try {
    const users = await pb.collection("users").getList(1, 5, {
      filter: `name ~ "${query}" || username ~ "${query}"`,
    })

    return users.items.map((user) => ({
      id: user.id,
      name: user.name || user.username,
      username: user.username,
      avatar: user.avatar
        ? `https://remain-faceghost.pockethost.io/api/files/${user.collectionId}/${user.id}/${user.avatar}`
        : undefined,
    }))
  } catch (error) {
    console.error("Error searching users:", error)
    return []
  }
}

// Extract @mentions from comment text
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}

// Helper function to format a comment record
function formatComment(record: any): CommentWithAuthor {
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

  if (record.expand?.user) {
    authorName = record.expand.user.name || record.expand.user.username
    if (record.expand.user.avatar) {
      authorAvatar = `${baseUrl}${record.expand.user.collectionId}/${record.expand.user.id}/${record.expand.user.avatar}`
    }
  }

  // Get tagged users
  const taggedUserNames: string[] = []
  if (record.expand?.tagged_users && Array.isArray(record.expand.tagged_users)) {
    record.expand.tagged_users.forEach((user: any) => {
      taggedUserNames.push(user.name || user.username)
    })
  }

  // Get who this comment is replying to
  let replyingTo: string | undefined
  if (record.parent_comment && record.expand?.parent_comment?.expand?.user) {
    replyingTo = record.expand.parent_comment.expand.user.name || record.expand.parent_comment.expand.user.username
  }

  return {
    ...record,
    authorName,
    authorAvatar,
    formattedDate,
    taggedUserNames,
    replyingTo,
  }
}


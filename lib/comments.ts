import { getPocketBase } from "@/lib/pocketbase"

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
    replies?: Comment[]
  }
}

export type CommentWithAuthor = Comment & {
  authorName: string
  authorAvatar: string | null
  formattedDate: string
  taggedUserNames: string[]
  replyingTo?: string
  replies?: CommentWithAuthor[]
  replyCount?: number
}

// Fetch comments for a specific review
export async function fetchComments(
  reviewId: string,
  page = 1,
  perPage = 50,
): Promise<{ items: CommentWithAuthor[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase()

  try {
    // First fetch all parent comments (comments without a parent)
    const parentComments = await pb.collection("comments").getList(page, perPage, {
      sort: "created",
      filter: `review = "${reviewId}" && parent_comment = null`,
      expand: "user,tagged_users,parent_comment.user", // Always expand user relation
    })

    // Debug: Log the first parent comment to see its structure
    if (parentComments.items.length > 0) {
      console.log("First parent comment:", JSON.stringify(parentComments.items[0], null, 2))
      console.log("User data:", parentComments.items[0].expand?.user)
    }

    // Then fetch all replies
    const replies = await pb.collection("comments").getList(1, 200, {
      sort: "created",
      filter: `review = "${reviewId}" && parent_comment != null`,
      expand: "user,tagged_users,parent_comment.user", // Always expand user relation
    })

    // Since expand isn't working for comments, we need to fetch user data separately
    const userIds = new Set<string>()

    // Collect all user IDs from parent comments
    parentComments.items.forEach((comment) => {
      if (comment.user) userIds.add(comment.user)
    })

    // Collect all user IDs from replies
    replies.items.forEach((reply) => {
      if (reply.user) userIds.add(reply.user)
    })

    // Fetch user data for all collected IDs
    const userMap = await fetchUserData(Array.from(userIds))

    // Format parent comments with the fetched user data
    const formattedParentComments = parentComments.items.map((comment) => {
      // Find all replies for this comment
      const commentReplies = replies.items
        .filter((reply) => reply.parent_comment === comment.id)
        .map((reply) => formatComment(reply, userMap))

      // Format the parent comment and add replies
      const formattedComment = formatComment(comment, userMap)
      formattedComment.replies = commentReplies
      formattedComment.replyCount = commentReplies.length

      return formattedComment
    })

    return {
      items: formattedParentComments,
      totalItems: parentComments.totalItems,
      totalPages: parentComments.totalPages,
    }
  } catch (error) {
    console.error("Error fetching comments:", error)
    return { items: [], totalItems: 0, totalPages: 0 }
  }
}

// Helper function to fetch user data for multiple user IDs
async function fetchUserData(userIds: string[]): Promise<Map<string, any>> {
  if (!userIds.length) return new Map()

  const pb = getPocketBase()
  const userMap = new Map<string, any>()

  try {
    // Fetch users in batches of 100 (PocketBase limit)
    const batchSize = 100
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)
      const filter = batch.map((id) => `id = "${id}"`).join(" || ")

      const users = await pb.collection("users").getList(1, batch.length, {
        filter,
      })

      users.items.forEach((user) => {
        userMap.set(user.id, user)
      })
    }

    console.log(`Fetched ${userMap.size} users for ${userIds.length} IDs`)
    return userMap
  } catch (error) {
    console.error("Error fetching user data:", error)
    return userMap
  }
}

// Add this function to update the comment count on a review
export async function updateReviewCommentCount(reviewId: string, increment = true): Promise<boolean> {
  const pb = getPocketBase()

  try {
    const review = await pb.collection("reviews").getOne(reviewId)
    const currentCount = review.comments_count || 0
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1)

    await pb.collection("reviews").update(reviewId, { comments_count: newCount })
    return true
  } catch (error: any) {
    console.error(`Error updating comment count for review ${reviewId}:`, error)
    return false
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
      expand: "user,tagged_users,parent_comment.user", // Always expand user relation
    })

    // Debug: Log the created comment
    console.log("Created comment:", JSON.stringify(record, null, 2))
    console.log("User data:", record.expand?.user)

    // Since expand might not work, fetch the current user data
    const currentUser = pb.authStore.model
    const userMap = new Map<string, any>()

    if (currentUser) {
      userMap.set(currentUser.id, currentUser)
    }

    // Update the review's comment count
    await updateReviewCommentCount(reviewId, true)

    return formatComment(record, userMap)
  } catch (error: any) {
    console.error("Error creating comment:", error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to comment. Please sign in first.")
    }

    throw new Error(error.message || "Failed to create comment. Please try again.")
  }
}

// Update a comment
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

    const data: any = { content }

    // Update tagged users if provided
    if (taggedUserIds.length > 0) {
      data.tagged_users = taggedUserIds
    }

    const record = await pb.collection("comments").update(commentId, data, {
      expand: "user,tagged_users,parent_comment.user", // Always expand user relation
    })

    // Since expand might not work, fetch the current user data
    const currentUser = pb.authStore.model
    const userMap = new Map<string, any>()

    if (currentUser) {
      userMap.set(currentUser.id, currentUser)
    }

    return formatComment(record, userMap)
  } catch (error: any) {
    console.error(`Error updating comment with ID ${commentId}:`, error)

    if (error.status === 401 || error.status === 403) {
      throw new Error("You don't have permission to update this comment")
    }

    throw new Error(error.message || "Failed to update comment. Please try again.")
  }
}

// Update the deleteComment function to decrement the comment count
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

    // Check if this is a parent comment with replies
    const replies = await pb.collection("comments").getList(1, 1, {
      filter: `parent_comment = "${commentId}"`,
    })

    // If this comment has replies, delete them first
    if (replies.totalItems > 0) {
      // Get all replies
      const allReplies = await pb.collection("comments").getList(1, 100, {
        filter: `parent_comment = "${commentId}"`,
      })

      // Delete each reply
      for (const reply of allReplies.items) {
        await pb.collection("comments").delete(reply.id)
        // Update comment count for each deleted reply
        await updateReviewCommentCount(reviewId, false)
      }
    }

    // Now delete the comment itself
    await pb.collection("comments").delete(commentId)

    // Update the review's comment count
    await updateReviewCommentCount(reviewId, false)

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
function formatComment(record: any, userMap?: Map<string, any>): CommentWithAuthor {
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

  // Debug: Log the comment structure to see what we're working with
  console.log("Formatting comment:", record.id)
  console.log("Comment expand:", record.expand)
  console.log("User ID:", record.user)

  // First try to get user info from the expanded data
  if (record.expand?.user) {
    console.log("Found expanded user:", record.expand.user)

    // Use the name or username from the expanded relation
    if (record.expand.user.name) {
      authorName = record.expand.user.name
      console.log("Using user name from expand:", authorName)
    } else if (record.expand.user.username) {
      authorName = record.expand.user.username
      console.log("Using username from expand:", authorName)
    }

    // Get avatar if available
    if (record.expand.user.avatar) {
      authorAvatar = `${baseUrl}${record.expand.user.collectionId}/${record.expand.user.id}/${record.expand.user.avatar}`
    }
  }
  // If expand didn't work, try to get user info from the userMap
  else if (userMap && record.user && userMap.has(record.user)) {
    const user = userMap.get(record.user)
    console.log("Found user in userMap:", user)

    if (user.name) {
      authorName = user.name
      console.log("Using user name from userMap:", authorName)
    } else if (user.username) {
      authorName = user.username
      console.log("Using username from userMap:", authorName)
    }

    if (user.avatar) {
      authorAvatar = `${baseUrl}${user.collectionId}/${user.id}/${user.avatar}`
    }
  } else {
    console.log("No user data found for comment:", record.id)
  }

  // Get tagged users
  const taggedUserNames: string[] = []
  if (record.expand?.tagged_users && Array.isArray(record.expand.tagged_users)) {
    record.expand.tagged_users.forEach((user: any) => {
      // Use the actual user name from the expanded tagged_users
      const userName = user.name || user.username || "Unknown User"
      taggedUserNames.push(userName)
    })
  }

  // Get who this comment is replying to
  let replyingTo: string | undefined
  if (record.parent_comment && record.expand?.parent_comment?.expand?.user) {
    // Use the actual user name from the expanded parent_comment.user
    const parentUser = record.expand.parent_comment.expand.user
    replyingTo = parentUser.name || parentUser.username || "Unknown User"
  }

  const formattedComment = {
    ...record,
    authorName,
    authorAvatar,
    formattedDate,
    taggedUserNames,
    replyingTo,
    replies: [],
    replyCount: 0,
  }

  console.log("Formatted comment author:", formattedComment.authorName)
  return formattedComment
}

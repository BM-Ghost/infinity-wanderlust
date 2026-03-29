import { getPocketBase } from "@/lib/pocketbase"
import { isBlogReview } from "@/lib/reviews"

const READ_STORAGE_PREFIX = "notifications_read_v1"
const LIKES_SNAPSHOT_PREFIX = "notifications_likes_snapshot_v1"

export type NotificationType =
  | "review_like"
  | "comment"
  | "comment_like"
  | "reply"
  | "mention"

export type AppNotification = {
  id: string
  type: NotificationType
  recipient: string
  actor: string
  review?: string
  comment?: string
  title: string
  body: string
  is_read: boolean
  created: string
  updated: string
  expand?: {
    actor?: {
      id: string
      name?: string
      username?: string
      avatar?: string
      collectionId?: string
    }
    review?: {
      id: string
      destination?: string
      review_text?: string
    }
    comment?: {
      id: string
      content?: string
    }
  }
}

export type NotificationWithDisplay = AppNotification & {
  actorName: string
  actorAvatar: string | null
  href: string
  isArticle: boolean
  createdLabel: string
}

function formatDateLabel(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function toDateValue(value: string): number {
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function getReadStorageKey(userId: string): string {
  return `${READ_STORAGE_PREFIX}:${userId}`
}

function getLikesSnapshotKey(userId: string): string {
  return `${LIKES_SNAPSHOT_PREFIX}:${userId}`
}

function loadReadIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(getReadStorageKey(userId))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((item) => typeof item === "string"))
  } catch {
    return new Set()
  }
}

function saveReadIds(userId: string, ids: Set<string>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(getReadStorageKey(userId), JSON.stringify(Array.from(ids)))
}

function loadLikesSnapshot(userId: string): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(getLikesSnapshotKey(userId))
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    const snapshot: Record<string, number> = {}
    Object.entries(parsed).forEach(([reviewId, likes]) => {
      if (typeof likes === "number" && Number.isFinite(likes)) {
        snapshot[reviewId] = likes
      }
    })
    return snapshot
  } catch {
    return {}
  }
}

function saveLikesSnapshot(userId: string, snapshot: Record<string, number>): void {
  if (typeof window === "undefined") return
  localStorage.setItem(getLikesSnapshotKey(userId), JSON.stringify(snapshot))
}

function getActorName(notification: AppNotification): string {
  const actor = notification.expand?.actor
  if (!actor) return notification.type === "review_like" ? "Community" : "Someone"
  return actor.name || actor.username || "Someone"
}

function getActorAvatar(notification: AppNotification): string | null {
  const actor = notification.expand?.actor
  if (!actor?.avatar || !actor.collectionId) return null
  return `https://remain-faceghost.pockethost.io/api/files/${actor.collectionId}/${actor.id}/${actor.avatar}`
}

function resolveNotificationHref(notification: AppNotification): { href: string; isArticle: boolean } {
  const review = notification.expand?.review
  const reviewId = notification.review || review?.id

  if (!reviewId) {
    return { href: "/notifications", isArticle: false }
  }

  const isArticle = !!review && isBlogReview({ review_text: review.review_text, reviewer: "", rating: 0 })
  const basePath = isArticle ? "/articles" : "/reviews"

  return {
    href: `${basePath}/${reviewId}`,
    isArticle,
  }
}

function normalizeNotification(record: any): NotificationWithDisplay {
  const notification = record as AppNotification
  const actorName = getActorName(notification)
  const actorAvatar = getActorAvatar(notification)
  const { href, isArticle } = resolveNotificationHref(notification)

  return {
    ...notification,
    actorName,
    actorAvatar,
    href,
    isArticle,
    createdLabel: formatDateLabel(notification.created),
  }
}

type DerivedContext = {
  userId: string
  updateLikesSnapshot: boolean
}

async function getDerivedNotifications(context: DerivedContext): Promise<NotificationWithDisplay[]> {
  const pb = getPocketBase()
  if (!pb || !pb.authStore.isValid) return []

  const readIds = loadReadIds(context.userId)

  const reviewResult = await pb.collection("reviews").getList(1, 200, {
    filter: `reviewer = "${context.userId}"`,
    sort: "-updated",
    fields: "id,created,updated,destination,review_text,likes_count",
    $autoCancel: false,
  })

  const myReviews = reviewResult.items as any[]
  const myReviewIds = new Set(myReviews.map((review) => review.id))
  const reviewById = new Map(myReviews.map((review) => [review.id, review]))

  const notifications: NotificationWithDisplay[] = []

  // Derive "review_like" notifications from likes_count deltas on the user's reviews.
  const previousSnapshot = loadLikesSnapshot(context.userId)
  const currentSnapshot: Record<string, number> = {}
  let hasPreviousSnapshot = Object.keys(previousSnapshot).length > 0

  myReviews.forEach((review) => {
    const likesCount = Number(review.likes_count || 0)
    currentSnapshot[review.id] = likesCount

    if (!hasPreviousSnapshot) {
      return
    }

    const previousLikes = Number(previousSnapshot[review.id] || 0)
    if (likesCount <= previousLikes) {
      return
    }

    const delta = likesCount - previousLikes
    const notificationId = `review_like:${review.id}:${likesCount}`
    const isArticle = isBlogReview({
      review_text: review.review_text,
      reviewer: "",
      rating: 0,
    })
    const hrefBase = isArticle ? "/articles" : "/reviews"

    notifications.push({
      id: notificationId,
      type: "review_like",
      recipient: context.userId,
      actor: "",
      review: review.id,
      title: delta === 1 ? "New like" : "New likes",
      body:
        delta === 1
          ? `Your ${isArticle ? "article" : "review"} received a new like.`
          : `Your ${isArticle ? "article" : "review"} received ${delta} new likes.`,
      is_read: readIds.has(notificationId),
      created: review.updated || review.created,
      updated: review.updated || review.created,
      expand: {
        review: {
          id: review.id,
          destination: review.destination,
          review_text: review.review_text,
        },
      },
      actorName: "Community",
      actorAvatar: null,
      href: `${hrefBase}/${review.id}`,
      isArticle,
      createdLabel: formatDateLabel(review.updated || review.created),
    })
  })

  if (context.updateLikesSnapshot) {
    saveLikesSnapshot(context.userId, currentSnapshot)
  }

  if (!hasPreviousSnapshot) {
    hasPreviousSnapshot = true
    if (context.updateLikesSnapshot) {
      saveLikesSnapshot(context.userId, currentSnapshot)
    }
  }

  // Derive comment/reply/mention notifications from existing comments relations.
  const commentsResult = await pb.collection("comments").getList(1, 300, {
    sort: "-created",
    expand: "user,review,parent_comment.user,tagged_users",
    $autoCancel: false,
  })

  const comments = commentsResult.items as any[]

  comments.forEach((comment) => {
    const actorId = String(comment.user || "")
    if (!actorId || actorId === context.userId) return

    const reviewId = String(comment.review || "")
    const review = reviewById.get(reviewId) || comment.expand?.review

    const taggedUserIds = Array.isArray(comment.tagged_users)
      ? comment.tagged_users.filter((id: unknown): id is string => typeof id === "string")
      : []

    const mentionsCurrentUser = taggedUserIds.includes(context.userId)
    const parentOwnerId = comment.expand?.parent_comment?.user?.id
    const repliesToCurrentUser = typeof parentOwnerId === "string" && parentOwnerId === context.userId
    const commentsOnMyReview = myReviewIds.has(reviewId)

    if (!mentionsCurrentUser && !repliesToCurrentUser && !commentsOnMyReview) {
      return
    }

    let type: NotificationType = "comment"
    let title = "New comment"
    let body = `${comment.expand?.user?.name || comment.expand?.user?.username || "Someone"} commented on your review.`

    if (mentionsCurrentUser) {
      type = "mention"
      title = "You were mentioned"
      body = `${comment.expand?.user?.name || comment.expand?.user?.username || "Someone"} mentioned you in a comment.`
    } else if (repliesToCurrentUser) {
      type = "reply"
      title = "New reply"
      body = `${comment.expand?.user?.name || comment.expand?.user?.username || "Someone"} replied to your comment.`
    }

    const notificationId = `${type}:${comment.id}`
    const normalized = normalizeNotification({
      id: notificationId,
      type,
      recipient: context.userId,
      actor: actorId,
      review: reviewId,
      comment: comment.id,
      title,
      body,
      is_read: readIds.has(notificationId),
      created: comment.created,
      updated: comment.updated,
      expand: {
        actor: comment.expand?.user,
        review: review
          ? {
              id: review.id,
              destination: review.destination,
              review_text: review.review_text,
            }
          : undefined,
        comment: {
          id: comment.id,
          content: comment.content,
        },
      },
    })

    notifications.push(normalized)
  })

  notifications.sort((a, b) => toDateValue(b.created) - toDateValue(a.created))
  return notifications
}

export async function fetchNotifications(
  page = 1,
  perPage = 20,
): Promise<{ items: NotificationWithDisplay[]; totalItems: number; totalPages: number }> {
  const pb = getPocketBase()
  if (!pb || !pb.authStore.isValid || !pb.authStore.model?.id) {
    return { items: [], totalItems: 0, totalPages: 0 }
  }

  try {
    const all = await getDerivedNotifications({
      userId: pb.authStore.model.id,
      updateLikesSnapshot: true,
    })

    const safePage = Math.max(1, page)
    const safePerPage = Math.max(1, perPage)
    const totalItems = all.length
    const totalPages = Math.max(1, Math.ceil(totalItems / safePerPage))
    const start = (safePage - 1) * safePerPage

    return {
      items: all.slice(start, start + safePerPage),
      totalItems,
      totalPages,
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error)
    return { items: [], totalItems: 0, totalPages: 0 }
  }
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const pb = getPocketBase()
  if (!pb || !pb.authStore.isValid || !pb.authStore.model?.id) return 0

  try {
    const all = await getDerivedNotifications({
      userId: pb.authStore.model.id,
      updateLikesSnapshot: true,
    })
    return all.filter((notification) => !notification.is_read).length
  } catch (error) {
    console.error("Failed to fetch unread notifications count:", error)
    return 0
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const pb = getPocketBase()
  if (!pb || !pb.authStore.isValid || !pb.authStore.model?.id) return false

  try {
    const readIds = loadReadIds(pb.authStore.model.id)
    readIds.add(notificationId)
    saveReadIds(pb.authStore.model.id, readIds)

    return true
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return false
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const pb = getPocketBase()
  if (!pb || !pb.authStore.isValid || !pb.authStore.model?.id) return false

  try {
    const all = await getDerivedNotifications({
      userId: pb.authStore.model.id,
      updateLikesSnapshot: true,
    })
    const readIds = loadReadIds(pb.authStore.model.id)

    all.forEach((notification) => readIds.add(notification.id))
    saveReadIds(pb.authStore.model.id, readIds)

    return true
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return false
  }
}

type CreateNotificationInput = {
  recipientId: string
  actorId: string
  type: NotificationType
  title: string
  body: string
  reviewId?: string
  commentId?: string
}

export async function createNotification(input: CreateNotificationInput): Promise<boolean> {
  // Derived notifications mode: no backend write is performed.
  // We keep this function for compatibility with existing callers.
  return !!input
}

export async function notifyReviewLike(reviewId: string, reviewOwnerId: string): Promise<void> {
  const pb = getPocketBase()
  const actorId = pb?.authStore.model?.id
  const actorName = pb?.authStore.model?.name || pb?.authStore.model?.username || "Someone"

  if (!actorId || !reviewOwnerId || actorId === reviewOwnerId) return

  await createNotification({
    recipientId: reviewOwnerId,
    actorId,
    type: "review_like",
    title: "New like",
    body: `${actorName} liked your review`,
    reviewId,
  })
}

export async function notifyCommentLike(reviewId: string, commentId: string, commentOwnerId: string): Promise<void> {
  const pb = getPocketBase()
  const actorId = pb?.authStore.model?.id
  const actorName = pb?.authStore.model?.name || pb?.authStore.model?.username || "Someone"

  if (!actorId || !commentOwnerId || actorId === commentOwnerId) return

  await createNotification({
    recipientId: commentOwnerId,
    actorId,
    type: "comment_like",
    title: "Comment liked",
    body: `${actorName} liked your comment`,
    reviewId,
    commentId,
  })
}

export async function notifyCommentEvents(params: {
  reviewId: string
  commentId: string
  reviewOwnerId?: string
  parentCommentOwnerId?: string
  taggedUserIds?: string[]
}): Promise<void> {
  const pb = getPocketBase()
  const actorId = pb?.authStore.model?.id
  const actorName = pb?.authStore.model?.name || pb?.authStore.model?.username || "Someone"

  if (!actorId) return

  const recipients = new Set<string>()

  if (params.reviewOwnerId && params.reviewOwnerId !== actorId) {
    recipients.add(params.reviewOwnerId)
  }

  if (params.parentCommentOwnerId && params.parentCommentOwnerId !== actorId) {
    recipients.add(params.parentCommentOwnerId)
  }

  const tagged = params.taggedUserIds || []
  tagged.forEach((userId) => {
    if (userId && userId !== actorId) {
      recipients.add(userId)
    }
  })

  for (const recipientId of recipients) {
    const isReply = !!params.parentCommentOwnerId && recipientId === params.parentCommentOwnerId
    const isMention = tagged.includes(recipientId)

    let type: NotificationType = "comment"
    let title = "New comment"
    let body = `${actorName} commented on your review`

    if (isReply) {
      type = "reply"
      title = "New reply"
      body = `${actorName} replied to your comment`
    } else if (isMention) {
      type = "mention"
      title = "You were mentioned"
      body = `${actorName} mentioned you in a comment`
    }

    await createNotification({
      recipientId,
      actorId,
      type,
      title,
      body,
      reviewId: params.reviewId,
      commentId: params.commentId,
    })
  }
}

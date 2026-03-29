"use client"
export const runtime = 'edge'

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/lib/translations"
import { useAuth } from "@/components/auth-provider"
import { ImageCollage } from "@/components/image-collage";
import { RichTextRenderer } from "@/components/rich-text-renderer"
import { ShareButton } from "@/components/share-button"
import {
  Star,
  MapPin,
  Calendar,
  Heart,
  MessageSquare,
  Reply,
  AtSign,
  ArrowLeft,
  ChevronRight,
  Camera,
  User,
  Bookmark,
  Pencil,
  Trash2,
} from "lucide-react"
import { motion } from "framer-motion"
import { useReviews } from "@/hooks/useReviews"
import { useQueryClient } from "@tanstack/react-query"
import { likeReview } from "@/lib/reviews"
import { CommentWithAuthor, createComment, deleteComment, fetchComments, likeComment, searchUsers, updateComment } from "@/lib/comments"
import { useToast } from "@/components/ui/use-toast"

const ADMIN_EMAIL = "infinitywanderlusttravels@gmail.com"

export default function ReviewDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const { user, isLoading: isAuthLoading } = useAuth()

  const [review, setReview] = useState<any>(null)
  const [relatedReviews, setRelatedReviews] = useState<any[]>([])
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [pendingCommentLikes, setPendingCommentLikes] = useState<Record<string, boolean>>({})
  const [optimisticCommentLikes, setOptimisticCommentLikes] = useState<Record<string, number>>({})
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null)
  const [replyTextByCommentId, setReplyTextByCommentId] = useState<Record<string, string>>({})
  const [submittingReplyByCommentId, setSubmittingReplyByCommentId] = useState<Record<string, boolean>>({})
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState("")
  const [savingEditByCommentId, setSavingEditByCommentId] = useState<Record<string, boolean>>({})
  const [deletingCommentById, setDeletingCommentById] = useState<Record<string, boolean>>({})
  const [expandedRepliesByCommentId, setExpandedRepliesByCommentId] = useState<Record<string, boolean>>({})
  const [mentionResultsByTarget, setMentionResultsByTarget] = useState<
    Record<string, Array<{ id: string; name: string; username: string; avatar?: string }>>
  >({})
  const [showMentionResultsByTarget, setShowMentionResultsByTarget] = useState<Record<string, boolean>>({})
  const [activeMentionIndexByTarget, setActiveMentionIndexByTarget] = useState<Record<string, number>>({})
  const [cursorPositionByTarget, setCursorPositionByTarget] = useState<Record<string, number>>({})
  const [taggedUsersByTarget, setTaggedUsersByTarget] = useState<Record<string, Array<{ id: string; name: string }>>>({})
  const { toast } = useToast()

  const getSafeMentionTarget = (targetKey: string) => targetKey.replace(/[^a-zA-Z0-9_-]/g, "_")

  useEffect(() => {
    Object.entries(activeMentionIndexByTarget).forEach(([targetKey, activeIndex]) => {
      if (!showMentionResultsByTarget[targetKey] || activeIndex < 0) return
      const safeTarget = getSafeMentionTarget(targetKey)
      const selector = `[data-mention-target="${safeTarget}"][data-mention-index="${activeIndex}"]`
      const option = document.querySelector<HTMLElement>(selector)
      option?.scrollIntoView({ block: "nearest" })
    })
  }, [activeMentionIndexByTarget, showMentionResultsByTarget])

  const getTextByTarget = (targetKey: string): string => {
    if (targetKey === "root") return commentText
    if (targetKey.startsWith("reply-")) return replyTextByCommentId[targetKey.replace("reply-", "")] || ""
    if (targetKey.startsWith("edit-") && editingCommentId === targetKey.replace("edit-", "")) return editCommentText
    return ""
  }

  const setTextByTarget = (targetKey: string, value: string) => {
    if (targetKey === "root") {
      setCommentText(value)
      return
    }

    if (targetKey.startsWith("reply-")) {
      const parentId = targetKey.replace("reply-", "")
      setReplyTextByCommentId((prev) => ({ ...prev, [parentId]: value }))
      return
    }

    if (targetKey.startsWith("edit-") && editingCommentId === targetKey.replace("edit-", "")) {
      setEditCommentText(value)
    }
  }

  const handleMentionLookup = async (targetKey: string, value: string, cursorPosition: number) => {
    setCursorPositionByTarget((prev) => ({ ...prev, [targetKey]: cursorPosition }))

    const beforeCursor = value.substring(0, cursorPosition)
    const atIndex = beforeCursor.lastIndexOf("@")

    if (atIndex === -1 || (atIndex > 0 && !/\s/.test(beforeCursor[atIndex - 1]))) {
      setShowMentionResultsByTarget((prev) => ({ ...prev, [targetKey]: false }))
      setActiveMentionIndexByTarget((prev) => ({ ...prev, [targetKey]: -1 }))
      return
    }

    const query = beforeCursor.substring(atIndex + 1)
    if (!query) {
      setShowMentionResultsByTarget((prev) => ({ ...prev, [targetKey]: false }))
      setActiveMentionIndexByTarget((prev) => ({ ...prev, [targetKey]: -1 }))
      return
    }

    try {
      const users = await searchUsers(query)
      setMentionResultsByTarget((prev) => ({ ...prev, [targetKey]: users }))
      setShowMentionResultsByTarget((prev) => ({ ...prev, [targetKey]: users.length > 0 }))
      setActiveMentionIndexByTarget((prev) => ({ ...prev, [targetKey]: users.length > 0 ? 0 : -1 }))
    } catch {
      setShowMentionResultsByTarget((prev) => ({ ...prev, [targetKey]: false }))
      setActiveMentionIndexByTarget((prev) => ({ ...prev, [targetKey]: -1 }))
    }
  }

  const handleMentionKeyDown = (
    targetKey: string,
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (!showMentionResultsByTarget[targetKey]) return

    const results = mentionResultsByTarget[targetKey] || []
    if (results.length === 0) return

    const currentIndex = activeMentionIndexByTarget[targetKey] ?? 0

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveMentionIndexByTarget((prev) => ({
        ...prev,
        [targetKey]: (currentIndex + 1) % results.length,
      }))
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveMentionIndexByTarget((prev) => ({
        ...prev,
        [targetKey]: (currentIndex - 1 + results.length) % results.length,
      }))
      return
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault()
      const selected = results[Math.max(0, currentIndex)]
      if (selected) {
        handleSelectMention(targetKey, selected)
      }
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setShowMentionResultsByTarget((prev) => ({ ...prev, [targetKey]: false }))
      setActiveMentionIndexByTarget((prev) => ({ ...prev, [targetKey]: -1 }))
    }
  }

  const handleSelectMention = (targetKey: string, selectedUser: { id: string; name: string; username: string }) => {
    const text = getTextByTarget(targetKey)
    const cursorPosition = cursorPositionByTarget[targetKey] ?? text.length
    const beforeCursor = text.substring(0, cursorPosition)
    const atIndex = beforeCursor.lastIndexOf("@")

    if (atIndex === -1) return

    const beforeAt = text.substring(0, atIndex)
    const afterCursor = text.substring(cursorPosition)
    const nextText = `${beforeAt}@${selectedUser.username} ${afterCursor}`

    setTextByTarget(targetKey, nextText)
    setTaggedUsersByTarget((prev) => ({
      ...prev,
      [targetKey]: [...(prev[targetKey] || []).filter((user) => user.id !== selectedUser.id), { id: selectedUser.id, name: selectedUser.name }],
    }))
    setShowMentionResultsByTarget((prev) => ({ ...prev, [targetKey]: false }))
    setActiveMentionIndexByTarget((prev) => ({ ...prev, [targetKey]: -1 }))
    setCursorPositionByTarget((prev) => ({ ...prev, [targetKey]: atIndex + selectedUser.username.length + 2 }))
  }

  const renderTaggedUsers = (targetKey: string) => {
    const users = taggedUsersByTarget[targetKey] || []
    if (users.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2">
        {users.map((taggedUser) => (
          <button
            key={taggedUser.id}
            type="button"
            className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
            onClick={() =>
              setTaggedUsersByTarget((prev) => ({
                ...prev,
                [targetKey]: (prev[targetKey] || []).filter((user) => user.id !== taggedUser.id),
              }))
            }
          >
            <AtSign className="mr-1 h-3 w-3" />
            {taggedUser.name}
          </button>
        ))}
      </div>
    )
  }
  const { data: reviewsData, isLoading, isError } = useReviews({
    page: 1,
    perPage: 50,
    enabled: true,
    filter: `reviewer.email != "${ADMIN_EMAIL}"`,
  })
  const reviews = reviewsData?.items || []

  // FIX: Move state updates into useEffect
  useEffect(() => {
    if (reviews && reviews.length > 0 && id) {
      const foundReview = reviews.find((review: any) => review.id === id) || null
      setReview(foundReview)
      setRelatedReviews(reviews.filter((r: any) => r.id !== id))

      if (foundReview?.id) {
        void loadComments(foundReview.id)
      }
    }
  }, [reviews, id])

  // Handle like action
  const handleLike = async () => {
    if (!user || isAuthLoading || isLiking) {
      return
    }

    if (!review?.id) return

    setIsLiking(true)

    setReview((prev: any) =>
      prev
        ? {
            ...prev,
            likes_count: (prev.likes_count || 0) + 1,
          }
        : prev,
    )

    try {
      await likeReview(review.id)
      setIsLiked(true)
    } catch (error: any) {
      setReview((prev: any) =>
        prev
          ? {
              ...prev,
              likes_count: Math.max(0, (prev.likes_count || 1) - 1),
            }
          : prev,
      )
      toast({
        variant: "destructive",
        title: "Failed to like review",
        description: error?.message || "Please try again.",
      })
    } finally {
      setIsLiking(false)
    }
  }

  const loadComments = async (reviewId: string) => {
    setIsLoadingComments(true)
    try {
      const result = await fetchComments(reviewId)
      setComments(result.items)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load comments",
        description: error?.message || "Please refresh and try again.",
      })
    } finally {
      setIsLoadingComments(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (!review?.id || !user || isSubmittingComment) return

    const trimmedComment = commentText.trim()
    if (!trimmedComment) return

    setIsSubmittingComment(true)

    try {
      const taggedUserIds = (taggedUsersByTarget.root || []).map((user) => user.id)
      const created = await createComment(review.id, trimmedComment, undefined, taggedUserIds)
      if (created) {
        setComments((prev) => [created, ...prev])
        setReview((prev: any) =>
          prev
            ? {
                ...prev,
                comments_count: (prev.comments_count || 0) + 1,
              }
            : prev,
        )
      }
      setCommentText("")
      setTaggedUsersByTarget((prev) => ({ ...prev, root: [] }))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to post comment",
        description: error?.message || "Please try again.",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleCommentLike = async (commentId: string, currentLikesCount: number) => {
    if (!user || pendingCommentLikes[commentId]) return

    const nextLikes = currentLikesCount + 1
    setPendingCommentLikes((prev) => ({ ...prev, [commentId]: true }))
    setOptimisticCommentLikes((prev) => ({ ...prev, [commentId]: nextLikes }))

    try {
      await likeComment(commentId)
    } catch (error: any) {
      setOptimisticCommentLikes((prev) => {
        const copy = { ...prev }
        delete copy[commentId]
        return copy
      })
      toast({
        variant: "destructive",
        title: "Failed to like comment",
        description: error?.message || "Please try again.",
      })
    } finally {
      setPendingCommentLikes((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  const updateCommentTree = (
    list: CommentWithAuthor[],
    commentId: string,
    updater: (comment: CommentWithAuthor) => CommentWithAuthor,
  ): CommentWithAuthor[] => {
    return list.map((comment) => {
      if (comment.id === commentId) {
        return updater(comment)
      }

      const replies = comment.replies || []
      if (replies.length === 0) {
        return comment
      }

      return {
        ...comment,
        replies: updateCommentTree(replies, commentId, updater),
      }
    })
  }

  const insertReplyInTree = (
    list: CommentWithAuthor[],
    parentCommentId: string,
    reply: CommentWithAuthor,
  ): CommentWithAuthor[] => {
    return list.map((comment) => {
      if (comment.id === parentCommentId) {
        const existingReplies = comment.replies || []
        return {
          ...comment,
          replies: [...existingReplies, reply],
          replyCount: existingReplies.length + 1,
        }
      }

      const replies = comment.replies || []
      if (replies.length === 0) {
        return comment
      }

      return {
        ...comment,
        replies: insertReplyInTree(replies, parentCommentId, reply),
      }
    })
  }

  const countCommentBranch = (comment: CommentWithAuthor): number => {
    const replies = comment.replies || []
    return 1 + replies.reduce((sum, reply) => sum + countCommentBranch(reply), 0)
  }

  const removeCommentFromTree = (
    list: CommentWithAuthor[],
    commentId: string,
  ): { nextComments: CommentWithAuthor[]; removedCount: number } => {
    let removedCount = 0

    const nextComments = list
      .filter((comment) => {
        if (comment.id === commentId) {
          removedCount += countCommentBranch(comment)
          return false
        }
        return true
      })
      .map((comment) => {
        const replies = comment.replies || []
        if (replies.length === 0) {
          return comment
        }

        const result = removeCommentFromTree(replies, commentId)
        removedCount += result.removedCount

        return {
          ...comment,
          replies: result.nextComments,
          replyCount: result.nextComments.length,
        }
      })

    return { nextComments, removedCount }
  }

  const handleStartEditComment = (comment: CommentWithAuthor) => {
    setEditingCommentId(comment.id)
    setEditCommentText(comment.content || "")
    setTaggedUsersByTarget((prev) => ({
      ...prev,
      [`edit-${comment.id}`]: (comment.tagged_users || []).map((id, index) => ({
        id,
        name: comment.taggedUserNames[index] || "Tagged user",
      })),
    }))
  }

  const handleSaveEditComment = async (commentId: string) => {
    const trimmedContent = editCommentText.trim()
    if (!trimmedContent) return

    setSavingEditByCommentId((prev) => ({ ...prev, [commentId]: true }))

    try {
      const taggedUserIds = (taggedUsersByTarget[`edit-${commentId}`] || []).map((user) => user.id)
      const updated = await updateComment(commentId, trimmedContent, taggedUserIds)
      if (updated) {
        setComments((prev) =>
          updateCommentTree(prev, commentId, (comment) => ({
            ...comment,
            content: updated.content,
            updated: updated.updated,
          })),
        )
      }
      setEditingCommentId(null)
      setEditCommentText("")
      setTaggedUsersByTarget((prev) => ({ ...prev, [`edit-${commentId}`]: [] }))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to edit comment",
        description: error?.message || "Please try again.",
      })
    } finally {
      setSavingEditByCommentId((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!review?.id) return

    setDeletingCommentById((prev) => ({ ...prev, [commentId]: true }))

    try {
      await deleteComment(commentId)

      setComments((prev) => {
        const result = removeCommentFromTree(prev, commentId)

        if (result.removedCount > 0) {
          setReview((current: any) =>
            current
              ? {
                  ...current,
                  comments_count: Math.max(0, (current.comments_count || 0) - result.removedCount),
                }
              : current,
          )
        }

        return result.nextComments
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to delete comment",
        description: error?.message || "Please try again.",
      })
    } finally {
      setDeletingCommentById((prev) => ({ ...prev, [commentId]: false }))
    }
  }

  const handleReplySubmit = async (parentCommentId: string) => {
    if (!review?.id || !user || submittingReplyByCommentId[parentCommentId]) return

    const trimmedReply = (replyTextByCommentId[parentCommentId] || "").trim()
    if (!trimmedReply) return

    setSubmittingReplyByCommentId((prev) => ({ ...prev, [parentCommentId]: true }))

    try {
      const replyTargetKey = `reply-${parentCommentId}`
      const taggedUserIds = (taggedUsersByTarget[replyTargetKey] || []).map((user) => user.id)
      const createdReply = await createComment(review.id, trimmedReply, parentCommentId, taggedUserIds)
      if (createdReply) {
        setComments((prev) => insertReplyInTree(prev, parentCommentId, createdReply))
        setReview((prev: any) =>
          prev
            ? {
                ...prev,
                comments_count: (prev.comments_count || 0) + 1,
              }
            : prev,
        )
      }

      setReplyTextByCommentId((prev) => ({ ...prev, [parentCommentId]: "" }))
        setTaggedUsersByTarget((prev) => ({ ...prev, [replyTargetKey]: [] }))
      setReplyingToCommentId(null)
      setExpandedRepliesByCommentId((prev) => ({ ...prev, [parentCommentId]: true }))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to post reply",
        description: error?.message || "Please try again.",
      })
    } finally {
      setSubmittingReplyByCommentId((prev) => ({ ...prev, [parentCommentId]: false }))
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
                <Link href="/reviews">Browse Reviews</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderCommentCard = (comment: CommentWithAuthor, isReply = false) => {
    const likesCount = optimisticCommentLikes[comment.id] ?? (comment.likes_count || 0)
    const canManageComment = user?.id === comment.user
    const replies = comment.replies || []
    const hasReplies = replies.length > 0
    const isRepliesExpanded = expandedRepliesByCommentId[comment.id] || false
    const isEditing = editingCommentId === comment.id

    return (
      <div key={comment.id} className={`rounded-lg border p-4 ${isReply ? "ml-6 bg-muted/20" : ""}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-sm">{comment.authorName}</p>
            <p className="text-xs text-muted-foreground">{comment.formattedDate}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={!user || !!pendingCommentLikes[comment.id]}
            onClick={() => handleCommentLike(comment.id, likesCount)}
            className="h-8 px-2"
          >
            <Heart className="h-3.5 w-3.5 mr-1" />
            {likesCount}
          </Button>
        </div>

        {isEditing ? (
          <div className="relative mt-3 space-y-2">
            {renderTaggedUsers(`edit-${comment.id}`)}
            <Textarea
              value={editCommentText}
              onChange={(event) => {
                const value = event.target.value
                setEditCommentText(value)
                void handleMentionLookup(`edit-${comment.id}`, value, event.target.selectionStart)
              }}
              onKeyDown={(event) => handleMentionKeyDown(`edit-${comment.id}`, event)}
              className="min-h-[84px]"
            />
            {showMentionResultsByTarget[`edit-${comment.id}`] && (
              <div className="absolute z-10 w-full rounded-md border bg-popover p-1 shadow-md">
                {(mentionResultsByTarget[`edit-${comment.id}`] || []).map((resultUser, index) => (
                  <button
                    data-mention-target={getSafeMentionTarget(`edit-${comment.id}`)}
                    data-mention-index={index}
                    key={resultUser.id}
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted ${
                      (activeMentionIndexByTarget[`edit-${comment.id}`] ?? 0) === index ? "bg-muted" : ""
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      handleSelectMention(`edit-${comment.id}`, resultUser)
                    }}
                  >
                    <AtSign className="h-3.5 w-3.5" />
                    <span>{resultUser.name}</span>
                    <span className="text-xs text-muted-foreground">@{resultUser.username}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingCommentId(null)
                  setEditCommentText("")
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleSaveEditComment(comment.id)}
                disabled={!editCommentText.trim() || !!savingEditByCommentId[comment.id]}
              >
                {savingEditByCommentId[comment.id] ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
            {comment.content.split(/(@\w+)/).map((part, index) =>
              part.startsWith("@") ? (
                <span key={`${comment.id}-mention-${index}`} className="font-medium text-primary">
                  {part}
                </span>
              ) : (
                <span key={`${comment.id}-text-${index}`}>{part}</span>
              ),
            )}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {user && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() =>
                setReplyingToCommentId((prev) => (prev === comment.id ? null : comment.id))
              }
            >
              <Reply className="h-3.5 w-3.5 mr-1" />
              Reply
            </Button>
          )}

          {canManageComment && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => handleStartEditComment(comment)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}

          {canManageComment && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-destructive hover:text-destructive"
              onClick={() => void handleDeleteComment(comment.id)}
              disabled={!!deletingCommentById[comment.id]}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {deletingCommentById[comment.id] ? "Deleting..." : "Delete"}
            </Button>
          )}

          {hasReplies && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() =>
                setExpandedRepliesByCommentId((prev) => ({ ...prev, [comment.id]: !isRepliesExpanded }))
              }
            >
              {isRepliesExpanded ? "Hide replies" : `Show replies (${replies.length})`}
            </Button>
          )}
        </div>

        {replyingToCommentId === comment.id && (
          <div className="relative mt-3 space-y-2">
            {renderTaggedUsers(`reply-${comment.id}`)}
            <Textarea
              value={replyTextByCommentId[comment.id] || ""}
              onChange={(event) => {
                const value = event.target.value
                const targetKey = `reply-${comment.id}`
                setReplyTextByCommentId((prev) => ({ ...prev, [comment.id]: value }))
                void handleMentionLookup(targetKey, value, event.target.selectionStart)
              }}
              onKeyDown={(event) => handleMentionKeyDown(`reply-${comment.id}`, event)}
              placeholder={`Reply to ${comment.authorName}...`}
              className="min-h-[84px]"
            />
            {showMentionResultsByTarget[`reply-${comment.id}`] && (
              <div className="absolute z-10 w-full rounded-md border bg-popover p-1 shadow-md">
                {(mentionResultsByTarget[`reply-${comment.id}`] || []).map((resultUser, index) => (
                  <button
                    data-mention-target={getSafeMentionTarget(`reply-${comment.id}`)}
                    data-mention-index={index}
                    key={resultUser.id}
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted ${
                      (activeMentionIndexByTarget[`reply-${comment.id}`] ?? 0) === index ? "bg-muted" : ""
                    }`}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      handleSelectMention(`reply-${comment.id}`, resultUser)
                    }}
                  >
                    <AtSign className="h-3.5 w-3.5" />
                    <span>{resultUser.name}</span>
                    <span className="text-xs text-muted-foreground">@{resultUser.username}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setReplyingToCommentId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleReplySubmit(comment.id)}
                disabled={
                  !((replyTextByCommentId[comment.id] || "").trim()) ||
                  !!submittingReplyByCommentId[comment.id]
                }
              >
                {submittingReplyByCommentId[comment.id] ? "Posting..." : "Post Reply"}
              </Button>
            </div>
          </div>
        )}

        {hasReplies && isRepliesExpanded && (
          <div className="mt-4 space-y-3">
            {replies.map((reply) => renderCommentCard(reply, true))}
          </div>
        )}
      </div>
    )
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
          <Link href="/reviews" className="text-muted-foreground hover:text-foreground">
            Reviews
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

                <div className="mb-6">
                  <RichTextRenderer content={review.review_text} className="text-muted-foreground" />
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
                  {user && (
                    <Button
                      variant={isLiked ? "default" : "outline"}
                      size="sm"
                      onClick={handleLike}
                      disabled={isLiking || isLiked}
                      className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
                    >
                      <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-white" : ""}`} />
                      {isLiked ? "Liked" : "Like"} ({review.likes_count})
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const commentsEl = document.getElementById("review-comments")
                      commentsEl?.scrollIntoView({ behavior: "smooth", block: "start" })
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments ({review.comments_count || 0})
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleBookmark}>
                    <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                    {isBookmarked ? "Saved" : "Save"}
                  </Button>

                  <ShareButton
                    url={typeof window !== "undefined" ? window.location.href : ""}
                    title={`Review from ${review.expand?.reviewer?.name || 'Anonymous'} about ${review.destination}`}
                    description={review.review_text.substring(0, 150)}
                  />
                </div>

                <div id="review-comments" className="mt-8 border-t pt-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Comments</h3>
                    <span className="text-sm text-muted-foreground">{review.comments_count || comments.length}</span>
                  </div>

                  {user ? (
                    <div className="relative space-y-3">
                      {renderTaggedUsers("root")}
                      <Textarea
                        value={commentText}
                        onChange={(event) => {
                          const value = event.target.value
                          setCommentText(value)
                          void handleMentionLookup("root", value, event.target.selectionStart)
                        }}
                        onKeyDown={(event) => handleMentionKeyDown("root", event)}
                        placeholder="Share your thoughts..."
                        className="min-h-[96px]"
                      />
                      {showMentionResultsByTarget.root && (
                        <div className="absolute z-10 w-full rounded-md border bg-popover p-1 shadow-md">
                          {(mentionResultsByTarget.root || []).map((resultUser, index) => (
                            <button
                              data-mention-target={getSafeMentionTarget("root")}
                              data-mention-index={index}
                              key={resultUser.id}
                              type="button"
                              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted ${
                                (activeMentionIndexByTarget.root ?? 0) === index ? "bg-muted" : ""
                              }`}
                              onMouseDown={(event) => {
                                event.preventDefault()
                                handleSelectMention("root", resultUser)
                              }}
                            >
                              <AtSign className="h-3.5 w-3.5" />
                              <span>{resultUser.name}</span>
                              <span className="text-xs text-muted-foreground">@{resultUser.username}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button onClick={handleCommentSubmit} disabled={isSubmittingComment || !commentText.trim()}>
                          {isSubmittingComment ? "Posting..." : "Post Comment"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sign in to join the conversation.</p>
                  )}

                  {isLoadingComments ? (
                    <p className="text-sm text-muted-foreground">Loading comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment.</p>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => renderCommentCard(comment))}
                    </div>
                  )}
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
                    <Link href={`/reviews?destination=${encodeURIComponent(review.destination)}`}>See All Reviews</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Related reviews */}
            {relatedReviews.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-4">More Reviews of {review.destination}</h3>
                  <div className="space-y-4">
                    {relatedReviews.map((relatedReview, index) => (
                      <Link key={relatedReview.id} href={`/reviews/${relatedReview.id}`} className="block">
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
                            {user && (
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
                            )}
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

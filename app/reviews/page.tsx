"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  Star,
  Calendar,
  MapPin,
  Camera,
  LogIn,
  Trash2,
  Edit,
  User,
  MessageSquare,
  Reply,
  MoreVertical,
  AtSign,
  Heart,
  Check,
  ChevronDown,
  Search,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/lib/translations"
import {
  fetchReviews,
  createReview,
  updateReview,
  deleteReview,
  type ReviewWithAuthor,
  likeReview,
} from "@/lib/reviews"
import {
  fetchComments,
  createComment,
  deleteComment,
  likeComment,
  searchUsers,
  type CommentWithAuthor,
} from "@/lib/comments"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { getPocketBase } from "@/lib/pocketbase"

export default function ReviewsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Use a ref to track if the component is mounted
  const isMounted = useRef(true)

  // State for reviews data
  const [reviews, setReviews] = useState<ReviewWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const perPage = 5

  // Filtering and sorting state
  const [activeTab, setActiveTab] = useState("all")
  const [sortOrder, setSortOrder] = useState("-created")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  // Review form state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [destination, setDestination] = useState("")
  const [reviewImages, setReviewImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])

  // Edit review state
  const [editReviewId, setEditReviewId] = useState<string | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editRating, setEditRating] = useState(0)
  const [editReviewText, setEditReviewText] = useState("")
  const [editDestination, setEditDestination] = useState("")
  const [editReviewImages, setEditReviewImages] = useState<File[]>([])
  const [editPreviewImages, setEditPreviewImages] = useState<string[]>([])
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  // Comments state
  const [reviewComments, setReviewComments] = useState<{ [reviewId: string]: CommentWithAuthor[] }>({})
  const [loadingComments, setLoadingComments] = useState<{ [reviewId: string]: boolean }>({})
  const [commentText, setCommentText] = useState<{ [reviewId: string]: string }>({})
  const [replyToComment, setReplyToComment] = useState<{ [reviewId: string]: string | null }>({})
  const [showComments, setShowComments] = useState<{ [reviewId: string]: boolean }>({})
  const [expandedReplies, setExpandedReplies] = useState<{ [commentId: string]: boolean }>({})
  const [commentInputFocus, setCommentInputFocus] = useState<{ [reviewId: string]: boolean }>({})
  const [userSearchResults, setUserSearchResults] = useState<
    Array<{ id: string; name: string; username: string; avatar?: string }>
  >([])
  const [taggedUsers, setTaggedUsers] = useState<{ [reviewId: string]: { id: string; name: string }[] }>({})
  const [showUserSearch, setShowUserSearch] = useState<{ [reviewId: string]: boolean }>({})
  const [cursorPosition, setCursorPosition] = useState<{ [reviewId: string]: number }>({})
  const [commentInputRefs] = useState<{ [reviewId: string]: HTMLTextAreaElement | null }>({})

  // Set isMounted to false when the component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  // Get page from URL
  useEffect(() => {
    // Get tab from URL if present
    const tab = searchParams.get("tab")
    if (tab && ["all", "top", "mine", "recent"].includes(tab)) {
      setActiveTab(tab)
    }

    const page = searchParams.get("page")
    if (page) {
      setCurrentPage(Number.parseInt(page, 10))
    }
  }, [searchParams])

  // Load reviews
  const loadReviews = useCallback(async () => {
    if (!isMounted.current) return

    setIsLoading(true)
    setError(null)

    try {
      let filter = ""
      const pb = getPocketBase()

      // Apply filters based on active tab
      if (activeTab === "mine") {
        if (!user && !pb?.authStore?.isValid) {
          // If not authenticated but trying to view "my reviews", show a message instead of redirecting
          if (isMounted.current) {
            setError("Please sign in to view your reviews")
            setIsLoading(false)
          }
          return
        }

        // Get the current user ID from either the user object or directly from PocketBase auth
        const userId = user?.id || pb?.authStore?.model?.id
        if (userId) {
          filter = `reviewer = "${userId}"`
        } else {
          if (isMounted.current) {
            setError("Unable to identify the current user")
            setIsLoading(false)
          }
          return
        }
      } else if (activeTab === "top") {
        filter = "rating >= 4"
      }

      // Add search query filter if present
      if (debouncedSearchQuery) {
        const searchFilter = `(destination ~ "${debouncedSearchQuery}" || review_text ~ "${debouncedSearchQuery}")`
        filter = filter ? `${filter} && ${searchFilter}` : searchFilter
      }

      const result = await fetchReviews(currentPage, perPage, sortOrder, filter)

      // Only update state if the component is still mounted
      if (isMounted.current) {
        setReviews(result.items)
        setTotalPages(result.totalPages)
        setTotalItems(result.totalItems)
      }
    } catch (err) {
      console.error("Failed to load reviews:", err)
      // Only update state if the component is still mounted
      if (isMounted.current) {
        setError("Failed to load reviews. Please try again later.")
      }
    } finally {
      // Only update state if the component is still mounted
      if (isMounted.current) {
        setIsLoading(false)
      }
    }
  }, [currentPage, perPage, sortOrder, activeTab, user, debouncedSearchQuery])

  // Update the useEffect to properly handle async operations
  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  // Add useEffect to trigger search after typing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  // Load comments for a review
  const loadComments = async (reviewId: string) => {
    if (loadingComments[reviewId] || !isMounted.current) return

    setLoadingComments((prev) => ({ ...prev, [reviewId]: true }))

    try {
      const result = await fetchComments(reviewId)
      if (isMounted.current) {
        setReviewComments((prev) => ({ ...prev, [reviewId]: result.items }))
      }
    } catch (err) {
      console.error(`Failed to load comments for review ${reviewId}:`, err)
      if (isMounted.current) {
        toast({
          variant: "destructive",
          title: "Failed to load comments",
          description: "Please try again later.",
        })
      }
    } finally {
      if (isMounted.current) {
        setLoadingComments((prev) => ({ ...prev, [reviewId]: false }))
      }
    }
  }

  // Toggle comments visibility
  const toggleComments = (reviewId: string) => {
    const newValue = !showComments[reviewId]
    setShowComments((prev) => ({ ...prev, [reviewId]: newValue }))

    if (newValue && !reviewComments[reviewId]) {
      loadComments(reviewId)
    }
  }

  // Toggle replies visibility
  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    router.push(`/reviews?page=${page}`)
  }

  // Handle image upload for new review
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setReviewImages([...reviewImages, ...files])

      // Create preview URLs
      const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
      setPreviewImages([...previewImages, ...newPreviewUrls])
    }
  }

  // Handle image upload for edit review
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      setEditReviewImages([...editReviewImages, ...files])

      // Create preview URLs
      const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
      setEditPreviewImages([...editPreviewImages, ...newPreviewUrls])
    }
  }

  // Remove image from upload
  const removeImage = (index: number) => {
    const newImages = [...reviewImages]
    newImages.splice(index, 1)
    setReviewImages(newImages)

    const newPreviews = [...previewImages]
    URL.revokeObjectURL(newPreviews[index])
    newPreviews.splice(index, 1)
    setPreviewImages(newPreviews)
  }

  // Remove image from edit upload
  const removeEditImage = (index: number) => {
    const newImages = [...editReviewImages]
    newImages.splice(index, 1)
    setEditReviewImages(newImages)

    const newPreviews = [...editPreviewImages]
    URL.revokeObjectURL(newPreviews[index])
    newPreviews.splice(index, 1)
    setEditPreviewImages(newPreviews)
  }

  // Handle review submission
  const handleSubmitReview = async () => {
    if (!rating || !destination || !reviewText.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createReview(
        {
          destination,
          rating,
          review_text: reviewText,
        },
        reviewImages.length > 0 ? reviewImages : undefined,
      )

      if (result) {
        toast({
          title: "Review submitted",
          description: "Your review has been published successfully.",
        })

        // Reset form and close dialog
        setRating(0)
        setDestination("")
        setReviewText("")
        setReviewImages([])
        setPreviewImages([])
        setReviewDialogOpen(false)

        // Reload reviews to show the new one
        loadReviews()
      } else {
        throw new Error("Failed to create review")
      }
    } catch (err: any) {
      console.error("Error submitting review:", err)
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: err.message || "There was an error submitting your review. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open edit dialog with review data
  const handleEditReview = (review: ReviewWithAuthor) => {
    setEditReviewId(review.id)
    setEditRating(review.rating)
    setEditReviewText(review.review_text)
    setEditDestination(review.destination)
    setEditReviewImages([])
    setEditPreviewImages(review.photoUrl ? [review.photoUrl] : [])
    setEditDialogOpen(true)
  }

  // Handle edit review submission
  const handleSubmitEditReview = async () => {
    if (!editReviewId || !editRating || !editDestination || !editReviewText.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields.",
      })
      return
    }

    setIsEditSubmitting(true)

    try {
      const result = await updateReview(
        editReviewId,
        {
          destination: editDestination,
          rating: editRating,
          review_text: editReviewText,
        },
        editReviewImages.length > 0 ? editReviewImages : undefined,
      )

      if (result) {
        toast({
          title: "Review updated",
          description: "Your review has been updated successfully.",
        })

        // Update the review in the list
        setReviews(reviews.map((review) => (review.id === editReviewId ? { ...result } : review)))

        // Reset form and close dialog
        setEditReviewId(null)
        setEditRating(0)
        setEditDestination("")
        setEditReviewText("")
        setEditReviewImages([])
        setEditPreviewImages([])
        setEditDialogOpen(false)
      } else {
        throw new Error("Failed to update review")
      }
    } catch (err: any) {
      console.error("Error updating review:", err)
      toast({
        variant: "destructive",
        title: "Update failed",
        description: err.message || "There was an error updating your review. Please try again.",
      })
    } finally {
      setIsEditSubmitting(false)
    }
  }

  // Handle review deletion
  const handleDeleteReview = async (id: string) => {
    if (confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      try {
        const success = await deleteReview(id)

        if (success) {
          toast({
            title: "Review deleted",
            description: "Your review has been deleted successfully.",
          })

          // Remove the deleted review from the list
          setReviews(reviews.filter((review) => review.id !== id))
        } else {
          throw new Error("Failed to delete review")
        }
      } catch (err: any) {
        console.error("Error deleting review:", err)
        toast({
          variant: "destructive",
          title: "Deletion failed",
          description: err.message || "There was an error deleting your review. Please try again.",
        })
      }
    }
  }

  // Add a function to handle comment submission that updates the UI
  const handleSubmitComment = async (reviewId: string, parentCommentId?: string) => {
    if (!commentText[reviewId]?.trim()) return

    try {
      // Use the provided parentCommentId or the one from state
      const actualParentId = parentCommentId || replyToComment[reviewId] || undefined

      // Get tagged user IDs
      const taggedUserIds = taggedUsers[reviewId]?.map((user) => user.id) || []

      const result = await createComment(reviewId, commentText[reviewId], actualParentId, taggedUserIds)

      if (result) {
        // Update comments list based on whether this is a reply or a top-level comment
        if (actualParentId) {
          // This is a reply - add it to the parent comment's replies
          setReviewComments((prev) => {
            const updatedComments = [...(prev[reviewId] || [])]
            const parentIndex = updatedComments.findIndex((c) => c.id === actualParentId)

            if (parentIndex !== -1) {
              // Create a new array of replies if it doesn't exist
              const parentReplies = updatedComments[parentIndex].replies || []
              updatedComments[parentIndex] = {
                ...updatedComments[parentIndex],
                replies: [...parentReplies, result],
                replyCount: (updatedComments[parentIndex].replyCount || 0) + 1,
              }
            }

            return { ...prev, [reviewId]: updatedComments }
          })
        } else {
          // This is a top-level comment
          setReviewComments((prev) => ({
            ...prev,
            [reviewId]: [...(prev[reviewId] || []), { ...result, replies: [], replyCount: 0 }],
          }))
        }

        // Update the review's comment count in the UI
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, comments_count: (review.comments_count || 0) + 1 } : review,
          ),
        )

        // Clear input and reset states
        setCommentText((prev) => ({ ...prev, [reviewId]: "" }))
        setReplyToComment((prev) => ({ ...prev, [reviewId]: null }))
        setTaggedUsers((prev) => ({ ...prev, [reviewId]: [] }))

        // If this was a reply, expand the parent comment's replies
        if (actualParentId) {
          setExpandedReplies((prev) => ({
            ...prev,
            [actualParentId]: true,
          }))
        }

        toast({
          title: "Comment added",
          description: "Your comment has been added successfully.",
        })
      }
    } catch (err: any) {
      console.error("Error submitting comment:", err)
      toast({
        variant: "destructive",
        title: "Comment failed",
        description: err.message || "There was an error posting your comment. Please try again.",
      })
    }
  }

  // Update the delete comment function to update the UI
  const handleDeleteComment = async (
    reviewId: string,
    commentId: string,
    isReply = false,
    parentCommentId?: string,
  ) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      try {
        const success = await deleteComment(commentId)

        if (success) {
          if (isReply && parentCommentId) {
            // This is a reply - remove it from the parent comment's replies
            setReviewComments((prev) => {
              const updatedComments = [...(prev[reviewId] || [])]
              const parentIndex = updatedComments.findIndex((c) => c.id === parentCommentId)

              if (parentIndex !== -1 && updatedComments[parentIndex].replies) {
                const filteredReplies = updatedComments[parentIndex].replies!.filter((reply) => reply.id !== commentId)

                updatedComments[parentIndex] = {
                  ...updatedComments[parentIndex],
                  replies: filteredReplies,
                  replyCount: filteredReplies.length,
                }
              }

              return { ...prev, [reviewId]: updatedComments }
            })
          } else {
            // This is a top-level comment - remove it and all its replies
            setReviewComments((prev) => ({
              ...prev,
              [reviewId]: (prev[reviewId] || []).filter((comment) => comment.id !== commentId),
            }))
          }

          // Update the review's comment count in the UI
          // For a parent comment, we need to subtract 1 + number of replies
          const commentToDelete = isReply ? null : reviewComments[reviewId]?.find((c) => c.id === commentId)
          const replyCount = commentToDelete?.replyCount || 0
          const decrementAmount = isReply ? 1 : 1 + replyCount

          setReviews((prev) =>
            prev.map((review) =>
              review.id === reviewId
                ? { ...review, comments_count: Math.max(0, (review.comments_count || 0) - decrementAmount) }
                : review,
            ),
          )

          toast({
            title: "Comment deleted",
            description: "Your comment has been deleted successfully.",
          })
        }
      } catch (err: any) {
        console.error("Error deleting comment:", err)
        toast({
          variant: "destructive",
          title: "Deletion failed",
          description: err.message || "There was an error deleting your comment. Please try again.",
        })
      }
    }
  }

  // Handle liking a comment
  const handleLikeComment = async (reviewId: string, commentId: string, isReply = false, parentCommentId?: string) => {
    try {
      const success = await likeComment(commentId)

      if (success) {
        if (isReply && parentCommentId) {
          // This is a reply - update its like count within the parent comment
          setReviewComments((prev) => {
            const updatedComments = [...(prev[reviewId] || [])]
            const parentIndex = updatedComments.findIndex((c) => c.id === parentCommentId)

            if (parentIndex !== -1 && updatedComments[parentIndex].replies) {
              const replyIndex = updatedComments[parentIndex].replies!.findIndex((reply) => reply.id === commentId)

              if (replyIndex !== -1) {
                const updatedReplies = [...updatedComments[parentIndex].replies!]
                updatedReplies[replyIndex] = {
                  ...updatedReplies[replyIndex],
                  likes_count: (updatedReplies[replyIndex].likes_count || 0) + 1,
                }

                updatedComments[parentIndex] = {
                  ...updatedComments[parentIndex],
                  replies: updatedReplies,
                }
              }
            }

            return { ...prev, [reviewId]: updatedComments }
          })
        } else {
          // This is a top-level comment
          setReviewComments((prev) => {
            const updatedComments = [...(prev[reviewId] || [])]
            const commentIndex = updatedComments.findIndex((c) => c.id === commentId)

            if (commentIndex !== -1) {
              updatedComments[commentIndex] = {
                ...updatedComments[commentIndex],
                likes_count: (updatedComments[commentIndex].likes_count || 0) + 1,
              }
            }

            return { ...prev, [reviewId]: updatedComments }
          })
        }
      }
    } catch (err: any) {
      console.error("Error liking comment:", err)
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.message || "There was an error liking this comment. Please try again.",
      })
    }
  }

  // Set up reply to comment
  const handleReplyToComment = (reviewId: string, commentId: string, authorName: string) => {
    setReplyToComment((prev) => ({ ...prev, [reviewId]: commentId }))

    // Add the author to tagged users
    const comment = findComment(reviewId, commentId)
    if (comment) {
      setTaggedUsers((prev) => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] || []), { id: comment.user, name: authorName }],
      }))
    }

    // Update comment text with @mention
    setCommentText((prev) => ({ ...prev, [reviewId]: `@${authorName} ` }))

    // Focus the comment input
    const commentInput = commentInputRefs[reviewId]
    if (commentInput) {
      commentInput.focus()
    }
  }

  // Helper function to find a comment by ID (either parent or reply)
  const findComment = (reviewId: string, commentId: string): CommentWithAuthor | undefined => {
    const comments = reviewComments[reviewId] || []

    // First check if it's a parent comment
    const parentComment = comments.find((c) => c.id === commentId)
    if (parentComment) return parentComment

    // If not, check if it's a reply
    for (const parent of comments) {
      if (parent.replies) {
        const reply = parent.replies.find((r) => r.id === commentId)
        if (reply) return reply
      }
    }

    return undefined
  }

  // Cancel reply
  const handleCancelReply = (reviewId: string) => {
    setReplyToComment((prev) => ({ ...prev, [reviewId]: null }))
    setCommentText((prev) => ({ ...prev, [reviewId]: "" }))
    setTaggedUsers((prev) => ({ ...prev, [reviewId]: [] }))
  }

  // Handle comment input change with @mention detection
  const handleCommentInputChange = async (reviewId: string, e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setCommentText((prev) => ({ ...prev, [reviewId]: value }))

    // Get cursor position
    const cursorPos = e.target.selectionStart
    setCursorPosition((prev) => ({ ...prev, [reviewId]: cursorPos }))

    // Check for @ symbol
    const textBeforeCursor = value.substring(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf("@")

    if (atIndex !== -1 && (atIndex === 0 || textBeforeCursor[atIndex - 1] === " ")) {
      const query = textBeforeCursor.substring(atIndex + 1)

      if (query.length >= 1) {
        // Search for users
        const results = await searchUsers(query)
        if (isMounted.current) {
          setUserSearchResults(results)
          setShowUserSearch((prev) => ({ ...prev, [reviewId]: true }))
        }
      } else {
        if (isMounted.current) {
          setShowUserSearch((prev) => ({ ...prev, [reviewId]: false }))
        }
      }
    } else {
      if (isMounted.current) {
        setShowUserSearch((prev) => ({ ...prev, [reviewId]: false }))
      }
    }
  }

  // Handle selecting a user from the search results
  const handleSelectUser = (reviewId: string, user: { id: string; name: string; username: string }) => {
    // Add user to tagged users
    setTaggedUsers((prev) => ({
      ...prev,
      [reviewId]: [...(prev[reviewId] || []).filter((u) => u.id !== user.id), { id: user.id, name: user.name }],
    }))

    // Replace the @query with @username
    const text = commentText[reviewId] || ""
    const cursorPos = cursorPosition[reviewId] || 0
    const textBeforeCursor = text.substring(0, cursorPos)
    const atIndex = textBeforeCursor.lastIndexOf("@")

    if (atIndex !== -1) {
      const beforeAt = text.substring(0, atIndex)
      const afterCursor = text.substring(cursorPos)
      const newText = `${beforeAt}@${user.username} ${afterCursor}`

      setCommentText((prev) => ({ ...prev, [reviewId]: newText }))

      // Hide user search
      setShowUserSearch((prev) => ({ ...prev, [reviewId]: false }))

      // Focus back on input and set cursor position after the inserted username
      setTimeout(() => {
        const input = commentInputRefs[reviewId]
        if (input) {
          const newCursorPos = atIndex + user.username.length + 2 // +2 for @ and space
          input.focus()
          input.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  // Handle comment input focus
  const handleCommentInputFocus = (reviewId: string) => {
    setCommentInputFocus((prev) => ({ ...prev, [reviewId]: true }))
  }

  // Handle comment input blur
  const handleCommentInputBlur = (reviewId: string) => {
    // Delay hiding the user search to allow for clicking on results
    setTimeout(() => {
      if (isMounted.current) {
        setCommentInputFocus((prev) => ({ ...prev, [reviewId]: false }))
        setShowUserSearch((prev) => ({ ...prev, [reviewId]: false }))
      }
    }, 200)
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      previewImages.forEach((url) => URL.revokeObjectURL(url))
      editPreviewImages.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [previewImages, editPreviewImages])

  // Render tagged users badges
  const renderTaggedUserBadges = (reviewId: string) => {
    const users = taggedUsers[reviewId] || []
    if (users.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {users.map((user) => (
          <div key={user.id} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center">
            <AtSign className="h-3 w-3 mr-1" />
            {user.name}
            <button
              className="ml-1 hover:text-destructive"
              onClick={() => {
                setTaggedUsers((prev) => ({
                  ...prev,
                  [reviewId]: (prev[reviewId] || []).filter((u) => u.id !== user.id),
                }))
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    )
  }

  // Render comment component
  const renderComment = (comment: CommentWithAuthor, reviewId: string, isReply = false, parentCommentId?: string) => (
    <div key={comment.id} className={`${isReply ? "ml-8 mt-2" : "border-b last:border-b-0"} py-3`}>
      <div className="flex items-start gap-3">
        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
          {comment.authorAvatar ? (
            <Image
              src={comment.authorAvatar || "/placeholder.svg"}
              alt={comment.authorName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium">
              {comment.authorName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-sm">{comment.authorName}</span>
              <span className="text-xs text-muted-foreground ml-2">{comment.formattedDate}</span>
            </div>
            {user && user.id === comment.user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Comment actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDeleteComment(reviewId, comment.id, isReply, parentCommentId)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Show who the comment is replying to */}
          {comment.replyingTo && (
            <div className="text-xs text-muted-foreground mb-1">
              Replying to <span className="font-medium">@{comment.replyingTo}</span>
            </div>
          )}

          <p className="text-sm mt-1">
            {/* Render comment text with highlighted @mentions */}
            {comment.content.split(/(@\w+)/).map((part, index) => {
              if (part.startsWith("@")) {
                return (
                  <span key={index} className="text-primary font-medium">
                    {part}
                  </span>
                )
              }
              return part
            })}
          </p>

          {/* Tagged users */}
          {comment.taggedUserNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {comment.taggedUserNames.map((name, index) => (
                <div key={index} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  <AtSign className="h-2 w-2 inline mr-0.5" />
                  {name}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => handleReplyToComment(reviewId, comment.id, comment.authorName)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => handleLikeComment(reviewId, comment.id, isReply, parentCommentId)}
            >
              <Heart className="h-3 w-3 mr-1" />
              {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
            </Button>
          </div>

          {/* Show view replies button for parent comments with replies */}
          {!isReply && comment.replies && comment.replies.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs mt-2 pl-0 flex items-center text-muted-foreground hover:text-foreground"
              onClick={() => toggleReplies(comment.id)}
            >
              {expandedReplies[comment.id] ? "Hide" : "View"} {comment.replyCount}{" "}
              {comment.replyCount === 1 ? "reply" : "replies"}
              <ChevronRight
                className={`h-3 w-3 ml-1 transition-transform ${expandedReplies[comment.id] ? "rotate-90" : ""}`}
              />
            </Button>
          )}

          {/* Show replies if expanded */}
          {!isReply && expandedReplies[comment.id] && comment.replies && (
            <div className="mt-2 space-y-3">
              {comment.replies.map((reply) => renderComment(reply, reviewId, true, comment.id))}

              {/* Reply input for this specific comment */}
              {user && expandedReplies[comment.id] && (
                <div className="ml-8 mt-3">
                  <div className="flex gap-2">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl || "/placeholder.svg"}
                          alt={user.name || user.email}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                          {(user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder={`Reply to ${comment.authorName}...`}
                        className="min-h-[60px] text-sm"
                        value={commentText[`${reviewId}-reply-${comment.id}`] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [`${reviewId}-reply-${comment.id}`]: e.target.value,
                          }))
                        }
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          disabled={!commentText[`${reviewId}-reply-${comment.id}`]?.trim()}
                          onClick={() => {
                            if (commentText[`${reviewId}-reply-${comment.id}`]?.trim()) {
                              // Set the comment text for the review
                              setCommentText((prev) => ({
                                ...prev,
                                [reviewId]: commentText[`${reviewId}-reply-${comment.id}`] || "",
                              }))

                              // Submit the comment as a reply to this specific comment
                              handleSubmitComment(reviewId, comment.id)

                              // Clear the reply input
                              setCommentText((prev) => ({
                                ...prev,
                                [`${reviewId}-reply-${comment.id}`]: "",
                              }))
                            }
                          }}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Add this function to handle liking a review
  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to like reviews.",
      })
      return
    }

    try {
      const success = await likeReview(reviewId)

      if (success) {
        // Update the review's like count in the UI
        setReviews((prev) =>
          prev.map((review) =>
            review.id === reviewId ? { ...review, likes_count: (review.likes_count || 0) + 1 } : review,
          ),
        )

        toast({
          title: "Review liked",
          description: "You liked this review.",
        })
      }
    } catch (err: any) {
      console.error("Error liking review:", err)
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.message || "There was an error liking this review. Please try again.",
      })
    }
  }

  // Add animation to the like button
  const renderLikeButton = (reviewId: string, likesCount: number) => {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2 group"
        onClick={() => handleLikeReview(reviewId)}
      >
        <Heart
          className={`h-4 w-4 transition-all duration-300 ${likesCount > 0 ? "fill-red-500 text-red-500" : "group-hover:scale-110 group-hover:text-red-400"}`}
        />
        <span>{likesCount > 0 ? likesCount : ""}</span>
      </Button>
    )
  }

  // Add a stats bar to show review metrics
  const ReviewStats = ({ review }: { review: ReviewWithAuthor }) => {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-md mt-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center">
            <Heart className={`h-4 w-4 mr-1 ${review.likes_count > 0 ? "fill-red-500 text-red-500" : ""}`} />
            <span className="text-sm">{review.likes_count || 0}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span className="text-sm">{review.comments_count || 0}</span>
          </div>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          <span className="text-xs text-muted-foreground">{review.formattedDate}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rainforest-bg min-h-screen">
      <Navbar />

      <div className="container py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("reviewsTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("reviewsSubtitle")}</p>

          <div className="mt-8">
            <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
              {user ? (
                <DialogTrigger asChild>
                  <Button size="lg">{t("writeReview")}</Button>
                </DialogTrigger>
              ) : (
                <Card className="max-w-md mx-auto bg-background/80 backdrop-blur-sm">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <LogIn className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium">Sign in to share your experience</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Join our community to share your travel stories and help others plan their adventures
                        </p>
                      </div>
                      <Button asChild className="mt-2">
                        <Link href="/login">Sign In</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>{t("writeReview")}</DialogTitle>
                  <DialogDescription>Share your travel experience with the community</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-y-auto flex-grow">
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination *</Label>
                    <Input
                      id="destination"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Bali, Indonesia"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rating *</Label>
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
                    <Label htmlFor="review">Your Review *</Label>
                    <Textarea
                      id="review"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience..."
                      rows={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Add Photos (Optional)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {previewImages.map((img, index) => (
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
                            onClick={() => removeImage(index)}
                          >
                            <span className="sr-only">Remove</span>
                            <Trash2 className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}

                      {previewImages.length < 5 && (
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

                <DialogFooter className="sticky bottom-0 pt-2 bg-background border-t mt-auto flex justify-center items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setReviewDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={isSubmitting || !rating || !destination || !reviewText.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Review Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Edit Review</DialogTitle>
                  <DialogDescription>Update your travel experience</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-y-auto flex-grow">
                  <div className="space-y-2">
                    <Label htmlFor="edit-destination">Destination *</Label>
                    <Input
                      id="edit-destination"
                      value={editDestination}
                      onChange={(e) => setEditDestination(e.target.value)}
                      placeholder="e.g. Bali, Indonesia"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Rating *</Label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setEditRating(star)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= editRating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-review">Your Review *</Label>
                    <Textarea
                      id="edit-review"
                      value={editReviewText}
                      onChange={(e) => setEditReviewText(e.target.value)}
                      placeholder="Share your experience..."
                      rows={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Photos</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {editPreviewImages.map((img, index) => (
                        <div key={index} className="relative aspect-square rounded-md overflow-hidden">
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={`Review image ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          {!img.includes("api/files/") && (
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-black/50 rounded-full p-1"
                              onClick={() => removeEditImage(index)}
                            >
                              <span className="sr-only">Remove</span>
                              <Trash2 className="h-4 w-4 text-white" />
                            </button>
                          )}
                        </div>
                      ))}

                      {editPreviewImages.length < 5 && (
                        <label
                          htmlFor="edit-image-upload"
                          className="aspect-square border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Add Photo</span>
                          <input
                            id="edit-image-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={handleEditImageUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="sticky bottom-0 pt-2 bg-background border-t mt-auto flex justify-center items-center gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmitEditReview}
                    disabled={isEditSubmitting || !editRating || !editDestination || !editReviewText.trim()}
                  >
                    {isEditSubmitting ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Updating...
                      </>
                    ) : (
                      "Update Review"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search reviews..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all">All Reviews</TabsTrigger>
              <TabsTrigger value="top">Top Rated</TabsTrigger>
              <TabsTrigger
                value="mine"
                onClick={() => {
                  if (!user && !getPocketBase()?.authStore?.isValid) {
                    toast({
                      variant: "destructive",
                      title: "Authentication required",
                      description: "Please sign in to view your reviews.",
                    })
                  }
                }}
              >
                My Reviews
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Sort by <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortOrder("-created")}>
                Newest first
                {sortOrder === "-created" && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("created")}>
                Oldest first
                {sortOrder === "created" && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("-rating")}>
                Highest rated
                {sortOrder === "-rating" && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("-likes_count")}>
                Most liked
                {sortOrder === "-likes_count" && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("-comments_count")}>
                Most commented
                {sortOrder === "-comments_count" && <Check className="ml-2 h-4 w-4" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          // Loading skeletons
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-60" />
                  </div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-4 mx-0.5" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          // Error state with sign-in option
          <div className="text-center py-12">
            <div className="bg-destructive/10 text-destructive p-4 rounded-md inline-block mb-4">
              <p>{error}</p>
            </div>
            {error.includes("sign in") ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">You need to be signed in to view your reviews</p>
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </div>
            ) : (
              <Button onClick={loadReviews}>Try Again</Button>
            )}
          </div>
        ) : reviews.length === 0 ? (
          // Empty state
          <div className="text-center py-12">
            <div className="bg-muted p-8 rounded-lg inline-block mb-6">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No reviews found</h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === "mine"
                  ? "You haven't written any reviews yet."
                  : "Be the first to share your travel experience!"}
              </p>
              {user && <Button onClick={() => setReviewDialogOpen(true)}>Write a Review</Button>}
              {!user && activeTab === "mine" && (
                <Button asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          // Reviews list
          <div className="space-y-8">
            {reviews.map((review) => (
              // Update the review card to include engagement stats
              <Card key={review.id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-start gap-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted">
                    {review.authorAvatar ? (
                      <Image
                        src={review.authorAvatar || "/placeholder.svg"}
                        alt={review.authorName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                        {review.authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{review.authorName}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {review.destination}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {review.formattedDate}
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
                  <p className="text-muted-foreground">{review.review_text}</p>

                  {review.photoUrl && (
                    <div className="mt-4">
                      <div className="relative aspect-video rounded-md overflow-hidden max-w-lg mx-auto">
                        <Image
                          src={review.photoUrl || "/placeholder.svg"}
                          alt={`${review.authorName}'s travel photo`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}

                  <ReviewStats review={review} />
                </CardContent>
                <CardFooter className="flex flex-col">
                  <div className="flex justify-between w-full">
                    <div className="flex items-center gap-4">
                      {renderLikeButton(review.id, review.likes_count || 0)}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => toggleComments(review.id)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>
                          {showComments[review.id] ? "Hide" : ""}
                          {!showComments[review.id] && review.comments_count > 0 && review.comments_count}
                        </span>
                      </Button>
                    </div>

                    {user && user.id === review.reviewer && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleEditReview(review)}
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Comments section */}
                  {showComments[review.id] && (
                    <div className="w-full mt-4 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">Comments</h4>

                      {/* Comments list */}
                      <div className="space-y-1 mb-4">
                        {loadingComments[review.id] ? (
                          <div className="py-4 flex justify-center">
                            <svg
                              className="animate-spin h-5 w-5 text-primary"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          </div>
                        ) : reviewComments[review.id]?.length > 0 ? (
                          <div className="space-y-1">
                            {reviewComments[review.id].map((comment) => renderComment(comment, review.id))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground py-2">
                            No comments yet. Be the first to comment!
                          </p>
                        )}
                      </div>

                      {/* Comment form */}
                      {user ? (
                        <div className="flex flex-col space-y-2">
                          {replyToComment[review.id] && (
                            <div className="flex items-center justify-between bg-muted px-3 py-1 rounded-md text-sm">
                              <span>Replying to comment</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => handleCancelReply(review.id)}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}

                          {/* Tagged users */}
                          {renderTaggedUserBadges(review.id)}

                          <div className="relative">
                            <Textarea
                              id={`comment-input-${review.id}`}
                              ref={(el) => (commentInputRefs[review.id] = el)}
                              placeholder="Add a comment... Use @ to mention users"
                              value={commentText[review.id] || ""}
                              onChange={(e) => handleCommentInputChange(review.id, e)}
                              onFocus={() => handleCommentInputFocus(review.id)}
                              onBlur={() => handleCommentInputBlur(review.id)}
                              className="min-h-[80px] pr-10"
                            />

                            <Button
                              className="absolute bottom-2 right-2"
                              size="sm"
                              disabled={!commentText[review.id]?.trim()}
                              onClick={() => handleSubmitComment(review.id)}
                            >
                              Post
                            </Button>

                            {/* User search results */}
                            {showUserSearch[review.id] && userSearchResults.length > 0 && (
                              <div className="absolute z-10 w-full max-h-60 overflow-y-auto bg-background border rounded-md shadow-md mt-1">
                                <Command>
                                  <CommandList>
                                    <CommandGroup heading="Mention a user">
                                      {userSearchResults.map((user) => (
                                        <CommandItem
                                          key={user.id}
                                          onSelect={() => handleSelectUser(review.id, user)}
                                          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-accent"
                                        >
                                          <div className="relative h-6 w-6 rounded-full overflow-hidden bg-muted">
                                            {user.avatar ? (
                                              <Image
                                                src={user.avatar || "/placeholder.svg"}
                                                alt={user.name}
                                                fill
                                                className="object-cover"
                                              />
                                            ) : (
                                              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <div className="font-medium text-sm">{user.name}</div>
                                            <div className="text-xs text-muted-foreground">@{user.username}</div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                    {userSearchResults.length === 0 && <CommandEmpty>No users found</CommandEmpty>}
                                  </CommandList>
                                </Command>
                              </div>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="inline-flex items-center">
                              <AtSign className="h-3 w-3 mr-1" />
                              Type @ to mention someone
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground mb-2">Please sign in to comment</p>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/login">Sign In</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                  </PaginationItem>
                )}

                {currentPage > 2 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                  </PaginationItem>
                )}

                {currentPage > 3 && <PaginationEllipsis />}

                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>{currentPage - 1}</PaginationLink>
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</PaginationLink>
                  </PaginationItem>
                )}

                {currentPage < totalPages - 2 && <PaginationEllipsis />}

                {currentPage < totalPages - 1 && (
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                  </PaginationItem>
                )}

                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

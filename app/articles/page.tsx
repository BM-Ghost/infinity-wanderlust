"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { ShareButton } from "@/components/share-button"
import {
  Calendar, User, Plus, Search, X, Star, MessageSquare, Heart,
  ChevronRight, Pencil, Trash2, BookOpen, Clock, Plane
} from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useArticles } from "@/hooks/useArticles"
import { isBlogReview, ReviewWithAuthor, deleteReview, stripBlogMarker } from "@/lib/reviews"
import { getUserLikedItems, toggleItemLike } from "@/lib/likes"
import { ImageCollage } from "@/components/image-collage"

const ADMIN_DISPLAY_NAME = "Infinity Wanderlust Travels"

export default function ArticlesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const isAdmin = user?.email?.toLowerCase() === "infinitywanderlusttravels@gmail.com"
  const { toast } = useToast()

  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [pendingLikes, setPendingLikes] = useState<Record<string, boolean>>({})
  const [optimisticLikes, setOptimisticLikes] = useState<Record<string, number>>({})
  const [likedByUser, setLikedByUser] = useState<Record<string, boolean>>({})

  const { data, isLoading, isError } = useArticles({ page: currentPage, perPage: 12, enabled: true })
  const articles = (data?.items || []).filter((article) => isBlogReview(article))
  const totalPages = data?.totalPages || 1

  const filteredArticles = searchQuery
    ? articles.filter(
        (a) =>
          a.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stripBlogMarker(a.review_text || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles

  useEffect(() => {
    const loadLikedArticles = async () => {
      if (!user?.id) {
        setLikedByUser({})
        return
      }

      const likedIds = await getUserLikedItems(user.id, "review")
      const likedMap: Record<string, boolean> = {}
      likedIds.forEach((id) => {
        likedMap[id] = true
      })
      setLikedByUser(likedMap)
    }

    void loadLikedArticles()
  }, [user?.id])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const resolveAuthorName = (review: ReviewWithAuthor) => {
    const rawName = (review.authorName || review.expand?.reviewer?.name || "").trim()
    if (!rawName || rawName === "Unknown User" || rawName === "Anonymous") return ADMIN_DISPLAY_NAME
    return rawName
  }

  const truncateText = (text: string, maxLength = 120) => {
    if (!text) return ""
    const stripped = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    if (stripped.length <= maxLength) return stripped
    return stripped.substring(0, maxLength) + "..."
  }

  const estimateReadTime = (text: string) => {
    if (!text) return "1 min"
    const words = text.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length
    const mins = Math.max(1, Math.round(words / 200))
    return `${mins} min read`
  }

  const getReviewImageUrls = (review: ReviewWithAuthor): string[] => {
    const photos = review.photos
    if (!photos) return ["/placeholder.svg"]
    if (typeof photos === "string") {
      try {
        const parsed = JSON.parse(photos)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter((p: unknown): p is string => typeof p === "string")
            .map((p) => `https://remain-faceghost.pockethost.io/api/files/reviews/${review.id}/${p}`)
        }
      } catch { /* ignore */ }
      return ["/placeholder.svg"]
    }
    if (Array.isArray(photos)) {
      return (photos as unknown[])
        .filter((p: unknown): p is string => typeof p === "string")
        .map((p: string) => `https://remain-faceghost.pockethost.io/api/files/reviews/${review.id}/${p}`)
    }
    return ["/placeholder.svg"]
  }

  const getAvatarUrl = (review: ReviewWithAuthor): string | null => {
    if (review.authorAvatar) return review.authorAvatar
    const reviewer = review.expand?.reviewer
    if (reviewer?.avatar) {
      return `https://remain-faceghost.pockethost.io/api/files/_pb_users_auth_/${reviewer.id}/${reviewer.avatar}`
    }
    return null
  }

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article? This cannot be undone.")) return
    try {
      await deleteReview(articleId)
      toast({ title: "Article deleted", description: "The article has been removed." })
      setCurrentPage(1)
      window.location.reload()
    } catch (error: any) {
      toast({ variant: "destructive", title: "Delete failed", description: error?.message || "Could not delete the article." })
    }
  }

  const handleLike = async (articleId: string, currentLikesCount: number) => {
    if (!isAuthenticated || !user?.id) {
      toast({ title: "Authentication required", description: "Please sign in to like articles.", variant: "destructive" })
      return
    }

    if (pendingLikes[articleId]) return

    const currentlyLiked = !!likedByUser[articleId]
    const nextLiked = !currentlyLiked
    const nextLikesCount = Math.max(0, currentLikesCount + (nextLiked ? 1 : -1))

    setPendingLikes((prev) => ({ ...prev, [articleId]: true }))
    setOptimisticLikes((prev) => ({ ...prev, [articleId]: nextLikesCount }))
    setLikedByUser((prev) => ({ ...prev, [articleId]: nextLiked }))

    try {
      const result = await toggleItemLike(articleId, "review", user.id)
      setOptimisticLikes((prev) => ({ ...prev, [articleId]: result.count }))
      setLikedByUser((prev) => ({ ...prev, [articleId]: result.liked }))
      toast({ title: result.liked ? "Liked" : "Unliked", description: result.liked ? "Thanks for your feedback." : "Like removed." })
    } catch (error: any) {
      setOptimisticLikes((prev) => ({ ...prev, [articleId]: currentLikesCount }))
      setLikedByUser((prev) => ({ ...prev, [articleId]: currentlyLiked }))

      toast({
        title: "Could not like article",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setPendingLikes((prev) => ({ ...prev, [articleId]: false }))
    }
  }

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative bg-[url('/images/explore.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />
        <div className="relative z-10 container mx-auto px-4 py-14 md:py-20">
          <div className="max-w-3xl mx-auto text-center text-white">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm mb-5">
              <Plane className="h-3.5 w-3.5" /> Travel Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg mb-4">
              Stories &amp; Inspiration
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl mx-auto">
              Discover travel tales, destination guides, and insider tips from around the world.
            </p>

            {/* Search bar inside hero */}
            <div className="mt-8 max-w-xl mx-auto">
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles by destination or topic..."
                  className="pl-12 pr-4 h-12 rounded-full bg-background/90 backdrop-blur-sm border-0 shadow-lg text-foreground"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
            </div>

            {isAdmin && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => router.push("/articles/create")}
                >
                  <Plus className="mr-2 h-4 w-4" /> Write New Article
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => router.push("/articles/migrate")}
                >
                  Migrate Legacy Blogs
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 pt-6 pb-12 md:pt-8 md:pb-14">
        {/* Article count */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-muted-foreground">
              {filteredArticles.length} article{filteredArticles.length !== 1 ? "s" : ""}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-md">
                <Skeleton className="h-52 w-full" />
                <CardHeader>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">Something went wrong</h3>
            <p className="text-muted-foreground mt-2">Could not load articles. Please try again later.</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredArticles.map((article: ReviewWithAuthor) => {
                const images = getReviewImageUrls(article)
                const avatarUrl = getAvatarUrl(article)
                const authorName = resolveAuthorName(article)
                const initials = authorName.charAt(0).toUpperCase()
                const displayContent = stripBlogMarker(article.review_text || "")
                const displayLikesCount = optimisticLikes[article.id] ?? (article.likes_count || 0)

                return (
                  <Card
                    key={article.id}
                    className="group overflow-hidden flex flex-col h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="relative h-52 w-full overflow-hidden">
                      <ImageCollage images={images} alt={article.destination || "Article image"} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                      {/* Reading time badge */}
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs px-2.5 py-1 font-medium">
                        <Clock className="h-3 w-3" />
                        {estimateReadTime(displayContent)}
                      </span>

                      {/* Rating badge */}
                      {(article.rating ?? 0) > 0 && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-yellow-500/90 text-white text-xs px-2.5 py-1 font-semibold">
                          <Star className="h-3 w-3 fill-white" />
                          {article.rating}
                        </span>
                      )}

                      {/* Admin actions */}
                      {isAdmin && (
                        <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-background/90 shadow hover:bg-background"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/articles/create?edit=${article.id}`) }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-background/90 shadow hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteArticle(article.id) }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex-1">
                        <h2 className="text-lg font-bold leading-snug mb-2 group-hover:text-primary transition-colors">
                          <Link href={`/articles/${article.id}`} className="hover:underline">
                            {article.destination || "Untitled Article"}
                          </Link>
                        </h2>

                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                          {truncateText(displayContent || "No content available")}
                        </p>

                        {displayContent && displayContent.length > 120 && (
                          <Link
                            href={`/articles/${article.id}`}
                            className="text-primary text-sm font-semibold inline-flex items-center hover:underline"
                          >
                            Continue Reading <ChevronRight className="ml-0.5 h-4 w-4" />
                          </Link>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t space-y-3">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            {isAuthenticated && (
                              <>
                                <button
                                  onClick={() => handleLike(article.id, displayLikesCount)}
                                  disabled={!!pendingLikes[article.id]}
                                  className="flex items-center gap-1 hover:text-red-500 transition-colors"
                                >
                                  <Heart className={`h-4 w-4 ${likedByUser[article.id] ? "fill-red-500 text-red-500" : ""}`} />
                                  <span>{displayLikesCount}</span>
                                </button>
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-4 w-4" />
                                  {article.comments_count || 0}
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(article.created)}
                            </span>
                            <ShareButton
                              url={typeof window !== "undefined" ? `${window.location.origin}/articles/${article.id}` : ""}
                              title={article.destination || "Travel Article"}
                              description={truncateText(displayContent || "", 80)}
                              className="h-8 w-8"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {avatarUrl ? (
                            <Image
                              src={avatarUrl}
                              alt={authorName}
                              width={28}
                              height={28}
                              className="h-7 w-7 rounded-full object-cover ring-2 ring-background"
                              priority={false}
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary ring-2 ring-background">
                              {initials}
                            </div>
                          )}
                          <span className="text-sm font-medium">{authorName}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="inline-flex items-center gap-2 bg-muted/50 rounded-full px-2 py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-3">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
              <BookOpen className="h-10 w-10 text-muted-foreground/60" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No results found" : "No articles yet"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? `No articles match "${searchQuery}". Try a different search term.`
                : "New travel stories and guides coming soon. Stay tuned!"}
            </p>
            {searchQuery && (
              <Button variant="outline" className="mt-5" onClick={() => setSearchQuery("")}>
                <X className="mr-2 h-4 w-4" /> Clear Search
              </Button>
            )}
            {isAdmin && !searchQuery && (
              <Button className="mt-5" onClick={() => router.push("/articles/create")}>
                <Plus className="mr-2 h-4 w-4" /> Write Your First Article
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

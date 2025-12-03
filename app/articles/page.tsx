"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Calendar, User, Plus, Search, X, Star, MessageSquare, Heart, ChevronRight } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { useArticles } from "@/hooks/useArticles"
import { ReviewWithAuthor } from "@/lib/reviews"
import { ImageCollage } from "@/components/image-collage"

export default function ArticlesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const isAuthenticated = !!user
  const isAdmin = user?.email === 'infinitywanderlusttravels@gmail.com'
  const { toast } = useToast()
  
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Use the useArticles hook to fetch articles (which are actually admin's reviews)
  const { data, isLoading, isError } = useArticles({
    page: currentPage,
    perPage: 10,
    enabled: true
  })
  const articles = data?.items || []
  const totalPages = data?.totalPages || 1
  
  // Filter articles based on search query
  const filteredArticles = searchQuery
    ? articles.filter(article => 
        article.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.review_text?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles

  // Format date for display (matches reviews page format)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  
  // Truncate text for preview
  const truncateText = (text: string, maxLength: number = 150) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Get review image URLs
  const getReviewImageUrls = (review: ReviewWithAuthor): string[] => {
    const photos = review.photos
    if (!photos) return ['/placeholder.svg']
    
    // If photos is a string, try to parse it as JSON
    if (typeof photos === 'string') {
      try {
        const parsedPhotos = JSON.parse(photos)
        if (Array.isArray(parsedPhotos) && parsedPhotos.length > 0) {
          return parsedPhotos
            .filter((photo: unknown): photo is string => typeof photo === 'string')
            .map(photo => 
              `https://remain-faceghost.pockethost.io/api/files/reviews/${review.id}/${photo}`
            )
        }
      } catch (e) {
        console.error('Error parsing photos:', e)
      }
      return ['/placeholder.svg']
    }
    
    // If it's already an array
    if (Array.isArray(photos)) {
      return (photos as unknown[])
        .filter((photo: unknown): photo is string => typeof photo === 'string')
        .map((photo: string) => 
          `https://remain-faceghost.pockethost.io/api/files/reviews/${review.id}/${photo}`
        )
    }
    
    return ['/placeholder.svg']
  }

  // Get avatar URL
  const getAvatarUrl = (review: ReviewWithAuthor): string | null => {
    // First try the formatted authorAvatar
    if (review.authorAvatar) return review.authorAvatar
    
    // Fall back to expand.reviewer.avatar
    const reviewer = review.expand?.reviewer
    if (reviewer?.avatar) {
      return `https://remain-faceghost.pockethost.io/api/files/_pb_users_auth_/${reviewer.id}/${reviewer.avatar}`
    }
    
    return null
  }
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Client-side filtering is handled by the filteredArticles variable
  }
  
  // Handle like action
  const handleLike = async (articleId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like articles.",
        variant: "destructive"
      })
      return
    }
    
    try {
      // TODO: Implement like functionality
      toast({
        title: "Liked!",
        description: "Thanks for your feedback!"
      })
    } catch (error) {
      console.error("Error liking article:", error)
      toast({
        title: "Error",
        description: "Failed to like the article. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  return (
    <div className="articles-page min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Blogs</h1>
            <p className="text-muted-foreground">
              Read my latest travel stories and experiences
            </p>
          </div>
          
          {isAdmin && (
            <Button onClick={() => router.push('/reviews/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Write Article
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </div>
        
        {/* Articles grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-t-lg" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">Error loading articles</h3>
            <p className="text-muted-foreground mt-2">
              Please try again later
            </p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article: ReviewWithAuthor) => (
                <Card key={article.id} className="overflow-hidden flex flex-col h-full group hover:shadow-lg transition-shadow duration-200">
                  {/* Image Carousel */}
                  <div className="relative h-48 w-full overflow-hidden">
                    <ImageCollage 
                      images={getReviewImageUrls(article)} 
                      alt={article.destination || 'Article image'}
                    />
                  </div>
                  
                  {/* Article Content */}
                  <div className="flex flex-col flex-1 p-4">
                    <div className="flex-1">
                      <CardHeader className="p-0 pb-3">
                        <CardTitle className="text-xl mb-1">
                          <Link href={`/articles/${article.id}`} className="hover:underline hover:text-primary">
                            {article.destination || 'Untitled Article'}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center gap-1 text-yellow-500 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < (article.rating || 0) ? 'fill-current' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-0">
                        <div className="text-sm text-foreground/90 mb-4">
                          <p className="line-clamp-3">
                            {truncateText(article.review_text || 'No content available')}
                          </p>
                          {article.review_text && article.review_text.length > 150 && (
                            <Link 
                              href={`/articles/${article.id}`} 
                              className="text-primary text-sm font-medium inline-flex items-center mt-1 hover:underline"
                            >
                              Read more <ChevronRight className="ml-1 h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </div>
                    
                    {/* Footer with stats */}
                    <div className="mt-auto pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="flex items-center mr-4">
                            <button 
                              onClick={() => handleLike(article.id)}
                              className="flex items-center hover:text-foreground transition-colors"
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              <span>{article.likes_count || 0}</span>
                            </button>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            <span>{article.comments_count || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(article.created)}
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center">
                        {(() => {
                          const avatarUrl = getAvatarUrl(article)
                          const authorName = article.authorName || article.expand?.reviewer?.name || 'Anonymous'
                          const initials = authorName.charAt(0).toUpperCase()
                          
                          return (
                            <>
                              {avatarUrl ? (
                                <Image
                                  src={avatarUrl}
                                  alt={authorName}
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 rounded-full mr-2 object-cover"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs mr-2">
                                  {initials}
                                </div>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {authorName}
                              </span>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No articles found</h3>
            <p className="text-muted-foreground mt-2">
              {searchQuery ? 'No articles match your search.' : 'No articles have been published yet.'}
            </p>
            {isAdmin && !searchQuery && (
              <Button className="mt-4" onClick={() => router.push('/reviews/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Write Your First Article
              </Button>
            )}
            {searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setSearchQuery('')}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  Settings,
  MapPin,
  Calendar,
  Globe,
  Camera,
  ImageIcon,
  Star,
  BookOpen,
  CalendarCheck,
  Users,
  Grid,
  List,
  X,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Github,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { getPocketBase } from "@/lib/pocketbase"

// Import hooks
import { useUsers } from "@/hooks/useUsers"
import { useReviews } from "@/hooks/useReviews"
import { useUploads } from "@/hooks/useUploads"
import { useEvents } from "@/hooks/useEvents"
import { useBookings } from "@/hooks/useBookings"
import { QueryClient } from "@tanstack/react-query"

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch all users, uploads, reviews, events, bookings
  const { data: users = [], isLoading: isUsersLoading } = useUsers(1)
  const { data: uploads = [], isLoading: isUploadsLoading } = useUploads(1)
  const { data: reviews = [], isLoading: isReviewsLoading } = useReviews(1)
  const { data: events = [], isLoading: isEventsLoading } = useEvents(1)
  const { data: bookings = [], isLoading: isBookingsLoading } = useBookings(user?.id || "")

  // Find the current user from users list
  const currentUser = users.find((u: any) => u.id === user?.id) || user

  // Followers: get user objects for follower IDs
  const followers = users.filter((u: any) => currentUser?.followers?.includes(u.id))

  // Following: get user objects for following IDs
  const followingUsers = users.filter((u: any) => currentUser?.following?.includes(u.id))

  console.log("followers:", followers)
  console.log("followingUsers:", followingUsers)

  // Stats
  const stats = {
    followers: currentUser?.followers?.length || 0,
    following: currentUser?.following?.length || 0,
    reviews: reviews.length,
    uploads: uploads.length,
    events: events.length,
    bookings: bookings.length,
  }

  // User's uploads and reviews
  const userReviews = reviews.filter((r: any) => r.user === currentUser?.id)

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [justFollowed, setJustFollowed] = useState<string[]>([])
  const [selectedUpload, setSelectedUpload] = useState<any>(null)
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)

  // Add a state to force re-render after follow/unfollow
  const [refreshKey, setRefreshKey] = useState(0)
  const queryClient = new QueryClient()

  // Suggested users: exclude self and users in followingIds
  const suggestedUsers = users.filter(
    (u: any) =>
      u.id !== currentUser?.id &&
      !currentUser?.following?.includes(u.id)
  )

  // Function to follow a user
  const handleFollow = async (userId: string) => {
    try {
      const pb = getPocketBase()
      if (!pb || !pb.authStore.model) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to follow users.",
        })
        return
      }

      const currentUserId = pb.authStore.model.id
      const userToFollow = users.find((u: any) => u.id === userId)
      if (!userToFollow) {
        toast({
          variant: "destructive",
          title: "User not found",
          description: "The user you are trying to follow does not exist.",
        })
        return
      }

      // Update the user being followed
      const currentFollowers = userToFollow.followers || []
      const updatedFollowers = [...new Set([...currentFollowers, currentUserId])]
      
      // Update the current user's following
      const currentUserData = users.find((u: any) => u.id === currentUserId)
      const currentFollowing = currentUserData?.following || []
      const updatedFollowing = [...new Set([...currentFollowing, userId])]

      try {
        await pb.collection("users").update(userId, {
          followers: updatedFollowers,
        })

        await pb.collection("users").update(currentUserId, {
          following: updatedFollowing,
        })

        setJustFollowed((prev) => [...prev, userId]) // Add to justFollowed
        setRefreshKey((k) => k + 1) // Force re-render

        queryClient.invalidateQueries({ queryKey: ["all-users"] })

        toast({
          title: "Success",
          description: `You are now following ${userToFollow.username}`,
        })

      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: err?.response?.data?.message ||
            err?.message ||
            "Failed to complete follow action. Please try again.",
        })
        return
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to follow user. Please try again.",
      })
    }
  }

  // Function to unfollow a user
  const handleUnfollow = async (userId: string) => {
    try {
      const pb = getPocketBase()
      if (!pb || !pb.authStore.model) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to unfollow users.",
        })
        return
      }
      const currentUserId = pb.authStore.model.id

      // Fetch latest user data from PocketBase
      const [userToUnfollow, currentUserData] = await Promise.all([
        pb.collection("users").getOne(userId),
        pb.collection("users").getOne(currentUserId),
      ])

      // Remove current user from their followers
      const updatedFollowers = (userToUnfollow.followers || []).filter((id: string) => id !== currentUserId)
      // Remove them from your following
      const updatedFollowing = (currentUserData.following || []).filter((id: string) => id !== userId)

      await pb.collection("users").update(userId, { followers: updatedFollowers })
      await pb.collection("users").update(currentUserId, { following: updatedFollowing })

      setJustFollowed((prev) => prev.filter((id) => id !== userId)) // Remove from justFollowed
      setRefreshKey((k) => k + 1) // Force re-render

      queryClient.invalidateQueries({ queryKey: ["all-users"] })

      toast({ title: "Unfollowed", description: `You unfollowed ${userToUnfollow.username}` })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to unfollow user.",
      })
    }
  }

  // Function to detect social media links and return appropriate icon
  const getSocialIcon = (url: string) => {
    if (!url) return { icon: Globe, name: "Website" }

    const lowerUrl = url.toLowerCase()

    if (lowerUrl.includes("instagram.com")) return { icon: Instagram, name: "Instagram" }
    if (lowerUrl.includes("facebook.com")) return { icon: Facebook, name: "Facebook" }
    if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return { icon: Twitter, name: "Twitter" }
    if (lowerUrl.includes("linkedin.com")) return { icon: Linkedin, name: "LinkedIn" }
    if (lowerUrl.includes("youtube.com")) return { icon: Youtube, name: "YouTube" }
    if (lowerUrl.includes("github.com")) return { icon: Github, name: "GitHub" }

    return { icon: Globe, name: "Website" }
  }

  // Extract short bio from about field if it's in [brackets]
  const extractShortBio = (about?: string): { shortBio: string | undefined; fullAbout: string | undefined } => {
    if (!about) return { shortBio: undefined, fullAbout: undefined }

    const shortBioMatch = about.match(/^\[(.*?)\]([\s\S]*)$/)
    if (shortBioMatch) {
      return {
        shortBio: shortBioMatch[1].trim(),
        fullAbout: shortBioMatch[2].trim(),
      }
    }

    return { shortBio: undefined, fullAbout: about }
  }

  // Loading state
  if (isUsersLoading || isUploadsLoading || isReviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user && typeof window !== "undefined" && !localStorage.getItem("pocketbase_auth")) {
    router.push("/login")
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getEventImageUrl = (event: any): string => {
    if (!event) return "/placeholder.svg"
    if (event.imageUrl) return event.imageUrl
    if (event.images?.length) {
      return `https://remain-faceghost.pockethost.io/api/files/${event.collectionId}/${event.id}/${event.images[0]}`
    }
    return "/placeholder.svg"
  }

  const { shortBio, fullAbout } = extractShortBio(user?.about)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container py-8 md:py-16">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Profile Image */}
            <div className="relative">
              <div className="relative h-32 w-32 md:h-40 md:w-40 rounded-full overflow-hidden bg-muted border-4 border-background shadow-lg">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl || "/placeholder.svg"}
                    alt={user.name || user.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                    <span className="text-4xl font-bold">
                      {(user?.name?.charAt(0) || user?.username?.charAt(0) || "").toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-2xl md:text-3xl font-bold">{user?.name || user?.username}</h1>
                <div className="flex gap-2 md:ml-auto">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mb-4">
                {user?.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{user.location}</span>
                  </div>
                )}

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Joined {user?.created ? formatDate(user.created) : ""}</span>
                </div>

                {user?.Links && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    {(() => {
                      const { icon: Icon, name } = getSocialIcon(user.Links)
                      return (
                        <>
                          <Icon className="h-4 w-4 mr-1" />
                          <a
                            href={user.Links}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                            aria-label={name}
                          >
                            {user.Links.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                          </a>
                        </>
                      )
                    })()}
                  </div>
                )}
              </div>

              {(user?.bio || shortBio) && (
                <div className="mb-4 max-w-2xl">
                  <p className="text-sm font-medium">{user?.bio || shortBio}</p>
                </div>
              )}

              {fullAbout && (
                <div className="bg-muted/30 p-4 rounded-lg mb-6 max-w-2xl">
                  <h3 className="text-sm font-medium mb-2">About Me</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{fullAbout}</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center mt-6">
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="bg-background/50 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:bg-background/70 transition-colors"
                >
                  <div className="text-xl font-bold">{stats.followers}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </button>
                <button
                  onClick={() => setShowFollowingModal(true)}
                  className="bg-background/50 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:bg-background/70 transition-colors"
                >
                  <div className="text-xl font-bold">{stats.following}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </button>
                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <div className="text-xl font-bold">{stats.reviews}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <div className="text-xl font-bold">{stats.uploads}</div>
                  <div className="text-xs text-muted-foreground">Uploads</div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <div className="text-xl font-bold">{stats.events}</div>
                  <div className="text-xs text-muted-foreground">Events</div>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                  <div className="text-xl font-bold">{stats.bookings}</div>
                  <div className="text-xs text-muted-foreground">Bookings</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Content Tabs */}
        <Tabs defaultValue="uploads" className="w-full">
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="uploads" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Uploads</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Bookings</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Events</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Uploads Tab - Masonry Grid */}
          <TabsContent value="uploads">
            {uploads?.length > 0 ? (
              <div className={`columns-2 md:columns-3 gap-4`}>
                {uploads.map((upload: any) => (
                  <div
                    key={upload.id}
                    className="mb-4 break-inside-avoid cursor-pointer group relative rounded-lg overflow-hidden"
                    onClick={() => setSelectedUpload(upload)}
                  >
                    <Image
                      src={upload.imageUrl || "/placeholder.svg"}
                      alt={upload.caption || "Gallery image"}
                      width={400}
                      height={400}
                      className="object-cover w-full h-auto transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-white text-xs">{upload.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No uploads yet</h3>
                <Button asChild>
                  <Link href="/gallery">Upload Photos</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {userReviews.length > 0 ? (
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" : "space-y-4"}
              >
                {userReviews.map((review: any) => (
                  <Card key={review.id} className="overflow-hidden h-full">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{review.destination}</h3>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{review.review_text}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">{formatDate(review.created)}</p>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {review.likes_count || 0}
                          </span>
                          <span className="flex items-center text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {review.comments_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                <p className="text-muted-foreground mb-6">Share your travel experiences with the community</p>
                <Button asChild>
                  <Link href="/reviews">Write a Review</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
              {bookings?.length > 0 ? (
              <div className={`columns-2 md:columns-3 gap-4`}>
                {bookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="mb-4 break-inside-avoid cursor-pointer group relative rounded-lg overflow-hidden"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <Image
                      src={getEventImageUrl(booking.expand?.event)}
                      alt={booking.caption || "Gallery image"}
                      width={400}
                      height={400}
                      className="object-cover w-full h-auto transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-white text-xs">{booking.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-6">Book your next adventure with us</p>
              <Button asChild>
                <Link href="/events">Explore Events</Link>
              </Button>
            </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {events?.length > 0 ? (
              <div className={`columns-2 md:columns-3 gap-4`}>
                {events.map((event: any) => (
                  <div
                    key={event.id}
                    className="mb-4 break-inside-avoid cursor-pointer group relative rounded-lg overflow-hidden"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Image
                      src={getEventImageUrl(event)}
                      alt={event.caption || "Gallery image"}
                      width={400}
                      height={400}
                      className="object-cover w-full h-auto transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <span className="text-white text-xs">{event.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-6">Join upcoming travel events</p>
              <Button asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Upload Modal Preview */}
        {selectedUpload && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setSelectedUpload(null)}>
            <div className="bg-background rounded-lg overflow-hidden max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
              <Image
                src={selectedUpload.src || "/placeholder.svg"}
                alt={selectedUpload.alt || "Gallery image"}
                width={600}
                height={600}
                className="object-cover w-full"
              />
              <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setSelectedUpload(null)}>
                <X className="h-5 w-5" />
              </Button>
              <div className="p-4">
                <h3 className="font-medium">{selectedUpload.alt || "Untitled"}</h3>
                <p className="text-sm text-muted-foreground">{selectedUpload.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Followers Modal */}
        {showFollowersModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-lg">Followers ({stats.followers})</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowFollowersModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="overflow-y-auto flex-1 p-2">
                {followers.length > 0 ? (
                  <div className="space-y-2">
                    {followers.map((follower: any) => (
                      <div key={follower.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md">
                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                          {follower.avatar ? (
                            <Image
                              src={`https://remain-faceghost.pockethost.io/api/files/${follower.collectionId}/${follower.id}/${follower.avatar}`}
                              alt={follower.name || follower.username}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                              <span className="text-sm font-bold">
                                {(follower.name?.charAt(0) || follower.username?.charAt(0) || "").toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{follower.name || follower.username}</p>
                          <p className="text-xs text-muted-foreground truncate">@{follower.username}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowFollowersModal(false)
                            router.push(`/profile/${follower.id}`)
                          }}
                        >
                          View Profile
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No followers yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Following Modal */}
        {showFollowingModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold text-lg">Following ({stats.following})</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowFollowingModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {followingUsers.length > 0 ? (
                  <div className="space-y-2">
                    {followingUsers.map((user: any) => {
                      const isMutual = (user.followers || []).includes(currentUser?.id)
                      const isJustFollowed = justFollowed.includes(user.id)
                      return (
                        <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded-md">
                          <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                            {user.avatar ? (
                              <Image
                                src={`https://remain-faceghost.pockethost.io/api/files/${user.collectionId}/${user.id}/${user.avatar}`}
                                alt={user.name || user.username}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                <span className="text-sm font-bold">
                                  {(user.name?.charAt(0) || user.username?.charAt(0) || "").toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{user.name || user.username}</p>
                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                          </div>
                          {/* Unfollow button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              await handleUnfollow(user.id)
                              // No need to do anything else, state will update
                            }}
                          >
                            Unfollow
                          </Button>
                          {/* After unfollow, show follow/follow back if user still follows you */}
                          {!currentUser?.following?.includes(user.id) && (
                            isMutual ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleFollow(user.id)}
                              >
                                Follow Back
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFollow(user.id)}
                              >
                                Follow
                              </Button>
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Not following anyone yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Suggested Users Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Suggested Users</h2>
          {isUsersLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : suggestedUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {suggestedUsers.map((suggestedUser: any) => (
                <Card key={suggestedUser.id} className="overflow-hidden">
                  <div className="p-4 flex flex-col items-center text-center">
                    <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted mb-3">
                      {suggestedUser.avatar ? (
                        <Image
                          src={`https://remain-faceghost.pockethost.io/api/files/${suggestedUser.collectionId}/${suggestedUser.id}/${suggestedUser.avatar}`}
                          alt={suggestedUser.name || suggestedUser.username}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                          <span className="text-xl font-bold">
                            {(suggestedUser.name?.charAt(0) || suggestedUser.username?.charAt(0) || "").toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium">{suggestedUser.name || suggestedUser.username}</h3>
                    <p className="text-xs text-muted-foreground mb-3">@{suggestedUser.username}</p>
                    {justFollowed.includes(suggestedUser.id) || currentUser?.following?.includes(suggestedUser.id) ? (  
                      <Button variant="default" size="sm" className="w-full" disabled>
                        Following
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleFollow(suggestedUser.id)}
                      >
                        Follow
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No suggested users available</h3>
              <p className="text-muted-foreground">Check back later for new user suggestions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

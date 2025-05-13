"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
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
import { getPocketBase } from "@/lib/pocketbase"
import { Separator } from "@/components/ui/separator"
import { fetchReviews } from "@/lib/reviews"
import { fetchGalleryImages } from "@/lib/gallery"

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const isMounted = useRef(true)

  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    followers: 0,
    reviews: 0,
    uploads: 0,
    events: 0,
    bookings: 0,
  })
  const [userReviews, setUserReviews] = useState([])
  const [userUploads, setUserUploads] = useState([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [followers, setFollowers] = useState([])
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true)

  // Set up cleanup when component unmounts
  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  // Fetch user data and stats
  useEffect(() => {
    const loadUserData = async () => {
      if (!isMounted.current) return
      setIsLoading(true)

      // First check if user is logged in
      const authData = localStorage.getItem("pocketbase_auth")
      if (!authData && !user) {
        router.push("/login")
        return
      }

      try {
        const pb = getPocketBase()
        if (!pb || !pb.authStore.model) {
          throw new Error("Not authenticated")
        }

        const userId = pb.authStore.model.id

        // Use Promise.all to fetch data in parallel
        const [userData, reviewsData, uploadsData] = await Promise.all([
          // Fetch user data with expanded followers
          pb
            .collection("users")
            .getOne(userId, {
              expand: "followers",
            }),

          // Fetch user reviews
          fetchReviews(1, 12, "-created", `reviewer = "${userId}"`),

          // Fetch user uploads
          fetchGalleryImages(),
        ])

        if (!isMounted.current) return

        // Filter uploads for the current user
        const userUploads = uploadsData.filter((img) => img.userId === userId)

        // Set stats
        setStats({
          followers: userData.followers_count || 0,
          reviews: reviewsData.totalItems || 0,
          uploads: userUploads.length || 0,
          events: 0, // We'll need to implement this when we have events data
          bookings: 0, // We'll need to implement this when we have bookings data
        })

        // Store followers data if available
        if (userData.expand?.followers) {
          setFollowers(userData.expand.followers)
        }

        setUserReviews(reviewsData.items || [])
        setUserUploads(userUploads || [])
      } catch (error) {
        console.error("Error loading user data:", error)

        // Only show toast if component is still mounted and it's not an auto-cancellation
        if (isMounted.current && !error.toString().includes("autocancelled")) {
          toast({
            variant: "destructive",
            title: "Error loading profile",
            description: "Could not load your profile data. Please try again.",
          })
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false)
        }
      }
    }

    loadUserData()
  }, [user, router, toast, refreshUser])

  // Fetch suggested users
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!isMounted.current || !user) return
      setIsLoadingSuggestions(true)

      try {
        const pb = getPocketBase()
        if (!pb || !pb.authStore.model) {
          return
        }

        const currentUserId = pb.authStore.model.id

        // Step 1: Get the current user's reviews
        const userReviews = await pb.collection("reviews").getList(1, 10, {
          filter: `reviewer = "${currentUserId}"`,
        })

        if (!isMounted.current) return

        // Get destinations the user has reviewed
        const userDestinations = userReviews.items.map((review) => review.destination)

        const suggestedUserIds = new Set()

        // Step 2: Find users who reviewed similar destinations
        if (userDestinations.length > 0) {
          // Create a filter for similar destinations
          const destinationFilters = userDestinations.map((dest) => `destination = "${dest}"`).join(" || ")

          const similarReviews = await pb.collection("reviews").getList(1, 20, {
            filter: `reviewer != "${currentUserId}" && (${destinationFilters})`,
          })

          if (!isMounted.current) return

          // Add these reviewers to suggested users
          similarReviews.items.forEach((review) => {
            if (review.reviewer && review.reviewer !== currentUserId) {
              suggestedUserIds.add(review.reviewer)
            }
          })
        }

        // Step 3: If we don't have enough suggestions, add some random users
        if (suggestedUserIds.size < 4) {
          const randomUsers = await pb.collection("users").getList(1, 8, {
            filter: `id != "${currentUserId}"`,
            sort: "@random",
          })

          if (!isMounted.current) return

          randomUsers.items.forEach((user) => {
            suggestedUserIds.add(user.id)
          })
        }

        // Step 4: Get the full user records for our suggestions
        let suggestedUsers = []

        if (suggestedUserIds.size > 0) {
          // Convert Set to Array and take only first 4
          const userIdsArray = Array.from(suggestedUserIds).slice(0, 4)

          // Create a filter to get these specific users
          const userFilter = userIdsArray.map((id) => `id = "${id}"`).join(" || ")

          const usersResult = await pb.collection("users").getList(1, 4, {
            filter: userFilter,
          })

          if (!isMounted.current) return

          suggestedUsers = usersResult.items
        }

        // Step 5: Filter out users that the current user already follows
        const currentUser = await pb.collection("users").getOne(currentUserId, {
          expand: "followers",
        })

        if (!isMounted.current) return

        const followingIds = currentUser.followers || []

        const filteredSuggestions = suggestedUsers.filter((user) => !followingIds.includes(user.id))

        setSuggestedUsers(filteredSuggestions)
      } catch (error) {
        console.error("Error fetching suggested users:", error)
        // Only show toast if it's not an auto-cancellation
        if (isMounted.current && !error.toString().includes("autocancelled")) {
          toast({
            variant: "destructive",
            title: "Error loading suggestions",
            description: "Could not load suggested users. Please try again.",
          })
        }
      } finally {
        if (isMounted.current) {
          setIsLoadingSuggestions(false)
        }
      }
    }

    if (user) {
      fetchSuggestedUsers()
    }
  }, [user, toast])

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

      // Don't allow following yourself
      if (userId === currentUserId) {
        toast({
          variant: "destructive",
          title: "Action not allowed",
          description: "You cannot follow yourself.",
        })
        return
      }

      // Get the user to follow
      const userToFollow = await pb.collection("users").getOne(userId)

      // Update their followers array and count
      const currentFollowers = userToFollow.followers || []
      const updatedFollowers = [...currentFollowers, currentUserId]

      await pb.collection("users").update(userId, {
        followers: updatedFollowers,
        followers_count: updatedFollowers.length,
      })

      toast({
        title: "Success",
        description: `You are now following ${userToFollow.username}`,
      })

      // Refresh suggested users
      const resultList = await pb.collection("users").getList(1, 4, {
        filter: `id != "${currentUserId}"`,
        sort: "@random",
      })

      if (isMounted.current) {
        setSuggestedUsers(resultList.items || [])
      }
    } catch (error) {
      console.error("Error following user:", error)
      if (isMounted.current) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to follow user. Please try again.",
        })
      }
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

    const shortBioMatch = about.match(/^\[(.*?)\](.*)$/s)
    if (shortBioMatch) {
      return {
        shortBio: shortBioMatch[1].trim(),
        fullAbout: shortBioMatch[2].trim(),
      }
    }

    return { shortBio: undefined, fullAbout: about }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container py-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user && !localStorage.getItem("pocketbase_auth")) {
    return null // Will redirect in useEffect
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const { shortBio, fullAbout } = extractShortBio(user?.about)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />

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

          <TabsContent value="uploads">
            {userUploads.length > 0 ? (
              <div
                className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" : "space-y-4"}
              >
                {userUploads.map((upload: any) =>
                  viewMode === "grid" ? (
                    <div key={upload.id} className="aspect-square relative rounded-md overflow-hidden group">
                      <Image
                        src={upload.src || "/placeholder.svg"}
                        alt={upload.alt || "Gallery image"}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-sm font-medium truncate">{upload.location}</p>
                        <div className="flex items-center gap-2 text-white/80 text-xs">
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            {upload.likes || 0}
                          </span>
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {upload.comments || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Card key={upload.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row">
                        <div className="relative w-full sm:w-48 h-48">
                          <Image
                            src={upload.src || "/placeholder.svg"}
                            alt={upload.alt || "Gallery image"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium">{upload.alt || "Untitled"}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{upload.location}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(upload.date)}</p>
                          <div className="flex items-center gap-4 mt-4">
                            <span className="flex items-center text-sm">
                              <Star className="h-4 w-4 mr-1" />
                              {upload.likes || 0} likes
                            </span>
                            <span className="flex items-center text-sm">
                              <Users className="h-4 w-4 mr-1" />
                              {upload.comments || 0} comments
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No uploads yet</h3>
                <p className="text-muted-foreground mb-6">Share your travel photos with the community</p>
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
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
              <p className="text-muted-foreground mb-6">Book your next adventure with us</p>
              <Button asChild>
                <Link href="/events">Explore Events</Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No events yet</h3>
              <p className="text-muted-foreground mb-6">Join upcoming travel events</p>
              <Button asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

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
                        <Button variant="outline" size="sm">
                          View
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

        {/* Suggested Users Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Suggested Users</h2>
          {isLoadingSuggestions ? (
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleFollow(suggestedUser.id)}
                    >
                      Follow
                    </Button>
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

      <Footer />
    </div>
  )
}

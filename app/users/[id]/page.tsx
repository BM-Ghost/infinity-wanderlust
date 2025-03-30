"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { User, Users, Calendar, LinkIcon } from "lucide-react"
import { fetchUserById, followUser, unfollowUser, isFollowingUser, type UserWithAvatar } from "@/lib/users"
import { fetchReviews, type ReviewWithAuthor } from "@/lib/reviews"

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserWithAvatar | null>(null)
  const [userReviews, setUserReviews] = useState<ReviewWithAuthor[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true)

      try {
        // Fetch user profile
        const profile = await fetchUserById(userId)
        setUserData(profile)

        // Check if current user is following this user
        if (user && profile) {
          const following = await isFollowingUser(profile.id)
          setIsFollowing(following)
        }

        // Fetch user reviews
        const reviewsResult = await fetchReviews(1, 10, "-created", `reviewer = "${userId}"`)
        setUserReviews(reviewsResult.items)
      } catch (error) {
        console.error("Error loading user data:", error)
        toast({
          variant: "destructive",
          title: "Failed to load user profile",
          description: "Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [userId, user, toast])

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to follow users.",
      })
      return
    }

    if (!userData) return

    setFollowLoading(true)

    try {
      if (isFollowing) {
        await unfollowUser(userData.id)
        setIsFollowing(false)

        // Update followers count in UI
        setUserData((prev) => (prev ? { ...prev, followers_count: Math.max(0, prev.followers_count - 1) } : null))

        toast({
          title: "Unfollowed",
          description: `You are no longer following ${userData.name || userData.username}.`,
        })
      } else {
        await followUser(userData.id)
        setIsFollowing(true)

        // Update followers count in UI
        setUserData((prev) => (prev ? { ...prev, followers_count: prev.followers_count + 1 } : null))

        toast({
          title: "Following",
          description: `You are now following ${userData.name || userData.username}.`,
        })
      }
    } catch (error: any) {
      console.error("Error toggling follow status:", error)
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message || "Please try again later.",
      })
    } finally {
      setFollowLoading(false)
    }
  }

  return (
    <div className="forest-bg min-h-screen">
      <Navbar />

      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            // Loading skeleton
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ) : !userData ? (
            // User not found
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">User not found</h3>
                <p className="text-muted-foreground mb-6">
                  The user you're looking for doesn't exist or has been removed.
                </p>
                <Button asChild>
                  <Link href="/users">Back to Users</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-8">
                  <TabsTrigger value="profile" className="flex-1">
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="reviews" className="flex-1">
                    Reviews
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <Card>
                    <CardHeader className="flex flex-row items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={userData.avatarUrl || ""} alt={userData.name || userData.username} />
                          <AvatarFallback className="text-xl">
                            {(userData.name || userData.username).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-2xl">{userData.name || userData.username}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <User className="h-3.5 w-3.5 mr-1" />@{userData.username}
                          </CardDescription>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm flex items-center">
                              <Users className="h-3.5 w-3.5 mr-1" />
                              {userData.followers_count || 0} followers
                            </span>
                            <span className="text-sm flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              Joined {userData.formattedDate}
                            </span>
                          </div>
                        </div>
                      </div>

                      {user && user.id !== userData.id && (
                        <Button
                          variant={isFollowing ? "outline" : "default"}
                          onClick={handleFollowToggle}
                          disabled={followLoading}
                        >
                          {followLoading ? (
                            <span className="flex items-center">
                              <svg
                                className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                              {isFollowing ? "Unfollowing..." : "Following..."}
                            </span>
                          ) : isFollowing ? (
                            "Unfollow"
                          ) : (
                            "Follow"
                          )}
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {userData.about && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">About</h3>
                          <p className="text-muted-foreground whitespace-pre-line">{userData.about}</p>
                        </div>
                      )}

                      {userData.Links && (
                        <div>
                          <h3 className="text-lg font-medium mb-2">Links</h3>
                          <a
                            href={userData.Links}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-primary hover:underline"
                          >
                            <LinkIcon className="h-4 w-4 mr-2" />
                            {userData.Links}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reviews">
                  <Card>
                    <CardHeader>
                      <CardTitle>Reviews</CardTitle>
                      <CardDescription>Reviews shared by {userData.name || userData.username}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userReviews.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            {userData.name || userData.username} hasn't written any reviews yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {userReviews.map((review) => (
                            <div key={review.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-medium">{review.destination}</h3>
                                <div className="flex">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <svg
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                                      }`}
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{review.formattedDate}</p>
                              <p className="text-sm line-clamp-3">{review.review_text}</p>

                              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                <span className="flex items-center">
                                  <svg
                                    className="h-4 w-4 mr-1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M7 10v12" />
                                    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
                                  </svg>
                                  {review.likes_count || 0} likes
                                </span>
                                <span className="flex items-center">
                                  <svg
                                    className="h-4 w-4 mr-1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                  </svg>
                                  {review.comments_count || 0} comments
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/reviews">View All Reviews</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}


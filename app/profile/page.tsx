"use client"

import Link from "next/link"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  Camera,
  User,
  Users,
  Edit,
  Loader2,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Mail,
  Pencil,
  X,
  Check,
  Trash2,
} from "lucide-react"
import { updateUserProfile, fetchUserById, getUserFollowers, type UserWithAvatar } from "@/lib/users"
import { fetchReviews, type ReviewWithAuthor } from "@/lib/reviews"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Profile data
  const [profileData, setProfileData] = useState<UserWithAvatar | null>(null)
  const [userReviews, setUserReviews] = useState<ReviewWithAuthor[]>([])
  const [followers, setFollowers] = useState<UserWithAvatar[]>([])

  // Edit form state
  const [name, setName] = useState("")
  const [about, setAbout] = useState("")
  const [links, setLinks] = useState("")
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Refs for animation
  const profileRef = useRef<HTMLDivElement>(null)

  // Load user profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      setIsLoading(true)

      try {
        // Fetch user profile
        const userData = await fetchUserById(user.id)
        setProfileData(userData)

        // Initialize form data
        if (userData) {
          setName(userData.name || "")
          setAbout(userData.about || "")
          setLinks(userData.Links || "")

          // Fetch followers
          const userFollowers = await getUserFollowers(user.id)
          setFollowers(userFollowers)
        }

        // Fetch user reviews
        const reviewsResult = await fetchReviews(1, 10, "-created", `reviewer = "${user.id}"`)
        setUserReviews(reviewsResult.items)
      } catch (error) {
        console.error("Error loading profile data:", error)
        toast({
          variant: "destructive",
          title: "Failed to load profile",
          description: "Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProfileData()
  }, [user, router, toast])

  // Handle avatar change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setAvatar(file)

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
    }
  }

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    setIsSubmitting(true)

    try {
      const updatedUser = await updateUserProfile(
        {
          name,
          about,
          Links: links,
        },
        avatar,
      )

      if (updatedUser) {
        setProfileData(updatedUser)
        setIsEditing(false)

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        })
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "There was an error updating your profile. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    // Reset form data
    if (profileData) {
      setName(profileData.name || "")
      setAbout(profileData.about || "")
      setLinks(profileData.Links || "")
    }

    // Clear avatar preview
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
      setAvatarPreview(null)
    }

    setAvatar(null)
    setIsEditing(false)
  }

  // Parse links for social media
  const getSocialLinks = () => {
    if (!profileData?.Links) return null

    const links = profileData.Links.split(",").map((link) => link.trim())

    return links.map((link, index) => {
      let icon = <Globe className="h-5 w-5" />

      if (link.includes("instagram.com")) {
        icon = <Instagram className="h-5 w-5 text-pink-500" />
      } else if (link.includes("twitter.com") || link.includes("x.com")) {
        icon = <Twitter className="h-5 w-5 text-blue-400" />
      } else if (link.includes("facebook.com")) {
        icon = <Facebook className="h-5 w-5 text-blue-600" />
      } else if (link.includes("mailto:")) {
        icon = <Mail className="h-5 w-5 text-red-500" />
      }

      return (
        <a
          key={index}
          href={link.startsWith("http") || link.startsWith("mailto:") ? link : `https://${link}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background/90 transition-colors"
        >
          {icon}
          <span className="text-sm truncate max-w-[200px]">{link}</span>
        </a>
      )
    })
  }

  // Clean up avatar preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  if (!user) {
    return null // Redirect handled in useEffect
  }

  return (
    <div className="forest-bg min-h-screen">
      <Navbar />

      <div className="container py-16">
        <div className="max-w-5xl mx-auto">
          {isLoading ? (
            // Loading skeleton
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ) : (
            <>
              <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-8 grid grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="reviews">My Reviews</TabsTrigger>
                  <TabsTrigger value="followers">Followers</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={profileRef}>
                    {/* Profile Card */}
                    <div className="md:col-span-1">
                      <Card className="overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-primary/30 to-primary/10"></div>
                        <div className="px-6 pb-6 pt-0 -mt-16 relative">
                          <div className="flex justify-center">
                            <div className="relative">
                              <Avatar className="h-32 w-32 border-4 border-background">
                                <AvatarImage
                                  src={avatarPreview || profileData?.avatarUrl || ""}
                                  alt={name || user.username}
                                />
                                <AvatarFallback className="text-4xl">
                                  {(name || user.username).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {!isEditing && (
                                <label
                                  htmlFor="avatar-upload"
                                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                                >
                                  <Camera className="h-5 w-5" />
                                  <span className="sr-only">Change avatar</span>
                                  <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleAvatarChange}
                                  />
                                </label>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 text-center">
                            <h2 className="text-2xl font-bold">{profileData?.name || user.username}</h2>
                            <p className="text-muted-foreground">@{user.username}</p>

                            <div className="flex justify-center gap-4 mt-4">
                              <div className="text-center">
                                <p className="text-lg font-semibold">{profileData?.followers_count || 0}</p>
                                <p className="text-xs text-muted-foreground">Followers</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold">{userReviews.length}</p>
                                <p className="text-xs text-muted-foreground">Reviews</p>
                              </div>
                            </div>

                            <div className="mt-6">
                              <Button variant="outline" className="w-full" onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? (
                                  <>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel Editing
                                  </>
                                ) : (
                                  <>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit Profile
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Social Links Card */}
                      {!isEditing && profileData?.Links && (
                        <Card className="mt-6">
                          <CardHeader>
                            <CardTitle className="text-lg">Connect</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2">{getSocialLinks()}</div>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-2">
                      {isEditing ? (
                        <Card>
                          <CardHeader>
                            <CardTitle>Edit Your Profile</CardTitle>
                            <CardDescription>Update your personal information</CardDescription>
                          </CardHeader>
                          <form onSubmit={handleUpdateProfile}>
                            <CardContent className="space-y-6">
                              <div className="space-y-2">
                                <Label htmlFor="name">Display Name</Label>
                                <Input
                                  id="name"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="Your name"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="about">About Me</Label>
                                <Textarea
                                  id="about"
                                  value={about}
                                  onChange={(e) => setAbout(e.target.value)}
                                  placeholder="Tell us about yourself, your travel experiences, and your interests..."
                                  rows={6}
                                  className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Share your travel experiences, favorite destinations, or travel bucket list.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="links">Social Links</Label>
                                <Textarea
                                  id="links"
                                  value={links}
                                  onChange={(e) => setLinks(e.target.value)}
                                  placeholder="https://instagram.com/yourusername, https://twitter.com/yourusername"
                                  rows={3}
                                  className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Add your social media profiles or website links, separated by commas.
                                </p>
                              </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Save Changes
                                  </>
                                )}
                              </Button>
                            </CardFooter>
                          </form>
                        </Card>
                      ) : (
                        <>
                          {/* About Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle>About Me</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {profileData?.about ? (
                                <div className="prose prose-sm max-w-none">
                                  <p className="whitespace-pre-line">{profileData.about}</p>
                                </div>
                              ) : (
                                <div className="text-center py-8 border border-dashed rounded-lg">
                                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                  <p className="text-muted-foreground mb-4">
                                    Tell others about yourself and your travel experiences.
                                  </p>
                                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                                    Add Bio
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Recent Activity Card */}
                          <Card className="mt-6">
                            <CardHeader>
                              <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {userReviews.length > 0 ? (
                                <div className="space-y-4">
                                  {userReviews.slice(0, 3).map((review) => (
                                    <div key={review.id} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">{review.destination}</p>
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                          {review.review_text}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                          <span className="text-xs text-muted-foreground">{review.formattedDate}</span>
                                          <span className="flex items-center text-xs">
                                            <svg
                                              className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500"
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
                                            {review.rating}/5
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 border border-dashed rounded-lg">
                                  <p className="text-muted-foreground mb-4">You haven't written any reviews yet.</p>
                                  <Button asChild>
                                    <Link href="/reviews">Write a Review</Link>
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Reviews</CardTitle>
                      <CardDescription>Reviews you've shared with the community</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {userReviews.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="bg-muted/50 p-8 rounded-lg inline-block mb-6">
                            <svg
                              className="h-12 w-12 text-muted-foreground mx-auto mb-4"
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
                            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                            <p className="text-muted-foreground mb-6">
                              Share your travel experiences with the community
                            </p>
                            <Button asChild>
                              <Link href="/reviews">Write a Review</Link>
                            </Button>
                          </div>
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
                              <p className="text-sm mb-4">{review.review_text}</p>

                              {review.photoUrl && (
                                <div className="mb-4">
                                  <div className="relative aspect-video w-full max-w-md mx-auto rounded-md overflow-hidden">
                                    <Image
                                      src={review.photoUrl || "/placeholder.svg"}
                                      alt={`Photo of ${review.destination}`}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                </div>
                              )}

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

                              <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={`/reviews/${review.id}`}>View</Link>
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-3.5 w-3.5 mr-1" />
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  Delete
                                </Button>
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

                <TabsContent value="followers">
                  <Card>
                    <CardHeader>
                      <CardTitle>Followers</CardTitle>
                      <CardDescription>People following your profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(profileData?.followers_count || 0) === 0 ? (
                        <div className="text-center py-8">
                          <div className="bg-muted/50 p-8 rounded-lg inline-block">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-medium mb-2">No followers yet</h3>
                            <p className="text-muted-foreground">
                              Share your travel experiences to connect with other travelers.
                            </p>
                          </div>
                        </div>
                      ) : followers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {followers.map((follower) => (
                            <div key={follower.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={follower.avatarUrl || ""} alt={follower.name || follower.username} />
                                <AvatarFallback>
                                  {(follower.name || follower.username).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{follower.name || follower.username}</p>
                                <p className="text-xs text-muted-foreground">@{follower.username}</p>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/users/${follower.id}`}>View</Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </CardContent>
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


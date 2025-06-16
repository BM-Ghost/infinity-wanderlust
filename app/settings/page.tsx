"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import {
  Camera,
  User,
  MapPin,
  Shield,
  KeyRound,
  LogOut,
  Bell,
  Eye,
  EyeOff,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Github,
  Globe,
} from "lucide-react"
import { getPocketBase } from "@/lib/pocketbase"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const { user, refreshUser, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [about, setAbout] = useState("")
  const [links, setLinks] = useState("")
  const [location, setLocation] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authNumber, setAuthNumber] = useState(0)
  const [shortBio, setShortBio] = useState("")

  // Password change fields
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [newFollowerNotif, setNewFollowerNotif] = useState(true)
  const [commentNotif, setCommentNotif] = useState(true)
  const [likeNotif, setLikeNotif] = useState(true)
  const [eventNotif, setEventNotif] = useState(true)

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

  // Redirect if not logged in
  useEffect(() => {
  const pb = getPocketBase()
  const currentUser = user || pb?.authStore?.model

  if (!currentUser) {
    router.push("/login")
    return
  }

  // Cast to your custom user type
  const typedUser = currentUser as {
    id: string
    collectionId: string
    collectionName: string
    username: string
    email: string
    name: string
    avatar?: string
    about?: string
    Links?: string
    location?: string
    bio?: string
    auth_number?: number
    avatarUrl?: string
  }

  setName(typedUser.name || "")
  setUsername(typedUser.username || "")
  setEmail(typedUser.email || "")
  setBio(typedUser.bio || "")

  const { shortBio: extractedShortBio, fullAbout } = extractShortBio(typedUser.about || "")
  setShortBio(extractedShortBio || "")
  setAbout(fullAbout || "")

  setLinks(typedUser.Links || "")
  setLocation(typedUser.location || "")
  setAuthNumber(typedUser.auth_number || 0)

  if (typedUser.avatar) {
    const avatarUrl = typedUser.avatarUrl
      ? typedUser.avatarUrl
      : `https://remain-faceghost.pockethost.io/api/files/${typedUser.collectionId}/${typedUser.id}/${typedUser.avatar}`
    setAvatarPreview(avatarUrl)
  }
}, [user, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const validateUrl = (url: string): boolean => {
    if (!url) return true // Empty is valid
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  // Update the handleSubmit function to include auth_number and handle short bio
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validate URL
  if (links && !validateUrl(links)) {
    toast({
      variant: "destructive",
      title: "Invalid URL",
      description: "Please enter a valid URL including http:// or https://",
    })
    return
  }

  const pb = getPocketBase()
  if (!pb || !pb.authStore.model) {
    toast({
      variant: "destructive",
      title: "Authentication error",
      description: "Please sign in again to update your profile.",
    })
    return
  }

  setIsSubmitting(true)

  try {
    const userId = pb.authStore.model.id
    const formData = new FormData()

    formData.append("name", name)
    formData.append("username", username)
    formData.append("bio", bio)

    // Combine short bio and about if short bio exists
    const combinedAbout = shortBio ? `[${shortBio}]${about}` : about
    formData.append("about", combinedAbout)

    formData.append("Links", links)
    formData.append("location", location)
    formData.append("auth_number", authNumber.toString())

    if (avatarFile) {
      formData.append("avatar", avatarFile)
    }

    await pb.collection("users").update(userId, formData)

    // Refresh user data
    if (refreshUser) {
      await refreshUser()
    }

    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    })

    // Navigate back to profile page
    router.push("/profile")
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const pb = getPocketBase()
      if (!pb || !pb.authStore.model) {
        throw new Error("Not authenticated")
      }

      const userId = pb.authStore.model.id

      await pb.collection("users").update(userId, {
        password: newPassword,
        passwordConfirm: confirmPassword,
        oldPassword: currentPassword,
      })

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      })

      // Clear password fields
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      // Navigate back to profile page
      router.push("/profile")
    } catch (error: any) {
      console.error("Error changing password:", error)
      toast({
        variant: "destructive",
        title: "Password change failed",
        description: error.message || "Please check your current password and try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = () => {
    if (signOut) {
      signOut()
      router.push("/login")
    }
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Button variant="outline" asChild>
              <Link href="/profile">Back to Profile</Link>
            </Button>
          </div>

          <Tabs defaultValue="profile">
            <div className="flex mb-8">
              <TabsList className="flex-col h-auto space-y-1 mr-8 bg-transparent">
                <TabsTrigger value="profile" className="justify-start w-full">
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </TabsTrigger>
                <TabsTrigger value="password" className="justify-start w-full">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="notifications" className="justify-start w-full">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="privacy" className="justify-start w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy
                </TabsTrigger>
              </TabsList>

              <div className="flex-1">
                <TabsContent value="profile">
                  <Card>
                    <form onSubmit={handleSubmit}>
                      <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>
                          Update your profile information and how others see you on the site.
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        <div className="space-y-4">
                          <div className="grid gap-2">
                            <Label htmlFor="avatar">Profile Picture</Label>
                            <div className="flex items-center gap-4">
                              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-muted">
                                {avatarPreview ? (
                                  <Image
                                    src={avatarPreview || "/placeholder.svg"}
                                    alt="Profile"
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                                    <User className="h-10 w-10" />
                                  </div>
                                )}

                                <label
                                  htmlFor="avatar-upload"
                                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer shadow-md hover:bg-primary/90 transition-colors"
                                >
                                  <Camera className="h-4 w-4" />
                                  <span className="sr-only">Upload avatar</span>
                                  <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={handleAvatarChange}
                                  />
                                </label>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Upload a new profile picture</p>
                                <p>JPG, PNG or GIF. 1MB max size.</p>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="name">Full Name</Label>
                              <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="username">Username</Label>
                              <Input
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Your username"
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="location">Location</Label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="location"
                                  value={location}
                                  onChange={(e) => setLocation(e.target.value)}
                                  placeholder="Where are you based?"
                                  className="pl-10"
                                />
                              </div>
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="bio">Short Bio</Label>
                              <Input
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="A brief description (e.g. Travel enthusiast, Photographer)"
                                maxLength={100}
                              />
                              <p className="text-xs text-muted-foreground text-right">{bio.length}/100 characters</p>
                            </div>
                          </div>

                          <Separator />

                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="about">About Me</Label>
                              <Textarea
                                id="about"
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                placeholder="Tell us more about yourself, your interests, and your travel experiences"
                                rows={5}
                              />
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="links">Website or Social Media Link</Label>
                              <div className="relative">
                                {(() => {
                                  const { icon: Icon } = getSocialIcon(links)
                                  return (
                                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  )
                                })()}
                                <Input
                                  id="links"
                                  value={links}
                                  onChange={(e) => setLinks(e.target.value)}
                                  placeholder="https://example.com"
                                  className="pl-10"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Add your personal website, blog, or social media profile
                              </p>
                            </div>
                          </div>
                        </div>
                        <Separator />
                      </CardContent>

                      <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                </TabsContent>

                <TabsContent value="password">
                  <Card>
                    <form onSubmit={handlePasswordChange}>
                      <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                        <CardDescription>Update your password to keep your account secure</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              required
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                          />
                          <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                      </CardContent>

                      <CardFooter className="flex justify-between">
                        <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? "Updating..." : "Update Password"}
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>

                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Account Actions</CardTitle>
                      <CardDescription>Manage your account settings</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>Control how and when you receive notifications</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <h3 className="font-medium">Notification Types</h3>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm">New Followers</p>
                            <p className="text-xs text-muted-foreground">When someone follows your profile</p>
                          </div>
                          <Switch
                            checked={newFollowerNotif}
                            onCheckedChange={setNewFollowerNotif}
                            disabled={!emailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm">Comments</p>
                            <p className="text-xs text-muted-foreground">When someone comments on your content</p>
                          </div>
                          <Switch
                            checked={commentNotif}
                            onCheckedChange={setCommentNotif}
                            disabled={!emailNotifications}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm">Likes</p>
                            <p className="text-xs text-muted-foreground">When someone likes your content</p>
                          </div>
                          <Switch checked={likeNotif} onCheckedChange={setLikeNotif} disabled={!emailNotifications} />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm">Events</p>
                            <p className="text-xs text-muted-foreground">Updates about events you're interested in</p>
                          </div>
                          <Switch checked={eventNotif} onCheckedChange={setEventNotif} disabled={!emailNotifications} />
                        </div>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          toast({
                            title: "Preferences saved",
                            description: "Your notification preferences have been updated.",
                          })
                          router.push("/profile")
                        }}
                      >
                        Save Preferences
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="privacy">
                  <Card>
                    <CardHeader>
                      <CardTitle>Privacy Settings</CardTitle>
                      <CardDescription>Control your privacy and visibility on the platform</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Profile Visibility</h3>
                          <p className="text-sm text-muted-foreground">Make your profile visible to everyone</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Email Visibility</h3>
                          <p className="text-sm text-muted-foreground">Show your email address on your profile</p>
                        </div>
                        <Switch />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Location Sharing</h3>
                          <p className="text-sm text-muted-foreground">Show your location on your profile</p>
                        </div>
                        <Switch defaultChecked />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Activity Status</h3>
                          <p className="text-sm text-muted-foreground">Show when you're active on the platform</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between">
                      <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          toast({
                            title: "Privacy settings saved",
                            description: "Your privacy settings have been updated.",
                          })
                          router.push("/profile")
                        }}
                      >
                        Save Privacy Settings
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

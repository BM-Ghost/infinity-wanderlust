"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Search, User, Users, Calendar, LinkIcon } from "lucide-react"
import { fetchUsers, followUser, unfollowUser, isFollowingUser, type UserWithAvatar } from "@/lib/users"

export default function UsersPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<UserWithAvatar[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({})
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const perPage = 10

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true)

      try {
        let filter = ""

        // Apply search filter if query exists
        if (searchQuery) {
          filter = `name ~ "${searchQuery}" || username ~ "${searchQuery}"`
        }

        const result = await fetchUsers(currentPage, perPage, "-created", filter)

        setUsers(result.items)
        setTotalPages(result.totalPages)
        setTotalItems(result.totalItems)

        // Check follow status for each user
        if (user) {
          const statusPromises = result.items.map(async (u) => {
            if (u.id === user.id) return [u.id, false] // Can't follow yourself
            const status = await isFollowingUser(u.id)
            return [u.id, status]
          })

          const statuses = await Promise.all(statusPromises)
          const statusMap = Object.fromEntries(statuses)
          setFollowStatus(statusMap)
        }
      } catch (error) {
        console.error("Error loading users:", error)
        toast({
          variant: "destructive",
          title: "Failed to load users",
          description: "Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [currentPage, searchQuery, user, toast])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1) // Reset to first page on new search
  }

  // Handle follow/unfollow
  const handleFollowToggle = async (userId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to follow users.",
      })
      return
    }

    setFollowLoading((prev) => ({ ...prev, [userId]: true }))

    try {
      const isFollowing = followStatus[userId]

      if (isFollowing) {
        await unfollowUser(userId)
        setFollowStatus((prev) => ({ ...prev, [userId]: false }))

        // Update followers count in UI
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, followers_count: Math.max(0, u.followers_count - 1) } : u)),
        )

        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        })
      } else {
        await followUser(userId)
        setFollowStatus((prev) => ({ ...prev, [userId]: true }))

        // Update followers count in UI
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, followers_count: u.followers_count + 1 } : u)))

        toast({
          title: "Following",
          description: "You are now following this user.",
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
      setFollowLoading((prev) => ({ ...prev, [userId]: false }))
    }
  }

  return (
    <div className="forest-bg min-h-screen">
      <Navbar />

      <div className="container py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Community Members</h1>
            <p className="text-muted-foreground">Connect with other travelers and explorers</p>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or username"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Button type="submit" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                Search
              </Button>
            </div>
          </form>

          {isLoading ? (
            // Loading skeletons
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No users found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "No users match your search criteria." : "There are no users to display."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {users.map((userData) => (
                <Card key={userData.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userData.avatarUrl || ""} alt={userData.name || userData.username} />
                        <AvatarFallback>{(userData.name || userData.username).charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{userData.name || userData.username}</h3>
                          <span className="text-sm text-muted-foreground">@{userData.username}</span>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            {userData.followers_count || 0} followers
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            Joined {userData.formattedDate}
                          </span>
                        </div>

                        {userData.about && <p className="text-sm mt-2 line-clamp-1">{userData.about}</p>}

                        {userData.Links && (
                          <div className="mt-1">
                            <a
                              href={userData.Links}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs flex items-center text-primary hover:underline"
                            >
                              <LinkIcon className="h-3 w-3 mr-1" />
                              {userData.Links}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/users/${userData.id}`}>View</Link>
                        </Button>

                        {user && user.id !== userData.id && (
                          <Button
                            variant={followStatus[userData.id] ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleFollowToggle(userData.id)}
                            disabled={followLoading[userData.id]}
                          >
                            {followLoading[userData.id] ? (
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
                              </span>
                            ) : followStatus[userData.id] ? (
                              "Unfollow"
                            ) : (
                              "Follow"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
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
                      <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationLink isActive>{currentPage}</PaginationLink>
                  </PaginationItem>

                  {currentPage < totalPages && (
                    <PaginationItem>
                      <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
                        {currentPage + 1}
                      </PaginationLink>
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
      </div>

      <Footer />
    </div>
  )
}


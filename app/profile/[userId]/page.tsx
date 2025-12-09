"use client"
export const runtime = "edge";
import { useParams, useRouter } from "next/navigation"
import { getPocketBase } from "@/lib/pocketbase"

// Import hooks
import { useUsers } from "@/hooks/useUsers"
import { useReviews } from "@/hooks/useReviews"
import { useUploads } from "@/hooks/useUploads"
import { useEvents } from "@/hooks/useEvents"
import { useBookings } from "@/hooks/useBookings"
import { QueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function UserProfilePage() {
  const { userId } = useParams()
  const router = useRouter()
  const { data: users = [] } = useUsers(1)
  const { data: uploads = [] } = useUploads(1)
  const { data: reviews = [] } = useReviews(1)

  const user = users.find((u: any) => u.id === userId)
  if (!user) return <div>User not found</div>

  // ...render profile info, uploads, reviews, follow/unfollow buttons, etc...
  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => router.back()}>Back</Button>
      <div className="flex flex-col items-center">
        <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted mb-4">
          {user.avatar ? (
            <Image src={user.avatar || "/placeholder.svg"} alt={user.name || user.username} fill className="object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
              <span className="text-4xl font-bold">{(user.name?.charAt(0) || user.username?.charAt(0) || "").toUpperCase()}</span>
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold">{user.name || user.username}</h1>
        <p className="text-muted-foreground">@{user.username}</p>
        {/* Add follow/unfollow logic here */}
      </div>
      {/* Show uploads, reviews, etc. */}
    </div>
  )
}
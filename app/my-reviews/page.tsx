// Create a dedicated My Reviews page that redirects to the reviews page with the correct tab
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { getPocketBase } from "@/lib/pocketbase"

export default function MyReviewsPage() {
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    // Check if user is authenticated
    const pb = getPocketBase()
    if (!user && !pb?.authStore?.isValid) {
      // Redirect to login if not authenticated
      router.push("/login?redirect=/reviews?tab=mine")
    } else {
      // Redirect to reviews page with "mine" tab selected
      router.push("/reviews?tab=mine")
    }
  }, [router, user])

  // Show loading state while redirecting
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  )
}

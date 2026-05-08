"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Home, CalendarDays, BookOpen, Star, Image as ImageIcon, PhoneCall, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { trackEngagementClick } from "@/lib/analytics-client"

type EngagementNavProps = {
  destination?: string
}

function getGalleryHref(destination?: string) {
  if (!destination) return "/gallery"
  return `/gallery?destination=${encodeURIComponent(destination)}`
}

function getReviewsHref(destination?: string) {
  if (!destination) return "/reviews"
  return `/reviews?destination=${encodeURIComponent(destination)}`
}

export function EngagementQuickLinks({ destination }: EngagementNavProps) {
  const searchParams = useSearchParams()
  
  // Hide on shared links (when visitor comes from ref parameter)
  const isFromSharedLink = searchParams?.has("ref")
  if (isFromSharedLink) return null

  const track = (target: string) => {
    if (typeof window === "undefined") return
    trackEngagementClick({
      path: `${window.location.pathname}${window.location.search}`,
      target,
      destination,
    })
  }

  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Keep exploring Infinity Wanderlust</p>
            <p className="text-xs text-muted-foreground">Discover events, reviews, and destination galleries in one tap.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="default" className="h-8">
              <Link href="/events" onClick={() => track("quick_events")}>
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                Events
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8">
              <Link href={getGalleryHref(destination)} onClick={() => track("quick_gallery")}>
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                Gallery
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8">
              <Link href={getReviewsHref(destination)} onClick={() => track("quick_reviews")}>
                <Star className="mr-1.5 h-3.5 w-3.5" />
                Reviews
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-8">
              <Link href="/articles" onClick={() => track("quick_articles")}>
                <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                Articles
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EngagementMobileDock({ destination }: EngagementNavProps) {
  const searchParams = useSearchParams()
  
  // Hide on shared links
  const isFromSharedLink = searchParams?.has("ref")
  if (isFromSharedLink) return null

  const track = (target: string) => {
    if (typeof window === "undefined") return
    trackEngagementClick({
      path: `${window.location.pathname}${window.location.search}`,
      target,
      destination,
    })
  }

  return (
    <div className="fixed inset-x-0 bottom-3 z-40 flex justify-center px-4 md:hidden pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border bg-background/95 p-1.5 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid grid-cols-5 gap-1">
          <Button asChild variant="ghost" size="sm" className="h-11 px-1">
            <Link href="/" className="flex flex-col items-center justify-center gap-0.5 text-[11px]" onClick={() => track("dock_home")}>
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-11 px-1">
            <Link href="/events" className="flex flex-col items-center justify-center gap-0.5 text-[11px]" onClick={() => track("dock_events")}>
              <Compass className="h-4 w-4" />
              Events
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-11 px-1">
            <Link href="/articles" className="flex flex-col items-center justify-center gap-0.5 text-[11px]" onClick={() => track("dock_articles")}>
              <BookOpen className="h-4 w-4" />
              Blog
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-11 px-1">
            <Link href={getGalleryHref(destination)} className="flex flex-col items-center justify-center gap-0.5 text-[11px]" onClick={() => track("dock_gallery")}>
              <ImageIcon className="h-4 w-4" />
              Gallery
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-11 px-1">
            <Link href="/contact" className="flex flex-col items-center justify-center gap-0.5 text-[11px]" onClick={() => track("dock_contact")}>
              <PhoneCall className="h-4 w-4" />
              Contact
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

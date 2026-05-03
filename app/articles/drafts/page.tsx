"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, FileClock, Pencil, Upload, Trash2, Search, ArrowLeft } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { fetchReviews, isDraftReview, stripBlogMarker, markAsBlogContent, updateReview, deleteReview, type ReviewWithAuthor } from "@/lib/reviews"

const ADMIN_EMAIL = "infinitywanderlusttravels@gmail.com"

export default function DraftArticlesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isLoading: isAuthLoading } = useAuth()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  const { data, isLoading, isError } = useQuery({
    queryKey: ["article-drafts"],
    queryFn: async () => {
      const result = await fetchReviews(1, 200, "-updated", "")
      return (result.items || []).filter((item) => isDraftReview(item))
    },
    enabled: isAdmin,
    refetchOnWindowFocus: false,
  })

  const drafts = data || []

  const filteredDrafts = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    if (!term) return drafts
    return drafts.filter((draft) => {
      const title = (draft.destination || "").toLowerCase()
      const body = stripBlogMarker(draft.review_text || "").toLowerCase()
      return title.includes(term) || body.includes(term)
    })
  }, [drafts, searchQuery])

  const formatDate = (value: string) => {
    const date = new Date(value)
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const estimateWords = (value: string) => value.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length

  const handlePublish = async (draft: ReviewWithAuthor) => {
    setPublishingId(draft.id)
    try {
      const cleanText = stripBlogMarker(draft.review_text || "")
      const result = await updateReview(draft.id, {
        destination: (draft.destination || "Untitled Article").trim(),
        rating: draft.rating || 5,
        review_text: markAsBlogContent(cleanText),
      })

      if (!result) throw new Error("Could not publish this draft")

      toast({ title: "Draft published", description: "The draft is now live in the blog." })
      await queryClient.invalidateQueries({ queryKey: ["article-drafts"] })
      await queryClient.invalidateQueries({ queryKey: ["articles"] })
      router.push(`/articles/${draft.id}`)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Publish failed",
        description: error?.message || "Could not publish the draft right now.",
      })
    } finally {
      setPublishingId(null)
    }
  }

  const handleDelete = async (draftId: string) => {
    if (!confirm("Delete this draft permanently?")) return

    setDeletingId(draftId)
    try {
      await deleteReview(draftId)
      toast({ title: "Draft deleted" })
      await queryClient.invalidateQueries({ queryKey: ["article-drafts"] })
      await queryClient.invalidateQueries({ queryKey: ["articles"] })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error?.message || "Could not delete this draft.",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="container max-w-5xl py-12">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Checking permissions...</CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You need to sign in as admin to view drafts.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild><Link href="/login?redirect=/articles/drafts">Sign In</Link></Button>
            <Button variant="outline" asChild><Link href="/articles">Back to Articles</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Admin access only</CardTitle>
            <CardDescription>Only admin can access article drafts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/articles">Back to Articles</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8 md:py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.push("/articles")}> 
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Articles
        </Button>
        <Button onClick={() => router.push("/articles/create")}>Write New Article</Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileClock className="h-6 w-6" />
            Draft Articles
          </CardTitle>
          <CardDescription>
            Manage unpublished drafts saved in the same articles collection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search drafts by title or content..."
              className="pl-9"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading drafts...</div>
          ) : isError ? (
            <div className="py-12 text-center text-destructive">Could not load drafts.</div>
          ) : filteredDrafts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-lg font-semibold">No drafts found</p>
              <p className="mt-1 text-muted-foreground">Save a draft from the article editor to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDrafts.map((draft) => {
                const body = stripBlogMarker(draft.review_text || "")
                const wordCount = estimateWords(body)
                return (
                  <div key={draft.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold leading-snug">{draft.destination || "Untitled Draft"}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {body || "No content yet."}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Updated {formatDate(draft.updated || draft.created)} · {wordCount} words
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/articles/create?edit=${draft.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" onClick={() => handlePublish(draft)} disabled={publishingId === draft.id || deletingId === draft.id}>
                          {publishingId === draft.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Publish
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(draft.id)}
                          disabled={publishingId === draft.id || deletingId === draft.id}
                        >
                          {deletingId === draft.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
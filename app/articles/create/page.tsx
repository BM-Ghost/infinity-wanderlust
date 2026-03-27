"use client"

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ImagePlus, X } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { createReview } from "@/lib/reviews"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

const ADMIN_EMAIL = "infinitywanderlusttravels@gmail.com"

export default function CreateArticlePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  const readingMinutes = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
  }, [content])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null

    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Image too large",
        description: "Please choose an image smaller than 8MB.",
      })
      event.target.value = ""
      return
    }

    setCoverImage(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview)
    }
    setCoverImage(null)
    setCoverPreview(null)
  }

  const handlePublish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle || !trimmedContent) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Add a title and article content before publishing.",
      })
      return
    }

    if (trimmedContent.length < 80) {
      toast({
        variant: "destructive",
        title: "Content too short",
        description: "Please write at least 80 characters for a professional article post.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createReview({
        destination: trimmedTitle,
        rating: 5,
        review_text: trimmedContent,
        photos: coverImage ? [coverImage] : [],
      })

      if (!result) {
        throw new Error("Publishing failed")
      }

      toast({
        title: "Article published",
        description: "Your blog article is now live.",
      })

      router.replace(`/articles/${result.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Publish failed",
        description: error?.message || "Could not publish this article right now.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Checking permissions...</CardContent>
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
            <CardDescription>You must sign in to publish blog articles.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/login?redirect=/articles/create">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/articles">Back to Blogs</Link>
            </Button>
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
            <CardDescription>
              Blog publishing is currently restricted to the admin account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/articles">Back to Blogs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <Card>
        <CardHeader>
          <CardTitle>Write New Blog Article</CardTitle>
          <CardDescription>
            Publish directly to the blog feed. Estimated read time: {readingMinutes} min.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublish} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g., 7 Days in Zanzibar: What I’d Do Again"
                maxLength={120}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Article Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write your full article here..."
                className="min-h-[280px]"
                required
              />
              <p className="text-xs text-muted-foreground">{content.trim().length} characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage">Cover Image (optional)</Label>
              {coverPreview ? (
                <div className="relative rounded-md overflow-hidden border">
                  <img src={coverPreview} alt="Cover preview" className="h-52 w-full object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute right-2 top-2 rounded-full bg-background/90 p-1"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="coverImage"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-4 py-10 text-sm text-muted-foreground hover:bg-muted/40"
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload cover image
                </label>
              )}
              <Input
                id="coverImage"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => router.push("/articles")}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Article"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

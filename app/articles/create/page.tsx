"use client"

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ImagePlus, X, ArrowLeft } from "lucide-react"
import { useEffect } from "react"

import { useAuth } from "@/components/auth-provider"
import { createReview, updateReview, fetchReviewById, markAsBlogContent, stripBlogMarker } from "@/lib/reviews"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"

const ADMIN_EMAIL = "infinitywanderlusttravels@gmail.com"

export default function CreateArticlePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingArticle, setIsLoadingArticle] = useState(!!editId)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const isEditMode = !!editId

  // Load article data when editing
  useEffect(() => {
    if (!editId) return
    const loadArticle = async () => {
      try {
        const article = await fetchReviewById(editId)
        if (article) {
          setTitle(article.destination)
          setContent(stripBlogMarker(article.review_text))
        } else {
          toast({ variant: "destructive", title: "Article not found" })
          router.replace("/articles")
        }
      } catch {
        toast({ variant: "destructive", title: "Failed to load article" })
        router.replace("/articles")
      } finally {
        setIsLoadingArticle(false)
      }
    }
    loadArticle()
  }, [editId, router, toast])

  const wordCount = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, " ").trim()
    return text.split(/\s+/).filter(Boolean).length
  }, [content])

  const readingMinutes = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    if (!file) return
    if (file.size > 8 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Image too large", description: "Please choose an image smaller than 8 MB." })
      event.target.value = ""
      return
    }
    setCoverImage(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const clearImage = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverImage(null)
    setCoverPreview(null)
  }

  const handlePublish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const plainText = content.replace(/<[^>]*>/g, "").trim()

    if (!trimmedTitle || !plainText) {
      toast({ variant: "destructive", title: "Missing information", description: "Add a title and article content before publishing." })
      return
    }
    if (plainText.length < 80) {
      toast({ variant: "destructive", title: "Content too short", description: "Please write at least 80 characters." })
      return
    }

    setIsSubmitting(true)
    try {
      const blogContent = markAsBlogContent(content)
      let result
      if (isEditMode && editId) {
        result = await updateReview(editId, {
          destination: trimmedTitle,
          rating: 5,
          review_text: blogContent,
          photos: coverImage ? [coverImage] : [],
        })
      } else {
        result = await createReview({
          destination: trimmedTitle,
          rating: 5,
          review_text: blogContent,
          photos: coverImage ? [coverImage] : [],
        })
      }
      if (!result) throw new Error("Operation failed")
      toast({
        title: isEditMode ? "Article updated" : "Article published",
        description: isEditMode ? "Your changes have been saved." : "Your blog article is now live.",
      })
      router.replace(`/articles/${result.id}`)
      router.refresh()
    } catch (error: any) {
      toast({ variant: "destructive", title: isEditMode ? "Update failed" : "Publish failed", description: error?.message || "Could not save the article right now." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || isLoadingArticle) {
    return (
      <div className="container max-w-4xl py-12">
        <Card><CardContent className="py-10 text-center text-muted-foreground">{isLoadingArticle ? "Loading article..." : "Checking permissions..."}</CardContent></Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader><CardTitle>Sign in required</CardTitle><CardDescription>You must sign in to publish blog articles.</CardDescription></CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild><Link href="/login?redirect=/articles/create">Sign In</Link></Button>
            <Button variant="outline" asChild><Link href="/articles">Back to Blogs</Link></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader><CardTitle>Admin access only</CardTitle><CardDescription>Blog publishing is currently restricted to the admin account.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link href="/articles">Back to Blogs</Link></Button></CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 md:py-12">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">{isEditMode ? "Edit Article" : "Write New Blog Article"}</CardTitle>
          <CardDescription>
            {isEditMode ? "Update your article below." : `Publish directly to the blog feed. ~${wordCount} words \u00b7 ${readingMinutes} min read`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublish} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">Article Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 7 Days in Zanzibar: What I'd Do Again" maxLength={120} className="text-lg" required />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Article Content</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write your full article here... Use the toolbar to format text, add headings, lists, links, and images."
                minHeight="380px"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{wordCount} words &middot; {readingMinutes} min read</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverImage" className="text-sm font-medium">Cover Image (optional)</Label>
              {coverPreview ? (
                <div className="relative rounded-lg overflow-hidden border shadow-sm">
                  <img src={coverPreview} alt="Cover preview" className="h-52 w-full object-cover" />
                  <button type="button" onClick={clearImage} className="absolute right-2 top-2 rounded-full bg-background/90 p-1.5 shadow-sm hover:bg-background" aria-label="Remove image">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="coverImage" className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-12 text-sm text-muted-foreground hover:bg-muted/40 hover:border-primary/40 transition-colors">
                  <ImagePlus className="h-5 w-5" />
                  Click to upload a cover image
                </label>
              )}
              <Input id="coverImage" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/articles")}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} size="lg">
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditMode ? "Saving..." : "Publishing..."}</>) : isEditMode ? "Save Changes" : "Publish Article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

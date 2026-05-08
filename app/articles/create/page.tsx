"use client"

import { useMemo, useState, useRef, useCallback, useEffect, type ChangeEvent, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ImagePlus, X, ArrowLeft } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { markAsDraftBlogContent, createReview, updateReview, fetchReviewById, markAsBlogContent, stripBlogMarker, isDraftContent } from "@/lib/reviews"
import { extractPlainText } from "@/lib/rich-text"

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
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isLoadingArticle, setIsLoadingArticle] = useState(!!editId)
  const [draftRecordId, setDraftRecordId] = useState<string | null>(editId)
  const [isEditingDraft, setIsEditingDraft] = useState(false)
  const [savedSnapshot, setSavedSnapshot] = useState({ title: "", content: "" })
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null)

  const hasUnsavedChangesRef = useRef(false)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL
  const isEditMode = !!(editId || draftRecordId)

  const plainTextContent = useMemo(() => extractPlainText(content), [content])
  const hasUnsavedChanges = useMemo(() => {
    const normalizedTitle = title.trim()
    const normalizedContent = content.trim()
    return (
      normalizedTitle !== savedSnapshot.title ||
      normalizedContent !== savedSnapshot.content ||
      !!coverImage
    )
  }, [title, content, savedSnapshot, coverImage])

  // Load article data when editing
  useEffect(() => {
    setDraftRecordId(editId)
    if (!editId) return
    const loadArticle = async () => {
      try {
        const article = await fetchReviewById(editId)
        if (article) {
          setIsEditingDraft(isDraftContent(article.review_text))
          const loadedTitle = article.destination || ""
          const loadedContent = stripBlogMarker(article.review_text)
          setTitle(loadedTitle)
          setContent(loadedContent)
          setSavedSnapshot({
            title: loadedTitle.trim(),
            content: loadedContent.trim(),
          })
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

  useEffect(() => {
    if (editId) return
    setIsEditingDraft(false)
    setSavedSnapshot({ title: "", content: "" })
  }, [editId])

  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges
  }, [hasUnsavedChanges])

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChangesRef.current) return
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [])

  useEffect(() => {
    const handleDocumentNavigation = (event: MouseEvent) => {
      if (!hasUnsavedChangesRef.current || isSubmitting || isSavingDraft) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target && anchor.target !== "_self") return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) return

      const currentUrl = new URL(window.location.href)
      const nextUrl = new URL(href, currentUrl.href)
      if (nextUrl.origin !== currentUrl.origin) return

      const currentTarget = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
      const nextTarget = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`
      if (currentTarget === nextTarget) return

      event.preventDefault()
      event.stopPropagation()
      setPendingLeaveAction(() => () => router.push(nextTarget))
      setShowLeaveDialog(true)
    }

    document.addEventListener("click", handleDocumentNavigation, true)
    return () => document.removeEventListener("click", handleDocumentNavigation, true)
  }, [router, isSubmitting, isSavingDraft])

  const wordCount = useMemo(() => {
    const text = extractPlainText(content)
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

  const createOrUpdateArticle = useCallback(async (mode: "publish" | "draft") => {
    const trimmedTitle = title.trim()

    if (mode === "publish") {
      if (!trimmedTitle || !plainTextContent) {
        toast({ variant: "destructive", title: "Missing information", description: "Add a title and article content before publishing." })
        return null
      }

      if (plainTextContent.length < 80) {
        toast({ variant: "destructive", title: "Content too short", description: "Please write at least 80 characters." })
        return null
      }
    } else if (!trimmedTitle && !plainTextContent) {
      toast({ variant: "destructive", title: "Nothing to save", description: "Write a title or content before saving a draft." })
      return null
    }

    if (mode === "publish") {
      setIsSubmitting(true)
    } else {
      setIsSavingDraft(true)
    }

    try {
      const articleContent = mode === "publish" ? markAsBlogContent(content) : markAsDraftBlogContent(content)
      const activeArticleId = editId || draftRecordId

      const result = activeArticleId
        ? await updateReview(activeArticleId, {
            destination: trimmedTitle || "Untitled Draft",
            rating: 5,
            review_text: articleContent,
            photos: coverImage ? [coverImage] : [],
          })
        : await createReview({
            destination: trimmedTitle || "Untitled Draft",
            rating: 5,
            review_text: articleContent,
            photos: coverImage ? [coverImage] : [],
          })

      if (!result) throw new Error("Operation failed")

      setDraftRecordId(result.id)
      setSavedSnapshot({ title: trimmedTitle, content: content.trim() })
      setCoverImage(null)

      if (mode === "draft") {
        setIsEditingDraft(true)
        toast({ title: "Draft saved", description: "Your article draft has been saved." })
        if (!editId) {
          router.replace(`/articles/create?edit=${result.id}`)
        }
        return result
      }

      setIsEditingDraft(false)
      toast({
        title: activeArticleId ? "Article updated" : "Article published",
        description: activeArticleId ? "Your changes have been saved." : "Your blog article is now live.",
      })
      router.replace(`/articles/${result.id}`)
      router.refresh()
      return result
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: mode === "publish" ? (isEditMode ? "Update failed" : "Publish failed") : "Draft save failed",
        description: error?.message || "Could not save the article right now.",
      })
      return null
    } finally {
      if (mode === "publish") {
        setIsSubmitting(false)
      } else {
        setIsSavingDraft(false)
      }
    }
  }, [title, plainTextContent, content, editId, draftRecordId, coverImage, toast, router, isEditMode])

  const handlePublish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await createOrUpdateArticle("publish")
  }

  const handleSaveDraft = async () => {
    const result = await createOrUpdateArticle("draft")
    return !!result
  }

  const attemptLeave = (action: () => void) => {
    if (!hasUnsavedChanges) {
      action()
      return
    }

    setPendingLeaveAction(() => action)
    setShowLeaveDialog(true)
  }

  const runPendingLeaveAction = () => {
    const action = pendingLeaveAction
    setPendingLeaveAction(null)
    if (action) action()
  }

  const handleDropAndLeave = () => {
    setShowLeaveDialog(false)
    runPendingLeaveAction()
  }

  const handleSaveDraftAndLeave = async () => {
    const saved = await handleSaveDraft()
    if (!saved) return
    setShowLeaveDialog(false)
    runPendingLeaveAction()
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
        <Button variant="ghost" size="sm" onClick={() => attemptLeave(() => router.back())} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl">{isEditMode ? "Edit Article" : "Write New Blog Article"}</CardTitle>
            {isEditingDraft && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
                Draft
              </span>
            )}
          </div>
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
              <Button type="button" variant="outline" onClick={() => attemptLeave(() => router.push("/articles"))}>Cancel</Button>
              <Button type="button" variant="secondary" disabled={isSubmitting || isSavingDraft} onClick={handleSaveDraft}>
                {isSavingDraft ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Draft...</>) : "Save Draft"}
              </Button>
              <Button type="submit" disabled={isSubmitting || isSavingDraft} size="lg">
                {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditMode ? "Saving..." : "Publishing..."}</>) : isEditMode ? "Save Changes" : "Publish Article"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave article editor?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Save as draft to keep this article for later, or drop it and leave.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingDraft}>Continue Editing</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={handleDropAndLeave} disabled={isSavingDraft}>
              Drop Article
            </Button>
            <Button type="button" onClick={handleSaveDraftAndLeave} disabled={isSavingDraft}>
              {isSavingDraft ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving Draft...</>) : "Save Draft"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

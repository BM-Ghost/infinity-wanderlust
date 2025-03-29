"use client"

import Link from "next/link"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Search, Upload, ExternalLink, Instagram } from "lucide-react"
import { useTranslation } from "@/lib/translations"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import {
  fetchGalleryImages,
  fetchInstagramImages,
  uploadGalleryImage,
  likeGalleryImage,
  addGalleryComment,
  type GalleryImage,
} from "@/lib/gallery"

// Add a helper component to show instructions for setting up the gallery collection
const GallerySetupInstructions = ({ activeTab }: { activeTab: string }) => {
  if (activeTab !== "uploads") return null

  return (
    <div className="bg-card p-6 rounded-lg mb-8">
      <h3 className="text-lg font-medium mb-2">Gallery Collection Setup</h3>
      <p className="text-muted-foreground mb-4">
        It looks like the gallery collection doesn't exist in your PocketBase instance yet. To enable image uploads,
        you'll need to create it with the following schema:
      </p>
      <div className="bg-muted p-4 rounded-md text-sm mb-4 overflow-x-auto">
        <pre>
          {`Collection Name: gallery
Fields:
- title (text, required)
- location (text)
- image (file, required)
- likes (number)
- comments (json)
- isInstagram (boolean)
- instagramUrl (text)
- user (relation to users collection)`}
        </pre>
      </div>
      <p className="text-sm text-muted-foreground">
        After creating the collection, you'll be able to upload and interact with images.
      </p>
    </div>
  )
}

export default function GalleryPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [commentText, setCommentText] = useState("")

  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadLocation, setUploadLocation] = useState("")

  // Gallery images state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [instagramImages, setInstagramImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load gallery images
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true)
      try {
        const [gallery, instagram] = await Promise.all([fetchGalleryImages(), fetchInstagramImages()])

        setGalleryImages(gallery)
        setInstagramImages(instagram)
      } catch (error: any) {
        console.error("Error loading images:", error)
        toast({
          variant: "destructive",
          title: "Error loading images",
          description: error.message || "Using fallback gallery data instead.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()
  }, [toast])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0])
    }
  }

  // Handle image upload
  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle || !uploadLocation) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all fields and select an image.",
      })
      return
    }

    setIsUploading(true)
    try {
      const newImage = await uploadGalleryImage(uploadFile, uploadTitle, uploadLocation)

      if (newImage) {
        setGalleryImages((prev) => [newImage, ...prev])
        setUploadDialogOpen(false)
        setUploadFile(null)
        setUploadTitle("")
        setUploadLocation("")

        toast({
          title: "Image uploaded",
          description: "Your image has been added to the gallery.",
        })
      } else {
        throw new Error("Failed to upload image")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Please make sure the gallery collection exists in PocketBase.",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle like
  const handleLike = async (imageId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to like images.",
      })
      return
    }

    try {
      const success = await likeGalleryImage(imageId)

      if (success) {
        setGalleryImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, likes: img.likes + 1 } : img)))

        toast({
          title: "Image liked",
          description: "You liked this image.",
        })
      }
    } catch (error) {
      console.error("Like error:", error)
      toast({
        variant: "destructive",
        title: "Action failed",
        description: "Please try again later.",
      })
    }
  }

  // Handle comment
  const handleComment = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to comment.",
      })
      return
    }

    if (!selectedImage || !commentText.trim()) {
      return
    }

    try {
      const success = await addGalleryComment(selectedImage, commentText)

      if (success) {
        setGalleryImages((prev) =>
          prev.map((img) => (img.id === selectedImage ? { ...img, comments: img.comments + 1 } : img)),
        )

        setCommentText("")

        toast({
          title: "Comment added",
          description: "Your comment has been added.",
        })
      }
    } catch (error) {
      console.error("Comment error:", error)
      toast({
        variant: "destructive",
        title: "Action failed",
        description: "Please try again later.",
      })
    }
  }

  // Filter images based on active tab and search query
  const getFilteredImages = () => {
    let images: GalleryImage[] = []

    switch (activeTab) {
      case "instagram":
        images = instagramImages
        break
      case "uploads":
        images = galleryImages.filter((img) => !img.isInstagram)
        break
      case "all":
      default:
        images = [...galleryImages, ...instagramImages]
        break
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return images.filter(
        (image) => image.location.toLowerCase().includes(query) || image.alt.toLowerCase().includes(query),
      )
    }

    return images
  }

  const filteredImages = getFilteredImages()

  // Get the selected image details
  const getSelectedImageDetails = () => {
    if (!selectedImage) return null

    const fromGallery = galleryImages.find((img) => img.id === selectedImage)
    const fromInstagram = instagramImages.find((img) => img.id === selectedImage)

    return fromGallery || fromInstagram || null
  }

  const selectedImageDetails = getSelectedImageDetails()

  return (
    <div className="forest-bg min-h-screen">
      <Navbar />

      <div className="container py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("galleryTitle")}</h1>
          <p className="text-muted-foreground text-lg">{t("gallerySubtitle")}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="instagram">
                <Instagram className="h-4 w-4 mr-2" />
                Instagram
              </TabsTrigger>
              <TabsTrigger value="uploads">Uploads</TabsTrigger>
            </TabsList>
          </Tabs>

          {user && (
            <Button onClick={() => setUploadDialogOpen(true)} className="md:ml-2">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          )}
        </div>

        {/* Add this after the search and tabs section */}
        <GallerySetupInstructions activeTab={activeTab} />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {filteredImages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No images found matching your search.</p>
              </div>
            ) : (
              <div className="gallery-grid">
                {filteredImages.map((image) => (
                  <div
                    key={image.id}
                    className="relative group overflow-hidden rounded-lg cursor-pointer"
                    onClick={() => setSelectedImage(image.id)}
                  >
                    <div className="aspect-square relative">
                      <Image
                        src={image.src || "/placeholder.svg"}
                        alt={image.alt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {image.isInstagram && (
                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1">
                          <Instagram className="h-4 w-4 text-pink-500" />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <h3 className="text-white font-medium">{image.alt}</h3>
                      <p className="text-white/80 text-sm">{image.location}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center text-white/90 text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          {image.likes}
                        </span>
                        <span className="flex items-center text-white/90 text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          {image.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Image Upload Dialog */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Image</DialogTitle>
              <DialogDescription>Share your travel memories with the community</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <div className="flex items-center gap-2">
                  <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                {uploadFile && (
                  <div className="mt-2 relative aspect-video rounded-md overflow-hidden">
                    <Image
                      src={URL.createObjectURL(uploadFile) || "/placeholder.svg"}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter a title for your image"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={uploadLocation}
                  onChange={(e) => setUploadLocation(e.target.value)}
                  placeholder="Where was this photo taken?"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
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
                    Uploading...
                  </span>
                ) : (
                  "Upload"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Detail Dialog */}
        <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            {selectedImageDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative aspect-square md:aspect-auto">
                  <Image
                    src={selectedImageDetails.src || ""}
                    alt={selectedImageDetails.alt || ""}
                    fill
                    className="object-cover"
                  />
                  {selectedImageDetails.isInstagram && (
                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm rounded-full p-2">
                      <Instagram className="h-5 w-5 text-pink-500" />
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col">
                  <DialogHeader>
                    <DialogTitle>{selectedImageDetails.alt}</DialogTitle>
                    <DialogDescription className="flex items-center">
                      {selectedImageDetails.location} • {selectedImageDetails.date}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex items-center gap-4 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => !selectedImageDetails.isInstagram && handleLike(selectedImageDetails.id)}
                      disabled={selectedImageDetails.isInstagram}
                    >
                      <Heart className="h-4 w-4" />
                      <span>{selectedImageDetails.likes}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>{selectedImageDetails.comments}</span>
                    </Button>
                    {selectedImageDetails.isInstagram && selectedImageDetails.instagramUrl && (
                      <Button variant="ghost" size="sm" className="flex items-center gap-2" asChild>
                        <a href={selectedImageDetails.instagramUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                          <span>View on Instagram</span>
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="mt-6 border-t pt-4">
                    <h4 className="font-medium mb-2">Comments</h4>
                    <div className="space-y-4 max-h-[200px] overflow-y-auto">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium">JD</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">John Doe</p>
                            <p className="text-xs text-muted-foreground">2 days ago</p>
                          </div>
                        </div>
                        <p className="text-sm mt-2 pl-10">Beautiful photo! The colors are amazing.</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium">AS</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Alice Smith</p>
                            <p className="text-xs text-muted-foreground">5 days ago</p>
                          </div>
                        </div>
                        <p className="text-sm mt-2 pl-10">I've been there too! Such an incredible place.</p>
                      </div>
                    </div>

                    {user && !selectedImageDetails.isInstagram && (
                      <div className="mt-4 pt-4 border-t">
                        <Textarea
                          placeholder="Add a comment..."
                          className="mb-2"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <Button size="sm" onClick={handleComment} disabled={!commentText.trim()}>
                          Post
                        </Button>
                      </div>
                    )}

                    {!user && (
                      <div className="mt-4 pt-4 border-t text-center">
                        <p className="text-sm text-muted-foreground">
                          Please{" "}
                          <Button variant="link" className="p-0 h-auto" asChild>
                            <Link href="/login">sign in</Link>
                          </Button>{" "}
                          to comment
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Footer />
    </div>
  )
}


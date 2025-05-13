"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { createUpload } from "@/lib/uploads"
import Image from "next/image"
import { Upload, MapPin, X } from "lucide-react"

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [caption, setCaption] = useState("")
  const [destination, setDestination] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images",
        variant: "destructive",
      })
      router.push("/login")
    }
  }, [user, router, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setUploadFile(file)

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const clearImage = () => {
    setUploadFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!uploadFile) {
      toast({
        title: "Image required",
        description: "Please select an image to upload",
        variant: "destructive",
      })
      return
    }

    if (!caption || !destination) {
      toast({
        title: "Missing information",
        description: "Please provide both a caption and destination",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await createUpload(uploadFile, caption, destination)

      toast({
        title: "Upload successful",
        description: "Your image has been uploaded to the gallery",
      })

      // Redirect back to gallery
      router.push("/gallery")
    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your image",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-12 forest-bg">
        <div className="container max-w-2xl">
          <Card className="bg-background/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Upload Photo</CardTitle>
              <CardDescription>Share your travel memories with the Infinity Wanderlust community</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="image">Photo</Label>

                  {previewUrl ? (
                    <div className="relative aspect-video rounded-md overflow-hidden border border-border">
                      <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-md p-8 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your photo here, or click to browse
                      </p>
                      <Input id="image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <Button type="button" variant="outline" onClick={() => document.getElementById("image")?.click()}>
                        Select Photo
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Input
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Enter a caption for your photo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destination" className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Destination
                  </Label>
                  <Input
                    id="destination"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Where was this photo taken?"
                    required
                  />
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/gallery")}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
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
                  "Upload Photo"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}

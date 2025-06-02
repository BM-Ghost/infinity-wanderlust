"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Upload } from "lucide-react"
import Image from "next/image"
import { useTranslation } from "@/lib/translations"
import { InstagramFeed } from "@/components/instagram-feed"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/components/ui/use-toast"
import { useUploads } from "@/hooks/useUploads"
import { useQueryClient } from "@tanstack/react-query"

export default function GalleryPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState("uploads")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUpload, setSelectedUpload] = useState<any | null>(null)

  const { data: uploads = [], isLoading, isError } = useUploads(1)

  const filteredUploads = uploads.filter((upload) => {
    const caption = upload.caption?.toLowerCase() || ""
    const destination = upload.destination?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()
    return caption.includes(query) || destination.includes(query)
  })

  const handleUploadClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload images",
        variant: "destructive",
      })
      return
    }

    // Redirect to upload page
    window.location.href = "/upload"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 py-12 forest-bg">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">{t("galleryTitle")}</h1>
            <p className="text-xl text-white/80">{t("gallerySubtitle")}</p>
          </div>

          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t("search gallery")}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {user && (
                <Button onClick={handleUploadClick}>
                  <Upload className="mr-2 h-4 w-4" /> {t("Upload photos")}
                </Button>
              )}
            </div>

            <Tabs defaultValue="uploads" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="uploads">Uploads</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
              </TabsList>

              <TabsContent value="uploads" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : filteredUploads.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">{t("no images found!")}</p>
                    {user && (
                      <Button onClick={handleUploadClick}>
                        <Upload className="mr-2 h-4 w-4" /> {t("Upload photos")}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="gallery-grid">
                    {filteredUploads.map((upload) => (
                      <Card
                        key={upload.id}
                        className="overflow-hidden cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedUpload(upload)}
                      >
                        <div className="relative aspect-square">
                          <Image
                            src={upload.imageUrl || "/placeholder.svg"}
                            alt={upload.caption}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-medium truncate">{upload.caption}</h3>
                          <p className="text-sm text-muted-foreground truncate">{upload.destination}</p>
                          {upload.uploader_name && (
                            <p className="text-xs text-muted-foreground mt-1">By {upload.uploader_name}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="instagram" className="mt-0">
                <InstagramFeed />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {selectedUpload && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUpload(null)}
        >
          <div
            className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video">
              <Image
                src={selectedUpload.imageUrl || "/placeholder.svg"}
                alt={selectedUpload.caption}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{selectedUpload.caption}</h2>
              <p className="text-muted-foreground mb-4">{selectedUpload.destination}</p>
              {selectedUpload.uploader_name && (
                <p className="text-sm mb-4">
                  Uploaded by <span className="font-medium">{selectedUpload.uploader_name}</span>
                </p>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  )
}

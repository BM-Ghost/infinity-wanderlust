import { Skeleton } from "@/components/ui/skeleton"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function ArticleDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero section skeleton */}
      <div className="relative h-[40vh] md:h-[50vh] bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
        </div>
      </div>

      <div className="container py-8 md:py-12">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center mb-8">
          <Skeleton className="h-4 w-16 mr-2" />
          <Skeleton className="h-4 w-4 mx-2" />
          <Skeleton className="h-4 w-16 mx-2" />
          <Skeleton className="h-4 w-4 mx-2" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border p-6 md:p-8">
              {/* Author info skeleton */}
              <div className="flex items-center mb-6">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="ml-4">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>

              {/* Article content skeleton */}
              <Skeleton className="h-8 w-3/4 mb-4" />

              <div className="space-y-4 mb-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              {/* Photo gallery skeleton */}
              <Skeleton className="aspect-video w-full rounded-lg mb-6" />

              {/* Article metadata skeleton */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>

              {/* Action buttons skeleton */}
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div>
            {/* Destination info skeleton */}
            <div className="bg-card rounded-lg border p-6 mb-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-4 w-full mb-4" />

              <div className="flex justify-between items-center mb-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <div className="flex">
                    <Skeleton className="h-4 w-4 mr-1" />
                    <Skeleton className="h-4 w-4 mr-1" />
                    <Skeleton className="h-4 w-4 mr-1" />
                    <Skeleton className="h-4 w-4 mr-1" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>

              <Skeleton className="h-10 w-full" />
            </div>

            {/* Related articles skeleton */}
            <div className="bg-card rounded-lg border p-6">
              <Skeleton className="h-6 w-48 mb-4" />

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <div className="flex">
                          <Skeleton className="h-3 w-3 mr-1" />
                          <Skeleton className="h-3 w-3 mr-1" />
                          <Skeleton className="h-3 w-3 mr-1" />
                          <Skeleton className="h-3 w-3 mr-1" />
                          <Skeleton className="h-3 w-3" />
                        </div>
                      </div>
                      <Skeleton className="h-3 w-full mt-1" />
                      <Skeleton className="h-3 w-full mt-1" />
                      <div className="flex items-center gap-3 mt-1">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Call to action skeleton */}
        <div className="mt-12 text-center">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-full mx-auto mb-2" />
            <Skeleton className="h-4 w-5/6 mx-auto mb-6" />
            <div className="flex justify-center gap-4">
              <Skeleton className="h-11 w-36" />
              <Skeleton className="h-11 w-36" />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

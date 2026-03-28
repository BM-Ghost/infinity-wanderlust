import type { ReactNode } from "react"
import type { Metadata } from "next"

export const runtime = "edge"

const PB_URL = "https://remain-faceghost.pockethost.io"
const SITE_URL = "https://infinity-wanderlust.com"

/** Strip HTML tags, return plain text */
function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  try {
    const res = await fetch(`${PB_URL}/api/collections/reviews/records/${encodeURIComponent(id)}`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) return {}

    const review = await res.json()

    const destination = (review.destination || "Travel Review").trim()
    const reviewer = review.reviewer_name || review.reviewer || ""
    const title = reviewer ? `${destination} — reviewed by ${reviewer}` : destination

    const descriptionRaw = plainText(review.review_text || review.description || "")
    const description = descriptionRaw.slice(0, 200) + (descriptionRaw.length > 200 ? "…" : "")
    const pageUrl = `${SITE_URL}/reviews/${review.id}`

    let photos: string[] = []
    if (Array.isArray(review.photos)) {
      photos = review.photos
    } else if (typeof review.photos === "string" && review.photos) {
      try { photos = JSON.parse(review.photos) } catch { photos = [review.photos] }
    }

    const ogImages =
      photos.length > 0
        ? [
            {
              url: `${PB_URL}/api/files/${review.collectionId}/${review.id}/${photos[0]}?thumb=1200x630`,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [
            {
              url: `${SITE_URL}/placeholder-logo.png`,
              width: 1200,
              height: 630,
              alt: "Infinity Wanderlust",
            },
          ]

    return {
      title,
      description,
      alternates: { canonical: pageUrl },
      openGraph: {
        type: "article",
        title,
        description,
        url: pageUrl,
        siteName: "Infinity Wanderlust",
        images: ogImages,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImages[0].url],
        creator: "@infinitywanderlust",
      },
    }
  } catch {
    return {}
  }
}

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

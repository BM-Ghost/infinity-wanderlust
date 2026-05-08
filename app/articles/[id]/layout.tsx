import type { ReactNode } from "react"
import type { Metadata } from "next"
import { extractPlainText } from "@/lib/rich-text"

export const runtime = "edge"

const PB_URL = "https://remain-faceghost.pockethost.io"
const SITE_URL = "https://infinity-wanderlust.com"
const BLOG_MARKER = "<!--IWT_BLOG-->"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params

  try {
    const res = await fetch(`${PB_URL}/api/collections/reviews/records/${encodeURIComponent(id)}`, {
      // Cache for 1 hour on the edge; re-validate if content changes
      next: { revalidate: 3600 },
    })

    if (!res.ok) return {}

    const article = await res.json()

    const title = (article.destination || "Travel Article").trim()
    const descriptionRaw = extractPlainText((article.review_text || article.description || "").replace(BLOG_MARKER, ""))
    const description = descriptionRaw.slice(0, 200) + (descriptionRaw.length > 200 ? "…" : "")
    const pageUrl = `${SITE_URL}/articles/${article.id}`

    // Build the OG image URL from the first uploaded photo
    let photos: string[] = []
    if (Array.isArray(article.photos)) {
      photos = article.photos
    } else if (typeof article.photos === "string" && article.photos) {
      try { photos = JSON.parse(article.photos) } catch { photos = [article.photos] }
    }

    const ogImages =
      photos.length > 0
        ? [
            {
              // Request a 1200×630 crop — WhatsApp / Instagram / Twitter all accept this
              url: `${PB_URL}/api/files/${article.collectionId}/${article.id}/${photos[0]}?thumb=1200x630`,
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

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

"use client"

import { cn } from "@/lib/utils"

interface RichTextRendererProps {
  content: string
  className?: string
}

// Regex to match URLs in plain text
const URL_REGEX = /(https?:\/\/[^\s<]+)/g

/**
 * Converts plain text URLs into clickable anchor tags.
 */
function linkifyText(text: string): string {
  return text.replace(
    URL_REGEX,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  )
}

/**
 * Renders rich text HTML content with professional typography and styling.
 * Detects whether content is HTML or plain text and renders accordingly.
 * Automatically converts URLs to clickable links in both plain text and HTML.
 */
export function RichTextRenderer({ content, className }: RichTextRendererProps) {
  if (!content) return null

  const isHtml = /<[a-z][\s\S]*>/i.test(content)

  if (!isHtml) {
    // Render plain text with paragraph splitting and auto-linked URLs
    const linkedHtml = content
      .split("\n\n")
      .map((p) => `<p>${linkifyText(p)}</p>`)
      .join("")

    return (
      <div
        className={cn("rich-text-content", className)}
        dangerouslySetInnerHTML={{ __html: linkedHtml }}
      />
    )
  }

  // For HTML content, linkify any bare URLs that aren't already inside an <a> tag
  const linkifiedHtml = content.replace(
    /(<a\s[^>]*>.*?<\/a>)|((https?:\/\/[^\s<]+))/g,
    (match, anchorTag, _full, bareUrl) => {
      // If it's already wrapped in an <a>, keep it as-is
      if (anchorTag) return anchorTag
      return `<a href="${bareUrl}" target="_blank" rel="noopener noreferrer">${bareUrl}</a>`
    }
  )

  return (
    <div
      className={cn("rich-text-content", className)}
      dangerouslySetInnerHTML={{ __html: linkifiedHtml }}
    />
  )
}

"use client"
import Script from "next/script"

export function InstagramFeed() {
  return (
    <div className="instagram-feed-container min-h-[600px] flex items-center justify-center">
      {/* Elfsight Instagram Feed Widget */}
      <Script
        src="https://static.elfsight.com/platform/platform.js"
        strategy="afterInteractive"
        onError={(e) => {
          console.error("Error loading Elfsight script:", e)
        }}
      />
      <div className="elfsight-app-cb483b94-6ae3-4a9d-a9ac-1607f5334118 w-full" data-elfsight-app-lazy></div>

      {/* Fallback content while widget loads */}
      <noscript>
        <div className="text-center p-8">
          <p>Please enable JavaScript to view our Instagram feed</p>
          <a
            href="https://www.instagram.com/infinitywanderlust"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline mt-2 inline-block"
          >
            Visit our Instagram page
          </a>
        </div>
      </noscript>
    </div>
  )
}

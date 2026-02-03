import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { Metadata } from "next"
import { organizationSchema, websiteSchema } from "@/lib/seo-schema"
import { LayoutClient } from "@/components/layout-client"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://infinity-wanderlust.com'),
  title: {
    default: 'Infinity Wanderlust - Discover & Book Travel Events',
    template: '%s | Infinity Wanderlust',
  },
  description: 'Discover and book unforgettable travel events worldwide. Connect with travelers, find amazing destinations, share reviews, and create lasting memories with Infinity Wanderlust.',
  keywords: [
    'travel events',
    'travel bookings',
    'destination discovery',
    'travel community',
    'adventure travel',
    'travel reviews',
    'travel gallery',
    'group tours',
    'travel planning',
  ],
  authors: [{ name: 'Infinity Wanderlust' }],
  creator: 'Infinity Wanderlust',
  publisher: 'Infinity Wanderlust',
  robots: {
    index: true,
    follow: true,
    nocache: false,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://infinity-wanderlust.com',
    title: 'Infinity Wanderlust - Discover & Book Travel Events',
    description: 'Discover and book unforgettable travel events worldwide. Connect with travelers, find amazing destinations, and create lasting memories.',
    siteName: 'Infinity Wanderlust',
    images: [
      {
        url: '/placeholder-logo.png',
        width: 1200,
        height: 630,
        alt: 'Infinity Wanderlust - Travel Events Platform',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Infinity Wanderlust - Discover & Book Travel Events',
    description: 'Discover and book unforgettable travel events worldwide.',
    images: ['/placeholder-logo.png'],
    creator: '@infinitywanderlust',
  },
  icons: {
    icon: '/placeholder-logo.svg',
    shortcut: '/placeholder-logo.png',
    apple: '/placeholder-logo.png',
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://infinity-wanderlust.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* JSON-LD Schema for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {/* JSON-LD Schema for Website */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Mobile Web App Meta Tags */}
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Infinity Wanderlust" />
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://remain-faceghost.pockethost.io" />
        <link rel="dns-prefetch" href="https://remain-faceghost.pockethost.io" />
      </head>
      <body className={inter.className}>
        <Providers>
          <LayoutClient>
            <Navbar />
            {children}
            <Footer />
            <Toaster />
          </LayoutClient>
        </Providers>
      </body>
    </html>
  )
}

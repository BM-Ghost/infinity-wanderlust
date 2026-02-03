import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Travel Articles & Tips | Infinity Wanderlust',
  description: 'Read inspiring travel articles, destination guides, and travel tips from Infinity Wanderlust community experts.',
  keywords: ['travel articles', 'travel guides', 'destination guides', 'travel tips', 'travel stories'],
  openGraph: {
    title: 'Travel Articles & Tips | Infinity Wanderlust',
    description: 'Read inspiring travel articles, destination guides, and travel tips from our community experts.',
    type: 'website',
    url: 'https://infinity-wanderlust.com/articles',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Travel Articles - Infinity Wanderlust',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Articles & Tips | Infinity Wanderlust',
    description: 'Read inspiring travel articles and destination guides.',
    images: ['/placeholder.jpg'],
  },
  alternates: {
    canonical: 'https://infinity-wanderlust.com/articles',
  },
}

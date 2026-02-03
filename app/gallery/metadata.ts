import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Travel Gallery | Infinity Wanderlust',
  description: 'Explore stunning photos and travel memories shared by our community. Get inspired by real traveler moments.',
  keywords: ['travel photos', 'travel gallery', 'destination photos', 'travel memories', 'travel inspiration'],
  openGraph: {
    title: 'Travel Gallery | Infinity Wanderlust',
    description: 'Explore stunning photos and travel memories shared by our community.',
    type: 'website',
    url: 'https://infinity-wanderlust.com/gallery',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Travel Gallery - Infinity Wanderlust',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Gallery | Infinity Wanderlust',
    description: 'Explore stunning photos and travel memories shared by our community.',
    images: ['/placeholder.jpg'],
  },
  alternates: {
    canonical: 'https://infinity-wanderlust.com/gallery',
  },
}

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Travel Reviews | Infinity Wanderlust',
  description: 'Read and write honest reviews about travel events, destinations, and experiences shared by the Infinity Wanderlust community.',
  keywords: ['travel reviews', 'destination reviews', 'event reviews', 'travel ratings', 'traveler feedback'],
  openGraph: {
    title: 'Travel Reviews | Infinity Wanderlust',
    description: 'Read and write honest reviews about travel experiences from our community.',
    type: 'website',
    url: 'https://infinity-wanderlust.com/reviews',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Travel Reviews - Infinity Wanderlust',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travel Reviews | Infinity Wanderlust',
    description: 'Read honest reviews about travel experiences from our community.',
    images: ['/placeholder.jpg'],
  },
  alternates: {
    canonical: 'https://infinity-wanderlust.com/reviews',
  },
}

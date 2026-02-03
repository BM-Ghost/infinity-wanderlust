import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discover Travel Events | Infinity Wanderlust',
  description: 'Browse and book exciting travel events from around the world. Find your next adventure with Infinity Wanderlust travel community.',
  keywords: ['travel events', 'book travel', 'travel destinations', 'group travel', 'adventure travel'],
  openGraph: {
    title: 'Discover Travel Events | Infinity Wanderlust',
    description: 'Browse and book exciting travel events from around the world. Find your next adventure with Infinity Wanderlust travel community.',
    type: 'website',
    url: 'https://infinity-wanderlust.com/events',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Travel Events - Infinity Wanderlust',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Travel Events | Infinity Wanderlust',
    description: 'Browse and book exciting travel events from around the world.',
    images: ['/placeholder.jpg'],
  },
  alternates: {
    canonical: 'https://infinity-wanderlust.com/events',
  },
}

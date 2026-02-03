import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | Infinity Wanderlust',
  description: 'Learn about Infinity Wanderlust - your trusted platform for discovering and booking travel events worldwide. Meet our team and mission.',
  keywords: ['about us', 'travel company', 'travel platform', 'our mission', 'travel community'],
  openGraph: {
    title: 'About Us | Infinity Wanderlust',
    description: 'Learn about Infinity Wanderlust and our mission to connect travelers worldwide.',
    type: 'website',
    url: 'https://infinity-wanderlust.com/about',
    images: [
      {
        url: '/placeholder-logo.png',
        width: 1200,
        height: 630,
        alt: 'About Infinity Wanderlust',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us | Infinity Wanderlust',
    description: 'Learn about Infinity Wanderlust and our mission.',
    images: ['/placeholder-logo.png'],
  },
  alternates: {
    canonical: 'https://infinity-wanderlust.com/about',
  },
}

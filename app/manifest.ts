import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Infinity Wanderlust - Travel Events & Discovery',
    short_name: 'Infinity Wanderlust',
    description: 'Discover and book unforgettable travel events worldwide. Connect with travelers, find amazing destinations, and create lasting memories.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#000000',
    background_color: '#ffffff',
    categories: ['travel', 'lifestyle', 'social'],
    icons: [
      {
        src: '/placeholder-logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/placeholder-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/placeholder.jpg',
        sizes: '540x720',
        type: 'image/jpeg',
        form_factor: 'narrow',
      },
      {
        src: '/placeholder.jpg',
        sizes: '1280x720',
        type: 'image/jpeg',
        form_factor: 'wide',
      },
    ],
  }
}

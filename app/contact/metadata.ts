import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Infinity Wanderlust',
  description: 'Get in touch with Infinity Wanderlust. Have questions about travel events or partnerships? Contact our team today.',
  keywords: ['contact', 'customer support', 'get in touch', 'partnerships', 'inquiries'],
  openGraph: {
    title: 'Contact Us | Infinity Wanderlust',
    description: 'Get in touch with Infinity Wanderlust. Have questions or partnership opportunities? Contact us today.',
    type: 'website',
    url: 'https://infinity-wanderlust.com/contact',
    images: [
      {
        url: '/placeholder-logo.png',
        width: 1200,
        height: 630,
        alt: 'Contact Infinity Wanderlust',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | Infinity Wanderlust',
    description: 'Get in touch with Infinity Wanderlust.',
    images: ['/placeholder-logo.png'],
  },
  alternates: {
    canonical: 'https://infinity-wanderlust.com/contact',
  },
}

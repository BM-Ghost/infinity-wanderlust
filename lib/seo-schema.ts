/**
 * Structured Data (JSON-LD) schemas for SEO
 * These help search engines understand site structure and content
 */

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'TravelAgency',
  name: 'Infinity Wanderlust',
  description: 'Discover and book unforgettable travel events worldwide. Connect with travelers, find amazing destinations, and create lasting memories.',
  url: 'https://infinity-wanderlust.com',
  logo: 'https://infinity-wanderlust.com/placeholder-logo.png',
  sameAs: [
    'https://www.instagram.com/infinity_wanderlust/',
    'https://www.facebook.com/infinitywanderlust',
    'https://twitter.com/infinitywanderlust',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    telephone: '+254706492887',
    email: 'infinitywanderlusttravels@gmail.com',
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Nairobi CBD',
    addressLocality: 'Nairobi',
    addressCountry: 'KE',
  },
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Infinity Wanderlust',
  url: 'https://infinity-wanderlust.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://infinity-wanderlust.com/events?search={search_term_string}',
    },
    query_input: 'required name=search_term_string',
  },
}

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
})

export const eventSchema = (event: any) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: event.title,
  description: event.description,
  image: event.imageUrl,
  startDate: event.start_date,
  endDate: event.end_date,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: event.destination,
    address: {
      '@type': 'PostalAddress',
      addressLocality: event.destination,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: event.latitude,
      longitude: event.longitude,
    },
  },
  offers: {
    '@type': 'Offer',
    url: `https://infinity-wanderlust.com/events/${event.id}`,
    priceCurrency: event.currency,
    price: event.price,
    availability: 'https://schema.org/InStock',
  },
})

export const collectionPageSchema = (pageType: string) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: pageType,
  url: `https://infinity-wanderlust.com/${pageType.toLowerCase()}`,
})

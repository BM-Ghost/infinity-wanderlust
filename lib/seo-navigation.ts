/**
 * SEO-friendly navigation structure for Infinity Wanderlust
 * Provides main categories and site hierarchy for better search engine crawling
 */

export const navigationStructure = {
  main: {
    label: 'Infinity Wanderlust',
    url: '/',
    description: 'Discover and book unforgettable travel events worldwide',
    priority: 'high',
    changeFreq: 'weekly',
  },
  categories: [
    {
      label: 'Events',
      url: '/events',
      description: 'Browse and book exciting travel events from around the world',
      priority: 'high',
      changeFreq: 'daily',
      icon: 'calendar',
    },
    {
      label: 'Articles',
      url: '/articles',
      description: 'Read inspiring travel articles and destination guides',
      priority: 'high',
      changeFreq: 'weekly',
      icon: 'book',
    },
    {
      label: 'Gallery',
      url: '/gallery',
      description: 'Explore stunning travel photos and memories',
      priority: 'high',
      changeFreq: 'weekly',
      icon: 'image',
    },
    {
      label: 'Reviews',
      url: '/reviews',
      description: 'Read and write honest reviews about travel experiences',
      priority: 'high',
      changeFreq: 'weekly',
      icon: 'star',
    },
    {
      label: 'About',
      url: '/about',
      description: 'Learn about Infinity Wanderlust and our mission',
      priority: 'medium',
      changeFreq: 'monthly',
      icon: 'info',
    },
    {
      label: 'Contact',
      url: '/contact',
      description: 'Get in touch with Infinity Wanderlust team',
      priority: 'medium',
      changeFreq: 'monthly',
      icon: 'mail',
    },
  ],
  secondary: [
    {
      label: 'My Bookings',
      url: '/my-bookings',
      description: 'View and manage your travel event bookings',
      auth_required: true,
    },
    {
      label: 'My Reviews',
      url: '/my-reviews',
      description: 'View your travel reviews and ratings',
      auth_required: true,
    },
    {
      label: 'Profile',
      url: '/profile',
      description: 'Manage your Infinity Wanderlust profile',
      auth_required: true,
    },
    {
      label: 'Settings',
      url: '/settings',
      description: 'Update your account settings and preferences',
      auth_required: true,
    },
  ],
}

/**
 * SEO keywords grouped by category
 * Used for content optimization and metadata
 */
export const seoKeywords = {
  primary: [
    'travel events',
    'travel bookings',
    'destination discovery',
    'travel community',
    'adventure travel',
  ],
  events: [
    'travel events',
    'group tours',
    'travel packages',
    'destination events',
    'travel experiences',
  ],
  articles: [
    'travel guides',
    'destination guides',
    'travel tips',
    'travel stories',
    'travel inspiration',
  ],
  reviews: [
    'travel reviews',
    'destination reviews',
    'traveler feedback',
    'event reviews',
    'travel ratings',
  ],
  gallery: [
    'travel photography',
    'destination photos',
    'travel inspiration',
    'travel memories',
  ],
  general: [
    'travel planner',
    'travel booking platform',
    'travel community',
    'travel adventures',
    'worldwide travel',
  ],
}

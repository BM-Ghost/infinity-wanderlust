"use client"

import { createContext, useContext } from "react"

// Define the language context type
type LanguageContextType = {
  language: string
  setLanguage: (lang: string) => void
  supportedLanguages: { code: string; name: string }[]
}

// Create the context with default values
export const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  supportedLanguages: [
    { code: "en", name: "English" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
    { code: "de", name: "Deutsch" },
    { code: "zh", name: "中文" },
  ],
})

// Create the hook to use the language context
export const useLanguage = () => useContext(LanguageContext)

// Define translations
export const translations = {
  en: {
    // Navigation
    home: "Home",
    gallery: "Gallery",
    events: "Events",
    reviews: "Reviews",
    contact: "Contact",
    signIn: "Sign In",
    signUp: "Sign Up",
    signOut: "Sign Out",
    profile: "Profile",
    myReviews: "My Reviews",
    myBookings: "My Bookings",

    // Theme
    light: "Light",
    dark: "Dark",
    system: "System",

    // Hero Section
    heroTitle: "Explore the World with Infinity Wanderlust",
    heroSubtitle: "Discover breathtaking destinations and unforgettable experiences",
    exploreButton: "Explore Destinations",
    learnMoreButton: "Learn More",

    // Featured Sections
    featuredDestinations: "Featured Destinations",
    upcomingEvents: "Upcoming Events",
    latestReviews: "Latest Reviews",
    viewAll: "View All",
    bookNow: "Book Now",
    readMore: "Read More",

    // Gallery
    galleryTitle: "Travel Gallery",
    gallerySubtitle: "Explore our adventures through captivating images",

    // Reviews
    reviewsTitle: "Traveler Reviews",
    reviewsSubtitle: "Hear what fellow travelers have to say about their experiences",
    writeReview: "Write a Review",

    // Events
    eventsTitle: "Travel Events",
    eventsSubtitle: "Join us on our upcoming adventures",
    joinEvent: "Join Event",
    eventDetails: "Event Details",

    // Contact
    contactTitle: "Get in Touch",
    contactSubtitle: "Have questions or want to collaborate? Reach out to us!",
    name: "Name",
    email: "Email",
    message: "Message",
    send: "Send Message",
    address: "123 Travel Street, Adventure City, AC 12345",

    // Footer
    footerTagline: "Exploring the world one adventure at a time",
    quickLinks: "Quick Links",
    newsletter: "Newsletter",
    newsletterText: "Subscribe to receive updates on new destinations and travel tips",
    emailPlaceholder: "Your email address",
    subscribe: "Subscribe",
    allRightsReserved: "All rights reserved",

    // Auth
    loginTitle: "Welcome Back",
    loginSubtitle: "Sign in to your account to continue your journey",
    registerTitle: "Join Our Community",
    registerSubtitle: "Create an account to share your travel experiences",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    resetPasswordSubtitle: "Enter your email to receive password reset instructions",
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: "Already have an account?",

    // Form Fields
    password: "Password",
    confirmPassword: "Confirm Password",
    rememberMe: "Remember me",

    // Success/Error Messages
    loginSuccess: "Welcome back!",
    registerSuccess: "Account created successfully!",
    resetEmailSent: "Password reset email sent",
    checkEmail: "Please check your email for further instructions",

    // Misc
    loading: "Loading...",
    search: "Search",
    searchPlaceholder: "Search destinations...",
  },
  es: {
    // Navigation
    home: "Inicio",
    gallery: "Galería",
    events: "Eventos",
    reviews: "Reseñas",
    contact: "Contacto",
    signIn: "Iniciar Sesión",
    signUp: "Registrarse",
    signOut: "Cerrar Sesión",
    profile: "Perfil",
    myReviews: "Mis Reseñas",
    myBookings: "Mis Reservas",

    // Theme
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",

    // Hero Section
    heroTitle: "Explora el Mundo con Infinity Wanderlust",
    heroSubtitle: "Descubre destinos impresionantes y experiencias inolvidables",
    exploreButton: "Explorar Destinos",
    learnMoreButton: "Saber Más",

    // Featured Sections
    featuredDestinations: "Destinos Destacados",
    upcomingEvents: "Próximos Eventos",
    latestReviews: "Últimas Reseñas",
    viewAll: "Ver Todo",
    bookNow: "Reservar Ahora",
    readMore: "Leer Más",

    // Gallery
    galleryTitle: "Galería de Viajes",
    gallerySubtitle: "Explora nuestras aventuras a través de imágenes cautivadoras",

    // Reviews
    reviewsTitle: "Reseñas de Viajeros",
    reviewsSubtitle: "Escucha lo que otros viajeros dicen sobre sus experiencias",
    writeReview: "Escribir Reseña",

    // Events
    eventsTitle: "Eventos de Viaje",
    eventsSubtitle: "Únete a nuestras próximas aventuras",
    joinEvent: "Unirse al Evento",
    eventDetails: "Detalles del Evento",

    // Contact
    contactTitle: "Ponte en Contacto",
    contactSubtitle: "¿Tienes preguntas o quieres colaborar? ¡Contáctanos!",
    name: "Nombre",
    email: "Correo Electrónico",
    message: "Mensaje",
    send: "Enviar Mensaje",
    address: "123 Calle Viajera, Ciudad Aventura, CA 12345",

    // Footer
    footerTagline: "Explorando el mundo una aventura a la vez",
    quickLinks: "Enlaces Rápidos",
    newsletter: "Boletín",
    newsletterText: "Suscríbete para recibir actualizaciones sobre nuevos destinos y consejos de viaje",
    emailPlaceholder: "Tu correo electrónico",
    subscribe: "Suscribirse",
    allRightsReserved: "Todos los derechos reservados",

    // Auth
    loginTitle: "Bienvenido de Nuevo",
    loginSubtitle: "Inicia sesión en tu cuenta para continuar tu viaje",
    registerTitle: "Únete a Nuestra Comunidad",
    registerSubtitle: "Crea una cuenta para compartir tus experiencias de viaje",
    forgotPassword: "¿Olvidaste tu Contraseña?",
    resetPassword: "Restablecer Contraseña",
    resetPasswordSubtitle: "Ingresa tu correo para recibir instrucciones de restablecimiento",
    dontHaveAccount: "¿No tienes una cuenta?",
    alreadyHaveAccount: "¿Ya tienes una cuenta?",

    // Form Fields
    password: "Contraseña",
    confirmPassword: "Confirmar Contraseña",
    rememberMe: "Recordarme",

    // Success/Error Messages
    loginSuccess: "¡Bienvenido de nuevo!",
    registerSuccess: "¡Cuenta creada exitosamente!",
    resetEmailSent: "Correo de restablecimiento enviado",
    checkEmail: "Por favor revisa tu correo para más instrucciones",

    // Misc
    loading: "Cargando...",
    search: "Buscar",
    searchPlaceholder: "Buscar destinos...",
  },
  fr: {
    // Basic translations for French
    home: "Accueil",
    gallery: "Galerie",
    events: "Événements",
    reviews: "Avis",
    contact: "Contact",
    signIn: "Connexion",
    signUp: "S'inscrire",
    signOut: "Déconnexion",
    // Add more translations as needed
  },
  de: {
    // Basic translations for German
    home: "Startseite",
    gallery: "Galerie",
    events: "Veranstaltungen",
    reviews: "Bewertungen",
    contact: "Kontakt",
    signIn: "Anmelden",
    signUp: "Registrieren",
    signOut: "Abmelden",
    // Add more translations as needed
  },
  zh: {
    // Basic translations for Chinese
    home: "首页",
    gallery: "画廊",
    events: "活动",
    reviews: "评论",
    contact: "联系",
    signIn: "登录",
    signUp: "注册",
    signOut: "登出",
    // Add more translations as needed
  },
}

// Create a hook to use translations
export function useTranslation() {
  const { language } = useLanguage()

  const t = (key: string) => {
    return (
      translations[language as keyof typeof translations]?.[key as keyof (typeof translations)["en"]] ||
      translations.en[key as keyof (typeof translations)["en"]] ||
      key
    )
  }

  return { t }
}


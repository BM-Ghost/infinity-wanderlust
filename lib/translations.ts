"use client";

import { createContext, useContext } from "react";

// Define the language context type
type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  supportedLanguages: { code: string; name: string }[];
};

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
});

// Create the hook to use the language context
export const useLanguage = () => useContext(LanguageContext);

// Define translations
export const translations = {
  en: {
    // Navigation
    home: "Home",
    about: "About",
    articles: "Blogs",
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
    heroSubtitle:
      "Discover breathtaking destinations and unforgettable experiences",
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
    reviewsSubtitle:
      "Hear what fellow travelers have to say about their experiences",
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
    newsletterText:
      "Subscribe to receive updates on new destinations and travel tips",
    emailPlaceholder: "Your email address",
    subscribe: "Subscribe",
    allRightsReserved: "All rights reserved",

    // Auth
    loginTitle: "Welcome Back",
    loginSubtitle: "Sign in to your account to continue your journey",
    registerTitle: "Join Our Community",
    registerSubtitle: "Create an account to share your travel experiences",
    forgotPasswordTitle: "Forgot your password?",
    forgotPasswordSubtitle: "Enter your email to get a 6-digit code or reset link.",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    resetPasswordTitle: "Create a new password",
    resetPasswordSubtitle:
      "Enter your email to receive password reset instructions",
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

    // About
    hello: "Hello 👋🏽",
    discover: "Discover the World With Us",
    aboutMe:
      "From Dubai's awe-inspiring skyline to Zanzibar's pristine beaches, each destination offers unique, unforgettable experiences. Exploring Arusha's vibrant culture and Kenya's diverse wonders, from bustling Nairobi to serene savannahs, creates indelible memories that enrich our lives and broaden our horizons.",
  },
  es: {
    // Navigation
    home: "Inicio",
    about: "Acerca de",
    artículos: "Blogs",
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
    heroSubtitle:
      "Descubre destinos impresionantes y experiencias inolvidables",
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
    gallerySubtitle:
      "Explora nuestras aventuras a través de imágenes cautivadoras",

    // Reviews
    reviewsTitle: "Reseñas de Viajeros",
    reviewsSubtitle:
      "Escucha lo que otros viajeros dicen sobre sus experiencias",
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
    newsletterText:
      "Suscríbete para recibir actualizaciones sobre nuevos destinos y consejos de viaje",
    emailPlaceholder: "Tu correo electrónico",
    subscribe: "Suscribirse",
    allRightsReserved: "Todos los derechos reservados",

    // Auth
    loginTitle: "Bienvenido de Nuevo",
    loginSubtitle: "Inicia sesión en tu cuenta para continuar tu viaje",
    registerTitle: "Únete a Nuestra Comunidad",
    registerSubtitle:
      "Crea una cuenta para compartir tus experiencias de viaje",
    forgotPasswordTitle: "¿Olvidaste tu contraseña?",
    forgotPasswordSubtitle:
      "Ingresa tu correo para recibir un código de 6 dígitos o un enlace de restablecimiento.",
    forgotPassword: "¿Olvidaste tu Contraseña?",
    resetPassword: "Restablecer Contraseña",
    resetPasswordTitle: "Crea una nueva contraseña",
    resetPasswordSubtitle:
      "Ingresa tu correo para recibir instrucciones de restablecimiento",
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

    // Acerca de
    hello: "Hola 👋🏽",
    discover: "Descubre el mundo con nosotras",
    aboutMe:
      "Desde el imponente horizonte de Dubái hasta las prístinas playas de Zanzíbar, cada destino ofrece experiencias únicas e inolvidables. Explorar la vibrante cultura de Arusha y las diversas maravillas de Kenia, desde la bulliciosa Nairobi hasta la serenidad de las sabanas, crea recuerdos imborrables que enriquecen nuestras vidas y amplían nuestros horizontes.",
  },
  fr: {
    // Navigation
    home: "Accueil",
    about: "À propos",
    articles: "Blogues",
    gallery: "Galerie",
    events: "Événements",
    reviews: "Avis",
    contact: "Contact",
    signIn: "Connexion",
    signUp: "S'inscrire",
    signOut: "Déconnexion",
    profile: "Profil",
    myReviews: "Mes avis",
    myBookings: "Mes réservations",

    // Theme
    light: "Clair",
    dark: "Sombre",
    system: "Système",

    // Hero Section
    heroTitle: "Explorez le monde avec Infinity Wanderlust",
    heroSubtitle:
      "Découvrez des destinations à couper le souffle et des expériences inoubliables",
    exploreButton: "Explorer les destinations",
    learnMoreButton: "En savoir plus",

    // Featured Sections
    featuredDestinations: "Destinations en vedette",
    upcomingEvents: "Événements à venir",
    latestReviews: "Derniers avis",
    viewAll: "Voir tout",
    bookNow: "Réserver maintenant",
    readMore: "En savoir plus",

    // Gallery
    galleryTitle: "Galerie de voyage",
    gallerySubtitle: "Découvrez nos aventures en images captivantes",

    // Reviews
    reviewsTitle: "Avis des voyageurs",
    reviewsSubtitle:
      "Découvrez ce que les autres voyageurs disent de leurs expériences",
    writeReview: "Écrire un avis",

    // Events
    eventsTitle: "Événements de voyage",
    eventsSubtitle: "Participez à nos prochaines aventures",
    joinEvent: "Rejoindre l'événement",
    eventDetails: "Détails de l'événement",

    // Contact
    contactTitle: "Contactez-nous",
    contactSubtitle: "Des questions ou envie de collaborer ? Écrivez-nous !",
    name: "Nom",
    email: "E-mail",
    message: "Message",
    send: "Envoyer le message",
    address: "123 rue du Voyage, Ville Aventure, AC 12345",

    // Footer
    footerTagline: "Explorer le monde une aventure à la fois",
    quickLinks: "Liens rapides",
    newsletter: "Bulletin",
    newsletterText:
      "Abonnez-vous pour recevoir des mises à jour et des astuces de voyage",
    emailPlaceholder: "Votre adresse e-mail",
    subscribe: "S'abonner",
    allRightsReserved: "Tous droits réservés",

    // Auth
    loginTitle: "Bon retour",
    loginSubtitle: "Connectez-vous pour continuer votre voyage",
    registerTitle: "Rejoignez notre communauté",
    registerSubtitle: "Créez un compte pour partager vos aventures",
    forgotPasswordTitle: "Mot de passe oublié ?",
    forgotPasswordSubtitle:
      "Saisissez votre e-mail pour recevoir un code à 6 chiffres ou un lien de réinitialisation.",
    forgotPassword: "Mot de passe oublié ?",
    resetPassword: "Réinitialiser le mot de passe",
    resetPasswordTitle: "Créer un nouveau mot de passe",
    resetPasswordSubtitle: "Entrez votre e-mail pour recevoir les instructions",
    dontHaveAccount: "Pas encore de compte ?",
    alreadyHaveAccount: "Vous avez déjà un compte ?",

    // Form Fields
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    rememberMe: "Se souvenir de moi",

    // Success/Error Messages
    loginSuccess: "Bon retour !",
    registerSuccess: "Compte créé avec succès !",
    resetEmailSent: "E-mail de réinitialisation envoyé",
    checkEmail: "Veuillez vérifier votre e-mail pour plus d'instructions",

    // Misc
    loading: "Chargement...",
    search: "Rechercher",
    searchPlaceholder: "Rechercher des destinations...",

    // About
    hello: "Bonjour 👋🏽",
    discover: "Découvrez le monde avec nous",
    aboutMe:
      "De l'impressionnante skyline de Dubaï aux plages immaculées de Zanzibar, chaque destination offre des expériences inoubliables. L’exploration de la culture vibrante d’Arusha et des merveilles variées du Kenya, de la trépidante Nairobi aux savanes paisibles, crée des souvenirs qui enrichissent nos vies.",
  },

  de: {
    // Navigation
    home: "Startseite",
    about: "Über uns",
    artikel: "Blogs",  
    gallery: "Galerie",
    events: "Veranstaltungen",
    reviews: "Bewertungen",
    contact: "Kontakt",
    signIn: "Anmelden",
    signUp: "Registrieren",
    signOut: "Abmelden",
    profile: "Profil",
    myReviews: "Meine Bewertungen",
    myBookings: "Meine Buchungen",

    // Theme
    light: "Hell",
    dark: "Dunkel",
    system: "System",

    // Hero Section
    heroTitle: "Entdecke die Welt mit Infinity Wanderlust",
    heroSubtitle: "Erkunde atemberaubende Orte und unvergessliche Erlebnisse",
    exploreButton: "Ziele erkunden",
    learnMoreButton: "Mehr erfahren",

    // Featured Sections
    featuredDestinations: "Top Reiseziele",
    upcomingEvents: "Bevorstehende Veranstaltungen",
    latestReviews: "Neueste Bewertungen",
    viewAll: "Alle ansehen",
    bookNow: "Jetzt buchen",
    readMore: "Mehr lesen",

    // Gallery
    galleryTitle: "Reisegalerie",
    gallerySubtitle: "Erkunde unsere Abenteuer in faszinierenden Bildern",

    // Reviews
    reviewsTitle: "Reisebewertungen",
    reviewsSubtitle: "Erfahre, was andere Reisende erlebt haben",
    writeReview: "Bewertung schreiben",

    // Events
    eventsTitle: "Reiseveranstaltungen",
    eventsSubtitle: "Begleite uns auf unseren nächsten Abenteuern",
    joinEvent: "Am Event teilnehmen",
    eventDetails: "Eventdetails",

    // Contact
    contactTitle: "Kontakt aufnehmen",
    contactSubtitle: "Fragen oder Kooperationen? Schreib uns!",
    name: "Name",
    email: "E-Mail",
    message: "Nachricht",
    send: "Nachricht senden",
    address: "Reisestraße 123, Abenteuerstadt, AC 12345",

    // Footer
    footerTagline: "Die Welt ein Abenteuer nach dem anderen erkunden",
    quickLinks: "Schnellzugriff",
    newsletter: "Newsletter",
    newsletterText: "Abonniere für Updates zu Reisezielen und Tipps",
    emailPlaceholder: "Deine E-Mail-Adresse",
    subscribe: "Abonnieren",
    allRightsReserved: "Alle Rechte vorbehalten",

    // Auth
    loginTitle: "Willkommen zurück",
    loginSubtitle: "Melde dich an, um deine Reise fortzusetzen",
    registerTitle: "Werde Teil unserer Community",
    registerSubtitle: "Erstelle ein Konto und teile deine Reiseerlebnisse",
    forgotPasswordTitle: "Passwort vergessen?",
    forgotPasswordSubtitle:
      "Gib deine E-Mail ein, um einen 6-stelligen Code oder einen Reset-Link zu erhalten.",
    forgotPassword: "Passwort vergessen?",
    resetPassword: "Passwort zurücksetzen",
    resetPasswordTitle: "Neues Passwort erstellen",
    resetPasswordSubtitle:
      "Gib deine E-Mail-Adresse ein, um Anweisungen zu erhalten",
    dontHaveAccount: "Noch kein Konto?",
    alreadyHaveAccount: "Schon registriert?",

    // Form Fields
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    rememberMe: "Angemeldet bleiben",

    // Success/Error Messages
    loginSuccess: "Willkommen zurück!",
    registerSuccess: "Konto erfolgreich erstellt!",
    resetEmailSent: "E-Mail zum Zurücksetzen gesendet",
    checkEmail: "Bitte überprüfe deine E-Mails für weitere Anweisungen",

    // Misc
    loading: "Lädt...",
    search: "Suchen",
    searchPlaceholder: "Ziele durchsuchen...",

    // About
    hello: "Hallo 👋🏽",
    discover: "Entdecke mit uns die Welt",
    aboutMe:
      "Von Dubais Skyline bis zu Sansibars unberührten Stränden – jedes Reiseziel bietet einzigartige Erlebnisse. Die Kultur Arushas und Kenias vielfältige Wunder – von Nairobi bis zur Savanne – schaffen unvergessliche Erinnerungen.",
  },

  zh: {
    // Navigation
    home: "首页",
    about: "关于我们",
    wenzhang: "博客", 
    gallery: "画廊",
    events: "活动",
    reviews: "评论",
    contact: "联系",
    signIn: "登录",
    signUp: "注册",
    signOut: "登出",
    profile: "个人资料",
    myReviews: "我的评论",
    myBookings: "我的预订",

    // Theme
    light: "浅色",
    dark: "深色",
    system: "系统",

    // Hero Section
    heroTitle: "与 Infinity Wanderlust 一起探索世界",
    heroSubtitle: "发现令人惊叹的目的地和难忘的体验",
    exploreButton: "探索目的地",
    learnMoreButton: "了解更多",

    // Featured Sections
    featuredDestinations: "精选目的地",
    upcomingEvents: "即将举行的活动",
    latestReviews: "最新评论",
    viewAll: "查看全部",
    bookNow: "立即预订",
    readMore: "阅读更多",

    // Gallery
    galleryTitle: "旅行画廊",
    gallerySubtitle: "通过迷人的图像探索我们的冒险旅程",

    // Reviews
    reviewsTitle: "旅行者评论",
    reviewsSubtitle: "看看其他旅行者的体验",
    writeReview: "撰写评论",

    // Events
    eventsTitle: "旅行活动",
    eventsSubtitle: "加入我们的下一个冒险旅程",
    joinEvent: "参加活动",
    eventDetails: "活动详情",

    // Contact
    contactTitle: "联系我们",
    contactSubtitle: "有问题或想合作？欢迎联系我们！",
    name: "姓名",
    email: "电子邮件",
    message: "留言",
    send: "发送信息",
    address: "旅行街123号，探险城市，AC 12345",

    // Footer
    footerTagline: "一次冒险探索世界",
    quickLinks: "快速链接",
    newsletter: "订阅信息",
    newsletterText: "订阅以获取最新目的地和旅行建议",
    emailPlaceholder: "请输入电子邮件地址",
    subscribe: "订阅",
    allRightsReserved: "版权所有",

    // Auth
    loginTitle: "欢迎回来",
    loginSubtitle: "登录以继续您的旅程",
    registerTitle: "加入我们的社区",
    registerSubtitle: "创建账户分享您的旅行故事",
    forgotPasswordTitle: "忘记密码？",
    forgotPasswordSubtitle: "输入邮箱以获取6位验证码或重置链接。",
    forgotPassword: "忘记密码？",
    resetPassword: "重设密码",
    resetPasswordTitle: "创建新密码",
    resetPasswordSubtitle: "请输入您的电子邮件以接收重设密码说明",
    dontHaveAccount: "还没有账户？",
    alreadyHaveAccount: "已经有账户？",

    // Form Fields
    password: "密码",
    confirmPassword: "确认密码",
    rememberMe: "记住我",

    // Success/Error Messages
    loginSuccess: "欢迎回来！",
    registerSuccess: "账户创建成功！",
    resetEmailSent: "重置密码邮件已发送",
    checkEmail: "请检查邮箱获取进一步说明",

    // Misc
    loading: "加载中...",
    search: "搜索",
    searchPlaceholder: "搜索目的地...",

    // About
    hello: "你好 👋🏽",
    discover: "与我们一起发现世界",
    aboutMe:
      "从迪拜壮观的天际线到桑给巴尔原始的海滩，每个目的地都带来独特难忘的体验。探索阿鲁沙的多彩文化和肯尼亚的自然奇迹，从繁华的内罗毕到宁静的草原，留下深刻的记忆，丰富我们的生活。",
  },
};

// Create a hook to use translations
export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string) => {
    return (
      translations[language as keyof typeof translations]?.[
        key as keyof (typeof translations)["en"]
      ] ||
      translations.en[key as keyof (typeof translations)["en"]] ||
      key
    );
  };

  return { t };
}

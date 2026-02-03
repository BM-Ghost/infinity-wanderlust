"use client"

import Link from "next/link"
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from "lucide-react"
import { useTranslation } from "@/lib/translations"

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary/10 border-t" role="contentinfo">
      <div className="container py-2 md:py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand and Socials */}
          <div className="space-y-4 break-words">
            <h2 className="text-lg font-bold text-primary">Infinity Wanderlust</h2>
            <p className="text-sm text-muted-foreground">{t("footerTagline")}</p>
            <div className="flex space-x-4">
              <Link
                href="https://www.instagram.com/infinity_wanderlust/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link 
                href="https://www.facebook.com/infinitywanderlust" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Follow us on Facebook"
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link 
                href="https://twitter.com/infinitywanderlust" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Follow us on Twitter"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          {/* Quick Links - SEO Sitelinks Section */}
          <nav className="space-y-4 break-words">
            <h3 className="text-lg font-bold">{t("quickLinks")}</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("home")}</Link></li>
              <li><Link href="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("events")}</Link></li>
              <li><Link href="/articles" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("articles")}</Link></li>
              <li><Link href="/gallery" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("gallery")}</Link></li>
              <li><Link href="/reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("reviews")}</Link></li>
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t("about")}</Link></li>
            </ul>
          </nav>

          {/* Contact Info */}
          <address className="space-y-4 break-words not-italic">
            <h3 className="text-lg font-bold">{t("contact")}</h3>
            <ul className="space-y-3">
              <li className="flex items-start break-all">
                <Mail className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                <a
                  href="mailto:infinitywanderlusttravels@gmail.com"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  infinitywanderlusttravels@gmail.com
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground break-words">
                  Infinity Wanderlust Travels
                  <br />
                  Nairobi CBD
                  <br />
                  Kenya
                </span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-primary flex-shrink-0" />
                <a
                  href="tel:+254706492887"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  +254 706 492 887
                </a>
              </li>
            </ul>
          </address>

          {/* Newsletter */}
          <div className="space-y-4 break-words">
            <h3 className="text-lg font-bold">{t("newsletter")}</h3>
            <p className="text-sm text-muted-foreground">{t("newsletterText")}</p>
            <form className="flex flex-col space-y-2 w-full">
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="px-3 py-2 bg-background border rounded-md text-sm w-full break-words"
                required
                aria-label="Email address"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                {t("subscribe")}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} Infinity Wanderlust. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  )
}

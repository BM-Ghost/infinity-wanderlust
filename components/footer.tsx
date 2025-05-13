"use client"

import Link from "next/link"
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from "lucide-react"
import { useTranslation } from "@/lib/translations"

export function Footer() {
  const { t } = useTranslation()

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary/10 border-t">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">Infinity Wanderlust</h3>
            <p className="text-sm text-muted-foreground">{t("footerTagline")}</p>
            <div className="flex space-x-4">
              <Link
                href="https://www.instagram.com/infinity_wanderlust/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">{t("quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("gallery")}
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("events")}
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t("reviews")}
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">{t("contact")}</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail className="h-5 w-5 mr-2 text-primary" />
                <a
                  href="mailto:infinitywanderlusttravels@gmail.com"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  infinitywanderlusttravels@gmail.com
                </a>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Infinity Wanderlust Travels
                  <br />
                  Nairobi CBD
                  <br />
                  Kenya
                </span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                <a
                  href="tel:+254706492887"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  +254 706 492 887
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold">{t("newsletter")}</h3>
            <p className="text-sm text-muted-foreground">{t("newsletterText")}</p>
            <form className="flex flex-col space-y-2">
              <input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="px-3 py-2 bg-background border rounded-md text-sm"
                required
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

        <div className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            © {currentYear} Infinity Wanderlust. {t("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  )
}

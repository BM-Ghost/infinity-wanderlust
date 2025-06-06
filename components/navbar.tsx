"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { useTranslation } from "@/lib/translations"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPocketBase } from "@/lib/pocketbase"

// Helper function to get first name
function getFirstName(fullName: string | undefined) {
  if (!fullName) return ""
  return fullName.split(" ")[0]
}

export function Navbar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  // Update the handleSignOut function to use router for smoother transitions
  const handleSignOut = () => {
    const pb = getPocketBase()
    if (pb) {
      pb.authStore.clear()
    }
    localStorage.removeItem("pocketbase_auth")
    setUser(null)

    // Use a small delay before redirecting to allow UI to update
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }

  // Update the useEffect hook to improve user data loading
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)

    // Check for user data
    const checkUserData = () => {
      try {
        const pb = getPocketBase()
        if (pb && pb.authStore.isValid) {
          setUser(pb.authStore.model)
        } else {
          // Try to get user data from localStorage as fallback
          const authData = localStorage.getItem("pocketbase_auth")
          if (authData) {
            try {
              const { model } = JSON.parse(authData)
              if (model) {
                setUser(model)
              } else {
                setUser(null)
              }
            } catch (e) {
              console.error("Error parsing auth data:", e)
              setUser(null)
            }
          } else {
            setUser(null)
          }
        }
      } catch (error) {
        console.error("Error checking user data:", error)
        setUser(null)
      }
    }

    checkUserData()

    // Set up an interval to check user data periodically
    const interval = setInterval(checkUserData, 1000)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(interval)
    }
  }, [])

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/gallery", label: t("gallery") },
    { href: "/events", label: t("events") },
    { href: "/reviews", label: t("reviews") },
    { href: "/contact", label: t("contact") },
  ]

  return (
<header
  className={`sticky top-0 z-50 w-full transition-all duration-200 ${
    isScrolled
      ? "bg-[#004d00]/30 backdrop-blur-sm shadow-md" // Dark green, slightly transparent
      : "bg-transparent"
  }`}
>

      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Infinity Wanderlust</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <LanguageToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3">
                  <span className="font-medium">Hi, {getFirstName(user.name)}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={
                        user.avatar
                          ? `https://remain-faceghost.pockethost.io/api/files/${user.collectionId}/${user.id}/${user.avatar}`
                          : ""
                      }
                      alt={user.name || user.username}
                    />
                    <AvatarFallback>
                      {(user.name?.charAt(0) || user.username?.charAt(0) || user.email?.charAt(0) || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">{t("profile")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-reviews">{t("myReviews")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-bookings">{t("myBookings")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>{t("signOut")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default">
              <Link href="/login">{t("signIn")}</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between pb-4 border-b">
                  <span className="text-lg font-bold text-primary">Infinity Wanderlust</span>
                  <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </div>
                <nav className="flex flex-col gap-4 py-6">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`text-base font-medium transition-colors hover:text-primary ${
                        pathname === link.href ? "text-primary" : "text-muted-foreground"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto flex flex-col gap-4 pt-6 border-t">
                  <LanguageToggle />
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              user.avatar
                                ? `https://remain-faceghost.pockethost.io/api/files/${user.collectionId}/${user.id}/${user.avatar}`
                                : ""
                            }
                            alt={user.name || user.username}
                          />
                          <AvatarFallback>
                            {(
                              user.name?.charAt(0) ||
                              user.username?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "U"
                            ).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">Hi, {getFirstName(user.name || user.username)}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Link href="/profile" className="text-sm font-medium" onClick={() => setIsMobileMenuOpen(false)}>
                        {t("profile")}
                      </Link>
                      <Link
                        href="/my-reviews"
                        className="text-sm font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t("myReviews")}
                      </Link>
                      <Link
                        href="/my-bookings"
                        className="text-sm font-medium"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t("myBookings")}
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => {
                          handleSignOut()
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        {t("signOut")}
                      </Button>
                    </>
                  ) : (
                    <Button asChild variant="default" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/login">{t("signIn")}</Link>
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

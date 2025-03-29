"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/gallery", label: "Gallery" },
    { href: "/events", label: "Events" },
    { href: "/reviews", label: "Reviews" },
    { href: "/contact", label: "Contact" },
  ]

  // Check if user is logged in
  const isLoggedIn = typeof window !== "undefined" && localStorage.getItem("pocketbase_auth") !== null

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        isScrolled ? "bg-background/95 backdrop-blur-sm shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">Infinity Wanderlust</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />

          {isLoggedIn ? (
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("pocketbase_auth")
                window.location.href = "/"
              }}
            >
              Sign Out
            </Button>
          ) : (
            <Button asChild variant="default">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-base font-medium transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}

                {isLoggedIn ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      localStorage.removeItem("pocketbase_auth")
                      window.location.href = "/"
                    }}
                  >
                    Sign Out
                  </Button>
                ) : (
                  <Button asChild variant="default" className="mt-4">
                    <Link href="/login">Sign In</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}


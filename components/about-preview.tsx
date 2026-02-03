"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useTranslation } from "@/lib/translations"

export function AboutPreview() {
  const { t } = useTranslation()

  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left: Image */}
          <div className="relative h-96 md:h-full min-h-[400px] rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Image
              src="/images/glow_red.jpg"
              alt="Meet Infinity Wanderlust"
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              quality={90}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>

          {/* Right: About Info */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-sm font-semibold rounded-full mb-4">
                Discover Our Story
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome to <span className="text-primary">Infinity Wanderlust</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe travel is more than just visiting new places—it's about connecting with people, 
                cultures, and experiences that transform us. Our mission is to make travel accessible, 
                memorable, and truly meaningful for everyone.
              </p>
            </div>

            {/* Key Points */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <p className="text-foreground">Expert curation of unforgettable travel experiences</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <p className="text-foreground">A passionate community of global travelers</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <p className="text-foreground">Personalized support for every adventure</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors duration-300 shadow-lg hover:shadow-xl"
              >
                Learn Our Story
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

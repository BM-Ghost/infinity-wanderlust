"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/translations";

export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <main className="flex-1">
      <section className="relative bg-[url('/images/explore.jpg')] bg-cover bg-center bg-no-repeat py-16 md:py-24">
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Column: Text Content */}
            <div className="text-white">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-block text-[1.8rem] font-semibold text-[var(--heading-color)] animate-pulse">
                    {t("hello")} 🌍
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-[var(--heading-color)] drop-shadow-lg">
                  {t("discover")}
                </h2>
                <p className="text-base md:text-lg leading-7 text-[var(--text-color)] bg-white/10 backdrop-blur-md rounded-lg p-4">
                  {t("aboutMe")}
                </p>
              </div>

              {/* Testimonial / Quote */}
              <blockquote className="mt-6 border-l-4 border-[var(--secondary-color)] pl-4 italic text-[var(--text-color)]">
                “Traveling – it leaves you speechless, then turns you into a storyteller.”
                <span className="block mt-2 text-sm font-medium text-gray-300">– Ibn Battuta</span>
              </blockquote>

              {/* Scroll indicator */}
              <div className="mt-8 flex justify-start">
                <div className="animate-bounce text-[var(--secondary-color)] text-lg">
                  ↓ Scroll to explore more
                </div>
              </div>
            </div>

            {/* Right Column: Cascading Media */}
            <div className="flex flex-col md:flex-row gap-4 relative">
              {/* Image (hidden on mobile) */}
              <div className="hidden md:block relative w-full max-w-[300px] h-[300px] rounded-[20px] overflow-hidden border border-white/30 z-30 translate-y-0 shadow-xl">
                <Image
                  src="/images/hero-img01.jpg"
                  alt="Travel destination"
                  fill
                  className="object-cover"
                  priority
                />
              </div>

              {/* Video 1 (always visible) */}
              <div className="relative w-full max-w-[300px] h-[300px] rounded-[20px] overflow-hidden border border-white/30 z-20 translate-y-0 md:translate-y-6 shadow-lg">
                <video
                  src="/images/hero-video.mp4"
                  controls
                  className="w-full h-full object-cover"
                  aria-label="Travel highlights video 1"
                />
              </div>

              {/* Video 2 (hidden on mobile) */}
              <div className="hidden md:block relative w-full max-w-[300px] h-[300px] rounded-[20px] overflow-hidden border border-white/30 z-10 translate-y-12 shadow-md">
                <video
                  src="/images/hero-vid.mp4"
                  controls
                  className="w-full h-full object-cover"
                  aria-label="Travel highlights video 2"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

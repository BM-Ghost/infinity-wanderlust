"use client";

import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="flex-1">
      <section className="relative bg-[url('/images/explore.jpg')] bg-cover bg-center bg-no-repeat py-16 md:py-24">
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left Column: Text Content */}
            <div className="text-white">
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 mb-4">
                  About Me
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold mb-5 text-[var(--heading-color)] drop-shadow-lg">
                  Hi, I&apos;m Glory Bundi
                </h1>
                <div className="space-y-4 text-base md:text-lg leading-7 text-[var(--text-color)] bg-white/10 backdrop-blur-md rounded-xl p-5 md:p-6 border border-white/15">
                  <p className="text-lg md:text-xl font-semibold text-white">
                    Hi, I&apos;m <span className="text-[var(--secondary-color)]">Glory Bundi</span>, thanks for stopping by!
                  </p>

                  <p>
                    I&apos;m <strong className="text-white font-semibold">Kenyan</strong>, based in <strong className="text-white font-semibold">Nairobi</strong>, and I&apos;ve built a life where <em>work, travel, and creativity</em> collide. I studied <strong className="text-white font-semibold">International Relations and Diplomacy</strong>, and today I work as a <strong className="text-white font-semibold">content creator and digital marketer</strong>, while also studying <strong className="text-white font-semibold">skin aesthetics</strong>.
                  </p>

                  <p>
                    I&apos;m resourceful by nature, which comes in handy when I plan my trips. Whether it&apos;s chasing a <em className="text-[var(--secondary-color)]">sunrise on a beach</em>, indulging in <em className="text-[var(--secondary-color)]">fine dining</em>, exploring <em className="text-[var(--secondary-color)]">vibrant cultures</em>, enjoying a <em className="text-[var(--secondary-color)]">spa</em>, or savoring a <em className="text-[var(--secondary-color)]">luxe escape</em> &mdash; I thrive on experiences that balance <strong className="text-white font-semibold">adventure and refinement</strong>.
                  </p>

                  <p>
                    Travel isn&apos;t just about destinations for me; it&apos;s about <strong className="text-white font-semibold">stories, people, flavors</strong>, and the little details that make a journey unforgettable. I capture these moments through <strong className="text-white font-semibold">photos and reels</strong> on <span className="text-[var(--secondary-color)] font-medium">Instagram</span> and <span className="text-[var(--secondary-color)] font-medium">TikTok</span>, sharing both the thrill and the calm, the adventure and the indulgence.
                  </p>

                  <p className="border-t border-white/15 pt-4 mt-2">
                    My blog is my space to <strong className="text-white font-semibold">inspire others to explore</strong>, share insights that make travel easier, and celebrate the balance between <em className="text-[var(--secondary-color)]">adventure, culture, and luxury</em>.
                  </p>
                </div>
              </div>

              {/* Testimonial / Quote */}
              <blockquote className="mt-6 border-l-4 border-[var(--secondary-color)] pl-4 italic text-[var(--text-color)]">
                &ldquo;Traveling &ndash; it leaves you speechless, then turns you into a storyteller.&rdquo;
                <span className="block mt-2 text-sm font-medium text-gray-300">&ndash; Ibn Battuta</span>
              </blockquote>

              {/* Scroll indicator */}
              <div className="mt-8 flex justify-start">
                <div className="animate-bounce text-[var(--secondary-color)] text-lg">
                  &darr; Scroll to explore more
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

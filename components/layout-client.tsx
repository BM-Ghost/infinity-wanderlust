"use client"

import { ReactNode, Suspense } from "react"
import { ScrollToTop } from "@/components/scroll-to-top"
import { GlobalVisitTracker } from "@/components/global-visit-tracker"

export function LayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <GlobalVisitTracker />
      </Suspense>
      <ScrollToTop />
      {children}
    </>
  )
}

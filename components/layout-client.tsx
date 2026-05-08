"use client"

import { ReactNode } from "react"
import { ScrollToTop } from "@/components/scroll-to-top"
import { GlobalVisitTracker } from "@/components/global-visit-tracker"

export function LayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      <GlobalVisitTracker />
      <ScrollToTop />
      {children}
    </>
  )
}

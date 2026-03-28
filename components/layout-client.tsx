"use client"

import { ReactNode } from "react"
import { ScrollToTop } from "@/components/scroll-to-top"

export function LayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  )
}

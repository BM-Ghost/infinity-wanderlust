'use client'

import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';


const inter = Inter({ subsets: ["latin"] })
// Instantiate the query client once
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <Navbar />
          {children}
          <ReactQueryDevtools/>
          <Footer />
        </QueryClientProvider>
      </body>
    </html>
  )
}

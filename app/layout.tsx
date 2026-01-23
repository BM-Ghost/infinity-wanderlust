'use client'

import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { useEffect } from "react"
import { fetchUsers } from "@/hooks/use-pb-users"

// Dynamically import DevTools to prevent chunk loading errors
const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(mod => mod.ReactQueryDevtools),
  { ssr: false }
)

const inter = Inter({ subsets: ["latin"] })

// Instantiate the query client once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Prefetch users data on app load
function PrefetchUsers() {
  useEffect(() => {
    // Prefetch first page of users
    queryClient.prefetchQuery({
      queryKey: ["all-users", 1],
      queryFn: () => fetchUsers({ page: 1, perPage: 50 }),
      staleTime: 1000 * 60 * 5,
    })

    // Prefetch second page as well for better UX
    queryClient.prefetchQuery({
      queryKey: ["all-users", 2],
      queryFn: () => fetchUsers({ page: 2, perPage: 50 }),
      staleTime: 1000 * 60 * 5,
    })

    console.log("[PrefetchUsers] Users data prefetched")
  }, [])

  return null
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <PrefetchUsers />
          <Navbar />
          {children}
          <ReactQueryDevtools/>
          <Footer />
        </QueryClientProvider>
      </body>
    </html>
  )
}

"use client"

import { ReactNode, useState } from "react"
import { QueryClientProvider, useQuery } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { getPocketBase } from "@/lib/pocketbase"

function createQueryClient() {
  return new (require("@tanstack/react-query").QueryClient)({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
      },
    },
  })
}

function PrefetchUsers({ queryClient }: { queryClient: any }) {
  useQuery({
    queryKey: ["all-users", 1, 50, "created"],
    queryFn: async () => {
      const pb = getPocketBase()
      if (!pb) throw new Error("PocketBase not initialized")
      return pb.collection("users").getList(1, 50, {
        sort: "-created",
      })
    },
    staleTime: 1000 * 60 * 5,
  })

  useQuery({
    queryKey: ["all-users", 2, 50, "created"],
    queryFn: async () => {
      const pb = getPocketBase()
      if (!pb) throw new Error("PocketBase not initialized")
      return pb.collection("users").getList(2, 50, {
        sort: "-created",
      })
    },
    staleTime: 1000 * 60 * 5,
  })

  return null
}

export function LayoutClient({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <PrefetchUsers queryClient={queryClient} />
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}

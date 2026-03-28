import type React from "react"

// NOTE: Providers (QueryClient, AuthProvider, etc.) live in the root layout.tsx
// and must NOT be re-created here. template.tsx re-mounts on every route change,
// so wrapping in Providers would destroy the QueryClient cache and reset auth
// state on every navigation — which breaks mobile nav and all cached data.
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

# Infinity Wanderlust - AI Agent Instructions

## Project Overview
**Infinity Wanderlust** is a Next.js travel booking and event discovery platform built with TypeScript, TailwindCSS, and Radix UI components. The backend is PocketBase (a Firebase alternative), deployed at `https://remain-faceghost.pockethost.io`. The app combines travel events, bookings, reviews, and user profiles in a modern, responsive UI.

## Architecture

### Stack & Build
- **Framework**: Next.js (App Router, `"use client"` patterns)
- **DB & Auth**: PocketBase (singleton initialized via `getPocketBase()` in `lib/pocketbase.ts`)
- **State Management**: TanStack React Query v5 (see `app/layout.tsx` for global QueryClient setup with 5-min staleTime, 30-min gcTime)
- **Styling**: TailwindCSS + Radix UI component library (in `components/ui/`)
- **Build Commands**: `npm run dev` (local), `npm run build`, `npm run start`, `npm run lint`
- **TypeScript**: Strict mode enabled; imports via `@/*` alias (see `tsconfig.json`)

### Data Flow & Key Modules
1. **Auth**: PocketBase user collection → `AuthProvider` (context in `components/auth-provider.tsx`) → localStorage persistence
   - User model: id, email, username, name, avatarUrl, bio, followers/following arrays, timestamps
   - Sign in/up/reset handled via PocketBase REST API in auth-provider
2. **Travel Domain**: 
   - `lib/travel-events.ts`: TravelEvent interface (title, destination, price, creator, collaborators, map coords)
   - `lib/travel-bookings.ts`: User booking records (event_id, user_id, status)
   - `lib/reviews.ts`: Review records (linked to events/users)
3. **Hooks Pattern**: 
   - `hooks/useEvents.ts` → calls `lib/travel-events.ts` → wrapped by React Query
   - `hooks/useBookings.ts` → calls `lib/travel-bookings.ts`
   - `hooks/useUsers.ts` → calls `hooks/use-pb-users.tsx`
   - All hooks return `{ data, isLoading, isError, error?, refetch? }` shape
4. **UI Components**: Radix UI primitives in `components/ui/` (40+ components). Custom layouts: `Navbar`, `Footer`, `AuthProvider`, `ThemeProvider`, `LanguageProvider` in `components/`

### Key File Locations
- **Backend Integration**: `lib/pocketbase.ts` (singleton), `lib/auth.ts` (stub), `lib/email.ts`, `lib/audit.ts`
- **Data Fetching**: `lib/travel-*.ts`, `hooks/use*.ts`
- **Routes**: `app/` directory structure mirrors routes (e.g., `app/login/page.tsx`, `app/events/page.tsx`)
- **Shared UI**: `components/` (custom) + `components/ui/` (Radix)
- **Public Assets**: `public/`

## Development Workflows

### Environment Setup
- **Node.js**: 18+ recommended (project uses `next@15.2.4`)
- **Package Manager**: `pnpm` or `npm` (lock file: `pnpm-lock.yaml`)
- **TypeScript**: Strict mode; `npm run lint` for eslint checks
- **No `.env` file checked in**: PocketBase URL is hardcoded (`https://remain-faceghost.pockethost.io`)
- **Admin operations**: Requires `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` in `.env.local` (for server-side only)

### Local Development
```bash
pnpm install  # or npm install
npm run dev   # Starts Next.js on http://localhost:3000
```
- Check PocketBase connectivity in console logs (health check at `lib/pocketbase.ts:27`)
- Auth state auto-restores from localStorage on app start
- React Query DevTools available (see `app/layout.tsx`)

### Common Tasks
- **Adding a new page/route**: Create folder in `app/`, add `page.tsx` with `"use client"` (all routes are client-side)
- **Creating custom hooks**: Use React Query pattern (see `hooks/useEvents.ts`), export `{ data, isLoading, isError }`
- **Adding UI components**: Use/extend Radix UI from `components/ui/`; wrap in custom components for app logic
- **Database calls**: Use `getPocketBase().collection('name').method()` pattern; auth auto-persists to localStorage
- **Forms**: Use `@hookform/resolvers` + Zod (see dependencies); form component in `components/ui/form.tsx`

### Admin Operations (Server-Side Only)
Use `getPocketBaseAdmin()` from `lib/pocketbase.ts` for privileged operations (see lines 60-115):
```typescript
import { getPocketBaseAdmin } from "@/lib/pocketbase"

// Server action or API route only
const pb = await getPocketBaseAdmin()
await pb.collection('users').update(userId, { role: 'admin' })
```
**Critical**: 
- Throws error if called in browser (`typeof window !== "undefined"`)
- Verifies admin auth: no `collectionId` on authStore.model
- Requires `PB_ADMIN_EMAIL` and `PB_ADMIN_PASSWORD` in `.env.local`
- Admin auth uses `/api/admins/auth-with-password` endpoint

### Testing & Debugging
- **No test framework configured**: Project uses eslint only (`npm run lint`)
- **Debug logging**: Use `logPocketBaseStatus()` from `lib/pocketbase.ts` to check auth state
- **React Query DevTools**: Visible in dev mode (see `app/layout.tsx:9`); inspect query cache and stale times
- **Browser console**: PocketBase logs all health checks, auth state changes, and connection errors
- **TypeScript strict mode**: Enables catch-all error detection; `next.config.mjs` ignores build errors for now

## Project-Specific Patterns & Conventions

### Authentication & User Context
- **No login session API**: Auth is client-side via PocketBase. User state lives in `AuthContext` (context/provider pattern)
- **Avatar URLs**: PocketBase files served at `https://remain-faceghost.pockethost.io/api/files/{collectionId}/{recordId}/{filename}`
- **Auth Persistence**: Token + model stored in localStorage as `pocketbase_auth` JSON (see `auth-provider.tsx:19-25`)

### Data Fetching & Caching
- **React Query prefetch on app load**: `useEffect` in `app/layout.tsx` prefetches users pages 1-2 for UX (not blocking)
- **Query Keys**: Use tuple arrays (e.g., `["all-events", page, perPage, sort, filter]`) for cache granularity
- **Enabled Queries**: Use `enabled: !!userId` pattern to conditionally fetch (see `hooks/useBookings.ts:7`)
- **Error Handling**: Hooks return `error` object; wrap components in `isLoading` / `isError` checks

### Component & Route Patterns
- **"use client" required**: All interactive routes/components must have `"use client"` directive (App Router)
- **Image URLs**: Build full URLs to PocketBase assets; use `<Image />` from Next.js with `unoptimized: true` (see `next.config.mjs`)
- **Theme Switching**: `ThemeProvider` uses class-based dark mode; toggle in `components/theme-toggle.tsx`
- **Multi-language**: `LanguageProvider` provides `useTranslation()` hook (see `components/language-provider.tsx`, `lib/translations.ts`)

### Type Safety
- **Zod + TypeScript**: Use interfaces for API responses (e.g., `TravelEvent` in `lib/travel-events.ts`); Zod for form validation
- **Error Types**: Catch `ClientResponseError` from PocketBase (see `hooks/useEvents.ts:5`)

### Cloudflare Workers Integration (Wrangler)
- **Config**: `wrangler.toml` (compatibility date: `2025-12-04`, `nodejs_compat` enabled)
- **Build Output**: Pages static output at `.vercel/output/static` 
- **Purpose**: Cloudflare Workers/Pages deployment (not used locally; see `package.json` for `wrangler@^4.53.0`)
- **Note**: Development uses `npm run dev`; production build via `npm run build`

## Common Gotchas & Tips

1. **Layout "use client" directive**: Root layout in `app/layout.tsx` is `"use client"` to enable providers; some nested routes may still be static if needed
2. **TypeScript Ignore Flags**: Build configured to ignore TypeScript errors (`ignoreBuildErrors: true`); fix properly for production
3. **PocketBase URL hardcoded**: `https://remain-faceghost.pockethost.io` appears in multiple files; externalize to `.env` if needed
4. **Auth check**: Always verify `pb.authStore.isValid` before accessing protected routes (see `auth-provider.tsx:52`)
5. **Prefetch data cautiously**: Large prefetches can slow initial load; see `app/layout.tsx` for example
6. **Admin operations**: Server-side admin actions use `getPocketBaseAdmin()` (not yet shown in samples; check `lib/pocketbase.ts:61+`)

## File Organization Quick Reference
- **New page**: `app/[feature]/page.tsx` + `"use client"`
- **New data hook**: `hooks/use[Feature].ts` → returns `{ data, isLoading, isError }`
- **Data fetching logic**: `lib/[domain].ts` (e.g., `lib/travel-events.ts`)
- **Shared component**: `components/[ComponentName].tsx`
- **UI primitive**: Use existing `components/ui/` or compose new one
- **Styling**: TailwindCSS classes directly in JSX; dark mode via `dark:` prefix

---

**Last Updated**: January 2026 | **Questions?** Review `lib/pocketbase.ts`, `components/auth-provider.tsx`, or `app/layout.tsx` for integration patterns.

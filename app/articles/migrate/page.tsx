"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckSquare, Loader2, RefreshCw } from "lucide-react"

import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import {
  LegacyBlogCandidate,
  listLegacyBlogCandidates,
  migrateLegacyBlogsByIds,
} from "@/lib/reviews"

const ADMIN_EMAIL = "infinitywanderlusttravels@gmail.com"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function MigrateBlogsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { toast } = useToast()

  const [candidates, setCandidates] = useState<LegacyBlogCandidate[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isFetching, setIsFetching] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL

  const allSelected = useMemo(
    () => candidates.length > 0 && selectedIds.size === candidates.length,
    [candidates.length, selectedIds.size],
  )

  const selectedCount = selectedIds.size

  const loadCandidates = async () => {
    setIsFetching(true)
    try {
      const rows = await listLegacyBlogCandidates()
      setCandidates(rows)
      setSelectedIds(new Set(rows.map((row) => row.id)))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to load candidates",
        description: error?.message || "Could not load legacy blog candidates.",
      })
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    if (!isLoading && isAdmin) {
      loadCandidates()
    }
  }, [isLoading, isAdmin])

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(candidates.map((row) => row.id)))
  }

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const runMigration = async () => {
    if (selectedIds.size === 0) {
      toast({ title: "No selection", description: "Select at least one candidate to migrate." })
      return
    }

    setIsMigrating(true)
    try {
      const ids = Array.from(selectedIds)
      const result = await migrateLegacyBlogsByIds(ids)
      toast({
        title: "Migration complete",
        description: `Migrated ${result.migrated} record(s), skipped ${result.skipped}.`,
      })
      await loadCandidates()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Migration failed",
        description: error?.message || "Could not migrate selected records.",
      })
    } finally {
      setIsMigrating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Checking permissions...</CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>You must sign in as admin to run migration.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link href="/login?redirect=/articles/migrate">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/articles">Back to Blogs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Admin access only</CardTitle>
            <CardDescription>Only the admin account can run blog migration.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/articles">Back to Blogs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-8 md:py-12 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push("/articles")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Blogs
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Legacy Blog Migration</CardTitle>
          <CardDescription>
            One-time admin tool to stamp older blog records with the blog marker for explicit blog/review separation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={loadCandidates} disabled={isFetching || isMigrating}>
              {isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Refresh Candidates
            </Button>
            <Button variant="outline" onClick={toggleAll} disabled={candidates.length === 0 || isMigrating}>
              <CheckSquare className="h-4 w-4 mr-2" />
              {allSelected ? "Clear Selection" : "Select All"}
            </Button>
            <Button onClick={runMigration} disabled={selectedCount === 0 || isMigrating || isFetching}>
              {isMigrating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Migrate Selected ({selectedCount})
            </Button>
          </div>

          {isFetching ? (
            <p className="text-sm text-muted-foreground">Loading legacy candidates...</p>
          ) : candidates.length === 0 ? (
            <div className="rounded-md border p-4 text-sm text-muted-foreground">
              No legacy candidates found. Existing blogs are already marked.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="max-h-[520px] overflow-y-auto divide-y">
                {candidates.map((item) => {
                  const checked = selectedIds.has(item.id)
                  return (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 p-4 hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleOne(item.id)}
                        className="mt-1"
                      />
                      <div className="space-y-1 min-w-0">
                        <p className="font-medium leading-snug">{item.destination}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.created)} · {item.wordCount} words · {item.id}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.preview}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

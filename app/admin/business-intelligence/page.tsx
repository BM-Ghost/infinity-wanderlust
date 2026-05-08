import { redirect } from "next/navigation"

export default function AdminBusinessIntelligencePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const query = new URLSearchParams()

  const mode = searchParams?.mode
  const timeframe = searchParams?.timeframe

  if (typeof mode === "string") query.set("mode", mode)
  if (typeof timeframe === "string") query.set("timeframe", timeframe)

  const suffix = query.toString()
  redirect(suffix ? `/admin/analytics?${suffix}` : "/admin/analytics")
}

import { NextResponse } from "next/server"
import PocketBase from "pocketbase"
import { getPocketBaseAdmin } from "@/lib/pocketbase"

export const runtime = 'edge';

const PB_URL = "https://remain-faceghost.pockethost.io"

export async function POST(request: Request) {
  try {
    // Require a valid user Bearer token — never trust userId from the body
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim()
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Validate the token against PocketBase
    const userPb = new PocketBase(PB_URL)
    userPb.authStore.save(token, null)
    let userId: string
    try {
      const auth = await userPb.collection("users").authRefresh()
      userId = auth.record.id
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use admin SDK to invalidate all sessions for this (and only this) user
    const adminPb = await getPocketBaseAdmin()
    await adminPb.collection("users").update(userId, {
      tokenKey: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      auth_number: Date.now(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/security/logout-all error")
    return NextResponse.json({ error: "Failed to logout all sessions" }, { status: 500 })
  }
}

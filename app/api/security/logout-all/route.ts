import { NextResponse } from "next/server"
import { getPocketBaseAdmin } from "@/lib/pocketbase"

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const adminPb = await getPocketBaseAdmin()
    
    // Force token invalidation by updating tokenKey
    // This forces PocketBase to regenerate the user's token secret, invalidating all existing tokens
    await adminPb.collection("users").update(userId, { 
      tokenKey: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      auth_number: Date.now()
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/security/logout-all error", error)
    return NextResponse.json({ error: "Failed to logout all sessions" }, { status: 500 })
  }
}

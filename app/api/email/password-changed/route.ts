import { NextResponse } from "next/server"
import PocketBase from "pocketbase"
import { sendPasswordChangedEmail } from "@/lib/email"

export const runtime = 'edge';

const PB_URL = "https://remain-faceghost.pockethost.io"

export async function POST(request: Request) {
  try {
    // Require a valid user Bearer token — prevents anonymous actors from sending
    // spoofed "password changed" notification emails through our domain.
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim()
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userPb = new PocketBase(PB_URL)
    userPb.authStore.save(token, null)
    let authenticatedEmail: string
    try {
      const auth = await userPb.collection("users").authRefresh()
      authenticatedEmail = auth.record.email as string
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { to, userName, logoutAll } = body

    if (!to) {
      return NextResponse.json({ error: "Missing 'to'" }, { status: 400 })
    }

    // Ensure the email target matches the authenticated user
    if (to.toLowerCase() !== authenticatedEmail.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await sendPasswordChangedEmail({ to, userName, logoutAll })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/email/password-changed error")
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

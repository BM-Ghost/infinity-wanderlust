import { NextResponse } from "next/server"
import { sendPasswordChangedEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, userName, logoutAll } = body

    if (!to) {
      return NextResponse.json({ error: "Missing 'to'" }, { status: 400 })
    }

    await sendPasswordChangedEmail({ to, userName, logoutAll })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/email/password-changed error", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

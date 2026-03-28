import { NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/email"

export const runtime = "edge"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    await sendContactEmail({
      senderName: name,
      senderEmail: email,
      subject,
      message,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/email/contact error:", error)
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    )
  }
}

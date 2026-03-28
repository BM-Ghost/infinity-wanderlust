import { NextResponse } from "next/server"
import { sendContactEmail } from "@/lib/email"

export const runtime = "edge"

// Strict input limits to prevent abuse / oversized payloads
const LIMITS = { name: 100, email: 254, subject: 200, message: 5000 }

export async function POST(request: Request) {
  try {
    // Guard against huge request bodies before even parsing JSON
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 20_000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 })
    }

    const body = await request.json()
    const { name, email, subject, message } = body

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Type check
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    // Length limits
    if (name.length > LIMITS.name || email.length > LIMITS.email || subject.length > LIMITS.subject || message.length > LIMITS.message) {
      return NextResponse.json({ error: "Input exceeds maximum length" }, { status: 400 })
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    await sendContactEmail({
      senderName: name.trim(),
      senderEmail: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("/api/email/contact error")
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    )
  }
}

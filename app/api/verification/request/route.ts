import { NextResponse } from "next/server"
import { requestSignupVerification } from "@/actions/signup-verification"

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, message: "Missing email" }, { status: 400 })
    }

    const result = await requestSignupVerification(email)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to process verification request" },
      { status: 500 },
    )
  }
}

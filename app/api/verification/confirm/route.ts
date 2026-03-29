import { NextResponse } from "next/server"
import { confirmSignupVerification } from "@/actions/signup-verification"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tokenOrCode, email } = body

    if (!tokenOrCode || typeof tokenOrCode !== "string") {
      return NextResponse.json(
        { success: false, message: "Missing verification token or code" },
        { status: 400 },
      )
    }

    const result = await confirmSignupVerification(tokenOrCode, email)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ success: false, message: "Failed to verify email" }, { status: 500 })
  }
}

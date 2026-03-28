import { NextResponse } from "next/server"
import { requestPasswordReset } from "@/actions/password-reset"

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    const result = await requestPasswordReset(email)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to process password reset request" },
      { status: 500 }
    )
  }
}

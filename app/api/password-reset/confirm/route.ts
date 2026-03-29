import { NextResponse } from "next/server"
import { confirmPasswordReset } from "@/actions/password-reset"

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tokenOrCode, newPassword, confirmPassword, email } = body

    if (!tokenOrCode || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    const result = await confirmPasswordReset(tokenOrCode, newPassword, confirmPassword, email)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    )
  }
}

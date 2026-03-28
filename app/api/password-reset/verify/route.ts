import { NextResponse } from "next/server"
import { verifyResetCode } from "@/actions/password-reset"

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = body

    if (!email || !code) {
      return NextResponse.json({ success: false, message: "Missing email or code" }, { status: 400 })
    }

    const result = await verifyResetCode(email, code)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to verify code" },
      { status: 500 }
    )
  }
}

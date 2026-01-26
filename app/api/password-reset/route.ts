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
  } catch (error) {
    console.error("/api/password-reset error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process password reset request",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

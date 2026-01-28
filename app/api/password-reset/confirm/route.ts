import { NextResponse } from "next/server"
import { confirmPasswordReset } from "@/actions/password-reset"

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    console.log("[API /api/password-reset/confirm] ========== CONFIRM REQUEST START ==========")
    const body = await request.json()
    const { tokenOrCode, newPassword, confirmPassword } = body

    console.log("[API /confirm] Request body:", { 
      tokenOrCode: tokenOrCode?.substring(0, 10) + "...", 
      newPassword: newPassword ? "***" : "undefined",
      confirmPassword: confirmPassword ? "***" : "undefined"
    })

    if (!tokenOrCode || !newPassword || !confirmPassword) {
      console.log("[API /confirm] Missing required fields")
      return NextResponse.json({ 
        success: false, 
        message: "Missing token/code or password" 
      }, { status: 400 })
    }

    console.log("[API /confirm] Calling confirmPasswordReset server action...")
    const result = await confirmPasswordReset(tokenOrCode, newPassword, confirmPassword)
    
    console.log("[API /confirm] Server action result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[API /confirm] Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to reset password",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

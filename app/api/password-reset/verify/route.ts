import { NextResponse } from "next/server"
import { verifyResetCode } from "@/actions/password-reset"

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    console.log("[API /api/password-reset/verify] ========== VERIFY REQUEST START ==========")
    const body = await request.json()
    const { email, code } = body

    console.log("[API /verify] Request body:", { email, code, code_length: code?.length, code_type: typeof code })

    if (!email || !code) {
      console.log("[API /verify] Missing email or code")
      return NextResponse.json({ success: false, message: "Missing email or code" }, { status: 400 })
    }

    console.log("[API /verify] Calling verifyResetCode server action...")
    const result = await verifyResetCode(email, code)
    
    console.log("[API /verify] Server action result:", result)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[API /verify] Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to verify code",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

"use server"

import { getPocketBase, getPocketBaseAdmin } from "@/lib/pocketbase"
import { sendPasswordResetEmail } from "@/lib/email"
import { createAuditLog } from "@/lib/audit"

// Server-side function to check if user exists by email
async function checkUserExistsByEmail(email: string): Promise<{ exists: boolean; user?: any }> {
  try {
    const pb = getPocketBase()
    if (!pb) return { exists: false }

    // Use filter to find user by email
    const result = await pb.collection('users').getList(1, 1, {
      filter: `email="${email}"`,
    })

    if (result.items.length > 0) {
      return { exists: true, user: result.items[0] }
    }

    return { exists: false }
  } catch (error) {
    console.error("[checkUserExistsByEmail] Error:", error)
    return { exists: false }
  }
}

interface PasswordResetResult {
  success: boolean
  message: string
  resetToken?: string
  verificationCode?: string
}

interface ConfirmPasswordResetResult {
  success: boolean
  message: string
}

// Check if user exists by email
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    const pb = getPocketBase()
    if (!pb) return false

    // Try to find user by email
    await pb.collection("users").getFirstListItem(`email="${email}"`)
    return true
  } catch (error) {
    return false
  }
}

// Request password reset - sends email with code and stores in PocketBase
export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  try {
    console.log("[requestPasswordReset] Starting password reset for:", email)

    const pb = getPocketBase()
    if (!pb) {
      return {
        success: false,
        message: "Database connection failed",
      }
    }

    // Check if user exists using the same method as useUsers hook
    const userCheck = await checkUserExistsByEmail(email)
    if (!userCheck.exists) {
      console.log("[requestPasswordReset] User not found:", email)
      return {
        success: false,
        message: "If an account with this email exists, a reset code has been sent.",
      }
    }

    const user = userCheck.user

    // Generate verification code (6 digits)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("[requestPasswordReset] 🔐 Generated verification code:", verificationCode)
    console.log("[requestPasswordReset] Code type:", typeof verificationCode)
    console.log("[requestPasswordReset] Code length:", verificationCode.length)

    // Generate reset token for email link
    const resetToken = crypto.randomUUID()
    console.log("[requestPasswordReset] 🔑 Generated reset token:", resetToken)

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)
    console.log("[requestPasswordReset] ⏰ Expires at:", expiresAt.toISOString())

    // Store reset request in PocketBase (try direct creation)
    let resetRequest
    try {
      const resetData = {
        user_id: user.id,
        verification_code: verificationCode,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false,
      }
      console.log("[requestPasswordReset] 💾 Saving to PocketBase:", {
        user_id: resetData.user_id,
        verification_code: resetData.verification_code,
        code_type: typeof resetData.verification_code,
        reset_token: resetData.reset_token,
        expires_at: resetData.expires_at,
        used: resetData.used,
      })
      
      resetRequest = await pb.collection("password_resets").create(resetData)
      console.log("[requestPasswordReset] ✅ Created reset request:", resetRequest.id)
      console.log("[requestPasswordReset] 📋 Saved record:", {
        id: resetRequest.id,
        verification_code: resetRequest.verification_code,
        code_type: typeof resetRequest.verification_code,
        user_id: resetRequest.user_id,
        used: resetRequest.used,
      })
    } catch (createError: any) {
      console.error("[requestPasswordReset] ❌ Failed to create reset request:", createError)

      if (createError.status === 404) {
        return {
          success: false,
          message: "Password reset system not configured. Please create the 'password_resets' collection in PocketBase.",
        }
      }

      return {
        success: false,
        message: "Failed to create password reset request. Please try again.",
      }
    }

    // Send email with both code and link
    try {
      console.log("[requestPasswordReset] 📧 Sending email with code:", verificationCode)
      await sendPasswordResetEmail({
        to: email,
        verificationCode,
        resetToken,
        userName: user.name || user.email,
      })
      console.log("[requestPasswordReset] ✅ Email sent successfully")
    } catch (emailError) {
      console.error("[requestPasswordReset] ❌ Email sending failed:", emailError)
      // Don't fail the whole request if email fails, but log it
    }

    // Create audit log
    try {
      await createAuditLog({
        action: "password_reset_requested",
        userId: user.id,
        email: email,
        metadata: { method: "custom" },
      })
    } catch (auditError) {
      console.log("[requestPasswordReset] Could not create audit log:", auditError)
    }

    return {
      success: true,
      message: "Password reset code sent to your email.",
      resetToken,
      verificationCode, // For testing purposes
    }
  } catch (error: any) {
    console.error("[requestPasswordReset] Error:", error)
    return {
      success: false,
      message: "Failed to send password reset email. Please try again.",
    }
  }
}

// Verify reset code
export async function verifyResetCode(email: string, code: string): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    console.log("[verifyResetCode] ========== VERIFICATION START ==========")
    console.log("[verifyResetCode] Input email:", email)
    console.log("[verifyResetCode] Input code:", code)
    console.log("[verifyResetCode] Code type:", typeof code)
    console.log("[verifyResetCode] Code length:", code.length)
    console.log("[verifyResetCode] Code trimmed:", code.trim())

    const pb = getPocketBase()
    if (!pb) {
      return {
        success: false,
        message: "Database connection failed",
      }
    }

    // Find user by email first
    let user
    try {
      user = await pb.collection("users").getFirstListItem(`email="${email}"`)
      console.log("[verifyResetCode] ✅ Found user ID:", user.id, "Email:", user.email)
    } catch (error) {
      console.log("[verifyResetCode] ❌ User not found for email:", email)
      return {
        success: false,
        message: "User not found",
      }
    }

    // First, get ALL reset requests for this user to see what's in the database
    console.log("[verifyResetCode] Fetching all password resets for user:", user.id)
    try {
      const allResets = await pb.collection("password_resets").getList(1, 10, {
        filter: `user_id="${user.id}"`,
        sort: "-created",
      })
      console.log("[verifyResetCode] Found", allResets.items.length, "reset requests for this user:")
      allResets.items.forEach((reset, index) => {
        console.log(`[verifyResetCode] Reset #${index + 1}:`, {
          id: reset.id,
          verification_code: reset.verification_code,
          code_type: typeof reset.verification_code,
          code_length: reset.verification_code?.length,
          used: reset.used,
          expires_at: reset.expires_at,
          created: reset.created,
        })
      })
    } catch (error) {
      console.log("[verifyResetCode] Could not fetch all resets:", error)
    }

    // Now try to find the matching reset request
    console.log("[verifyResetCode] Searching for matching code...")
    const filterQuery = `user_id="${user.id}" && verification_code="${code}" && used=false`
    console.log("[verifyResetCode] Filter query:", filterQuery)

    let resetRequest
    try {
      resetRequest = await pb.collection("password_resets").getFirstListItem(filterQuery)
      console.log("[verifyResetCode] ✅ Found reset request:", {
        id: resetRequest.id,
        verification_code: resetRequest.verification_code,
        used: resetRequest.used,
        expires_at: resetRequest.expires_at,
      })
    } catch (error: any) {
      console.log("[verifyResetCode] ❌ No matching reset request found")
      console.log("[verifyResetCode] Error status:", error.status)
      console.log("[verifyResetCode] Error message:", error.message)
      console.log("[verifyResetCode] Error data:", JSON.stringify(error.data || {}))
      
      // Try to manually compare codes from the list
      try {
        const allResets = await pb.collection("password_resets").getList(1, 10, {
          filter: `user_id="${user.id}" && used=false`,
        })
        console.log("[verifyResetCode] Manual comparison:")
        allResets.items.forEach((reset) => {
          const dbCode = String(reset.verification_code)
          const inputCode = String(code)
          console.log(`[verifyResetCode] DB Code: "${dbCode}" (${dbCode.length} chars) vs Input: "${inputCode}" (${inputCode.length} chars) - Match: ${dbCode === inputCode}`)
        })
      } catch (e) {
        console.log("[verifyResetCode] Could not perform manual comparison:", e)
      }

      return {
        success: false,
        message: "Invalid verification code",
      }
    }

    // Check if expired
    if (new Date(resetRequest.expires_at) < new Date()) {
      console.log("[verifyResetCode] Code expired at:", resetRequest.expires_at)
      return {
        success: false,
        message: "Verification code has expired",
      }
    }

    console.log("[verifyResetCode] Code verified successfully")
    return {
      success: true,
      message: "Code verified successfully",
      userId: user.id,
    }
  } catch (error: any) {
    console.error("[verifyResetCode] Error:", error)
    return {
      success: false,
      message: "Failed to verify code",
    }
  }
}

// Confirm password reset with new password
export async function confirmPasswordReset(
  tokenOrCode: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ConfirmPasswordResetResult> {
  try {
    console.log("[confirmPasswordReset] Starting password reset confirmation")

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: "Passwords do not match",
      }
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long",
      }
    }

    const pb = getPocketBase()
    if (!pb) {
      return {
        success: false,
        message: "Database connection failed",
      }
    }

    let resetRequest
    let userId

    if (tokenOrCode.length === 6) {
      // 6-digit code verification
      console.log("[confirmPasswordReset] Validating 6-digit code:", tokenOrCode)

      // Find the reset request by code (wrap in try-catch since getFirstListItem throws 404)
      try {
        resetRequest = await pb.collection("password_resets").getFirstListItem(
          `verification_code="${tokenOrCode}" && used=false`
        )
        console.log("[confirmPasswordReset] Found reset request via code:", resetRequest.id)
      } catch (error: any) {
        console.log("[confirmPasswordReset] No valid reset request found for code:", tokenOrCode)
        return {
          success: false,
          message: "Invalid or expired verification code",
        }
      }
    } else {
      // Token-based reset (from email link)
      console.log("[confirmPasswordReset] Validating reset token:", tokenOrCode)

      try {
        resetRequest = await pb.collection("password_resets").getFirstListItem(
          `reset_token="${tokenOrCode}" && used=false`
        )
        console.log("[confirmPasswordReset] Found reset request via token:", resetRequest.id)
      } catch (error: any) {
        console.log("[confirmPasswordReset] No valid reset request found for token:", tokenOrCode)
        return {
          success: false,
          message: "Invalid or expired reset link",
        }
      }
    }

    // Check expiry
    if (new Date(resetRequest.expires_at) < new Date()) {
      return {
        success: false,
        message: "Reset request has expired",
      }
    }

    userId = resetRequest.user_id

    // Update password - try admin method first
    try {
      const adminPb = await getPocketBaseAdmin()
      
      // Log the API request details for Postman replication
      const updateData = {
        password: newPassword,
        passwordConfirm: confirmPassword,
      }
      console.log("[confirmPasswordReset] API Request Details:")
      console.log("Method: PATCH")
      console.log("URL: /api/collections/users/records/" + userId)
      console.log("Headers: Authorization: Bearer " + adminPb.authStore.token)
      console.log("Body:", JSON.stringify(updateData, null, 2))
      
      await adminPb.collection('users').update(userId, updateData)
      console.log("[confirmPasswordReset] Password updated successfully via admin update")

      // Invalidate other sessions by bumping auth_number
      try {
        await adminPb.collection('users').update(userId, { auth_number: Date.now() })
        console.log("[confirmPasswordReset] auth_number bumped for session invalidation")
      } catch (bumpError) {
        console.warn("[confirmPasswordReset] auth_number bump failed (non-blocking)", bumpError)
      }
    } catch (adminError: any) {
      console.error("[confirmPasswordReset] Admin update failed:", adminError.message)
      return {
        success: false,
        message: "Failed to update password. Please check admin configuration.",
      }
    }

    // Mark reset request as used
    await pb.collection('password_resets').update(resetRequest.id, { used: true })

    // Create audit log
    try {
      await createAuditLog({
        action: "password_reset_confirmed",
        userId: userId,
        email: "",
        metadata: { method: tokenOrCode.length === 6 ? "code" : "link" },
      })
    } catch (auditError) {
      console.log("[confirmPasswordReset] Could not create audit log:", auditError)
    }

    return {
      success: true,
      message: "Password reset successfully",
    }
  } catch (error: any) {
    console.error("[confirmPasswordReset] Error:", error)
    return {
      success: false,
      message: "Password reset failed. Please try again.",
    }
  }
}

// Ensure password_resets collection exists
async function ensurePasswordResetsCollection(pb: any) {
  try {
    // Try to get the collection to see if it exists
    await pb.collections.getOne("password_resets")
    console.log("[ensurePasswordResetsCollection] Collection exists")
  } catch (error: any) {
    if (error.status === 404) {
      console.log("[ensurePasswordResetsCollection] Creating password_resets collection")

      // Create the collection
      await pb.collections.create({
        name: "password_resets",
        type: "base",
        schema: [
          {
            name: "user_id",
            type: "text",
            required: true,
          },
          {
            name: "verification_code",
            type: "text",
            required: true,
          },
          {
            name: "reset_token",
            type: "text",
            required: true,
          },
          {
            name: "expires_at",
            type: "date",
            required: true,
          },
          {
            name: "used",
            type: "bool",
            required: true,
          },
        ],
      })

      console.log("[ensurePasswordResetsCollection] Collection created successfully")
    } else {
      console.error("[ensurePasswordResetsCollection] Error:", error)
      throw error
    }
  }
}
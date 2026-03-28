"use server"

import { getPocketBase, getPocketBaseAdmin } from "@/lib/pocketbase"
import { sendPasswordResetEmail } from "@/lib/email"
import { createAuditLog } from "@/lib/audit"

/**
 * Escape a string value for safe use inside a PocketBase filter expression.
 * Prevents filter-injection attacks when user-supplied values (e.g. email) are
 * interpolated directly into filter strings.
 */
function pbEsc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/~/g, "\\~").replace(/"/g, '\\"')
}

// Server-side function to check if user exists by email
async function checkUserExistsByEmail(email: string): Promise<{ exists: boolean; user?: any }> {
  try {
    const pb = getPocketBase()
    if (!pb) return { exists: false }

    // Use filter to find user by email
    const result = await pb.collection('users').getList(1, 1, {
      filter: `email="${pbEsc(email)}"`,
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
    await pb.collection("users").getFirstListItem(`email="${pbEsc(email)}"`)
    return true
  } catch {
    return false
  }
}

// Request password reset - sends email with code and stores in PocketBase
export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  try {
    const pb = getPocketBase()
    if (!pb) {
      return { success: false, message: "Database connection failed" }
    }

    const userCheck = await checkUserExistsByEmail(email)
    // Always return the same message whether the user exists or not (prevents email enumeration)
    if (!userCheck.exists) {
      return {
        success: true,
        message: "If an account with this email exists, a reset code has been sent.",
      }
    }

    const user = userCheck.user

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const resetToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    try {
      await pb.collection("password_resets").create({
        user_id: user.id,
        verification_code: verificationCode,
        reset_token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
    } catch (createError: any) {
      console.error("[requestPasswordReset] Failed to create reset request")
      if (createError.status === 404) {
        return {
          success: false,
          message: "Password reset system not configured.",
        }
      }
      return { success: false, message: "Failed to create password reset request. Please try again." }
    }

    try {
      await sendPasswordResetEmail({
        to: email,
        verificationCode,
        resetToken,
        userName: user.name || user.email,
      })
    } catch (emailError) {
      console.error("[requestPasswordReset] Email sending failed")
    }

    try {
      await createAuditLog({
        action: "password_reset_requested",
        userId: user.id,
        email: email,
        metadata: { method: "custom" },
      })
    } catch {
      // audit log failure is non-blocking
    }

    // Never return the code or token — they must only travel via email
    return {
      success: true,
      message: "If an account with this email exists, a reset code has been sent.",
    }
  } catch (error: any) {
    console.error("[requestPasswordReset] Unexpected error")
    return {
      success: false,
      message: "Failed to send password reset email. Please try again.",
    }
  }
}

// Verify reset code
export async function verifyResetCode(email: string, code: string): Promise<{ success: boolean; message: string; userId?: string }> {
  try {
    const pb = getPocketBase()
    if (!pb) {
      return { success: false, message: "Database connection failed" }
    }

    // Find user by email first
    let user
    try {
      user = await pb.collection("users").getFirstListItem(`email="${pbEsc(email)}"`)
    } catch {
      // Return a generic message to avoid revealing whether the email is registered
      return { success: false, message: "Invalid email or verification code" }
    }

    // Sanitise both sides before building the filter
    const filterQuery = `user_id="${pbEsc(user.id)}" && verification_code="${pbEsc(code)}" && used=false`

    let resetRequest
    try {
      resetRequest = await pb.collection("password_resets").getFirstListItem(filterQuery)
    } catch {
      return { success: false, message: "Invalid verification code" }
    }

    if (new Date(resetRequest.expires_at) < new Date()) {
      return { success: false, message: "Verification code has expired" }
    }

    return { success: true, message: "Code verified successfully", userId: user.id }
  } catch {
    return { success: false, message: "Failed to verify code" }
  }
}

// Confirm password reset with new password
export async function confirmPasswordReset(
  tokenOrCode: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ConfirmPasswordResetResult> {
  try {
    if (newPassword !== confirmPassword) {
      return { success: false, message: "Passwords do not match" }
    }

    if (newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters long" }
    }

    const pb = getPocketBase()
    if (!pb) {
      return { success: false, message: "Database connection failed" }
    }

    let resetRequest
    let userId

    if (tokenOrCode.length === 6) {
      // 6-digit code verification (only digits allowed — reject anything else)
      if (!/^\d{6}$/.test(tokenOrCode)) {
        return { success: false, message: "Invalid verification code" }
      }
      try {
        resetRequest = await pb.collection("password_resets").getFirstListItem(
          `verification_code="${pbEsc(tokenOrCode)}" && used=false`
        )
      } catch {
        return { success: false, message: "Invalid or expired verification code" }
      }
    } else {
      // Token-based reset (from email link) — UUID format only
      if (!/^[0-9a-f-]{36}$/i.test(tokenOrCode)) {
        return { success: false, message: "Invalid reset link" }
      }
      try {
        resetRequest = await pb.collection("password_resets").getFirstListItem(
          `reset_token="${pbEsc(tokenOrCode)}" && used=false`
        )
      } catch {
        return { success: false, message: "Invalid or expired reset link" }
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

    // Update password via admin SDK
    try {
      const adminPb = await getPocketBaseAdmin()
      await adminPb.collection('users').update(userId, {
        password: newPassword,
        passwordConfirm: confirmPassword,
      })

      // Invalidate other sessions
      try {
        await adminPb.collection('users').update(userId, { auth_number: Date.now() })
      } catch {
        // non-blocking
      }
    } catch {
      console.error("[confirmPasswordReset] Admin update failed")
      return { success: false, message: "Failed to update password. Please try again." }
    }

    await pb.collection('password_resets').update(resetRequest.id, { used: true })

    try {
      await createAuditLog({
        action: "password_reset_confirmed",
        userId: userId,
        email: "",
        metadata: { method: tokenOrCode.length === 6 ? "code" : "link" },
      })
    } catch {
      // audit failure is non-blocking
    }

    return { success: true, message: "Password reset successfully" }
  } catch {
    console.error("[confirmPasswordReset] Unexpected error")
    return { success: false, message: "Password reset failed. Please try again." }
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
"use server"

import { getPocketBase, getPocketBaseAdmin } from "@/lib/pocketbase"
import { sendSignupVerificationEmail } from "@/lib/email"
import { createAuditLog } from "@/lib/audit"

function pbEsc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/~/g, "\\~").replace(/"/g, '\\"')
}

type SignupVerificationResult = {
  success: boolean
  message: string
}

async function ensureSignupVerificationsCollection(adminPb: any) {
  try {
    await adminPb.collections.getOne("signup_verifications")
  } catch (error: any) {
    if (error?.status !== 404) {
      throw error
    }

    await adminPb.collections.create({
      name: "signup_verifications",
      type: "base",
      schema: [
        {
          name: "user_id",
          type: "text",
          required: true,
        },
        {
          name: "email",
          type: "email",
          required: true,
        },
        {
          name: "verification_code",
          type: "text",
          required: true,
        },
        {
          name: "verification_token",
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
  }
}

async function getUserByEmail(email: string): Promise<any | null> {
  const pb = getPocketBase()
  if (!pb) return null

  try {
    return await pb.collection("users").getFirstListItem(`email=\"${pbEsc(email)}\"`)
  } catch {
    return null
  }
}

export async function requestSignupVerification(email: string): Promise<SignupVerificationResult> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) {
    return { success: false, message: "Email is required" }
  }

  const user = await getUserByEmail(normalizedEmail)

  // Avoid email enumeration: keep response generic when user is missing.
  if (!user) {
    return {
      success: true,
      message: "If an account with this email exists, a verification email has been sent.",
    }
  }

  if (user.verified) {
    return {
      success: true,
      message: "This email is already verified.",
    }
  }

  try {
    const adminPb = await getPocketBaseAdmin()
    await ensureSignupVerificationsCollection(adminPb)

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    const existing = await adminPb.collection("signup_verifications").getFullList({
      filter: `user_id=\"${pbEsc(user.id)}\" && used=false`,
      fields: "id",
      $autoCancel: false,
    })

    for (const record of existing) {
      await adminPb.collection("signup_verifications").update(record.id, { used: true })
    }

    await adminPb.collection("signup_verifications").create({
      user_id: user.id,
      email: normalizedEmail,
      verification_code: verificationCode,
      verification_token: verificationToken,
      expires_at: expiresAt.toISOString(),
      used: false,
    })

    await sendSignupVerificationEmail({
      to: normalizedEmail,
      verificationCode,
      verificationToken,
      userName: user.name || user.username || normalizedEmail,
    })

    await createAuditLog({
      action: "signup_verification_requested",
      userId: user.id,
      email: normalizedEmail,
      metadata: { method: "custom" },
    })

    return {
      success: true,
      message: "Verification email sent successfully.",
    }
  } catch (error) {
    console.error("[requestSignupVerification] Error:", error)
    return {
      success: false,
      message: "Failed to send verification email. Please try again.",
    }
  }
}

export async function confirmSignupVerification(tokenOrCode: string, email?: string): Promise<SignupVerificationResult> {
  if (!tokenOrCode) {
    return { success: false, message: "Missing verification token or code" }
  }

  try {
    const adminPb = await getPocketBaseAdmin()
    await ensureSignupVerificationsCollection(adminPb)

    const isCode = /^\d{6}$/.test(tokenOrCode)
    const safeTokenOrCode = pbEsc(tokenOrCode)

    let filter = isCode
      ? `verification_code=\"${safeTokenOrCode}\" && used=false`
      : `verification_token=\"${safeTokenOrCode}\" && used=false`

    if (isCode) {
      const normalizedEmail = (email || "").trim().toLowerCase()
      if (!normalizedEmail) {
        return { success: false, message: "Email is required when confirming with code" }
      }
      filter = `${filter} && email=\"${pbEsc(normalizedEmail)}\"`
    }

    let verificationRecord
    try {
      verificationRecord = await adminPb.collection("signup_verifications").getFirstListItem(filter)
    } catch {
      return { success: false, message: "Invalid or expired verification request." }
    }

    if (new Date(verificationRecord.expires_at) < new Date()) {
      return { success: false, message: "Verification request has expired." }
    }

    const user = await adminPb.collection("users").getOne(verificationRecord.user_id)

    if (!user.verified) {
      await adminPb.collection("users").update(user.id, { verified: true })
    }

    await adminPb.collection("signup_verifications").update(verificationRecord.id, { used: true })

    const siblingRecords = await adminPb.collection("signup_verifications").getFullList({
      filter: `user_id=\"${pbEsc(user.id)}\" && used=false`,
      fields: "id",
      $autoCancel: false,
    })

    for (const record of siblingRecords) {
      if (record.id !== verificationRecord.id) {
        await adminPb.collection("signup_verifications").update(record.id, { used: true })
      }
    }

    await createAuditLog({
      action: "signup_verification_confirmed",
      userId: user.id,
      email: user.email,
      metadata: { method: isCode ? "code" : "link" },
    })

    return { success: true, message: "Email verified successfully." }
  } catch (error) {
    console.error("[confirmSignupVerification] Error:", error)
    return { success: false, message: "Failed to verify email. Please try again." }
  }
}

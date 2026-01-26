const MAILCHANNELS_ENDPOINT = "https://api.mailchannels.net/tx/v1/send"

type SendMailPayload = {
    to: string
    subject: string
    html: string
}

async function sendMail({ to, subject, html }: SendMailPayload) {
    const fromEmail = process.env.SMTP_FROM || "no-reply@infinitywanderlust.com"
    const fromName = "Infinity Wanderlust"

    try {
        // Use MailChannels for all environments (edge-compatible)
        const payload = {
            personalizations: [
                {
                    to: [{ email: to }],
                },
            ],
            from: { email: fromEmail, name: fromName },
            subject,
            content: [
                {
                    type: "text/html",
                    value: html,
                },
            ],
        }

        console.log("[sendMail] Sending via MailChannels", {
            to,
            fromEmail,
            subject,
            hasHtml: Boolean(html),
        })

        const response = await fetch(MAILCHANNELS_ENDPOINT, {
            method: "POST",
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const body = await response.text()
            console.error(`[sendMail] MailChannels error ${response.status}: ${body}`)
            throw new Error(`MailChannels error ${response.status}: ${body}`)
        }

        console.log(`[sendMail] Email sent to ${to}`)
        return true
    } catch (error) {
        console.error("[sendMail] Failed to send email:", error)
        throw error
    }
}

interface PasswordResetEmailData {
  to: string
  verificationCode: string
  resetToken: string
  userName: string
}

interface PasswordChangedEmailData {
    to: string
    userName: string
    logoutAll?: boolean
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${data.resetToken}`

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Infinity Wanderlust</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f4f4f4;
            padding: 20px;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .code-box {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .code {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 0;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #64748b;
            text-align: center;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌍 Infinity Wanderlust</div>
            <h1>Password Reset Request</h1>
        </div>

        <p>Hello ${data.userName},</p>

        <p>You have requested to reset your password for your Infinity Wanderlust account. Here are two ways to reset your password:</p>

        <h2>Option 1: Use Verification Code</h2>
        <p>Use this 6-digit verification code to reset your password:</p>

        <div class="code-box">
            <div class="code">${data.verificationCode}</div>
        </div>

        <p>Enter this code on the password reset page to continue.</p>

        <h2>Option 2: Click Reset Link</h2>
        <p>Alternatively, you can click the button below to reset your password directly:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">Reset My Password</a>
        </div>

        <div class="warning">
            <strong>Security Notice:</strong> This link and code will expire in 24 hours. If you didn't request this password reset, please ignore this email.
        </div>

        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>

        <p>Thank you for using Infinity Wanderlust!</p>
        <p>Best regards,<br>The Infinity Wanderlust Team</p>

        <div class="footer">
            <p>This email was sent to ${data.to}. If you have any questions, please contact our support team.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/support" class="link">Visit Support</a></p>
            <p>&copy; 2024 Infinity Wanderlust. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`

        await sendMail({
            to: data.to,
            subject: "Password Reset - Infinity Wanderlust",
            html: htmlTemplate,
        })

        console.log("[sendPasswordResetEmail] Email sent successfully")

        return { success: true, messageId: "mailchannels" }
  } catch (error: any) {
    console.error("[sendPasswordResetEmail] Error sending email:", error)
        throw new Error(`Failed to send password reset email: ${error.message}`)
  }
}

export async function sendPasswordResetConfirmation(email: string, userName: string) {
  try {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Successful - Infinity Wanderlust</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f4f4f4;
            padding: 20px;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #64748b;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌍 Infinity Wanderlust</div>
            <div class="success-icon">✅</div>
            <h1>Password Reset Successful</h1>
        </div>

        <p>Hello ${userName},</p>

        <p>Your password has been successfully reset for your Infinity Wanderlust account.</p>

        <p>If you did not make this change, please contact our support team immediately to secure your account.</p>

        <p>You can now log in to your account with your new password.</p>

        <p>Thank you for using Infinity Wanderlust!</p>
        <p>Best regards,<br>The Infinity Wanderlust Team</p>

        <div class="footer">
            <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
            <p>&copy; 2024 Infinity Wanderlust. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`

        await sendMail({
            to: email,
            subject: "Password Reset Successful - Infinity Wanderlust",
            html: htmlTemplate,
        })

        console.log("[sendPasswordResetConfirmation] Confirmation email sent")

        return { success: true, messageId: "mailchannels" }
  } catch (error: any) {
    console.error("[sendPasswordResetConfirmation] Error sending confirmation email:", error)
    // Don't throw error for confirmation emails - they're not critical
    return { success: false, error: error.message }
  }
}

export async function sendPasswordChangedEmail(data: PasswordChangedEmailData) {
    try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const secureUrl = `${appUrl}/forgot-password?alert=secure-account${data.to ? `&email=${encodeURIComponent(data.to)}` : ''}`

        const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Updated</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #0f172a; background: #f8fafc; padding: 24px; }
        .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
        .title { font-size: 20px; font-weight: 700; margin: 0 0 12px; }
        .muted { color: #475569; margin: 4px 0; }
        .pill { display: inline-block; padding: 6px 12px; background: #ecfdf3; color: #166534; border-radius: 999px; font-weight: 600; margin: 12px 0; }
        .footer { margin-top: 18px; font-size: 13px; color: #64748b; }
        .link { color: #2563eb; text-decoration: none; font-weight: 600; }
        .button { display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:10px 16px; border-radius:8px; font-weight:600; margin-top:12px; }
        .button:hover { background:#1d4ed8; }
    </style>
</head>
<body>
    <div class="card">
        <p class="pill">Security Notice</p>
        <h1 class="title">Your password was updated</h1>
        <p class="muted">Hi ${data.userName || "there"},</p>
        <p class="muted">We wanted to let you know that your Infinity Wanderlust password was changed just now.</p>
        <p class="muted">If this was you, no action is needed.</p>
        <p class="muted">If this wasn't you, secure your account immediately.</p>
        <p class="muted">For extra safety, we've signed out other sessions.</p>

        <a href="${secureUrl}" class="button">Secure Your Account</a>

        <p class="muted" style="margin-top:12px;">This link opens the Forgot Password page with a security notice. Enter your email to receive a code and set a new password. After reset, you can choose to sign out everywhere and log in again.</p>
        <p class="footer">Need help? Reply to this email or <a href="${appUrl}/support" class="link">visit support</a>.</p>
    </div>
</body>
</html>`

        await sendMail({
          to: data.to,
          subject: "Your password was updated",
          html: htmlTemplate,
        })

        console.log("[sendPasswordChangedEmail] Email sent to", data.to)
    } catch (error) {
        console.error("[sendPasswordChangedEmail] Error sending email:", error)
    }
}
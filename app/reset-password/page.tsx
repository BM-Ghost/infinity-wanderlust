"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/lib/translations"
import { PasswordResetSuccess } from "@/components/password-reset-success"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { toast } = useToast()

  const [step, setStep] = useState<'code' | 'password' | 'success'>('code')
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Password validation function
  const validatePassword = (password: string, confirm: string) => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long")
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number")
    }

    if (password && confirm && password !== confirm) {
      errors.push("Passwords do not match")
    }

    return errors
  }

  // Update password validation on change
  const handlePasswordChange = (value: string) => {
    setNewPassword(value)
    setPasswordErrors(validatePassword(value, confirmPassword))
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    setPasswordErrors(validatePassword(newPassword, value))
  }

  useEffect(() => {
    // Get email and token from URL params
    const emailParam = searchParams.get('email')
    const tokenParam = searchParams.get('token')

    if (emailParam) {
      setEmail(emailParam)
    }

    if (tokenParam) {
      setToken(tokenParam)
      setStep('password') // Skip code verification if we have a token
    }
  }, [searchParams])

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      console.log("[handleVerifyCode] CLIENT: Starting verification")
      console.log("[handleVerifyCode] CLIENT: Email:", email)
      console.log("[handleVerifyCode] CLIENT: Code:", code)
      console.log("[handleVerifyCode] CLIENT: Code type:", typeof code)
      console.log("[handleVerifyCode] CLIENT: Code length:", code.length)
      
      // Call the API endpoint instead of server action directly
      const response = await fetch("/api/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      
      const result = await response.json()
      
      console.log("[handleVerifyCode] CLIENT: API response:", result)

      if (result.success) {
        setStep('password')
        toast({
          title: "Code verified",
          description: "Please enter your new password.",
        })
      } else {
        setError(result.message)
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: result.message,
        })
      }
    } catch (err: any) {
      console.error("[handleVerifyCode] CLIENT: Error:", err)
      setError("Failed to verify code. Please try again.")
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Something went wrong.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Final validation check
    const errors = validatePassword(newPassword, confirmPassword)
    if (errors.length > 0) {
      setPasswordErrors(errors)
      return
    }

    setIsLoading(true)

    try {
      console.log("[handleResetPassword] CLIENT: Starting password reset")
      const resetToken = token || code
      console.log("[handleResetPassword] CLIENT: Using token/code:", resetToken?.substring(0, 10) + "...")
      
      // Call the API endpoint instead of server action directly
      const response = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenOrCode: resetToken, newPassword, confirmPassword }),
      })
      
      const result = await response.json()
      console.log("[handleResetPassword] CLIENT: API response:", result)

      if (result.success) {
        // Show success screen instead of redirecting immediately
        setStep('success')
        toast({
          title: "Password reset successful",
          description: "You can now log in with your new password.",
        })
      } else {
        setError(result.message)
        toast({
          variant: "destructive",
          title: "Reset failed",
          description: result.message,
        })
      }
    } catch (err: any) {
      console.error("[handleResetPassword] CLIENT: Error:", err)
      setError("Failed to reset password. Please try again.")
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: "Something went wrong.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="forest-bg min-h-screen">
      <div className="container py-16 flex flex-col items-center">
        {/* Show success screen or form based on step */}
        {step === 'success' ? (
          <PasswordResetSuccess />
        ) : (
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">
                  {step === 'code' ? 'Enter Reset Code' : 'Reset Password'}
                </CardTitle>
                <CardDescription>
                  {step === 'code'
                    ? 'Enter the 6-digit code sent to your email'
                    : 'Enter your new password'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === 'code' ? (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <Input
                        id="code"
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        required
                      />
                    </div>
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    {passwordErrors.length > 0 && (
                      <div className="text-red-600 text-sm space-y-1">
                        {passwordErrors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                      </div>
                    )}
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || passwordErrors.length > 0}
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </form>
                )}
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary hover:underline">
                    Back to Login
                  </Link>
                  {step === 'password' && (
                    <>
                      {" • "}
                      <button
                        onClick={() => setStep('code')}
                        className="text-primary hover:underline"
                      >
                        Enter Different Code
                      </button>
                    </>
                  )}
                </p>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="forest-bg min-h-screen">
        <div className="container py-16 flex flex-col items-center">
          <div className="w-full max-w-md">
            <Card>
              <CardContent className="py-8">
                <div className="text-center">Loading...</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
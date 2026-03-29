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
import { PasswordStrength, isPasswordValid } from "@/components/ui/password-strength"
import { Eye, EyeOff } from "lucide-react"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

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
      const response = await fetch("/api/password-reset/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const result = await response.json()
      if (result.success) {
        setStep('password')
        toast({ title: "Code verified", description: "Please enter your new password." })
      } else {
        setError(result.message)
        toast({ variant: "destructive", title: "Verification failed", description: result.message })
      }
    } catch {
      setError("Failed to verify code. Please try again.")
      toast({ variant: "destructive", title: "Verification failed", description: "Something went wrong." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid(newPassword) || newPassword !== confirmPassword) return

    setIsLoading(true)

    try {
      const resetToken = token || code
      const response = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenOrCode: resetToken, newPassword, confirmPassword, email }),
      })
      const result = await response.json()
      if (result.success) {
        setStep('success')
        toast({ title: "Password reset successful", description: "You can now log in with your new password." })
      } else {
        setError(result.message)
        toast({ variant: "destructive", title: "Reset failed", description: result.message })
      }
    } catch {
      setError("Failed to reset password. Please try again.")
      toast({ variant: "destructive", title: "Reset failed", description: "Something went wrong." })
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
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((s) => !s)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          onClick={() => setShowPassword((s) => !s)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <PasswordStrength password={newPassword} confirmPassword={confirmPassword} />
                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !isPasswordValid(newPassword) || newPassword !== confirmPassword}
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
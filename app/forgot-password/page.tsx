"use client"

import React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/lib/translations"
import { requestPasswordReset } from "@/actions/password-reset"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Prefill email and show security banner when coming from secure link
  const alert = searchParams.get("alert")
  const emailParam = searchParams.get("email")
  const showSecureBanner = alert === "secure-account"
  
  React.useEffect(() => {
    if (emailParam) setEmail(emailParam)
  }, [emailParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await requestPasswordReset(email)

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Password reset code sent",
          description: "Please check your email for the verification code.",
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
      console.error("Forgot password error:", err)
      setError(err.message || "Unable to send reset email. Please try again.")
      toast({
        variant: "destructive",
        title: "Reset failed",
        description: err.message || "Something went wrong.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="forest-bg min-h-screen">
      <div className="container py-16 flex flex-col items-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">{t("forgotPasswordTitle")}</CardTitle>
              <CardDescription>{t("forgotPasswordSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              {showSecureBanner && (
                <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
                  <strong>Security Notice:</strong> We detected a password change. To secure your account, enter your email to receive a verification code, then set a new password on the next screen. After reset, you'll be asked whether to sign out other sessions and you can log in again.
                </div>
              )}
              {success ? (
                <div className="space-y-4">
                  <div className="text-green-600 text-sm text-center">
                    Password reset code sent! Check your email for a 6-digit verification code.
                  </div>
                  <div className="text-sm text-muted-foreground text-center">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button
                      onClick={() => setSuccess(false)}
                      className="text-primary hover:underline"
                    >
                      try again
                    </button>
                  </div>
                  <Button
                    onClick={() => router.push(`/reset-password?email=${encodeURIComponent(email)}`)}
                    className="w-full"
                  >
                    Enter Reset Code
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? t("loading") : "Send Reset Code"}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  {t("backToLogin")}
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

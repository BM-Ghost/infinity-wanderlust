"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/lib/translations"
import { getPocketBase } from "@/lib/pocketbase"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const pb = getPocketBase()
      if (!pb) {
        throw new Error("Password reset service unavailable")
      }

      await pb.collection("users").requestPasswordReset(email)

      setSuccess(true)
      toast({
        title: "Password reset email sent",
        description: "Please check your inbox for the reset link.",
      })
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
              {success ? (
                <p className="text-green-600 text-sm">
                  {t("resetEmailSent") || "If that email is registered, you’ll receive a reset link shortly."}
                </p>
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
                    {isLoading ? t("loading") : t("resetPassword")}
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

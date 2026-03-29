"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useTranslation } from "@/lib/translations"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { signIn, requestVerification } = useAuth()

  // Avoid hydration mismatches by delaying render until client mounts
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Show secure-account toast when arriving with flag
  useEffect(() => {
    if (!mounted) return
    const secure = searchParams.get("secure")
    if (secure === "1") {
      toast({ title: "Your account is secure", description: "You can sign in with your new password." })
    }
  }, [mounted, searchParams])

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNeedsVerification(false)
    setIsLoading(true)

    try {
      const result = await signIn(email, password)

      if (!result.success && result.needsVerification) {
        setNeedsVerification(true)
        setError("Your account is not verified yet. Please verify to continue.")
        localStorage.setItem("pendingVerificationEmail", email)

        try {
          await requestVerification(email)
          toast({
            title: "Verification sent",
            description: "We sent a fresh email with a link and 6-digit code.",
          })
        } catch {
          toast({
            variant: "destructive",
            title: "Could not resend verification",
            description: "You can still continue to the verification page and try again.",
          })
        }
        return
      }

      if (!result.success) {
        throw new Error(result.error || "Invalid email or password. Please try again.")
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })

      setTimeout(() => {
        router.push("/")
      }, 300)
    } catch (error: any) {
      setError("Invalid email or password. Please try again.")
      console.error("Login error:", error)

      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setError("Please enter your email first.")
      return
    }

    setIsResendingVerification(true)
    try {
      await requestVerification(email.trim())
      localStorage.setItem("pendingVerificationEmail", email.trim())
      toast({
        title: "Verification sent",
        description: "Check your email for both the verification link and code.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to resend verification email. Please try again.")
    } finally {
      setIsResendingVerification(false)
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="forest-bg min-h-screen">
      <div className="container py-16 flex flex-col items-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">{t("loginTitle")}</CardTitle>
              <CardDescription>{t("loginSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t("password")}</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    {t("rememberMe")}
                  </Label>
                </div>
                {error && (
                  <div className="mb-4 text-red-600 text-sm">
                    {error}
                  </div>
                )}
                {needsVerification && (
                  <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                    <p className="mb-2 font-medium">Verify your email to continue</p>
                    <p className="mb-3">
                      Please click the verification link in your inbox, or enter the 6-digit code on the verification page.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                      >
                        {isResendingVerification ? "Sending..." : "Resend Code"}
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={() => router.push(`/verify?email=${encodeURIComponent(email.trim())}&source=login-unverified`)}
                      >
                        Verify Now
                      </Button>
                    </div>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t("loading") : t("signIn")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                {t("dontHaveAccount")}{" "}
                <Link href="/register" className="text-primary hover:underline">
                  {t("signUp")}
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

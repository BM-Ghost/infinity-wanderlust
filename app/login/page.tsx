"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/lib/translations"
import { getPocketBase } from "@/lib/pocketbase"

export default function LoginPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { signIn } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Direct PocketBase authentication
      const pb = getPocketBase()
      if (!pb) {
        throw new Error("Authentication service unavailable")
      }

      console.log("Attempting to sign in with:", email)

      // Authenticate directly with PocketBase
      await pb.collection("users").authWithPassword(email, password)

      // Save auth data to localStorage
      localStorage.setItem(
        "pocketbase_auth",
        JSON.stringify({
          token: pb.authStore.token,
          model: pb.authStore.model,
        }),
      )

      console.log("Authentication successful")

      // Show success message
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })

      // Use router.push instead of window.location for smoother transition
      setTimeout(() => {
        router.push("/")
      }, 300)
    } catch (error: any) {
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
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
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

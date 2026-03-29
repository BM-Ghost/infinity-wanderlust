"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Loader2, AlertCircle, X, User, Mail, Lock, CheckCircle, Eye, EyeOff } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { PasswordStrength, isPasswordValid } from "@/components/ui/password-strength"

// Hunter.io API key
const hunterApiKey = "572557b3f832258066fb2fe92f863a806e13c57f"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { signUp } = useAuth()

  // Form state
  const [credentials, setCredentials] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
  })

  // UI state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setCredentials((prev) => ({ ...prev, [id]: value }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid(credentials.password)) {
      setError("Please make sure your password meets all the requirements.")
      return
    }

    if (credentials.password !== credentials.passwordConfirm) {
      setError("Passwords don't match.")
      return
    }

    setIsLoading(true)

    try {
      // Skip Hunter.io verification for now to simplify the process

      // Register user with PocketBase
      try {
        await signUp(
          credentials.username,
          credentials.email,
          credentials.password,
          credentials.passwordConfirm,
          credentials.name,
        )

        router.push(`/verify?email=${encodeURIComponent(credentials.email)}`)
        return
      } catch (signUpError: any) {
        console.error("Sign up error:", signUpError)

        // Display a more user-friendly error message
        const msg = signUpError.message || ""
        if (
          msg.includes("email") &&
          (msg.toLowerCase().includes("already in use") || msg.toLowerCase().includes("not unique") || msg.toLowerCase().includes("already exists"))
        ) {
          setError("This email is already registered. Please use a different email or try to log in.")
        } else if (
          msg.includes("username") &&
          (msg.toLowerCase().includes("not unique") || msg.toLowerCase().includes("already exists") || msg.toLowerCase().includes("already in use"))
        ) {
          setError("This username is already taken. Please choose a different username.")
        } else {
          setError(msg || "Failed to create account. Please try again with different information.")
        }

        setIsLoading(false)
        return
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      setError(error.message || "Failed to create account. Please try again with different information.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="alps-bg min-h-screen">
      <div className="container py-16 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <Card className="overflow-hidden shadow-lg">
            <div className="flex flex-col md:flex-row">
              {/* Left side - Image and info */}
              <div className="w-full md:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 flex flex-col items-center justify-center p-8 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-4 mx-auto">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Join Our Community</h2>
                  <p className="text-muted-foreground mb-6">
                    Share your travel experiences and connect with fellow adventurers
                  </p>
                </div>

                <div className="space-y-4 text-left w-full max-w-xs">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm">Share your travel photos and stories</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm">Connect with like-minded travelers</p>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm">Discover new destinations and adventures</p>
                  </div>
                </div>
              </div>

              {/* Right side - Form */}
              <div className="w-full md:w-1/2 p-8">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <AlertCircle className="h-4 w-4 mt-1" />
                        <AlertDescription className="ml-2">{error}</AlertDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setError(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Alert>
                )}

                {!error ? (
                  <>
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                      <CardDescription>Fill in your details to get started</CardDescription>
                    </CardHeader>

                    {isLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">Creating your account...</p>
                        </div>
                      </div>
                    ) : (
                      <CardContent className="px-0 pb-0">
                        <form onSubmit={handleSubmit} className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="username" className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              Username
                            </Label>
                            <Input
                              id="username"
                              value={credentials.username}
                              onChange={handleChange}
                              required
                              autoComplete="username"
                              className="bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center">
                              <User className="h-4 w-4 mr-2 text-muted-foreground" />
                              Full Name
                            </Label>
                            <Input
                              id="name"
                              value={credentials.name}
                              onChange={handleChange}
                              required
                              autoComplete="name"
                              className="bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="name@example.com"
                              value={credentials.email}
                              onChange={handleChange}
                              required
                              autoComplete="email"
                              className="bg-background/50"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password" className="flex items-center">
                              <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                              Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                                className="bg-background/50 pr-10"
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
                            <PasswordStrength
                              password={credentials.password}
                              confirmPassword={credentials.passwordConfirm}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="passwordConfirm" className="flex items-center">
                              <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                              Confirm Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="passwordConfirm"
                                type={showPassword ? "text" : "password"}
                                value={credentials.passwordConfirm}
                                onChange={handleChange}
                                required
                                autoComplete="new-password"
                                className="bg-background/50 pr-10"
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

                          <Button
                            type="submit"
                            className="w-full mt-6"
                            disabled={!isPasswordValid(credentials.password) || credentials.password !== credentials.passwordConfirm}
                          >
                            Create Account
                          </Button>
                        </form>

                        <Separator className="my-6" />

                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="text-primary font-medium hover:underline">
                              Sign In
                            </Link>
                          </p>
                        </div>
                      </CardContent>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

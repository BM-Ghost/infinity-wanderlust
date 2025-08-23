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
import { Loader2, AlertCircle, X, User, Mail, Lock, CheckCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// Hunter.io API key
const hunterApiKey = "572557b3f832258066fb2fe92f863a806e13c57f"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { signUp, requestVerification } = useAuth()

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
  const [showVerification, setShowVerification] = useState(false)
  const [timer, setTimer] = useState(120)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordFeedback, setPasswordFeedback] = useState("")

  // Timer for resending verification email
  useEffect(() => {
    let countdown: NodeJS.Timeout | undefined

    if (showVerification && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }

    return () => {
      if (countdown) clearInterval(countdown)
    }
  }, [showVerification, timer])

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setCredentials((prev) => ({ ...prev, [id]: value }))

    // Check password strength
    if (id === "password") {
      checkPasswordStrength(value)
    }
  }

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0)
      setPasswordFeedback("")
      return
    }

    let strength = 0
    let feedback = ""

    // Length check
    if (password.length >= 8) {
      strength += 1
    } else {
      feedback = "Password should be at least 8 characters"
    }

    // Contains uppercase
    if (/[A-Z]/.test(password)) {
      strength += 1
    }

    // Contains lowercase
    if (/[a-z]/.test(password)) {
      strength += 1
    }

    // Contains numbers
    if (/[0-9]/.test(password)) {
      strength += 1
    }

    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) {
      strength += 1
    }

    setPasswordStrength(strength)

    if (strength < 3 && !feedback) {
      feedback = "Consider adding uppercase, numbers, or special characters"
    } else if (strength >= 3) {
      feedback = "Strong password"
    }

    setPasswordFeedback(feedback)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (credentials.password !== credentials.passwordConfirm) {
      setError("Passwords don't match. Please make sure your passwords match.")
      return
    }

    if (credentials.password.length < 8) {
      setError("Password must be at least 8 characters long.")
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

        // Show verification screen
        setShowVerification(true)

        // Store email in localStorage for verification page
        localStorage.setItem("pendingVerificationEmail", credentials.email)
      } catch (signUpError: any) {
        console.error("Sign up error:", signUpError)

        // Display a more user-friendly error message
        if (signUpError.message.includes("email already exists")) {
          setError("This email is already registered. Please use a different email or try to log in.")
        } else if (signUpError.message.includes("username already exists")) {
          setError("This username is already taken. Please choose a different username.")
        } else {
          setError(signUpError.message || "Failed to create account. Please try again with different information.")
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

  // Handle verification button click
  const handleVerification = () => {
    toast({
      title: "Thank you for verifying!",
      description: "You can now log in to your account.",
    })
    router.push("/login")
  }

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      await requestVerification(credentials.email)
      setTimer(120)
      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification link.",
      })
    } catch (error: any) {
      console.error("Failed to resend verification:", error)
      toast({
        variant: "destructive",
        title: "Failed to resend verification email",
        description: error.message || "Please try again later.",
      })
    }
  }

  // Render password strength indicator
  const renderPasswordStrength = () => {
    if (!credentials.password) return null

    return (
      <div className="mt-1">
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full ${
                passwordStrength >= level ? (passwordStrength < 3 ? "bg-orange-500" : "bg-green-500") : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p
          className={`text-xs ${
            passwordStrength < 3
              ? "text-orange-500"
              : passwordStrength >= 3
                ? "text-green-500"
                : "text-muted-foreground"
          }`}
        >
          {passwordFeedback}
        </p>
      </div>
    )
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

                {!error && !showVerification ? (
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
                            <Input
                              id="password"
                              type="password"
                              value={credentials.password}
                              onChange={handleChange}
                              required
                              minLength={8}
                              autoComplete="new-password"
                              className="bg-background/50"
                            />
                            {renderPasswordStrength()}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="passwordConfirm" className="flex items-center">
                              <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                              Confirm Password
                            </Label>
                            <Input
                              id="passwordConfirm"
                              type="password"
                              value={credentials.passwordConfirm}
                              onChange={handleChange}
                              required
                              minLength={8}
                              autoComplete="new-password"
                              className="bg-background/50"
                            />
                          </div>

                          <Button type="submit" className="w-full mt-6">
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
                ) : (
                  !error &&
                  showVerification && (
                    <div className="flex flex-col items-center py-6">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                        <Mail className="h-8 w-8 text-primary" />
                      </div>

                      <CardTitle className="text-2xl font-bold mb-2">Verify Your Email</CardTitle>
                      <CardDescription className="text-center mb-6">
                        We've sent a verification link to <span className="font-medium">{credentials.email}</span>.
                        Please check your inbox and verify your email address.
                      </CardDescription>

                      <Button onClick={handleVerification} className="w-full mb-6">
                        I've Verified My Email
                      </Button>

                      <div className="text-center text-sm text-muted-foreground w-full">
                        {timer > 0 ? (
                          <p>
                            You can resend the email in {Math.floor(timer / 60)}:{timer % 60 < 10 ? "0" : ""}
                            {timer % 60}
                          </p>
                        ) : (
                          <Button variant="outline" onClick={resendVerificationEmail} className="mt-2">
                            Resend Verification Email
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

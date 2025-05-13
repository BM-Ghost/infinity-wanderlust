"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { getPocketBase } from "@/lib/pocketbase"
import { AlertCircle, CheckCircle, Mail, Loader2 } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { requestVerification } = useAuth()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "error">("pending")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [timer, setTimer] = useState(120)

  // Initialize email from localStorage if available
  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingVerificationEmail")
    if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [])

  // Timer for resending verification email
  useEffect(() => {
    let countdown: NodeJS.Timeout | undefined

    if (timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1)
      }, 1000)
    }

    return () => {
      if (countdown) clearInterval(countdown)
    }
  }, [timer])

  // Check for token in URL (for email verification links)
  useEffect(() => {
    const token = searchParams.get("token")
    const verificationToken = searchParams.get("verification")

    if (token || verificationToken) {
      // Handle verification token
      handleVerificationToken(token || (verificationToken as string))
    }
  }, [searchParams])

  // Handle verification token from email link
  const handleVerificationToken = async (token: string) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const pb = getPocketBase()
      await pb.collection("users").confirmVerification(token)

      setVerificationStatus("success")
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified. You can now log in.",
      })

      // Clear the pending email from localStorage
      localStorage.removeItem("pendingVerificationEmail")
    } catch (error: any) {
      console.error("Verification error:", error)
      setVerificationStatus("error")
      setErrorMessage(error.message || "Failed to verify email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle resend verification email
  const handleResendVerification = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address.",
      })
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      await requestVerification(email)
      setTimer(120)
      toast({
        title: "Verification email sent",
        description: "Please check your inbox for the verification link.",
      })
    } catch (error: any) {
      console.error("Failed to resend verification:", error)
      setErrorMessage(error.message || "Failed to send verification email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle manual verification (user clicks "I've verified my email")
  const handleManualVerification = () => {
    toast({
      title: "Thank you!",
      description: "You can now proceed to login.",
    })
    router.push("/login")
  }

  return (
    <div className="alps-bg min-h-screen">
      <Navbar />

      <div className="container py-16 flex flex-col items-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">
                {verificationStatus === "success" ? "Email Verified" : "Verify Your Email"}
              </CardTitle>
              <CardDescription>
                {verificationStatus === "success"
                  ? "Your email has been verified successfully."
                  : "Please check your inbox for a verification link."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {errorMessage && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              {isLoading && (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
                  <p className="text-center">Verifying your email...</p>
                </div>
              )}

              {!isLoading && verificationStatus === "success" && (
                <div className="flex flex-col items-center py-8">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <p className="text-center mb-6">
                    Your email has been verified successfully. You can now log in to your account.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
              )}

              {!isLoading && verificationStatus === "pending" && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center py-4">
                    <Mail className="h-16 w-16 text-primary mb-4" />
                    <p className="text-center mb-6">
                      We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the
                      verification link.
                    </p>
                    <Button onClick={handleManualVerification} className="w-full mb-4">
                      I've Verified My Email
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      {timer > 0 ? (
                        <span>
                          You can resend the email in {Math.floor(timer / 60)}:{timer % 60 < 10 ? "0" : ""}
                          {timer % 60}
                        </span>
                      ) : (
                        "Didn't receive the email? You can resend it now."
                      )}
                    </p>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleResendVerification}
                      disabled={timer > 0 || isLoading}
                    >
                      Resend Verification Email
                    </Button>
                  </div>
                </div>
              )}

              {!isLoading && verificationStatus === "error" && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center py-4">
                    <AlertCircle className="h-16 w-16 text-destructive mb-4" />
                    <p className="text-center mb-6">
                      We couldn't verify your email. The verification link may have expired or is invalid.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Please enter your email to request a new verification link:
                    </p>

                    <div className="space-y-4">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Button className="w-full" onClick={handleResendVerification} disabled={isLoading}>
                        Request New Verification Link
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}

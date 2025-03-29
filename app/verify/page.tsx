"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/components/auth-provider"
import { useTranslation } from "@/lib/translations"
import { CheckCircle, XCircle, MailCheck, Loader2 } from "lucide-react"

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const { toast } = useToast()
  const { resendVerification } = useAuth()

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  // Check for token in URL (for email verification)
  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token")

      if (!token) {
        // No token, show resend verification UI
        const email = localStorage.getItem("pendingVerificationEmail")
        if (email) {
          setPendingEmail(email)
          setStatus("error")
          setMessage("Please verify your email to continue.")
        } else {
          setStatus("error")
          setMessage("No verification token found.")
        }
        return
      }

      try {
        // In a real app, you would verify the token with your backend
        // For this demo, we'll simulate a successful verification
        await new Promise((resolve) => setTimeout(resolve, 1500))

        setStatus("success")
        setMessage("Your email has been successfully verified.")

        // Clear any pending verification email from localStorage
        localStorage.removeItem("pendingVerificationEmail")
      } catch (error) {
        console.error("Verification error:", error)
        setStatus("error")
        setMessage("Failed to verify your email. The token may be invalid or expired.")
      }
    }

    verifyEmail()
  }, [searchParams])

  const handleResendVerification = async () => {
    if (!pendingEmail) return

    setIsResending(true)
    try {
      const success = await resendVerification(pendingEmail)
      if (success) {
        toast({
          title: "Verification email sent",
          description: "Please check your inbox for the verification link.",
        })
      }
    } catch (error) {
      console.error("Failed to resend verification:", error)
      toast({
        variant: "destructive",
        title: "Failed to resend verification email",
        description: "Please try again later.",
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="beach-bg min-h-screen">
      <Navbar />

      <div className="container py-16 flex flex-col items-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
              <CardDescription>Verify your email address to continue</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              {status === "loading" && (
                <div className="text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Verifying your email...</p>
                  <p className="text-sm text-muted-foreground mt-2">This will only take a moment.</p>
                </div>
              )}

              {status === "success" && (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Verification Successful</p>
                  <p className="text-sm text-muted-foreground mt-2">{message}</p>
                </div>
              )}

              {status === "error" && pendingEmail && (
                <div className="text-center">
                  <MailCheck className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">Verification Required</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-6">
                    We've sent a verification email to <strong>{pendingEmail}</strong>. Please check your inbox and
                    click the verification link.
                  </p>
                  <Button onClick={handleResendVerification} disabled={isResending}>
                    {isResending ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </div>
              )}

              {status === "error" && !pendingEmail && (
                <div className="text-center">
                  <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-medium">Verification Failed</p>
                  <p className="text-sm text-muted-foreground mt-2">{message}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Link href="/login">
                <Button variant="outline">Return to Login</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  )
}


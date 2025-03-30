// Completely rewrite the auth provider with a much simpler implementation
"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import PocketBase from "pocketbase"

// Define types
type User = {
  id: string
  email: string
  username: string
  name?: string
  avatarUrl?: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; needsVerification?: boolean; error?: string }>
  signUp: (username: string, email: string, password: string, passwordConfirm: string, name: string) => Promise<void>
  signOut: () => void
  resetPassword: (email: string) => Promise<void>
  resendVerification: (email: string) => Promise<boolean>
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null)

// Create PocketBase instance (client-side only)
const createPocketBase = () => {
  if (typeof window === "undefined") return null
  return new PocketBase("https://remain-faceghost.pockethost.io")
}

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [pb, setPb] = useState<PocketBase | null>(null)

  // Initialize PocketBase on client-side only
  useEffect(() => {
    const pb = createPocketBase()
    setPb(pb)

    if (!pb) {
      setIsLoading(false)
      return
    }

    // Try to load auth from localStorage
    try {
      const authData = localStorage.getItem("pocketbase_auth")
      if (authData) {
        const { token, model } = JSON.parse(authData)
        pb.authStore.save(token, model)
      }
    } catch (e) {
      console.error("Error loading auth data:", e)
      localStorage.removeItem("pocketbase_auth")
    }

    // Set initial user
    if (pb.authStore.isValid && pb.authStore.model) {
      const model = pb.authStore.model
      setUser({
        id: model.id,
        email: model.email,
        username: model.username,
        name: model.name,
        avatarUrl: model.avatar
          ? `https://remain-faceghost.pockethost.io/api/files/${model.collectionId}/${model.id}/${model.avatar}`
          : undefined,
      })
    }

    setIsLoading(false)
  }, [])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    if (!pb) return { success: false, error: "Authentication service unavailable" }

    setIsLoading(true)
    try {
      await pb.collection("users").authWithPassword(email, password)

      // Check if verified
      if (pb.authStore.model && !pb.authStore.model.verified) {
        pb.authStore.clear()

        try {
          await pb.collection("users").requestVerification(email)
        } catch (e) {
          console.error("Failed to resend verification:", e)
        }

        localStorage.setItem("pendingVerificationEmail", email)
        return { success: false, needsVerification: true }
      }

      // Save auth data
      localStorage.setItem(
        "pocketbase_auth",
        JSON.stringify({
          token: pb.authStore.token,
          model: pb.authStore.model,
        }),
      )

      // Update user state
      if (pb.authStore.model) {
        const model = pb.authStore.model
        setUser({
          id: model.id,
          email: model.email,
          username: model.username,
          name: model.name,
          avatarUrl: model.avatar
            ? `https://remain-faceghost.pockethost.io/api/files/${model.collectionId}/${model.id}/${model.avatar}`
            : undefined,
        })
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })

      router.push("/")
      return { success: true }
    } catch (error: any) {
      console.error("Sign in error:", error)

      // Check for verification errors
      if (
        error.message &&
        (error.message.includes("not verified") ||
          error.message.includes("verification") ||
          error.message.includes("verify"))
      ) {
        localStorage.setItem("pendingVerificationEmail", email)

        try {
          await pb.collection("users").requestVerification(email)
        } catch (e) {
          console.error("Failed to resend verification:", e)
        }

        return { success: false, needsVerification: true }
      }

      return {
        success: false,
        error: error.message || "Authentication failed",
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign up function
  const signUp = async (username: string, email: string, password: string, passwordConfirm: string, name: string) => {
    if (!pb) throw new Error("Authentication service unavailable")

    setIsLoading(true)
    try {
      const userData = {
        username,
        email,
        emailVisibility: true,
        password,
        passwordConfirm,
        name,
      }

      const record = await pb.collection("users").create(userData)

      if (record) {
        try {
          await pb.collection("users").requestVerification(email)
        } catch (e) {
          console.error("Failed to send verification:", e)
        }
      }

      localStorage.setItem("pendingVerificationEmail", email)

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      })
    } catch (error: any) {
      console.error("Sign up error:", error)

      let errorMessage = "Registration failed. Please try again."

      if (error.data) {
        const validationErrors = Object.entries(error.data)
          .map(([field, fieldError]: [string, any]) => {
            return `${field}: ${fieldError.message}`
          })
          .join(", ")

        if (validationErrors) {
          errorMessage = `Validation errors: ${validationErrors}`
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: errorMessage,
      })

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out function
  const signOut = () => {
    if (pb) {
      pb.authStore.clear()
    }

    localStorage.removeItem("pocketbase_auth")
    setUser(null)

    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    })

    router.push("/")
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    if (!pb) throw new Error("Authentication service unavailable")

    setIsLoading(true)
    try {
      await pb.collection("users").requestPasswordReset(email)

      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      })
    } catch (error: any) {
      console.error("Password reset error:", error)

      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error.message || "Please try again later.",
      })

      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Resend verification function
  const resendVerification = async (email: string) => {
    if (!pb) throw new Error("Authentication service unavailable")

    setIsLoading(true)
    try {
      await pb.collection("users").requestVerification(email)

      toast({
        title: "Verification email sent",
        description: "Please check your email for the verification link.",
      })

      return true
    } catch (error: any) {
      console.error("Verification error:", error)

      toast({
        variant: "destructive",
        title: "Failed to resend verification email",
        description: error.message || "Please try again later.",
      })

      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Create value object
  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    resendVerification,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Export hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}


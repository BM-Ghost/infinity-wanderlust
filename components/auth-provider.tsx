"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { getPocketBase, getCurrentUser } from "@/lib/pocketbase"

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
  signIn: (email: string, password: string) => Promise<void>
  signUp: (username: string, email: string, password: string, passwordConfirm: string, name: string) => Promise<void>
  signOut: () => void
  resetPassword: (email: string) => Promise<void>
  checkUserExists: (username: string, email: string) => Promise<{ exists: boolean; message?: string }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
  resetPassword: async () => {},
  checkUserExists: async () => ({ exists: false }),
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const pb = getPocketBase()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const currentUser = getCurrentUser()
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            username: currentUser.username,
            name: currentUser.name,
            avatarUrl: currentUser.avatar
              ? `https://remain-faceghost.pockethost.io/api/files/${currentUser.collectionId}/${currentUser.id}/${currentUser.avatar}`
              : undefined,
          })
        }
      } catch (error) {
        console.error("Authentication error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Subscribe to auth state changes
    pb.authStore.onChange(() => {
      const currentUser = getCurrentUser()
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.username,
          name: currentUser.name,
          avatarUrl: currentUser.avatar
            ? `https://remain-faceghost.pockethost.io/api/files/${currentUser.collectionId}/${currentUser.id}/${currentUser.avatar}`
            : undefined,
        })
      } else {
        setUser(null)
      }
    })
  }, [])

  // Check if a user with the given username or email already exists
  const checkUserExists = async (username: string, email: string) => {
    try {
      // Check for existing username
      try {
        await pb.collection("users").getFirstListItem(`username="${username}"`)
        return {
          exists: true,
          message: "Username already exists. Please choose a different username.",
        }
      } catch (error) {
        // Username doesn't exist, continue checking email
      }

      // Check for existing email
      try {
        await pb.collection("users").getFirstListItem(`email="${email}"`)
        return {
          exists: true,
          message: "Email already exists. Please use a different email or sign in.",
        }
      } catch (error) {
        // Email doesn't exist either, user can be created
        return { exists: false }
      }
    } catch (error) {
      console.error("Error checking if user exists:", error)
      return { exists: false } // Assume user doesn't exist if there's an error
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await pb.collection("users").authWithPassword(email, password)

      // Save auth data to local storage
      localStorage.setItem(
        "pocketbase_auth",
        JSON.stringify({
          token: pb.authStore.token,
          model: pb.authStore.model,
        }),
      )

      const currentUser = getCurrentUser()
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.username,
          name: currentUser.name,
          avatarUrl: currentUser.avatar
            ? `https://remain-faceghost.pockethost.io/api/files/${currentUser.collectionId}/${currentUser.id}/${currentUser.avatar}`
            : undefined,
        })
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Sign in error:", error)

      let errorMessage = "Please check your credentials and try again."

      // Handle specific error cases
      if (error.status === 400) {
        errorMessage = "Invalid email or password."
      } else if (error.status === 403) {
        errorMessage = "Your account is not verified. Please check your email."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (username: string, email: string, password: string, passwordConfirm: string, name: string) => {
    setIsLoading(true)
    try {
      // First check if user already exists
      const userExists = await checkUserExists(username, email)
      if (userExists.exists) {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: userExists.message || "User already exists.",
        })
        setIsLoading(false)
        return
      }

      // Create the user data object with all required fields
      const formData = new FormData()
      formData.append("username", username)
      formData.append("email", email)
      formData.append("emailVisibility", "true")
      formData.append("password", password)
      formData.append("passwordConfirm", passwordConfirm)
      formData.append("name", name)

      // Create the user record
      const record = await pb.collection("users").create(formData)

      // Auto sign in after registration
      await pb.collection("users").authWithPassword(email, password)

      // Save auth data to local storage
      localStorage.setItem(
        "pocketbase_auth",
        JSON.stringify({
          token: pb.authStore.token,
          model: pb.authStore.model,
        }),
      )

      const currentUser = getCurrentUser()
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          username: currentUser.username,
          name: currentUser.name,
          avatarUrl: currentUser.avatar
            ? `https://remain-faceghost.pockethost.io/api/files/${currentUser.collectionId}/${currentUser.id}/${currentUser.avatar}`
            : undefined,
        })
      }

      toast({
        title: "Account created!",
        description: "Your account has been successfully created.",
      })

      router.push("/")
    } catch (error: any) {
      console.error("Sign up error details:", error)

      // Extract detailed validation errors if available
      let errorMessage = "Registration failed. Please try again."

      if (error.data && typeof error.data === "object") {
        // Handle validation errors from PocketBase
        const validationErrors = Object.entries(error.data)
          .map(([field, fieldError]: [string, any]) => {
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1)
            return `${fieldName}: ${fieldError.message}`
          })
          .join(", ")

        if (validationErrors) {
          errorMessage = validationErrors
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    pb.authStore.clear()
    localStorage.removeItem("pocketbase_auth")
    setUser(null)
    router.push("/")
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    })
  }

  const resetPassword = async (email: string) => {
    setIsLoading(true)
    try {
      await pb.collection("users").requestPasswordReset(email)
      toast({
        title: "Password reset email sent",
        description: "Check your email for instructions to reset your password.",
      })
    } catch (error: any) {
      console.error("Password reset error:", error)

      let errorMessage = "Please try again later."

      if (error.status === 400) {
        errorMessage = "Email not found. Please check your email address."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, resetPassword, checkUserExists }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)


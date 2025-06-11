"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getPocketBase } from "@/lib/pocketbase"

// Update the User type to include all fields from the API
type User = {
  id: string
  email: string
  username: string
  name?: string
  avatarUrl?: string
  bio?: string
  about?: string
  Links?: string
  location?: string
  auth_number?: number
  followers?: string[]
  following?: string[]
  created: string
  updated: string
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; needsVerification?: boolean; error?: string }>
  signUp: (username: string, email: string, password: string, passwordConfirm: string, name?: string) => Promise<void>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (password: string, passwordConfirm: string, resetToken: string) => Promise<void>
  refreshUser: () => Promise<void>
  requestVerification: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from PocketBase
  useEffect(() => {
    const pb = getPocketBase()

    // Set initial user state
    if (pb?.authStore.isValid) {
      const authModel = pb.authStore.model
      if (authModel) {
        setUser({
          id: authModel.id,
          email: authModel.email,
          username: authModel.username,
          name: authModel.name,
          avatarUrl: authModel.avatar
            ? `https://remain-faceghost.pockethost.io/api/files/${authModel.collectionId}/${authModel.id}/${authModel.avatar}`
            : undefined,
          bio: authModel.bio,
          about: authModel.about,
          Links: authModel.Links,
          location: authModel.location,
          auth_number: authModel.auth_number,
          followers: authModel.followers,
          following: authModel.following,
          created: authModel.created,
          updated: authModel.updated,
        })
      }
    }

    setIsLoading(false)

    // Listen for auth state changes
    pb?.authStore.onChange(() => {
      if (pb && pb.authStore.isValid && pb.authStore.model) {
        const authModel = pb.authStore.model
        setUser({
          id: authModel.id,
          email: authModel.email,
          username: authModel.username,
          name: authModel.name,
          avatarUrl: authModel.avatar
            ? `https://remain-faceghost.pockethost.io/api/files/${authModel.collectionId}/${authModel.id}/${authModel.avatar}`
            : undefined,
          bio: authModel.bio,
          about: authModel.about,
          Links: authModel.Links,
          location: authModel.location,
          auth_number: authModel.auth_number,
          followers: authModel.followers,
          following: authModel.following,
          created: authModel.created,
          updated: authModel.updated,
        })
      } else {
        setUser(null)
      }
    })
  }, [])

  // Sign in with email and password
  const signIn = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; needsVerification?: boolean; error?: string }> => {
    const pb = getPocketBase()

    if (!pb) {
      return { success: false, error: "Authentication service unavailable" }
    }

    try {
      const authData = await pb.collection("users").authWithPassword(email, password)

      // Save auth data to localStorage
      localStorage.setItem(
        "pocketbase_auth",
        JSON.stringify({
          token: pb.authStore.token,
          model: pb.authStore.model,
        }),
      )

      // Check if the user is verified (if your PocketBase has verification enabled)
      if (authData.record && !authData.record.verified) {
        pb.authStore.clear()
        return { success: false, needsVerification: true }
      }

      return { success: true }
    } catch (error: any) {
      console.error("Authentication error:", error)

      // Check if this might be a verification issue
      if (error.status === 400 && error.message.includes("verification")) {
        return { success: false, needsVerification: true }
      }

      return { success: false, error: error.message || "Failed to sign in" }
    }
  }

  // Request email verification
  const requestVerification = async (email: string) => {
    const pb = getPocketBase()

    try {
      await pb?.collection("users").requestVerification(email)
      console.log("Verification email sent to:", email)
    } catch (error: any) {
      console.error("Failed to send verification email:", error)
      throw new Error(error.message || "Failed to send verification email")
    }
  }

  // Sign up with email and password - SIMPLIFIED to focus on essential fields
  const signUp = async (username: string, email: string, password: string, passwordConfirm: string, name?: string) => {
    try {
      const pb = getPocketBase()

      if (!pb) {
        throw new Error("PocketBase connection failed")
      }

      console.log("Attempting to register with:", {
        username,
        email,
        name: name || "",
      })

      // Create a minimal user data object with only the essential fields
      const data = {
        username,
        email,
        password,
        passwordConfirm,
        name: name || "",
      }

      console.log("Sending registration data:", JSON.stringify(data))

      try {
        // Create the user using the SDK with minimal fields
        const record = await pb.collection("users").create(data)
        console.log("User created successfully:", record)

        // Send verification email using the SDK method
        await pb.collection("users").requestVerification(email)
        console.log("Verification email sent to:", email)

        // Store email in localStorage for verification page
        localStorage.setItem("pendingVerificationEmail", email)
      } catch (createError: any) {
        console.error("PocketBase create error:", createError)

        // Log detailed error information
        if (createError.data) {
          console.error("Error data:", JSON.stringify(createError.data))
        }

        if (createError.response) {
          console.error("Error response:", createError.response)
        }

        if (createError.status) {
          console.error("Error status:", createError.status)
        }

        if (createError.url) {
          console.error("Request URL:", createError.url)
        }

        throw new Error(createError.message || "Failed to create record")
      }
    } catch (error: any) {
      console.error("Registration error details:", error)

      // Extract detailed error information
      let errorMessage = "Failed to create user account"

      if (error.data && error.data.data) {
        // Extract field-specific errors
        const fieldErrors = Object.entries(error.data.data)
          .map(([field, message]) => `${field}: ${message}`)
          .join(", ")

        if (fieldErrors) {
          errorMessage = fieldErrors
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      throw new Error(errorMessage)
    }
  }

  // Sign out
  const signOut = () => {
    const pb = getPocketBase()
    pb?.authStore.clear()
  }

  // Request password reset
  const requestPasswordReset = async (email: string) => {
    const pb = getPocketBase()

    try {
      await pb?.collection("users").requestPasswordReset(email)
    } catch (error: any) {
      console.error("Password reset request error:", error)
      throw new Error(error.message || "Failed to request password reset")
    }
  }

  // Reset password with token
  const resetPassword = async (password: string, passwordConfirm: string, resetToken: string) => {
    const pb = getPocketBase()

    try {
      await pb?.collection("users").confirmPasswordReset(resetToken, password, passwordConfirm)
    } catch (error: any) {
      console.error("Password reset error:", error)
      throw new Error(error.message || "Failed to reset password")
    }
  }

  // Update the refreshUser function to better handle user data
  const refreshUser = async () => {
    const pb = getPocketBase()

    if (pb?.authStore.isValid && pb.authStore.model) {
      try {
        const userId = pb.authStore.model.id
        const updatedUser = await pb.collection("users").getOne(userId)

        // Update the auth store with the latest user data
        pb.authStore.save(pb.authStore.token, updatedUser)

        setUser({
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          name: updatedUser.name,
          avatarUrl: updatedUser.avatar
            ? `https://remain-faceghost.pockethost.io/api/files/${updatedUser.collectionId}/${updatedUser.id}/${updatedUser.avatar}`
            : undefined,
          bio: updatedUser.bio,
          about: updatedUser.about,
          Links: updatedUser.Links,
          location: updatedUser.location,
          auth_number: updatedUser.auth_number,
          followers: updatedUser.followers,
          following: updatedUser.following,
          created: updatedUser.created,
          updated: updatedUser.updated,
        })

        // Also update localStorage
        localStorage.setItem(
          "pocketbase_auth",
          JSON.stringify({
            token: pb.authStore.token,
            model: updatedUser,
          }),
        )
      } catch (error) {
        console.error("Error refreshing user data:", error)
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        requestPasswordReset,
        resetPassword,
        refreshUser,
        requestVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

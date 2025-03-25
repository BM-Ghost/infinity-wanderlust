import PocketBase from "pocketbase"

// Create a single PocketBase instance to use throughout the app
let pb: PocketBase

// Initialize PocketBase in a way that works with Next.js (client and server)
export function getPocketBase() {
  if (typeof window !== "undefined") {
    // Client-side
    if (!pb) {
      pb = new PocketBase("https://remain-faceghost.pockethost.io")

      // Load auth data from local storage
      const authData = localStorage.getItem("pocketbase_auth")
      if (authData) {
        try {
          const { token, model } = JSON.parse(authData)
          pb.authStore.save(token, model)

          // Check if the token is valid
          pb.authStore.isValid && console.log("Authenticated as:", pb.authStore.model?.name)
        } catch (error) {
          console.error("Error loading auth data from localStorage:", error)
          localStorage.removeItem("pocketbase_auth")
        }
      }
    }
    return pb
  } else {
    // Server-side (create a new instance for each request)
    return new PocketBase("https://remain-faceghost.pockethost.io")
  }
}

// Helper function to get the current authenticated user
export function getCurrentUser() {
  const pb = getPocketBase()
  return pb.authStore.isValid ? pb.authStore.model : null
}

// Helper function to get the first name from a full name
export function getFirstName(fullName: string | undefined) {
  if (!fullName) return ""
  return fullName.split(" ")[0]
}


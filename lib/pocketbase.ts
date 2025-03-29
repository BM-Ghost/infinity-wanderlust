import PocketBase from "pocketbase"

// Create a PocketBase instance (client-side only)
export function getPocketBase() {
  if (typeof window === "undefined") {
    return null
  }

  const pb = new PocketBase("https://remain-faceghost.pockethost.io")

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

  return pb
}

// Helper function to get the current authenticated user
export function getCurrentUser() {
  const pb = getPocketBase()
  return pb && pb.authStore.isValid ? pb.authStore.model : null
}

// Helper function to get the first name from a full name
export function getFirstName(fullName: string | undefined) {
  if (!fullName) return ""
  return fullName.split(" ")[0]
}


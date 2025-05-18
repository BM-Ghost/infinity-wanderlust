import PocketBase from "pocketbase"

// Create a singleton instance of PocketBase
let pb: PocketBase | null = null

// Update the getPocketBase function to ensure it's properly initialized
export function getPocketBase() {
  if (!pb) {
    try {
      // Create a new PocketBase instance with the correct URL
      pb = new PocketBase("https://remain-faceghost.pockethost.io")
      console.log("PocketBase initialized with URL:", pb.baseUrl)

      // Try to restore auth state from localStorage if available
      if (typeof window !== "undefined") {
        const authData = localStorage.getItem("pocketbase_auth")
        if (authData) {
          try {
            const { token, model } = JSON.parse(authData)
            pb.authStore.save(token, model)
            console.log("Auth state restored from localStorage")
          } catch (error) {
            console.error("Failed to restore auth state:", error)
            localStorage.removeItem("pocketbase_auth")
          }
        }
      }

      // Test the connection
      pb.health
        .check()
        .then(() => console.log("PocketBase connection successful"))
        .catch((err) => console.error("PocketBase connection test failed:", err))
    } catch (error) {
      console.error("Failed to initialize PocketBase:", error)
      return null
    }
  }

  // Log connection status for debugging
  // console.log("PocketBase connection status:", {
  //   initialized: !!pb,
  //   baseUrl: pb?.baseUrl,
  //   authStoreValid: pb?.authStore?.isValid,
  // })

  return pb
}

// For debugging purposes
export function logPocketBaseStatus() {
  const pb = getPocketBase()
  if (!pb) {
    console.error("PocketBase is not initialized")
    return null
  }

  console.log("PocketBase Status:", {
    isValid: pb.authStore.isValid,
    token: pb.authStore.token ? "exists" : "none",
    model: pb.authStore.model ? "exists" : "none",
    baseUrl: pb.baseUrl,
  })
  return pb
}

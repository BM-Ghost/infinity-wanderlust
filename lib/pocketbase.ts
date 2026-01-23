import PocketBase from "pocketbase"

// Create a singleton instance of PocketBase
let pb: PocketBase | null = null

// Update the getPocketBase function to ensure it's properly initialized
export function getPocketBase() {
  if (!pb) {
    try {
      pb = new PocketBase("https://remain-faceghost.pockethost.io")
      
      // Disable auto-cancellation to prevent losing auth state
      pb.autoCancellation(false)
      
      console.log("PocketBase initialized with URL:", pb.baseUrl)

      // Restore auth state ONLY in the browser (users)
      if (typeof window !== "undefined") {
        const authData = localStorage.getItem("pocketbase_auth")
        if (authData) {
          try {
            const { token, model } = JSON.parse(authData)
            pb.authStore.save(token, model)
            console.log("Auth state restored from localStorage")
          } catch {
            localStorage.removeItem("pocketbase_auth")
          }
        }
        
        // Sync authStore changes to localStorage automatically
        pb.authStore.onChange(() => {
          if (pb && pb.authStore.isValid) {
            localStorage.setItem(
              "pocketbase_auth",
              JSON.stringify({
                token: pb.authStore.token,
                model: pb.authStore.model,
              })
            )
          } else {
            localStorage.removeItem("pocketbase_auth")
          }
        })
      }

      pb.health
        .check()
        .then(() => console.log("PocketBase connection successful"))
        .catch((err) => console.error("PocketBase connection test failed:", err))
    } catch (error) {
      console.error("Failed to initialize PocketBase:", error)
      return null
    }
  }

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

// Ensure admin authentication for admin operations
export async function getPocketBaseAdmin() {
  const pb = getPocketBase()
  if (!pb) {
    throw new Error("PocketBase not initialized")
  }

  // 🚨 Admin auth must never run in the browser
  if (typeof window !== "undefined") {
    throw new Error("Admin authentication must run on the server only")
  }

  // ✅ Correct admin-auth check (NO _superusers, NO collections)
  const model = pb.authStore.model
  const isAdmin =
    pb.authStore.isValid &&
    model &&
    !("collectionId" in model) &&
    !("collectionName" in model)

  if (isAdmin) {
    console.log("Already authenticated as admin")
    return pb
  }

  const adminEmail = process.env.PB_ADMIN_EMAIL
  const adminPassword = process.env.PB_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Admin credentials not configured. Please set PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in your .env file."
    )
  }

  console.log("[getPocketBaseAdmin] Attempting admin auth with email:", adminEmail)

  try {
    console.log("Authenticating as admin...")

    // Call the admins endpoint directly (matches Postman)
    const response = await pb.send("/api/admins/auth-with-password", {
      method: "POST",
      body: {
        identity: adminEmail,
        password: adminPassword,
      },
    })

    pb.authStore.save(response.token, response.admin)

    console.log("Admin authentication successful")
    return pb
  } catch (error: any) {
    console.error("Admin authentication failed:", error)
    console.error("Admin email used:", adminEmail)
    throw new Error(
      `Admin authentication failed: ${error.message}. Please check your PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD in .env file.`
    )
  }
}

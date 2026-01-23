import { getPocketBase } from "./pocketbase"

interface AuditLogData {
  action: string
  userId: string
  email?: string
  metadata?: Record<string, any>
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const pb = getPocketBase()
    if (!pb) {
      console.log("[createAuditLog] PocketBase not available, skipping audit log")
      return
    }

    // Try to create audit log in a collection (if it exists)
    try {
      await pb.collection("audit_logs").create({
        action: data.action,
        user_id: data.userId,
        email: data.email || "",
        metadata: data.metadata || {},
        timestamp: new Date().toISOString(),
        ip_address: "", // Could be added later with request context
        user_agent: "", // Could be added later with request context
      })
    } catch (collectionError: any) {
      // If audit_logs collection doesn't exist, just log to console
      if (collectionError.status === 404) {
        console.log("[createAuditLog] Audit collection not found, logging to console:", data)
      } else {
        console.error("[createAuditLog] Error creating audit log:", collectionError)
      }
    }
  } catch (error) {
    console.error("[createAuditLog] Unexpected error:", error)
  }
}

// Function to ensure audit_logs collection exists (optional)
export async function ensureAuditLogsCollection() {
  try {
    const pb = getPocketBase()
    if (!pb) return

    // Try to get the collection
    await pb.collections.getOne("audit_logs")
  } catch (error: any) {
    if (error.status === 404) {
      console.log("[ensureAuditLogsCollection] Creating audit_logs collection")

      await pb.collections.create({
        name: "audit_logs",
        type: "base",
        schema: [
          {
            name: "action",
            type: "text",
            required: true,
          },
          {
            name: "user_id",
            type: "text",
            required: true,
          },
          {
            name: "email",
            type: "text",
            required: false,
          },
          {
            name: "metadata",
            type: "json",
            required: false,
          },
          {
            name: "timestamp",
            type: "date",
            required: true,
          },
          {
            name: "ip_address",
            type: "text",
            required: false,
          },
          {
            name: "user_agent",
            type: "text",
            required: false,
          },
        ],
      })

      console.log("[ensureAuditLogsCollection] Audit logs collection created")
    }
  }
}
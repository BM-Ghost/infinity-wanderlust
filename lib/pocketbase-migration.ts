/**
 * PocketBase Collection Creator
 * Use this to programmatically create the engagement_metrics collection
 * 
 * Usage:
 *   node scripts/create-analytics-collection.js
 * 
 * Or import in your code:
 *   import { createAnalyticsCollection } from '@/lib/pocketbase-migration'
 */

import PocketBase from "pocketbase"

const PB_URL = "https://remain-faceghost.pockethost.io"
const COLLECTION_NAME = "engagement_metrics"

/**
 * Create the engagement_metrics collection with full schema
 */
export async function createAnalyticsCollection(pbAdmin: any) {
  try {
    // Check if collection already exists
    try {
      await pbAdmin.collections.getOne(COLLECTION_NAME)
      console.log(`✓ Collection "${COLLECTION_NAME}" already exists`)
      return true
    } catch (e: any) {
      if (e?.status !== 404) throw e
    }

    console.log(`📦 Creating collection "${COLLECTION_NAME}"...`)

    // Create collection
    const collection = await pbAdmin.collections.create({
      name: COLLECTION_NAME,
      type: "base",
      system: false,
      schema: [
        {
          id: "event_type",
          name: "event_type",
          type: "text",
          system: false,
          required: true,
          searchable: true,
          options: {
            min: null,
            max: 20,
            pattern: "",
          },
        },
        {
          id: "path",
          name: "path",
          type: "text",
          system: false,
          required: true,
          searchable: true,
          options: {
            min: null,
            max: 500,
            pattern: "",
          },
        },
        {
          id: "source",
          name: "source",
          type: "text",
          system: false,
          required: false,
          searchable: true,
          options: {
            min: null,
            max: 100,
            pattern: "",
          },
        },
        {
          id: "referrer_host",
          name: "referrer_host",
          type: "text",
          system: false,
          required: false,
          searchable: true,
          options: {
            min: null,
            max: 200,
            pattern: "",
          },
        },
        {
          id: "visitor_key",
          name: "visitor_key",
          type: "text",
          system: false,
          required: false,
          searchable: true,
          options: {
            min: null,
            max: 100,
            pattern: "",
          },
        },
        {
          id: "target",
          name: "target",
          type: "text",
          system: false,
          required: false,
          searchable: true,
          options: {
            min: null,
            max: 200,
            pattern: "",
          },
        },
        {
          id: "destination",
          name: "destination",
          type: "text",
          system: false,
          required: false,
          searchable: true,
          options: {
            min: null,
            max: 200,
            pattern: "",
          },
        },
        {
          id: "user_id",
          name: "user_id",
          type: "text",
          system: false,
          required: false,
          searchable: true,
          options: {
            min: null,
            max: 100,
            pattern: "",
          },
        },
        {
          id: "user_email",
          name: "user_email",
          type: "email",
          system: false,
          required: false,
          searchable: true,
          options: {},
        },
        {
          id: "user_agent",
          name: "user_agent",
          type: "text",
          system: false,
          required: false,
          searchable: false,
          options: {
            min: null,
            max: 500,
            pattern: "",
          },
        },
      ],
      listRule: '@request.auth.email = "infinitywanderlusttravels@gmail.com"',
      viewRule: '@request.auth.email = "infinitywanderlusttravels@gmail.com"',
      createRule: "@request.auth.verified = true || !@request.auth",
      updateRule: "false",
      deleteRule: '@request.auth.email = "infinitywanderlusttravels@gmail.com"',
    })

    console.log(`✓ Collection created with ${collection.schema?.length || 0} fields`)

    // Create indexes for performance
    console.log("📊 Creating indexes...")

    const indexQueries = [
      `CREATE INDEX idx_event_type_created on ${COLLECTION_NAME} (event_type, created)`,
      `CREATE INDEX idx_path_created on ${COLLECTION_NAME} (path, created)`,
      `CREATE INDEX idx_visitor_key_created on ${COLLECTION_NAME} (visitor_key, created)`,
      `CREATE INDEX idx_source_created on ${COLLECTION_NAME} (source, created)`,
    ]

    for (const query of indexQueries) {
      try {
        await pbAdmin.send("/api/collections/query", {
          method: "POST",
          body: { query },
        })
      } catch (e) {
        // Index might already exist, that's ok
        console.log(`  ⚠ Index creation note:`, (e as any)?.message)
      }
    }

    console.log("✓ Indexes created")
    console.log(`✅ Collection "${COLLECTION_NAME}" ready for production!`)

    return true
  } catch (error) {
    console.error("❌ Failed to create collection:", error)
    return false
  }
}

/**
 * Verify collection schema matches expected format
 */
export async function verifyAnalyticsCollection(pbAdmin: any): Promise<boolean> {
  try {
    const collection = await pbAdmin.collections.getOne(COLLECTION_NAME)

    const requiredFields = [
      "event_type",
      "path",
      "source",
      "referrer_host",
      "visitor_key",
      "target",
      "destination",
      "user_id",
      "user_email",
      "user_agent",
    ]

    const existingFields = collection.schema?.map((f: any) => f.name) || []
    const missing = requiredFields.filter((f) => !existingFields.includes(f))

    if (missing.length > 0) {
      console.warn(`⚠ Collection is missing fields:`, missing)
      return false
    }

    console.log(`✓ Collection schema is valid`)
    return true
  } catch (error) {
    console.error("❌ Collection verification failed:", error)
    return false
  }
}

/**
 * Run setup (only use in development/admin scripts)
 */
export async function setupAnalyticsCollection() {
  try {
    // Note: This requires admin credentials to work
    // In production, you should have already created the collection via UI

    console.log("🔧 PocketBase Analytics Collection Setup")
    console.log("=========================================\n")

    console.log(`PocketBase URL: ${PB_URL}`)
    console.log(`Collection: ${COLLECTION_NAME}\n`)

    console.log("⚠️  IMPORTANT:")
    console.log("   This script is for manual setup only.")
    console.log("   In production, create the collection via PocketBase UI:")
    console.log("   1. Open: https://remain-faceghost.pockethost.io/_/")
    console.log("   2. Go to Collections")
    console.log("   3. Create new collection using schema from docs/POCKETBASE_COLLECTION_SETUP.md\n")

    console.log("If you have admin credentials and want to create automatically:")
    console.log("   node scripts/setup-analytics.js <ADMIN_EMAIL> <ADMIN_PASSWORD>\n")

    return true
  } catch (error) {
    console.error("Setup failed:", error)
    return false
  }
}

// If run directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAnalyticsCollection().catch(console.error)
}

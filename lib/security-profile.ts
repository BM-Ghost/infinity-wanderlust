export type SecurityProfile = "normal" | "strict" | "lockdown"

type SecurityLimits = {
  apiPerMinute: number
  analyticsTrackPerMinute: number
  sensitiveApiWritesPerMinute: number
  analyticsTrackPerVisitorPerMinute: number
  analyticsTrackPerIpPerMinute: number
  analyticsTrackBodyMaxBytes: number
}

const PROFILE_LIMITS: Record<SecurityProfile, SecurityLimits> = {
  normal: {
    apiPerMinute: 300,
    analyticsTrackPerMinute: 90,
    sensitiveApiWritesPerMinute: 25,
    analyticsTrackPerVisitorPerMinute: 45,
    analyticsTrackPerIpPerMinute: 100,
    analyticsTrackBodyMaxBytes: 8 * 1024,
  },
  strict: {
    apiPerMinute: 180,
    analyticsTrackPerMinute: 50,
    sensitiveApiWritesPerMinute: 14,
    analyticsTrackPerVisitorPerMinute: 24,
    analyticsTrackPerIpPerMinute: 60,
    analyticsTrackBodyMaxBytes: 6 * 1024,
  },
  lockdown: {
    apiPerMinute: 80,
    analyticsTrackPerMinute: 20,
    sensitiveApiWritesPerMinute: 6,
    analyticsTrackPerVisitorPerMinute: 10,
    analyticsTrackPerIpPerMinute: 25,
    analyticsTrackBodyMaxBytes: 4 * 1024,
  },
}

function normalizeProfile(input: string | undefined): SecurityProfile {
  const value = String(input || "normal").toLowerCase()
  if (value === "strict") return "strict"
  if (value === "lockdown") return "lockdown"
  return "normal"
}

export function getSecurityProfile(): SecurityProfile {
  return normalizeProfile(process.env.SECURITY_PROFILE)
}

export function getSecurityLimits(profile: SecurityProfile = getSecurityProfile()): SecurityLimits {
  return PROFILE_LIMITS[profile]
}

export function isWriteMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())
}

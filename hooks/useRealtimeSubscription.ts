"use client"

import { useEffect, useCallback, useRef } from "react"
import { getPocketBase } from "@/lib/pocketbase"

export type CommentChangeEvent = {
  commentId: string
  action: "create" | "update" | "delete"
  reviewId?: string
  timestamp: number
}

/**
 * Real-time subscription hook for comment events
 * Listens to comment creation, updates, and deletion
 * Provides real-time UI updates without polling
 */
export function useCommentSubscription(
  reviewId: string | undefined,
  onCommentChange?: (event: CommentChangeEvent) => void,
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const isInitializedRef = useRef(false)

  const setupSubscription = useCallback(async () => {
    if (!reviewId || isInitializedRef.current) return

    try {
      const pb = getPocketBase()
      if (!pb) return

      // Unsubscribe from previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      // Subscribe to all changes in comments collection for this review
      const unsubscribe = await pb.collection("comments").subscribe("*", (event) => {
        const record = event.record

        // Only process records for this review
        if (record.review !== reviewId) {
          return
        }

        const timestamp = Date.now()

        // Notify listeners of the change
        onCommentChange?.({
          commentId: record.id,
          action: event.action as "create" | "update" | "delete",
          reviewId,
          timestamp,
        })
      })

      unsubscribeRef.current = unsubscribe
      isInitializedRef.current = true
    } catch (error) {
      console.error("Error setting up comment subscription:", error)
    }
  }, [reviewId, onCommentChange])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Setup subscription when reviewId changes
  useEffect(() => {
    isInitializedRef.current = false
    setupSubscription()
  }, [setupSubscription])
}

/**
 * Real-time subscription hook for notification changes
 * Listens to new notifications and marks them as read instantly
 */
export function useNotificationSubscription(
  userId: string | undefined,
  onNotificationReceived?: (notificationId: string) => void,
) {
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const setupSubscription = useCallback(async () => {
    if (!userId) return

    try {
      const pb = getPocketBase()
      if (!pb) return

      // Unsubscribe from previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      // Subscribe to new notifications for this user
      const unsubscribe = await pb.collection("notifications").subscribe("*", (event) => {
        const record = event.record

        // Only process new notifications for this user
        if (record.recipient !== userId || event.action !== "create") {
          return
        }

        // Trigger callback for new notification
        onNotificationReceived?.(record.id)
      })

      unsubscribeRef.current = unsubscribe
    } catch (error) {
      console.error("Error setting up notification subscription:", error)
    }
  }, [userId, onNotificationReceived])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Setup subscription when userId changes
  useEffect(() => {
    setupSubscription()
  }, [setupSubscription])
}

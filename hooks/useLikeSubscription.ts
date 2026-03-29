"use client"

import { useEffect, useCallback, useRef, useReducer, useState } from "react"
import { getPocketBase } from "@/lib/pocketbase"
import type { LikeItemType } from "@/actions/likes"

export type LikeChangeEvent = {
  itemId: string
  itemType: LikeItemType
  userId: string
  action: "like" | "unlike"
  newCount: number
  timestamp: number
}

interface LikeState {
  likedIds: Set<string>
  counts: Record<string, number>
  isLoading: boolean
  error: string | null
}

type LikeAction =
  | { type: "LIKE"; itemId: string; count: number }
  | { type: "UNLIKE"; itemId: string; count: number }
  | { type: "SET_LIKED_IDS"; ids: string[]; counts: Record<string, number> }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "RESET" }

function likeReducer(state: LikeState, action: LikeAction): LikeState {
  switch (action.type) {
    case "LIKE":
      return {
        ...state,
        likedIds: new Set([...state.likedIds, action.itemId]),
        counts: { ...state.counts, [action.itemId]: action.count },
      }
    case "UNLIKE":
      state.likedIds.delete(action.itemId)
      return {
        ...state,
        likedIds: new Set(state.likedIds),
        counts: { ...state.counts, [action.itemId]: action.count },
      }
    case "SET_LIKED_IDS":
      return {
        ...state,
        likedIds: new Set(action.ids),
        counts: action.counts,
        isLoading: false,
      }
    case "SET_ERROR":
      return { ...state, error: action.error, isLoading: false }
    case "SET_LOADING":
      return { ...state, isLoading: action.loading }
    case "RESET":
      return { likedIds: new Set(), counts: {}, isLoading: false, error: null }
    default:
      return state
  }
}

/**
 * Real-time subscription hook for like events
 * Subscribes to changes in likes collection and updates local state instantly
 * Provides optimistic updates and sync with server state
 */
export function useLikeSubscription(
  userId: string | undefined,
  itemType: LikeItemType,
  onLikeChange?: (event: LikeChangeEvent) => void,
) {
  const [state, dispatch] = useReducer(likeReducer, {
    likedIds: new Set<string>(),
    counts: {},
    isLoading: false,
    error: null,
  })

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const pbRef = useRef<any>(null)

  // Subscribe to real-time changes in likes collection
  const setupSubscription = useCallback(async () => {
    if (!userId) return

    try {
      const pb = getPocketBase()
      if (!pb) return

      pbRef.current = pb

      // Unsubscribe from previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      dispatch({ type: "SET_LOADING", loading: true })

      // Subscribe to all changes in likes collection for this user and item type
      const unsubscribe = await pb.collection("likes").subscribe("*", (event) => {
        const record = event.record

        // Only process records matching our user and item type
        if (record.user_id !== userId || record.item_type !== itemType) {
          return
        }

        const itemId = record.item_id
        const timestamp = Date.now()

        if (event.action === "create" || event.action === "update") {
          // New like was added
          dispatch({ type: "LIKE", itemId, count: 0 })
          onLikeChange?.({
            itemId,
            itemType,
            userId,
            action: "like",
            newCount: 0,
            timestamp,
          })
        } else if (event.action === "delete") {
          // Like was removed
          dispatch({ type: "UNLIKE", itemId, count: 0 })
          onLikeChange?.({
            itemId,
            itemType,
            userId,
            action: "unlike",
            newCount: 0,
            timestamp,
          })
        }
      })

      unsubscribeRef.current = unsubscribe
      dispatch({ type: "SET_LOADING", loading: false })
    } catch (error) {
      console.error("Error setting up like subscription:", error)
      dispatch({
        type: "SET_ERROR",
        error: error instanceof Error ? error.message : "Failed to subscribe to likes",
      })
    }
  }, [userId, itemType, onLikeChange])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Setup subscription when user or itemType changes
  useEffect(() => {
    setupSubscription()
  }, [setupSubscription])

  return {
    likedIds: state.likedIds,
    counts: state.counts,
    isLoading: state.isLoading,
    error: state.error,
    isLiked: (itemId: string) => state.likedIds.has(itemId),
    getLikeCount: (itemId: string) => state.counts[itemId] || 0,
  }
}

/**
 * Alternative hook: Subscribe to item count changes only
 * Used when you want to track like count updates for specific items
 */
export function useItemLikeCount(userId: string | undefined, itemId: string, itemType: LikeItemType) {
  const [count, setCount] = useState<number>(0)
  const [isLiked, setIsLiked] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const setupSubscription = useCallback(async () => {
    if (!userId || !itemId) return

    try {
      const pb = getPocketBase()
      if (!pb) return

      // Unsubscribe from previous subscription if exists
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      setIsLoading(true)

      // Subscribe to changes in likes collection for this specific item
      const unsubscribe = await pb.collection("likes").subscribe("*", (event) => {
        const record = event.record

        // Only process records matching our item
        if (record.item_id !== itemId || record.item_type !== itemType) {
          return
        }

        // Check if current user has liked this item
        const userHasLiked = record.user_id === userId && event.action !== "delete"
        if (record.user_id === userId) {
          setIsLiked(event.action !== "delete")
        }
      })

      unsubscribeRef.current = unsubscribe
      setIsLoading(false)
    } catch (error) {
      console.error("Error setting up item like subscription:", error)
      setIsLoading(false)
    }
  }, [userId, itemId, itemType])

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  useEffect(() => {
    setupSubscription()
  }, [setupSubscription])

  return { count, isLiked, isLoading }
}

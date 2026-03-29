import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notifications"

export function useNotifications(page = 1, perPage = 20, enabled = true) {
  return useQuery({
    queryKey: ["notifications", page, perPage],
    queryFn: () => fetchNotifications(page, perPage),
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useUnreadNotificationsCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadNotificationCount,
    enabled,
    staleTime: 15 * 1000,
    refetchInterval: 15 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

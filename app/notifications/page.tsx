"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "@/hooks/useNotifications"

type NotificationTimeGroup = "Today" | "Yesterday" | "This week" | "Earlier"

function toTimeGroup(createdAt: string): NotificationTimeGroup {
  const now = new Date()
  const created = new Date(createdAt)

  if (Number.isNaN(created.getTime())) {
    return "Earlier"
  }

  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const startOfWeek = new Date(startOfToday)
  const day = startOfWeek.getDay()
  const diff = day === 0 ? 6 : day - 1
  startOfWeek.setDate(startOfWeek.getDate() - diff)

  if (created >= startOfToday) return "Today"
  if (created >= startOfYesterday) return "Yesterday"
  if (created >= startOfWeek) return "This week"
  return "Earlier"
}

function toTimestamp(value: string): number {
  const timestamp = new Date(value).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export default function NotificationsPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const enabled = !!user && !isAuthLoading

  const { data, isLoading } = useNotifications(1, 100, enabled)
  const markOne = useMarkNotificationAsRead()
  const markAll = useMarkAllNotificationsAsRead()

  const notifications = data?.items || []
  const unreadCount = useMemo(
    () => notifications.filter((notification: any) => !notification.is_read).length,
    [notifications],
  )
  const groupedNotifications = useMemo(() => {
    const sorted = [...notifications].sort((a, b) => toTimestamp(b.created) - toTimestamp(a.created))
    const groups: Record<NotificationTimeGroup, typeof sorted> = {
      Today: [],
      Yesterday: [],
      "This week": [],
      Earlier: [],
    }

    sorted.forEach((notification) => {
      groups[toTimeGroup(notification.created)].push(notification)
    })

    return ["Today", "Yesterday", "This week", "Earlier"].map((group) => ({
      group,
      items: groups[group as NotificationTimeGroup],
    }))
  }, [notifications])

  if (!enabled) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Sign in to view your notifications.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {groupedNotifications.map(({ group, items }) =>
                items.length === 0 ? null : (
                  <div key={group} className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group}</h3>
                    {items.map((notification) => (
                      <Link
                        key={notification.id}
                        href={notification.href}
                        onClick={() => {
                          if (!notification.is_read) {
                            markOne.mutate(notification.id)
                          }
                        }}
                        className="block"
                      >
                        <div
                          className={`rounded-lg border p-4 transition-colors ${
                            notification.is_read ? "bg-background" : "bg-primary/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium">{notification.title}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                              <p className="mt-2 text-xs text-muted-foreground">{notification.createdLabel}</p>
                            </div>
                            {!notification.is_read && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-primary" />}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

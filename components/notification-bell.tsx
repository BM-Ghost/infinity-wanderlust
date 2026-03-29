"use client"

import Link from "next/link"
import { useMemo } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationsCount,
} from "@/hooks/useNotifications"
import { useAuth } from "@/components/auth-provider"

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

export function NotificationBell() {
  const { user, isLoading } = useAuth()
  const enabled = !!user && !isLoading

  const { data: notificationsData } = useNotifications(1, 10, enabled)
  const { data: unreadCountData } = useUnreadNotificationsCount(enabled)

  const markOne = useMarkNotificationAsRead()
  const markAll = useMarkAllNotificationsAsRead()

  const notifications = notificationsData?.items || []
  const unreadCount = typeof unreadCountData === "number" ? unreadCountData : 0

  const hasUnread = useMemo(() => unreadCount > 0, [unreadCount])
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

  if (!enabled) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 text-[10px] leading-5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={!hasUnread || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            Mark all read
          </Button>
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {groupedNotifications.map(({ group, items }) =>
              items.length === 0 ? null : (
                <div key={group}>
                  <div className="px-3 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {group}
                  </div>
                  {items.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex flex-col items-start gap-1 px-3 py-3"
                      onSelect={() => {
                        if (!notification.is_read) {
                          markOne.mutate(notification.id)
                        }
                      }}
                      asChild
                    >
                      <Link href={notification.href} className="w-full">
                        <div className="flex w-full items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight">{notification.title}</p>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{notification.createdLabel}</p>
                          </div>
                          {!notification.is_read && <span className="mt-1 h-2 w-2 rounded-full bg-primary" />}
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ),
            )}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-sm font-medium">
          <Link href="/notifications">View all notifications</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

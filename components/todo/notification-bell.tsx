"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { Bell, CalendarClock, CheckCheck } from "lucide-react"
import { format, parseISO, isValid } from "date-fns"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/use-notifications"

function formatDueDate(dateStr: string): string {
  if (!dateStr) return "N/A"
  try {
    const parsed = parseISO(dateStr)
    return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : dateStr
  } catch {
    return dateStr
  }
}

const priorityLabel: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

const priorityColor: Record<string, string> = {
  low: "text-blue-500",
  medium: "text-yellow-500",
  high: "text-red-500",
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [open, setOpen] = React.useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) markAllRead()
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          className="relative inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 w-80 rounded-lg border bg-popover p-0 shadow-md outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {notifications.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {notifications.length} task{notifications.length !== 1 ? "s" : ""} due
              </span>
            )}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground">
                <CheckCheck className="size-8 opacity-40" />
                <p>No upcoming due tasks</p>
              </div>
            ) : (
              <ul className="divide-y">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 text-sm transition-colors",
                      !n.flag && "bg-accent/40"
                    )}
                  >
                    <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Due: {formatDueDate(n.dueDate)}
                        {n.priority && (
                          <span className={cn("ml-2 font-medium", priorityColor[n.priority])}>
                            · {priorityLabel[n.priority]}
                          </span>
                        )}
                      </p>
                    </div>
                    {!n.flag && (
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

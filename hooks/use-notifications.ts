import { useEffect, useRef, useState } from "react"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client"
import { fetchDueTasks, transformDueTasksPayload } from "@/lib/todo-api"
import type { DueTaskNotification } from "@/types/todo"
import { useAuthStore } from "@/lib/auth-store"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export function useNotifications() {
  const [notifications, setNotifications] = useState<DueTaskNotification[]>([])
  const clientRef = useRef<Client | null>(null)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Only fetch due tasks when the user is authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    fetchDueTasks()
      .then((tasks) => setNotifications(tasks))
      .catch((err) => console.error("Failed to fetch due tasks:", err))
  }, [isAuthenticated])

  // Only open WebSocket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/topic/tasks/due", (message) => {
          try {
            const raw = JSON.parse(message.body) as unknown[]
            const incoming = transformDueTasksPayload(raw)
            setNotifications(incoming.map((n) => ({ ...n, flag: false })))
          } catch {
            // ignore malformed frames
          }
        })
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame)
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [isAuthenticated])

  const unreadCount = notifications.filter((n) => !n.flag).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, flag: true })))
  }

  return { notifications, unreadCount, markAllRead }
}

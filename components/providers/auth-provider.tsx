"use client"

import { useEffect, useRef } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { AuthService } from "@/lib/services/auth-service"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout, isAuthenticated } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const checkAuth = async () => {
      try {
        // No access token in store — try to silent refresh via HttpOnly cookie
        if (!isAuthenticated) {
          try {
            const response = await AuthService.refreshToken()
            setAuth(response.accessToken, (response as any).user || undefined)
          } catch (e) {
            logout()
          }
        }
      } catch (error) {
        console.error("Auth initialization check failed:", error)
      }
    }

    checkAuth()
  }, [])

  // Auto-refresh the token every 14 minutes if authenticated (because token lives 15m)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(async () => {
      try {
        const response = await AuthService.refreshToken()
        setAuth(response.accessToken, (response as any).user as any)
      } catch (error) {
        console.error("Periodic token refresh failed:", error)
        logout()
      }
    }, 14 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, setAuth, logout])

  return <>{children}</>
}

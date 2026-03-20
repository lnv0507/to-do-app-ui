"use client"

import { useEffect, useRef } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { authApi } from "@/lib/auth-api"
import Cookies from "js-cookie"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout, isAuthenticated } = useAuthStore()
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const checkAuth = async () => {
      try {
        // Attempt to refresh the token on initial app load if the user is not authenticated
        // or just to ensure the token hasn't expired while they were away.
        const tokenInCookie = Cookies.get("auth-token")

        if (!tokenInCookie) {
          // No access token cookie, try to refresh via HTTP-only refresh token cookie
          try {
            const response = await authApi.refreshToken()
            // We cast response to any as fallback if the backend doesn't return user info on refresh
            setAuth(response.accessToken, (response as any).user || { email: "user@" } as any)
          } catch (e) {
            // Refresh failed (e.g., no refresh token), ensure we are logged out
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
        const response = await authApi.refreshToken()
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

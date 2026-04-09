"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { AuthService } from "@/lib/services/auth-service"

// Paths that require authentication
const protectedPaths = ["/todos", "/profile", "/dashboard"]
// Paths that are only for guest users
const guestOnlyPaths = ["/auth/login", "/auth/register", "/auth/confirm-otp", "/auth/verify-device"]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, logout, isAuthenticated, accessToken } = useAuthStore()
  const initialized = useRef(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const checkAuth = async () => {
      // If no token in memory, try to refresh via HttpOnly cookie
      if (!isAuthenticated && !accessToken) {
        try {
          const response = await AuthService.refreshToken()
          setAuth(response.accessToken, (response as any).user || undefined)
        } catch (e) {
          logout()
        }
      }
    }

    checkAuth()
  }, [isAuthenticated, accessToken, setAuth, logout])

  // Client-side authentication guard (replaces middleware for S3/Static Export)
  useEffect(() => {
    const isProtected = protectedPaths.some(path => pathname.startsWith(path))
    const isGuestOnly = guestOnlyPaths.some(path => pathname.startsWith(path))

    if (isProtected && !isAuthenticated) {
      router.push("/auth/login")
    } else if (isGuestOnly && isAuthenticated) {
      router.push("/todos")
    } else if (pathname === "/" && isAuthenticated) {
      router.push("/todos")
    } else if (pathname === "/" && !isAuthenticated) {
      router.push("/auth/login")
    }
  }, [pathname, isAuthenticated, router])

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

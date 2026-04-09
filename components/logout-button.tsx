"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth-store"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"

export function LogoutButton() {
  const logout = useAuthStore((state) => state.logout)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Call backend to expire the HttpOnly refreshToken cookie.
      // JS cannot remove HttpOnly cookies directly — only the server can.
      await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true })
    } catch {
      // Best-effort: proceed with local logout even if the call fails
    } finally {
      logout() // Clear Zustand store + auth-token JS cookie
      // Hard redirect so the proxy re-evaluates cookies (no refreshToken → /auth/login)
      window.location.href = "/auth/login"
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">{isLoggingOut ? "Logging out..." : "Logout"}</span>
    </Button>
  )
}

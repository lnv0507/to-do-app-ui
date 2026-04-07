"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/auth-store"
import { useRouter } from "next/navigation"

export function LogoutButton() {
  const logout = useAuthStore((state) => state.logout)
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="gap-2 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">Logout</span>
    </Button>
  )
}

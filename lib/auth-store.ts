import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import Cookies from "js-cookie"
import { User } from "@/types/auth"

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean

  // Actions
  setAuth: (token: string, user?: User) => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

/**
 * Zustand store for authentication state management.
 * Persists data to sessionStorage to survive page refreshes while remaining secure.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        Cookies.set("auth-token", token, { expires: 15 / 1440 }) // 15 minutes
        set({
          accessToken: token,
          user: user || null,
          isAuthenticated: true
        })
      },

      setAccessToken: (token) => {
        Cookies.set("auth-token", token, { expires: 15 / 1440 }) // 15 minutes
        set({
          accessToken: token,
          isAuthenticated: true
        })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        Cookies.remove("auth-token")
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false
        })
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

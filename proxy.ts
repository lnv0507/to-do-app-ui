import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedPaths = ["/todos", "/profile", "/dashboard"]
const guestOnlyPaths = ["/auth/login", "/auth/register", "/auth/confirm-otp", "/auth/verify-device"]
// Paths that must be accessible regardless of auth state (email-link flows)
const publicPaths = ["/reset-password", "/auth/forgot-password"]

export function proxy(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    /**
     * Auth signal strategy:
     * - `auth-token`   : short-lived JS cookie (15 min) set by auth-store — present only
     *                    when the access token is still valid/fresh.
     * - `refreshToken` : long-lived HttpOnly cookie set by the backend — present for the
     *                    entire session lifetime (7 days).
     *
     * We use `refreshToken` as the primary session presence signal because:
     * 1. It is set server-side and survives access-token rotation.
     * 2. The middleware only needs to know "does this browser have a session?",
     *    not whether the session is still valid (the backend validates on every API call).
     * 3. `auth-token` expiring after 15 min would incorrectly lock out users who have
     *    a valid session but haven't refreshed recently.
     */
    const hasSession =
      !!request.cookies.get("refreshToken")?.value ||
      !!request.cookies.get("auth-token")?.value

    // 1. Root path
    if (pathname === "/") {
      return NextResponse.redirect(
        new URL(hasSession ? "/todos" : "/auth/login", request.url)
      )
    }

    // 2. Protected routes — redirect to login when no session
    const isProtected = protectedPaths.some((p) => pathname.startsWith(p))
    if (isProtected && !hasSession) {
      const url = new URL("/auth/login", request.url)
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)
    }

    // 3. Public paths — always allow (token-based flows from email links)
    const isPublic = publicPaths.some((p) => pathname.startsWith(p))
    if (isPublic) return NextResponse.next()

    // 4. Guest-only pages — redirect logged-in users away
    const isGuestOnly = guestOnlyPaths.some((p) => pathname.startsWith(p))
    if (isGuestOnly && hasSession) {
      return NextResponse.redirect(new URL("/todos", request.url))
    }

    return NextResponse.next()
  } catch (error) {
    console.error("Middleware Error:", error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Regex patterns to ensure trailing-slash variants are also caught:
     * - '/todos'  and '/todos/' and '/todos/anything'
     * - '/profile' and '/profile/' ...
     * - '/auth/**' for all auth routes
     * - '/reset-password' for email-link flow
     */
    "/",
    "/(todos|profile|dashboard)((?:/.*)?)$",
    "/auth/(.*)",
    "/reset-password",
  ],
}

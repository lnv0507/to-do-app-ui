import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedPaths = ["/todos", "/profile", "/dashboard"]
const guestOnlyPaths = ["/auth/login", "/auth/register", "/auth/confirm-otp", "/auth/verify-device"]

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl
    const authToken = request.cookies.get("auth-token")?.value

    console.log(`Middleware: ${pathname}, Auth: ${!!authToken}`)

    // 1. Root path handling
    if (pathname === "/") {
      return NextResponse.redirect(new URL(authToken ? "/todos" : "/auth/login", request.url))
    }

    // 2. Auth protection
    const isProtected = protectedPaths.some(p => pathname.startsWith(p))
    if (isProtected && !authToken) {
      const url = new URL("/auth/login", request.url)
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)
    }

    // 3. Guest only pages (don't show login to logged in users)
    const isGuestOnly = guestOnlyPaths.some(p => pathname.startsWith(p))
    if (isGuestOnly && authToken) {
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
    "/",
    "/todos/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
    "/auth/:path*"
  ],
}

import {
  SignInRequest,
  SignUpRequest,
  AuthResponse,
  VerifyOtpRequest,
  VerifyDeviceRequest
} from "@/types/auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

/**
 * Auth API service to handle all authentication endpoints
 */
export const authApi = {
  /**
   * POST /api/v1/auth/signup
   */
  async signup(data: SignUpRequest): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Signup failed: ${response.statusText} - ${errorText}`)
    }

    return response.text()
  },

  /**
   * POST /api/v1/auth/signin
   */
  async signin(data: SignInRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      // Note: Backend might return 403 for RBA, which frontend should handle separately
      throw {
        status: response.status,
        message: `Signin failed: ${response.statusText}`,
        data: errorText ? JSON.parse(errorText) : null
      }
    }

    return response.json()
  },

  /**
   * POST /api/v1/auth/confirm-otp
   */
  async confirmOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/confirm-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OTP Confirmation failed: ${response.statusText} - ${errorText}`)
    }

    return response.json()
  },

  /**
   * POST /api/v1/auth/refresh-token
   * Note: Expects Refresh Token in HttpOnly cookie
   */
  async refreshToken(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      throw new Error("Refresh token failed")
    }

    return response.json()
  },

  /**
   * POST /api/v1/auth/verify-device
   * Used for RBA Phase 2 after 403 Forbidden from signin
   */
  async verifyDevice(data: VerifyDeviceRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Device verification failed: ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }


}

import { apiClient } from "../api/api-client";
import {
  SignInRequest,
  SignUpRequest,
  AuthResponse,
  VerifyOtpRequest,
  VerifyDeviceRequest
} from "@/types/auth";

export const AuthService = {
  /**
   * Register a new user
   */
  signup: async (data: SignUpRequest): Promise<string> => {
    const { data: responseData } = await apiClient.post<string>("/api/v1/auth/signup", data);
    return responseData;
  },

  /**
   * Log in an existing user
   */
  signin: async (data: SignInRequest): Promise<AuthResponse> => {
    const { data: responseData } = await apiClient.post<AuthResponse>("/api/v1/auth/signin", data);
    return responseData;
  },

  /**
   * Confirm account with OTP
   */
  confirmOtp: async (data: VerifyOtpRequest): Promise<AuthResponse> => {
    const { data: responseData } = await apiClient.post<AuthResponse>("/api/v1/auth/confirm-otp", data);
    return responseData;
  },

  /**
   * Refresh the access token using the refresh token cookie
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const { data: responseData } = await apiClient.post<AuthResponse>("/api/v1/auth/refresh-token");
    return responseData;
  },

  /**
   * Verify device for Risk-Based Authentication (RBA)
   */
  verifyDevice: async (data: VerifyDeviceRequest): Promise<AuthResponse> => {
    const { data: responseData } = await apiClient.post<AuthResponse>("/api/v1/auth/verify-device", data);
    return responseData;
  },

};

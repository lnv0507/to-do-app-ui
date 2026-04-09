export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyDeviceRequest {
  otp: string;
  verificationToken: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface User {
  id?: string;
  email: string;
  fullName: string;
}

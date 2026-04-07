"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/lib/services/auth-service";
import { useAuthStore } from "@/lib/auth-store";
import {
  SignInRequest,
  SignUpRequest,
  VerifyOtpRequest,
  VerifyDeviceRequest
} from "@/types/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setAuth, logout, isAuthenticated } = useAuthStore();

  // Mutation: Log in a user
  const loginMutation = useMutation({
    mutationFn: (credentials: SignInRequest) => AuthService.signin(credentials),
    onSuccess: (data) => {
      setAuth(data.accessToken);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Login successful!");
      router.push("/todos");
    },
    onError: (error: any) => {
      // If it's a 403, we might want special handling for RBA in the component
      if (error.response?.status !== 403) {
        toast.error(error.response?.data?.message || "Login failed.");
      }
    },
  });

  // Mutation: Register a new user
  const signupMutation = useMutation({
    mutationFn: (data: SignUpRequest) => AuthService.signup(data),
    onSuccess: (_, variables) => {
      toast.success("Registration successful! Please confirm your email.");
      router.push(`/auth/confirm-otp?email=${variables.email}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Registration failed.");
    },
  });

  // Mutation: Confirm OTP
  const confirmOtpMutation = useMutation({
    mutationFn: (data: VerifyOtpRequest) => AuthService.confirmOtp(data),
    onSuccess: (data) => {
      setAuth(data.accessToken);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Account confirmed!");
      router.push("/todos");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "OTP Confirmation failed.");
    },
  });

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,

    signup: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,

    confirmOtp: confirmOtpMutation.mutateAsync,
    isConfirmingOtp: confirmOtpMutation.isPending,

    logout: () => {
      logout();
      queryClient.clear();
      router.push("/auth/login");
    },
  };
};

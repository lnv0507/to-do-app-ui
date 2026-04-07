"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 characters"),
})

type OtpFormValues = z.infer<typeof otpSchema>

function ConfirmOtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { confirmOtp, isConfirmingOtp } = useAuth()
  
  const email = searchParams.get("email")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  })

  async function onSubmit(data: OtpFormValues) {
    if (!email) {
      toast.error("Missing email address. Please try registering again.")
      router.push("/auth/register")
      return
    }

    try {
      await confirmOtp({
        email,
        otp: data.otp
      })
    } catch (error: any) {
      // Error is handled by the hook's toast
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Verify Account</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to <strong>{email || "your email"}</strong>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">One-Time Password</Label>
            <Input
              id="otp"
              placeholder="123456"
              {...register("otp")}
              className={`text-center text-2xl tracking-[0.5em] font-mono ${errors.otp ? "border-red-500" : ""}`}
            />
            {errors.otp && (
              <p className="text-sm text-center text-red-500">{errors.otp.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isConfirmingOtp}>
            {isConfirmingOtp ? "Verifying..." : "Confirm Account"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ConfirmOtpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ConfirmOtpForm />
      </Suspense>
    </div>
  )
}

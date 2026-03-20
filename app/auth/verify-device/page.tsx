"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/lib/auth-api"
import { useAuthStore } from "@/lib/auth-store"

const verifySchema = z.object({
  otp: z.string().length(6, "OTP must be 6 characters"),
})

type VerifyFormValues = z.infer<typeof verifySchema>

function VerifyDeviceForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  useEffect(() => {
    if (!token) {
      toast.error("Missing verification token. Please sign in again.")
      router.push("/auth/login")
    }
  }, [token, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
  })

  async function onSubmit(data: VerifyFormValues) {
    if (!token) return
    
    setIsLoading(true)
    try {
      const response = await authApi.verifyDevice({
        otp: data.otp,
        verificationToken: token
      })
      setAuth(response.accessToken)
      toast.success("Identity verified successfully!")
      router.push("/todos")
    } catch (error: any) {
      toast.error(error.message || "Verification failed. Please check your code.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-orange-200">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
          <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold">New Device Detected</CardTitle>
        <CardDescription>
          For your security, please enter the verification code sent to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Security Code</Label>
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
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify Identity"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/auth/login")} className="text-sm">
            Cancel and back to login
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function VerifyDevicePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyDeviceForm />
      </Suspense>
    </div>
  )
}

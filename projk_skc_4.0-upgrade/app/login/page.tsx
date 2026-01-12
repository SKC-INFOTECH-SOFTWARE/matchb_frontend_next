"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Users } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Image src="/matchb-logo.png" alt="MatchB" width={120} height={40} className="h-10 w-auto" />
          </div>
          <p className="text-gray-600">Sign in to your MatchB account</p>
        </div>

        <Card className="shadow-xl border-0 hover:shadow-2xl transition-shadow">
          <Link href="/login/user">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-rose-100 rounded-full">
                  <Users className="h-8 w-8 text-rose-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-gray-900">User Login</CardTitle>
              <CardDescription>Access your matrimonial profile and matches</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full h-11 bg-rose-600 hover:bg-rose-700">Sign In</Button>
            </CardContent>
          </Link>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-rose-600 hover:text-rose-700 font-medium">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
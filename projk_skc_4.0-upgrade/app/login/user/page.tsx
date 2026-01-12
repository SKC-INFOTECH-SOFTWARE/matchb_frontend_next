import { UserLoginForm } from "@/components/auth/user-login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"

export default function UserLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/matchb-logo.png" alt="MatchB" width={120} height={40} className="h-10 w-auto" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold text-gray-800">User Login</CardTitle>
          <CardDescription>Sign in with your email or phone number</CardDescription>
        </CardHeader>
        <CardContent>
          <UserLoginForm />
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-rose-600 hover:underline font-medium">
                Register now
              </Link>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <Link href="/" className="text-gray-600 hover:underline">
                ← Back to Home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

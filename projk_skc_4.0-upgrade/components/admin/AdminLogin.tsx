"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, User, Phone } from "lucide-react"
import Image from "next/image"
import ReactCountryFlag from "react-country-flag"

interface CountryCode {
  code: string
  countryCode: string
  country: string
}

const countryCodes: CountryCode[] = [
  { code: "+1", countryCode: "US", country: "US" },
  { code: "+44", countryCode: "GB", country: "UK" },
  { code: "+91", countryCode: "IN", country: "IN" },
]

interface AuthContext {
  login: (identifier: string, password: string, role: string) => Promise<boolean>
}

export default function AdminLogin() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [countryCode, setCountryCode] = useState("+91")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth() as AuthContext

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!identifier.trim()) {
      setError("Please enter a username, email, or phone number")
      setIsLoading(false)
      return
    }
    if (isPhone && !countryCode) {
      setError("Please select a country code for phone number")
      setIsLoading(false)
      return
    }

    const finalIdentifier = isPhone ? `${countryCode}${identifier}` : identifier

    try {
      const success = await login(finalIdentifier, password, "admin")
      if (success) {
        router.push("/admin")
      } else {
        setError("Invalid credentials or insufficient permissions")
      }
    } catch (error) {
      setError("Network error. Please try again.")
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isEmail = identifier.includes("@")
  const isPhone = /^\d+$/.test(identifier.trim())
  const isUsername = !isEmail && !isPhone && identifier.trim().length > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/matchb-logo.png" alt="MatchB" width={120} height={40} className="h-10 w-auto" />
          </div>
          <CardTitle className="text-2xl font-serif font-bold text-gray-800">Admin Access</CardTitle>
          <CardDescription>Enter your admin credentials to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">Username, Email, or Phone</Label>
              <div className="relative flex items-center">
                {isPhone && (
                  <Select
                    value={countryCode}
                    onValueChange={setCountryCode}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-[140px] mr-2">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countryCodes.map(({ code, countryCode, country }) => (
                        <SelectItem key={code} value={code}>
                          <div className="flex items-center">
                            <ReactCountryFlag
                              countryCode={countryCode}
                              svg
                              className="mr-2"
                              style={{ width: "1.5em", height: "1.5em" }}
                            />
                            {code} ({country})
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="relative flex-1">
                  <Input
                    id="identifier"
                    type="text"
                    placeholder={isPhone ? "Enter phone number" : "Enter username, email, or phone"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    className={isPhone ? "pl-4" : "pl-10"}
                    disabled={isLoading}
                  />
                  {!isPhone && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      {isEmail ? (
                        <Mail className="h-4 w-4 text-gray-400" />
                      ) : isUsername ? (
                        <User className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Phone className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full bg-gray-600 hover:bg-gray-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Access Admin Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
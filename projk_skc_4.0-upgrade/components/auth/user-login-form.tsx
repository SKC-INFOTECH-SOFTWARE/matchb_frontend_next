"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Phone } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import ReactCountryFlag from "react-country-flag"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const countryCodes = [
  { code: "+1", countryCode: "US", country: "US" },
  { code: "+44", countryCode: "GB", country: "UK" },
  { code: "+91", countryCode: "IN", country: "IN" },
]

export function UserLoginForm() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [countryCode, setCountryCode] = useState("+91")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    if (!identifier) {
      setError("Please enter an email or phone number")
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
      const success = await login(finalIdentifier, password, "user")
      
      if (success) {
      } else {
        setError("Invalid email/phone or password")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const isEmail = identifier.includes("@")
  const isPhone = /^\d+$/.test(identifier)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="identifier">Email or Phone</Label>
        <div className="relative flex items-center">
          {isPhone && (
            <Select 
              value={countryCode} 
              onValueChange={(value) => setCountryCode(value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[120px] mr-2">
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
                      {code} {country}
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
              placeholder={isPhone ? "Enter phone number" : "Enter email or phone number"}
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-rose-600 hover:bg-rose-700" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  )
}
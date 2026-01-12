"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, Users, Mail, User, Lock, Eye, EyeOff } from "lucide-react"
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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    countryCode: "+91",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  // Form validation
  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Full name is required"
    }
    
    if (formData.name.trim().length < 2) {
      return "Name must be at least 2 characters long"
    }

    if (!formData.email.trim()) {
      return "Email is required"
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      return "Please enter a valid email address"
    }

    if (!formData.phone.trim()) {
      return "Phone number is required"
    }

    // Phone validation (only digits for the phone number part)
    const phoneRegex = /^\d{10,}$/
    if (!phoneRegex.test(formData.phone.trim())) {
      return "Please enter a valid phone number (at least 10 digits)"
    }

    if (!formData.countryCode) {
      return "Please select a country code"
    }

    if (!formData.password) {
      return "Password is required"
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters long"
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // Concatenate country code and phone number without space
      const fullPhoneNumber = `${formData.countryCode}${formData.phone.trim()}`

      const success = await register(
        formData.email.trim(), 
        formData.password, 
        formData.name.trim(),
        fullPhoneNumber,
      )

      if (success) {
        router.push("/profile/create")
      } else {
        setError("Registration failed. Email or phone number may already exist.")
      }
    } catch (err) {
      setError("Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // Clear error when user starts typing
    if (error) {
      setError("")
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // Allow only digits for phone number
    value = value.replace(/[^\d]/g, '')
    
    setFormData((prev) => ({
      ...prev,
      phone: value,
    }))
    
    if (error) {
      setError("")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-rose-100 rounded-full">
                <Users className="h-6 w-6 text-rose-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-gray-900">Create User Account</CardTitle>
            <CardDescription>Join thousands finding their perfect match</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="h-11 pl-10"
                    disabled={loading}
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-11 pl-10"
                    disabled={loading}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative flex items-center">
                  <Select 
                    value={formData.countryCode} 
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, countryCode: value }))}
                    disabled={loading}
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
                  <div className="relative flex-1">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                      className="h-11 pl-4"
                      disabled={loading}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Enter phone number without country code</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 6 characters)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-11 pl-10 pr-10"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="h-11 pl-10 pr-10"
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="mt-1 text-center">
                <Link href="/" className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login/user" className="text-rose-600 hover:text-rose-700 font-medium transition-colors">
                  Sign In
                </Link>
              </p>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="text-rose-600 hover:text-rose-700">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-rose-600 hover:text-rose-700">Privacy Policy</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
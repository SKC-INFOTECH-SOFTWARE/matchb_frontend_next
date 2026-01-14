"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, Loader2, Copy, Check, Upload, X, Image } from "lucide-react"
import PhoneInput from "react-phone-input-2"
import "react-phone-input-2/lib/style.css"

interface AdminAddUserProps {
  onUserAdded?: () => void
}

interface FormData {
  name: string
  email: string
  phone: string
  age: string
  gender: string
  height: string
  weight: string
  caste: string
  religion: string
  mother_tongue: string
  marital_status: string
  education: string
  occupation: string
  income: string
  state: string
  city: string
  family_type: string
  family_status: string
  about_me: string
  partner_preferences: string
  profile_photo: string
}

export default function AdminAddUser({ onUserAdded }: AdminAddUserProps) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    caste: "",
    religion: "",
    mother_tongue: "",
    marital_status: "",
    education: "",
    occupation: "",
    income: "",
    state: "",
    city: "",
    family_type: "",
    family_status: "",
    about_me: "",
    partner_preferences: "",
    profile_photo: ""
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean
    userId?: number
    password?: string
  }>({
    open: false
  })
  const [copied, setCopied] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (message) setMessage(null)
  }

  const handlePhoneChange = (value: string) => {
    const formattedPhone = `+${value.replace(/\s/g, '')}`
    setFormData(prev => ({ ...prev, phone: formattedPhone }))
    if (message) setMessage(null)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size too large. Maximum 5MB allowed.' })
      return
    }

    setSelectedFile(file)

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    if (message) setMessage(null)
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setPreviewUrl("")
    setFormData(prev => ({ ...prev, profile_photo: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile) return null

    setIsUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload`, {
        method: "POST",
        body: uploadFormData,
      })

      const data = await response.json()

      if (response.ok) {
        return data.url
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload image' })
        return null
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload image. Please try again.' })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const validateForm = (): boolean => {
    const requiredFields = ['name', 'email', 'phone', 'age', 'gender', 'caste', 'religion', 'education', 'occupation', 'state', 'city', 'marital_status']

    for (const field of requiredFields) {
      if (!formData[field as keyof FormData]) {
        setMessage({ type: 'error', text: `${field.replace('_', ' ')} is required` })
        return false
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage({ type: 'error', text: 'Invalid email format' })
      return false
    }

    if (!/^\+\d{10,15}$/.test(formData.phone)) {
      setMessage({ type: 'error', text: 'Phone number must include country code and be 10-15 digits' })
      return false
    }

    const age = parseInt(formData.age)
    if (isNaN(age) || age < 18 || age > 100) {
      setMessage({ type: 'error', text: 'Age must be between 18 and 100' })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!validateForm()) return

    setIsLoading(true)

    try {
      let photoUrl = ""
      if (selectedFile) {
        const uploadedUrl = await uploadFile()
        if (!uploadedUrl) {
          setIsLoading(false)
          return
        }
        photoUrl = uploadedUrl
      }

      const token = localStorage.getItem("token")
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication token not found. Please log in.' })
        setIsLoading(false)
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/create-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          age: parseInt(formData.age),
          profile_photo: photoUrl
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessDialog({
          open: true,
          userId: data.userId,
          password: data.defaultPassword
        })

        setFormData({
          name: "",
          email: "",
          phone: "",
          age: "",
          gender: "",
          height: "",
          weight: "",
          caste: "",
          religion: "",
          mother_tongue: "",
          marital_status: "",
          education: "",
          occupation: "",
          income: "",
          state: "",
          city: "",
          family_type: "",
          family_status: "",
          about_me: "",
          partner_preferences: "",
          profile_photo: ""
        })

        removeSelectedFile()

        if (onUserAdded) {
          onUserAdded()
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const copyPassword = () => {
    if (successDialog.password) {
      navigator.clipboard.writeText(successDialog.password)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New User Profile
          </CardTitle>
          <CardDescription>Create a new user account with profile (auto-approved)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <PhoneInput
                    country={'in'}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    disabled={isLoading}
                    inputProps={{
                      required: true,
                      className: 'w-full pl-12 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    }}
                    buttonStyle={{
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem 0 0 0.375rem'
                    }}
                    containerStyle={{
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="marital_status">Marital Status *</Label>
                  <Select value={formData.marital_status} onValueChange={(value) => handleInputChange("marital_status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Never Married">Never Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Physical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    placeholder="e.g., 5'6&quot;"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    placeholder="e.g., 60 kg"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Social Background</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="caste">Caste *</Label>
                  <Input
                    id="caste"
                    value={formData.caste}
                    onChange={(e) => handleInputChange("caste", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="religion">Religion *</Label>
                  <Input
                    id="religion"
                    value={formData.religion}
                    onChange={(e) => handleInputChange("religion", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother_tongue">Mother Tongue</Label>
                  <Input
                    id="mother_tongue"
                    value={formData.mother_tongue}
                    onChange={(e) => handleInputChange("mother_tongue", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education">Education *</Label>
                  <Input
                    id="education"
                    value={formData.education}
                    onChange={(e) => handleInputChange("education", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation *</Label>
                  <Input
                    id="occupation"
                    value={formData.occupation}
                    onChange={(e) => handleInputChange("occupation", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income">Income</Label>
                  <Input
                    id="income"
                    placeholder="e.g., 5-10 LPA"
                    value={formData.income}
                    onChange={(e) => handleInputChange("income", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Family Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="family_type">Family Type</Label>
                  <Select value={formData.family_type} onValueChange={(value) => handleInputChange("family_type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select family type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Joint Family">Joint Family</SelectItem>
                      <SelectItem value="Nuclear Family">Nuclear Family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="family_status">Family Status</Label>
                  <Select value={formData.family_status} onValueChange={(value) => handleInputChange("family_status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select family status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Middle Class">Middle Class</SelectItem>
                      <SelectItem value="Upper Middle Class">Upper Middle Class</SelectItem>
                      <SelectItem value="Rich">Rich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="about_me">About Me</Label>
                  <Textarea
                    id="about_me"
                    placeholder="Brief description about the person..."
                    value={formData.about_me}
                    onChange={(e) => handleInputChange("about_me", e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner_preferences">Partner Preferences</Label>
                  <Textarea
                    id="partner_preferences"
                    placeholder="What they're looking for in a partner..."
                    value={formData.partner_preferences}
                    onChange={(e) => handleInputChange("partner_preferences", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profile Photo (Optional)</Label>
                  <div className="space-y-4">
                    {!selectedFile && !previewUrl && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <div className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isUploading}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Choose Image
                          </Button>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, JPEG, WebP up to 5MB
                          </p>
                        </div>
                      </div>
                    )}

                    {(selectedFile || previewUrl) && (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img
                            src={previewUrl}
                            alt="Profile preview"
                            className="w-32 h-32 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full p-0"
                            onClick={removeSelectedFile}
                            disabled={isLoading || isUploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || isUploading}
                          >
                            Change Image
                          </Button>
                          {selectedFile && (
                            <span className="text-sm text-gray-600">
                              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isLoading || isUploading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Uploading Image..." : "Creating User Profile..."}
                </>
              ) : (
                "Create User Profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={successDialog.open} onOpenChange={(open) => setSuccessDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Created Successfully!</DialogTitle>
            <DialogDescription>
              The user account has been created with an auto-approved profile. Please share these login credentials with the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="space-y-2">
                <div>
                  <Label className="text-sm font-medium">User ID:</Label>
                  <p className="text-sm">{successDialog.userId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Temporary Password:</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {successDialog.password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={copyPassword}
                      className="h-8"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <Alert>
              <AlertDescription>
                The user can login with their email/phone and this temporary password. They should change their password after first login.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end">
              <Button onClick={() => setSuccessDialog({ open: false })}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

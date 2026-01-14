"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUpload } from "@/components/file-upload"
import { ArrowLeft, CreditCard, Upload, CheckCircle, HelpCircle, Mail, Phone, Info, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Plan {
  id: number
  name: string
  price: number
  duration_months: number
  features: string
  description: string
}

export default function PaymentSubmitPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [screenshot, setScreenshot] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login/user")
      return
    }

    if (user) {
      fetchPlans()
    }
  }, [user, loading, router])

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/plans`)
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    } finally {
      setLoadingPlans(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPlanId || !transactionId) {
      setError("Please select a plan and enter transaction ID")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          transactionId,
          screenshot: screenshot || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      } else {
        setError(data.error || "Failed to submit payment")
      }
    } catch (error) {
      setError("An error occurred while submitting payment")
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPlan = plans.find(plan => plan.id.toString() === selectedPlanId)

  if (loading || loadingPlans) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Card className="text-center shadow-lg">
            <CardContent className="pt-8 pb-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-50 rounded-full">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Your payment has been submitted for verification. We'll notify you once it's approved.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-blue-900">What's Next?</p>
                    <p className="text-sm text-blue-700">
                      Our team will verify your payment within 24-48 hours. You'll receive an email confirmation once approved.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Redirecting to dashboard in a few seconds...
              </p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-medium">Back to Dashboard</span>
              </Link>
            </div>
            <Image src="/matchb-logo.png" alt="MatchB" width={120} height={40} className="h-8 w-auto" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Submit Payment</h1>
              </div>
              <p className="text-gray-600">Submit your payment details for verification and activation</p>
            </div>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Payment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Plan Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="plan" className="text-sm font-medium text-gray-700">
                      Select Plan <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose your subscription plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            <div className="flex justify-between items-center w-full">
                              <span>{plan.name}</span>
                              <span className="text-sm text-gray-500 ml-4">
                                ₹{plan.price} / {plan.duration_months}mo
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Selected Plan Summary */}
                  {selectedPlan && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-blue-900 mb-1">{selectedPlan.name}</h3>
                          <p className="text-sm text-blue-700 mb-2">{selectedPlan.description}</p>
                          <div className="text-sm text-blue-600">
                            <p><span className="font-medium">Price:</span> ₹{selectedPlan.price}</p>
                            <p><span className="font-medium">Duration:</span> {selectedPlan.duration_months} month(s)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">₹{selectedPlan.price}</div>
                          <div className="text-sm text-blue-600">{selectedPlan.duration_months} month(s)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transaction ID */}
                  <div className="space-y-3">
                    <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                      Transaction ID / Reference Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="transactionId"
                      type="text"
                      placeholder="e.g., TXN123456789 or REF987654321"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="h-11"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Enter the reference number you received after making the UPI payment
                    </p>
                  </div>

                  {/* Payment Screenshot */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      Payment Screenshot <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <FileUpload
                        onUpload={(url) => setScreenshot(url)}
                        currentImage={screenshot}
                        acceptedTypes="image/*"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Upload a screenshot of your payment confirmation for faster verification
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 font-medium"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Upload className="h-5 w-5 mr-2 animate-spin" />
                        Submitting Payment...
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5 mr-2" />
                        Submit for Verification
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* Verification Process */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Info className="h-5 w-5 text-blue-600 mr-2" />
                  Verification Process
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">1</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Submit Details</p>
                      <p className="text-xs text-gray-500">Provide transaction ID and screenshot</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Verification</p>
                      <p className="text-xs text-gray-500">Our team verifies your payment (24-48 hrs)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Activation</p>
                      <p className="text-xs text-gray-500">Your plan gets activated automatically</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Notes */}
            <Card className="shadow-sm border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-base text-amber-800">Important Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-amber-700 space-y-2">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Ensure the transaction ID is accurate and complete
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    Payment amount should match the selected plan
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    You'll receive email confirmation once verified
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <HelpCircle className="h-5 w-5 text-gray-600 mr-2" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Having trouble with payment submission? Our support team is here to help.
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

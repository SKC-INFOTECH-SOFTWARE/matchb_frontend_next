"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle, XCircle, Eye, Edit, Plus, Minus,
  AlertTriangle, TrendingUp, Clock, Zap, Activity, RefreshCw, Settings, PhoneCall, CreditCard, Users
} from "lucide-react"

// Number formatting utility function
const formatNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (numValue > Number.MAX_SAFE_INTEGER) {
    return 'Error: Number too large';
  }
  return Math.floor(numValue).toLocaleString('en-IN');
};

interface CallSubscription {
  id: number
  user_id: number
  user_name: string
  user_email: string
  user_phone: string
  user_photo: string
  plan_name: string
  plan_id: number
  credits_purchased: number
  credits_remaining: number
  credits_used: number
  amount_paid: number
  payment_status: 'pending' | 'verified' | 'rejected'
  payment_screenshot: string
  transaction_id: string
  admin_notes: string
  expires_at: string
  created_at: string
  verified_at: string
  verified_by: string
  is_active: boolean
  total_call_duration: number
  total_calls_made: number
}

interface ExotelCredit {
  total_credits: number
  used_credits: number
  remaining_credits: number
  cost_per_minute: number
  monthly_limit: number
  current_month_usage: number
  last_updated: string
}

interface CreditDistribution {
  user_id: number
  user_name: string
  allocated_credits: number
  used_credits: number
  remaining_credits: number
  last_call: string
  status: 'active' | 'expired' | 'suspended'
}

export default function CallSubscriptions() {
  const [activeTab, setActiveTab] = useState("subscriptions")
  const [callSubscriptions, setCallSubscriptions] = useState<CallSubscription[]>([])
  const [exotelCredit, setExotelCredit] = useState<ExotelCredit | null>(null)
  const [creditDistributions, setCreditDistributions] = useState<CreditDistribution[]>([])
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true)
  const [loadingExotelCredit, setLoadingExotelCredit] = useState(true)
  const [loadingDistributions, setLoadingDistributions] = useState(true)
  
  const [verifyDialog, setVerifyDialog] = useState<{
    open: boolean
    subscription: CallSubscription | null
    action: 'verify' | 'reject' | null
    adminNotes: string
  }>({
    open: false,
    subscription: null,
    action: null,
    adminNotes: ""
  })

  const [creditDialog, setCreditDialog] = useState<{
    open: boolean
    userId: number
    userName: string
    currentCredits: number
    newCredits: string
    action: 'add' | 'remove' | 'set'
    reason: string
  }>({
    open: false,
    userId: 0,
    userName: "",
    currentCredits: 0,
    newCredits: "",
    action: 'add',
    reason: ""
  })

  const [exotelDialog, setExotelDialog] = useState<{
    open: boolean
    newLimit: string
    costPerMinute: string
    monthlyLimit: string
  }>({
    open: false,
    newLimit: "",
    costPerMinute: "",
    monthlyLimit: ""
  })

  const [filters, setFilters] = useState({
    search: "",
    paymentStatus: "all",
    subscriptionStatus: "all"
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    await Promise.all([
      fetchCallSubscriptions(),
      fetchExotelCredit(),
      fetchCreditDistributions()
    ])
  }

  const fetchCallSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/call-subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCallSubscriptions(data.subscriptions || [])
      } else {
        throw new Error("Failed to fetch call subscriptions")
      }
    } catch (error) {
      console.error("Error fetching call subscriptions:", error)
    } finally {
      setLoadingSubscriptions(false)
    }
  }

  const fetchExotelCredit = async () => {
    try {
      setLoadingExotelCredit(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/exotel-credits", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setExotelCredit(data.credits)
      } else {
        throw new Error("Failed to fetch Exotel credits")
      }
    } catch (error) {
      console.error("Error fetching Exotel credits:", error)
    } finally {
      setLoadingExotelCredit(false)
    }
  }

  const fetchCreditDistributions = async () => {
    try {
      setLoadingDistributions(true)
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/credit-distributions", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setCreditDistributions(data.distributions || [])
      } else {
        throw new Error("Failed to fetch credit distributions")
      }
    } catch (error) {
      console.error("Error fetching credit distributions:", error)
    } finally {
      setLoadingDistributions(false)
    }
  }

  const handlePaymentVerification = async () => {
    if (!verifyDialog.subscription || !verifyDialog.action) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/verify-call-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscriptionId: verifyDialog.subscription.id,
          action: verifyDialog.action,
          adminNotes: verifyDialog.adminNotes,
        }),
      })

      if (response.ok) {
        await fetchCallSubscriptions()
        await fetchExotelCredit()
        setVerifyDialog({ open: false, subscription: null, action: null, adminNotes: "" })
      } else {
        throw new Error("Failed to verify payment")
      }
    } catch (error) {
      console.error("Error verifying payment:", error)
    }
  }

  const handleCreditAdjustment = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/adjust-credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: creditDialog.userId,
          action: creditDialog.action,
          credits: parseInt(creditDialog.newCredits),
          reason: creditDialog.reason,
        }),
      })

      if (response.ok) {
        await fetchCreditDistributions()
        await fetchExotelCredit()
        setCreditDialog({
          open: false,
          userId: 0,
          userName: "",
          currentCredits: 0,
          newCredits: "",
          action: 'add',
          reason: ""
        })
      } else {
        throw new Error("Failed to adjust credits")
      }
    } catch (error) {
      console.error("Error adjusting credits:", error)
    }
  }

  const handleExotelSettingsUpdate = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/admin/exotel-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          totalCredits: parseInt(exotelDialog.newLimit),
          costPerMinute: parseFloat(exotelDialog.costPerMinute),
          monthlyLimit: parseInt(exotelDialog.monthlyLimit),
        }),
      })

      if (response.ok) {
        await fetchExotelCredit()
        setExotelDialog({
          open: false,
          newLimit: "",
          costPerMinute: "",
          monthlyLimit: ""
        })
      } else {
        throw new Error("Failed to update Exotel settings")
      }
    } catch (error) {
      console.error("Error updating Exotel settings:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const filteredSubscriptions = callSubscriptions.filter(sub => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!sub.user_name.toLowerCase().includes(searchLower) &&
          !sub.user_email.toLowerCase().includes(searchLower) &&
          !sub.transaction_id.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      if (sub.payment_status !== filters.paymentStatus) {
        return false
      }
    }
    if (filters.subscriptionStatus && filters.subscriptionStatus !== "all") {
      const isActive = sub.is_active && new Date(sub.expires_at) > new Date()
      if (filters.subscriptionStatus === 'active' && !isActive) return false
      if (filters.subscriptionStatus === 'expired' && isActive) return false
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Call Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage subscriptions, payments, and Call credits
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 hover:bg-gray-50"
            onClick={() => {
              if (exotelCredit) {
                setExotelDialog({
                  open: true,
                  newLimit: exotelCredit.total_credits.toString(),
                  costPerMinute: exotelCredit.cost_per_minute.toString(),
                  monthlyLimit: exotelCredit.monthly_limit.toString()
                })
              }
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Stats Cards - Compact Grid */}
        {loadingExotelCredit ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2 text-gray-400" />
            <span className="text-gray-600">Loading credits...</span>
          </div>
        ) : exotelCredit ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Credits</span>
                  <Zap className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(exotelCredit.total_credits)}</div>
                <div className="text-xs text-gray-500 mt-1">Available</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Used</span>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(exotelCredit.used_credits)}</div>
                <Progress 
                  value={Math.round((exotelCredit.used_credits / exotelCredit.total_credits) * 100)} 
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Remaining</span>
                  <Activity className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(exotelCredit.remaining_credits)}</div>
                <div className="text-xs text-gray-500 mt-1">Credits left</div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Monthly</span>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(exotelCredit.current_month_usage)}</div>
                <Progress 
                  value={Math.round((exotelCredit.current_month_usage / exotelCredit.monthly_limit) * 100)} 
                  className="mt-2 h-1"
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">Failed to load credit information</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Tab Buttons */}
          <div className="block sm:hidden mb-4">
            <div className="flex overflow-x-auto space-x-1 pb-2">
              <Button
                variant={activeTab === "subscriptions" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("subscriptions")}
                className="whitespace-nowrap"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Subscriptions ({formatNumber(callSubscriptions.filter(s => s.payment_status === 'pending').length)})
              </Button>
              <Button
                variant={activeTab === "distributions" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("distributions")}
                className="whitespace-nowrap"
              >
                <Users className="h-4 w-4 mr-1" />
                Credits
              </Button>
              <Button
                variant={activeTab === "analytics" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("analytics")}
                className="whitespace-nowrap"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Analytics
              </Button>
            </div>
          </div>

          {/* Desktop Tab List */}
          <TabsList className="hidden sm:grid w-full grid-cols-3 bg-gray-100 border border-gray-200 mb-6">
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden lg:inline">Call Subscriptions</span>
              <span className="lg:hidden">Subscriptions</span>
              ({formatNumber(callSubscriptions.filter(s => s.payment_status === 'pending').length)})
            </TabsTrigger>
            <TabsTrigger value="distributions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Credit Distribution</span>
              <span className="lg:hidden">Credits</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-6">
            <Card className="border-gray-200 bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg text-gray-900">Payment Verification</CardTitle>
                <CardDescription className="text-gray-600">Review and verify call subscription payments</CardDescription>
                
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Input
                    placeholder="Search by name, email, or transaction ID..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="flex-1"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={filters.paymentStatus}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, paymentStatus: value }))}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Payment Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Payments</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.subscriptionStatus}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, subscriptionStatus: value }))}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingSubscriptions ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2 text-gray-400" />
                    <span className="text-gray-600">Loading subscriptions...</span>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredSubscriptions.map((subscription) => (
                      <div
                        key={subscription.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Mobile Layout */}
                        <div className="block sm:hidden p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={subscription.user_photo || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gray-100 text-gray-700">{subscription.user_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-medium text-gray-900 truncate">{subscription.user_name}</h3>
                                <div className="flex flex-col gap-1 ml-2">
                                  <Badge
                                    variant={
                                      subscription.payment_status === "verified"
                                        ? "default"
                                        : subscription.payment_status === "rejected"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {subscription.payment_status}
                                  </Badge>
                                  {subscription.is_active && new Date(subscription.expires_at) > new Date() && (
                                    <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mb-2 truncate">{subscription.user_email}</p>
                              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
                                <span>{subscription.plan_name}</span>
                                <span>₹{formatNumber(subscription.amount_paid)}</span>
                                <span>{formatNumber(subscription.credits_remaining)}/{formatNumber(subscription.credits_purchased)} credits</span>
                                <span>{formatNumber(subscription.total_calls_made)} calls</span>
                              </div>
                              {subscription.expires_at && (
                                <p className="text-xs text-gray-500 mb-2">
                                  Expires: {formatDate(subscription.expires_at)}
                                </p>
                              )}
                              {subscription.admin_notes && (
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mb-2">
                                  {subscription.admin_notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Mobile Actions */}
                          <div className="flex flex-wrap gap-2">
                            {subscription.payment_screenshot && (
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <a href={subscription.payment_screenshot} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </a>
                              </Button>
                            )}
                            {subscription.payment_status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setVerifyDialog({
                                      open: true,
                                      subscription,
                                      action: "verify",
                                      adminNotes: "",
                                    })
                                  }
                                  className="flex-1 bg-gray-900 hover:bg-gray-800"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verify
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setVerifyDialog({
                                      open: true,
                                      subscription,
                                      action: "reject",
                                      adminNotes: "",
                                    })
                                  }
                                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {subscription.payment_status === "verified" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCreditDialog({
                                    open: true,
                                    userId: subscription.user_id,
                                    userName: subscription.user_name,
                                    currentCredits: subscription.credits_remaining,
                                    newCredits: "",
                                    action: 'add',
                                    reason: ""
                                  })
                                }
                                className="w-full"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Adjust Credits
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center justify-between p-6">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={subscription.user_photo || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gray-100 text-gray-700">{subscription.user_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900 truncate">{subscription.user_name}</h3>
                                <Badge
                                  variant={
                                    subscription.payment_status === "verified"
                                      ? "default"
                                      : subscription.payment_status === "rejected"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {subscription.payment_status}
                                </Badge>
                                {subscription.is_active && new Date(subscription.expires_at) > new Date() && (
                                  <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate mb-1">{subscription.user_email}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{subscription.plan_name}</span>
                                <span>₹{formatNumber(subscription.amount_paid)}</span>
                                <span>{formatNumber(subscription.credits_remaining)}/{formatNumber(subscription.credits_purchased)} credits</span>
                                <span className="hidden lg:inline">{formatNumber(subscription.total_calls_made)} calls</span>
                                <span className="hidden xl:inline">{formatDuration(subscription.total_call_duration)}</span>
                              </div>
                              {subscription.expires_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Expires: {formatDate(subscription.expires_at)}
                                </p>
                              )}
                              {subscription.admin_notes && (
                                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-2">
                                  {subscription.admin_notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Desktop Actions */}
                          <div className="flex items-center gap-2">
                            {subscription.payment_screenshot && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={subscription.payment_screenshot} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 mr-1" />
                                  <span className="hidden lg:inline">View</span>
                                </a>
                              </Button>
                            )}
                            {subscription.payment_status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    setVerifyDialog({
                                      open: true,
                                      subscription,
                                      action: "verify",
                                      adminNotes: "",
                                    })
                                  }
                                  className="bg-gray-900 hover:bg-gray-800"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  <span className="hidden lg:inline">Verify</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setVerifyDialog({
                                      open: true,
                                      subscription,
                                      action: "reject",
                                      adminNotes: "",
                                    })
                                  }
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  <span className="hidden lg:inline">Reject</span>
                                </Button>
                              </>
                            )}
                            {subscription.payment_status === "verified" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setCreditDialog({
                                    open: true,
                                    userId: subscription.user_id,
                                    userName: subscription.user_name,
                                    currentCredits: subscription.credits_remaining,
                                    newCredits: "",
                                    action: 'add',
                                    reason: ""
                                  })
                                }
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                <span className="hidden lg:inline">Adjust</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredSubscriptions.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <PhoneCall className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No subscriptions found</h3>
                        <p className="text-sm">No call subscriptions match your current filters</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credit Distributions Tab */}
          <TabsContent value="distributions" className="space-y-6">
            <Card className="border-gray-200 bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-lg text-gray-900">Credit Distribution</CardTitle>
                <CardDescription className="text-gray-600">Monitor and adjust user credit allocations</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {loadingDistributions ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2 text-gray-400" />
                    <span className="text-gray-600">Loading credit distributions...</span>
                  </div>
                ) : creditDistributions.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {creditDistributions.map((distribution) => (
                      <div
                        key={distribution.user_id}
                        className="hover:bg-gray-50 transition-colors p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate">{distribution.user_name}</h3>
                              <Badge
                                variant={
                                  distribution.status === "active"
                                    ? "default"
                                    : distribution.status === "expired"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {distribution.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Allocated: {formatNumber(distribution.allocated_credits)}</span>
                              <span>Used: {formatNumber(distribution.used_credits)}</span>
                              <span>Remaining: {formatNumber(distribution.remaining_credits)}</span>
                              <span className="hidden lg:inline">Last Call: {formatDate(distribution.last_call)}</span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCreditDialog({
                                open: true,
                                userId: distribution.user_id,
                                userName: distribution.user_name,
                                currentCredits: distribution.remaining_credits,
                                newCredits: "",
                                action: 'add',
                                reason: ""
                              })
                            }
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="hidden lg:inline">Adjust</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No credit distributions found</h3>
                    <p className="text-sm">No credit allocations available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{formatNumber(callSubscriptions.filter(s => s.payment_status === 'verified')
                      .reduce((sum, s) => sum + s.amount_paid, 0))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">From call plans</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Active Subscribers</span>
                    <Users className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(callSubscriptions.filter(s => s.is_active && new Date(s.expires_at) > new Date()).length)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Currently active</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Total Calls</span>
                    <PhoneCall className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(callSubscriptions.reduce((sum, s) => sum + s.total_calls_made, 0))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">All time</p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Call Duration</span>
                    <Clock className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDuration(callSubscriptions.reduce((sum, s) => sum + s.total_call_duration, 0))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total duration</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Verification Dialog */}
        <Dialog open={verifyDialog.open} onOpenChange={(open) => setVerifyDialog({ ...verifyDialog, open })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {verifyDialog.action === "verify" ? "Verify Payment" : "Reject Payment"}
              </DialogTitle>
              <DialogDescription>
                {verifyDialog.action === "verify"
                  ? "Confirm payment verification to activate call credits"
                  : "Provide reason for rejecting this payment"}
              </DialogDescription>
            </DialogHeader>
            {verifyDialog.subscription && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">{verifyDialog.subscription.user_name}</h3>
                  <p className="text-sm text-gray-600">{verifyDialog.subscription.user_email}</p>
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>Plan: {verifyDialog.subscription.plan_name} - ₹{formatNumber(verifyDialog.subscription.amount_paid)}</p>
                    <p>Credits: {formatNumber(verifyDialog.subscription.credits_purchased)}</p>
                    <p>Transaction: {verifyDialog.subscription.transaction_id}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Admin Notes</Label>
                  <Textarea
                    value={verifyDialog.adminNotes}
                    onChange={(e) => setVerifyDialog({ ...verifyDialog, adminNotes: e.target.value })}
                    placeholder={
                      verifyDialog.action === "verify"
                        ? "Add any verification notes..."
                        : "Provide reason for rejection..."
                    }
                    rows={3}
                    className="mt-2"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setVerifyDialog({ open: false, subscription: null, action: null, adminNotes: "" })}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePaymentVerification}
                    className={verifyDialog.action === "verify" ? "bg-gray-900 hover:bg-gray-800" : "bg-red-600 hover:bg-red-700"}
                  >
                    {verifyDialog.action === "verify" ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify & Activate
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Payment
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Credit Adjustment Dialog */}
        <Dialog open={creditDialog.open} onOpenChange={(open) => setCreditDialog({ ...creditDialog, open })}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {creditDialog.action === 'add' ? 'Add Credits' : 
                 creditDialog.action === 'remove' ? 'Remove Credits' : 'Set Credits'}
              </DialogTitle>
              <DialogDescription>
                Manually adjust call credits for {creditDialog.userName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Current Credits:</span>
                  <span className="text-lg font-bold text-gray-900">{formatNumber(creditDialog.currentCredits)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={creditDialog.action === 'add' ? 'default' : 'outline'}
                  onClick={() => setCreditDialog({ ...creditDialog, action: 'add' })}
                  className="flex items-center justify-center gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
                <Button
                  variant={creditDialog.action === 'remove' ? 'default' : 'outline'}
                  onClick={() => setCreditDialog({ ...creditDialog, action: 'remove' })}
                  className="flex items-center justify-center gap-2"
                  size="sm"
                >
                  <Minus className="h-4 w-4" />
                  Remove
                </Button>
                <Button
                  variant={creditDialog.action === 'set' ? 'default' : 'outline'}
                  onClick={() => setCreditDialog({ ...creditDialog, action: 'set' })}
                  className="flex items-center justify-center gap-2"
                  size="sm"
                >
                  <Edit className="h-4 w-4" />
                  Set
                </Button>
              </div>
              <div>
                <Label className="text-sm font-medium">
                  {creditDialog.action === 'add' ? 'Credits to Add' : 
                   creditDialog.action === 'remove' ? 'Credits to Remove' : 'New Credit Amount'}
                </Label>
                <Input
                  type="number"
                  value={creditDialog.newCredits}
                  onChange={(e) => setCreditDialog({ ...creditDialog, newCredits: e.target.value })}
                  placeholder="Enter number of credits"
                  min="1"
                  max={creditDialog.action === 'remove' ? creditDialog.currentCredits : undefined}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Reason for Adjustment</Label>
                <Textarea
                  value={creditDialog.reason}
                  onChange={(e) => setCreditDialog({ ...creditDialog, reason: e.target.value })}
                  placeholder="Provide reason for credit adjustment..."
                  rows={3}
                  className="mt-2"
                />
              </div>
              {creditDialog.newCredits && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Result:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatNumber(
                        creditDialog.action === 'add' 
                          ? creditDialog.currentCredits + parseInt(creditDialog.newCredits || '0')
                          : creditDialog.action === 'remove'
                          ? Math.max(0, creditDialog.currentCredits - parseInt(creditDialog.newCredits || '0'))
                          : parseInt(creditDialog.newCredits || '0')
                      )} credits
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCreditDialog({
                    open: false,
                    userId: 0,
                    userName: "",
                    currentCredits: 0,
                    newCredits: "",
                    action: 'add',
                    reason: ""
                  })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreditAdjustment}
                  disabled={!creditDialog.newCredits || !creditDialog.reason.trim()}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Exotel Settings Dialog */}
        <Dialog open={exotelDialog.open} onOpenChange={(open) => setExotelDialog({ ...exotelDialog, open })}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Call Credit Settings</DialogTitle>
              <DialogDescription>
                Configure Call credit limits and pricing
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Changes to Call settings will affect all future call allocations. Current active credits will remain unchanged.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Credit Limit</Label>
                  <Input
                    type="number"
                    value={exotelDialog.newLimit}
                    onChange={(e) => setExotelDialog({ ...exotelDialog, newLimit: e.target.value })}
                    placeholder="10000"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total Call credits available</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cost per Minute (₹)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={exotelDialog.costPerMinute}
                    onChange={(e) => setExotelDialog({ ...exotelDialog, costPerMinute: e.target.value })}
                    placeholder="1.0"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Charging rate per minute</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Monthly Usage Limit</Label>
                <Input
                  type="number"
                  value={exotelDialog.monthlyLimit}
                  onChange={(e) => setExotelDialog({ ...exotelDialog, monthlyLimit: e.target.value })}
                  placeholder="5000"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum credits that can be used per month</p>
              </div>
              {exotelCredit && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Current Settings:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Credits:</span>
                      <span className="font-medium text-gray-900">{formatNumber(exotelCredit.total_credits)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost/Min:</span>
                      <span className="font-medium text-gray-900">₹{exotelCredit.cost_per_minute.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly Limit:</span>
                      <span className="font-medium text-gray-900">{formatNumber(exotelCredit.monthly_limit)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-gray-900">{formatDate(exotelCredit.last_updated)}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setExotelDialog({
                    open: false,
                    newLimit: "",
                    costPerMinute: "",
                    monthlyLimit: ""
                  })}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExotelSettingsUpdate}
                  disabled={!exotelDialog.newLimit || !exotelDialog.costPerMinute || !exotelDialog.monthlyLimit}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Update Settings
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
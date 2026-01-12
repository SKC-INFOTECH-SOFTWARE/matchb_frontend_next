"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, CreditCard, Heart, Settings, PhoneCall, Ban, Search } from "lucide-react"
import Image from "next/image"
import AdminLogin from "@/components/admin/AdminLogin"
import StatsCards from "@/components/admin/StatsCards"
import ProfileFilters from "@/components/admin/ProfileFilters"
import ProfileList from "@/components/admin/ProfileList"
import PaymentList from "@/components/admin/PaymentList"
import Matchmaking from "@/components/admin/Matchmaking"
import ProfileViewDialog from "@/components/admin/ProfileViewDialog"
import ProfileApprovalDialog from "@/components/admin/ProfileApprovalDialog"
import PaymentVerificationDialog from "@/components/admin/PaymentVerificationDialog"
import AdminSettings from "@/components/admin/AdminSettings"
import CallSubscriptions from "@/components/admin/CallSubscriptions"
import UserCallLogs from "@/components/admin/UserCallLogs"
import AdminBlocksManagement from "@/components/admin/AdminBlockManagement"
import AdminSearchVisibilityManager from "@/components/admin/AdminSearchVisibilityManager"
import { UserProfile, Payment, PotentialMatch, CurrentMatch } from "@/components/admin/types"
import { fetchProfiles, fetchStats, fetchPayments, fetchMatches, handleProfileApproval, handlePaymentVerification, updateUserStatus, createMatches, removeMatch } from "@/components/admin/api"
import { Button } from "@/components/ui/button"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profiles")
  const [callSubTab, setCallSubTab] = useState("subscriptions")
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([])
  const [currentMatches, setCurrentMatches] = useState<CurrentMatch[]>([])
  const [selectedMatches, setSelectedMatches] = useState<number[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [viewDialog, setViewDialog] = useState<{
    open: boolean
    profile: UserProfile | null
  }>({
    open: false,
    profile: null,
  })
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    maleUsers: 0,
    femaleUsers: 0,
  })
  const [filters, setFilters] = useState({
    search: "",
    caste: "",
    ageMin: "",
    ageMax: "",
    state: "",
    gender: "",
    status: "",
  })
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean
    profile: UserProfile | null
    action: "approve" | "reject" | null
    rejectionReason: string
  }>({
    open: false,
    profile: null,
    action: null,
    rejectionReason: "",
  })
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean
    payment: Payment | null
    action: "verify" | "reject" | null
    adminNotes: string
  }>({
    open: false,
    payment: null,
    action: null,
    adminNotes: "",
  })

  useEffect(() => {
    if (user?.role === "admin" && !loading) {
      setLoadingProfiles(true)
      setLoadingPayments(true)
      Promise.all([fetchProfiles(), fetchStats(), fetchPayments()]).then(([profilesData, statsData, paymentsData]) => {
        setProfiles(profilesData)
        setFilteredProfiles(profilesData)
        setStats(statsData)
        setPayments(paymentsData)
        setLoadingProfiles(false)
        setLoadingPayments(false)
        setError(null)
      }).catch(() => {
        setError("Network error while fetching data. Please check your connection.")
        setLoadingProfiles(false)
        setLoadingPayments(false)
      })
    }
  }, [user, loading])

  useEffect(() => {
    let filtered = profiles

    if (filters.search) {
      filtered = filtered.filter(
        (profile) =>
          profile.name &&
          (profile.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            profile.email.toLowerCase().includes(filters.search.toLowerCase()))
      )
    }

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((profile) => profile.status === filters.status)
    }

    if (filters.caste && filters.caste !== "all") {
      filtered = filtered.filter((profile) => {
        if (profile.status === 'incomplete_registration') return false
        return profile.caste === filters.caste
      })
    }

    if (filters.ageMin) {
      filtered = filtered.filter((profile) => {
        if (profile.status === 'incomplete_registration') return false
        return profile.age >= Number.parseInt(filters.ageMin)
      })
    }

    if (filters.ageMax) {
      filtered = filtered.filter((profile) => {
        if (profile.status === 'incomplete_registration') return false
        return profile.age <= Number.parseInt(filters.ageMax)
      })
    }

    if (filters.state && filters.state !== "all") {
      filtered = filtered.filter((profile) => {
        if (profile.status === 'incomplete_registration') return false
        return profile.state === filters.state
      })
    }

    if (filters.gender && filters.gender !== "all") {
      filtered = filtered.filter((profile) => {
        if (profile.status === 'incomplete_registration') return false
        return profile.gender === filters.gender
      })
    }

    setFilteredProfiles(filtered)
  }, [filters, profiles])

  const handleFetchMatches = async (userId: number) => {
    setLoadingMatches(true)
    const data = await fetchMatches(userId)
    setPotentialMatches(data.potentialMatches || [])
    setCurrentMatches(data.currentMatches || [])
    setUserProfile(data.userProfile || null)
    setLoadingMatches(false)
  }

  const handleCreateMatches = async () => {
    if (!selectedUserId || selectedMatches.length === 0) return
    const success = await createMatches(selectedUserId, selectedMatches)
    if (success) {
      handleFetchMatches(selectedUserId)
      setSelectedMatches([])
    }
  }

  const handleRemoveMatch = async (matchedUserId: number) => {
    if (!selectedUserId) return
    const success = await removeMatch(selectedUserId, matchedUserId)
    if (success) {
      handleFetchMatches(selectedUserId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return <AdminLogin />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Responsive */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 sm:py-4 gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Image
                src="/matchb-logo.png"
                alt="MatchB"
                width={120}
                height={40}
                className="h-6 sm:h-8 w-auto"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Manage matrimonial profiles and system
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 truncate">
                Welcome, {user?.name}
              </span>
              <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                <span className="hidden sm:inline">Back to Site</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4 sm:mb-6">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Tabs - Responsive */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile Tab List - Scrollable */}
          <div className="block sm:hidden mb-6">
            <div className="flex overflow-x-auto space-x-2 pb-2 snap-x snap-mandatory scrollbar-hide">
              <Button
                variant={activeTab === "profiles" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("profiles")}
                className="whitespace-nowrap min-w-[100px] snap-start"
              >
                <Users className="h-4 w-4 mr-1" />
                Profiles
              </Button>
              <Button
                variant={activeTab === "payments" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("payments")}
                className="whitespace-nowrap min-w-[100px] snap-start"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Payments
              </Button>
              <Button
                variant={activeTab === "matches" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("matches")}
                className="whitespace-nowrap min-w-[100px] snap-start"
              >
                <Heart className="h-4 w-4 mr-1" />
                Matches
              </Button>
              <Button
                variant={activeTab === "call-subscriptions" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("call-subscriptions")}
                className="whitespace-nowrap min-w-[100px] snap-start"
              >
                <PhoneCall className="h-4 w-4 mr-1" />
                Calls
              </Button>
              <Button
                variant={activeTab === "blocks" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("blocks")}
                className="whitespace-nowrap min-w-[100px] snap-start"
              >
                <Ban className="h-4 w-4 mr-1" />
                Blocks
              </Button>
              <Button
                variant={activeTab === "search-visibility" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("search-visibility")}
                className="whitespace-nowrap min-w-[100px] snap-start"
              >
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
              <Button
                variant={activeTab === "settings" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("settings")}
                className="whitespace-nowrap min-w-[100px] snap-start"
              >
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </div>
          </div>
          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
              scroll-behavior: smooth;
              -webkit-overflow-scrolling: touch;
            }
          `}</style>

          {/* Desktop Tabs */}
          <TabsList className="hidden sm:grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">User Profiles</span>
              <span className="lg:hidden">Profiles</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden lg:inline">Payments</span>
              <span className="lg:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger value="matches" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden lg:inline">Matchmaking</span>
              <span className="lg:hidden">Match</span>
            </TabsTrigger>
            <TabsTrigger value="call-subscriptions" className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4" />
              <span className="hidden lg:inline">Call Subscriptions</span>
              <span className="lg:hidden">Calls</span>
            </TabsTrigger>
            <TabsTrigger value="blocks" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              <span className="hidden lg:inline">Blocked Users</span>
              <span className="lg:hidden">Blocks</span>
            </TabsTrigger>
            <TabsTrigger value="search-visibility" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Search Visibility</span>
              <span className="lg:hidden">Search</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden lg:inline">Settings</span>
              <span className="lg:hidden">Set</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="profiles" className="space-y-4 sm:space-y-6">
            <ProfileFilters profiles={filteredProfiles} filters={filters} setFilters={setFilters} />
            {!loadingProfiles && (
              <ProfileList
                profiles={filteredProfiles}
                setViewDialog={setViewDialog}
                setApprovalDialog={setApprovalDialog}
                updateUserStatus={updateUserStatus}
                setSelectedUserId={setSelectedUserId}
                fetchMatches={handleFetchMatches}
                setActiveTab={setActiveTab}
              />
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 sm:space-y-6">
            <PaymentList
              payments={payments}
              loadingPayments={loadingPayments}
              setPaymentDialog={setPaymentDialog}
            />
          </TabsContent>

          <TabsContent value="matches" className="space-y-4 sm:space-y-6">
            <Matchmaking
              profiles={profiles}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              userProfile={userProfile}
              potentialMatches={potentialMatches}
              currentMatches={currentMatches}
              selectedMatches={selectedMatches}
              setSelectedMatches={setSelectedMatches}
              loadingMatches={loadingMatches}
              fetchMatches={handleFetchMatches}
              handleCreateMatches={handleCreateMatches}
              handleRemoveMatch={handleRemoveMatch}
            />
          </TabsContent>

          <TabsContent value="call-subscriptions" className="space-y-4 sm:space-y-6">
            <Tabs value={callSubTab} onValueChange={setCallSubTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" />
                  <span>Subscriptions</span>
                </TabsTrigger>
                <TabsTrigger value="call-logs" className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4" />
                  <span>Call Logs</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="subscriptions" className="space-y-4">
                <CallSubscriptions />
              </TabsContent>
              <TabsContent value="call-logs" className="space-y-4">
                <UserCallLogs />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Blocks Management Tab */}
          <TabsContent value="blocks" className="space-y-4 sm:space-y-6">
            <AdminBlocksManagement />
          </TabsContent>

          {/* NEW: Search Visibility Management Tab */}
          <TabsContent value="search-visibility" className="space-y-4 sm:space-y-6">
            <AdminSearchVisibilityManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <AdminSettings
              userId={user.id}
              onUserAdded={() => {
                setLoadingProfiles(true)
                Promise.all([fetchProfiles(), fetchStats()]).then(([profilesData, statsData]) => {
                  setProfiles(profilesData)
                  setFilteredProfiles(profilesData)
                  setStats(statsData)
                  setLoadingProfiles(false)
                })
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <ProfileApprovalDialog
        approvalDialog={approvalDialog}
        setApprovalDialog={setApprovalDialog}
        handleProfileApproval={async () => {
          if (!approvalDialog.profile || !approvalDialog.action) return
          const success = await handleProfileApproval(
            approvalDialog.profile.id,
            approvalDialog.action === "approve" ? "approved" : "rejected",
            approvalDialog.rejectionReason
          )
          if (success) {
            setLoadingProfiles(true)
            Promise.all([fetchProfiles(), fetchStats()]).then(([profilesData, statsData]) => {
              setProfiles(profilesData)
              setFilteredProfiles(profilesData)
              setStats(statsData)
              setApprovalDialog({ open: false, profile: null, action: null, rejectionReason: "" })
              setLoadingProfiles(false)
            })
          }
        }}
      />

      <PaymentVerificationDialog
        paymentDialog={paymentDialog}
        setPaymentDialog={setPaymentDialog}
        handlePaymentVerification={async () => {
          if (!paymentDialog.payment || !paymentDialog.action) return
          const success = await handlePaymentVerification(
            paymentDialog.payment.id,
            paymentDialog.action === "verify" ? "verified" : "rejected",
            paymentDialog.adminNotes
          )
          if (success) {
            setLoadingPayments(true)
            fetchPayments().then((paymentsData) => {
              setPayments(paymentsData)
              setPaymentDialog({ open: false, payment: null, action: null, adminNotes: "" })
              setLoadingPayments(false)
            })
          }
        }}
      />

      <ProfileViewDialog viewDialog={viewDialog} setViewDialog={setViewDialog} />
    </div>
  )
}

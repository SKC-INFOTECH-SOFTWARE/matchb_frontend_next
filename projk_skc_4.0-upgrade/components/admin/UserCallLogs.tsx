"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  PhoneCall, PhoneIncoming, PhoneOutgoing, Clock, ChevronLeft, ChevronRight,
  Eye, User, Calendar, Phone, CreditCard, Activity, RefreshCw, Search
} from "lucide-react"

interface CallLog {
  session_id: number
  call_type: 'incoming' | 'outgoing'
  other_party_name: string
  other_party_phone: string
  other_party_photo: string
  status: string
  duration: number
  cost: number
  virtual_number: string
  started_at: string
  ended_at: string
  created_at: string
  caller_name: string
  receiver_name: string
}

interface UserWithCalls {
  id: number
  name: string
  email: string
  phone: string
  profile_photo: string
  outgoing_calls: number
  incoming_calls: number
  total_calls: number
  completed_outgoing: number
  completed_incoming: number
  completed_calls: number
  total_minutes: number
  avg_call_duration: number
  total_cost: number
  last_call_date: string
  credits_remaining: number
  credits_purchased: number
  credits_expire: string
  has_active_credits: boolean
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function UserCallLogs() {
  const [users, setUsers] = useState<UserWithCalls[]>([])
  const [callLogs, setCallLogs] = useState<CallLog[]>([])
  const [selectedUser, setSelectedUser] = useState<UserWithCalls | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [usersPagination, setUsersPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0
  })
  
  const [logsPagination, setLogsPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [usersPagination.page])

  useEffect(() => {
    if (selectedUser) {
      fetchUserCallLogs(selectedUser.id)
    }
  }, [selectedUser, logsPagination.page])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `/api/admin/user-call-logs?page=${usersPagination.page}&limit=${usersPagination.limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setUsersPagination(prev => ({ ...prev, ...data.pagination }))
        setError(null)
      } else {
        setError("Failed to fetch users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      setError("Network error while fetching users")
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchUserCallLogs = async (userId: number) => {
    setLoadingLogs(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `/api/admin/user-call-logs?userId=${userId}&page=${logsPagination.page}&limit=${logsPagination.limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.ok) {
        const data = await response.json()
        setCallLogs(data.callLogs || [])
        setLogsPagination(prev => ({ ...prev, ...data.pagination }))
        setError(null)
      } else {
        setError("Failed to fetch call logs")
      }
    } catch (error) {
      console.error("Error fetching call logs:", error)
      setError("Network error while fetching call logs")
    } finally {
      setLoadingLogs(false)
    }
  }

  const formatDate = (dateString: string | null, fallbackDate: string | null) => {
    const date = dateString && !isNaN(new Date(dateString).getTime()) 
      ? new Date(dateString) 
      : (fallbackDate && !isNaN(new Date(fallbackDate).getTime()) 
          ? new Date(fallbackDate) 
          : null)
    if (!date) return "N/A"
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: "default" as const, label: "Completed" },
      busy: { variant: "destructive" as const, label: "Busy" },
      "no-answer": { variant: "secondary" as const, label: "No Answer" },
      failed: { variant: "destructive" as const, label: "Failed" },
      initiated: { variant: "secondary" as const, label: "Initiated" },
      ringing: { variant: "secondary" as const, label: "Ringing" },
      "in_progress": { variant: "default" as const, label: "In Progress" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { variant: "secondary" as const, label: status }

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    )
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  )

  const handleViewLogs = (user: UserWithCalls) => {
    setSelectedUser(user)
    setLogsPagination({ page: 1, limit: 20, total: 0, totalPages: 0 })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users List */}
      <Card>
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Users with Call Activity</CardTitle>
              <CardDescription className="text-sm">
                Click on any user to view their detailed call history
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={loadingUsers}
              >
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-2">Refresh</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading users...
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="border rounded-lg hover:shadow-md transition-shadow bg-white/50"
                  >
                    {/* Mobile Layout */}
                    <div className="block sm:hidden p-3">
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src={user.profile_photo || "/placeholder.svg"} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                            <div className="flex items-center gap-1 ml-2">
                              {user.has_active_credits && (
                                <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 truncate">{user.email}</p>
                          <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mb-2">
                            <span>Total: {user.total_calls}</span>
                            <span>Completed: {user.completed_calls}</span>
                            <span>Minutes: {user.total_minutes}</span>
                            <span>Credits: {user.credits_remaining}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            Last call: {user.last_call_date ? formatDate(user.last_call_date, null) : 'Never'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleViewLogs(user)}
                        className="w-full text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Call History
                      </Button>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Avatar className="h-14 w-14 flex-shrink-0">
                          <AvatarImage src={user.profile_photo || "/placeholder.svg"} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate">{user.name}</h3>
                            {user.has_active_credits && (
                              <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                                Active Credits
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate mb-2">{user.email}</p>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <PhoneCall className="h-3 w-3" />
                              <span>Total: {user.total_calls}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              <span>Completed: {user.completed_calls}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>Minutes: {user.total_minutes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" />
                              <span>Credits: {user.credits_remaining}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Last call: {user.last_call_date ? formatDate(user.last_call_date, null) : 'Never'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleViewLogs(user)}
                        className="flex-shrink-0"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Logs
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Users Pagination */}
              {usersPagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Page {usersPagination.page} of {usersPagination.totalPages} 
                    ({usersPagination.total} total users)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={usersPagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUsersPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={usersPagination.page === usersPagination.totalPages}
                    >
                      <span className="hidden sm:inline mr-1">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {filteredUsers.length === 0 && !loadingUsers && (
                <div className="text-center py-8 text-gray-500">
                  <PhoneCall className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No call activity found</h3>
                  <p className="text-sm">No users have made or received calls yet</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Call Logs Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[70vh] overflow-y-auto p-4">
          <DialogHeader className="mb-2">
            <DialogTitle className="flex items-center gap-1 text-base">
              <User className="h-4 w-4" />
              {selectedUser?.name}'s Calls
            </DialogTitle>
            <DialogDescription className="text-xs">
              Call history and key metrics
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3">
              {/* User Summary */}
              <div className="flex items-center justify-between bg-gray-50 rounded-md p-2 text-xs">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.profile_photo || "/placeholder.svg"} />
                    <AvatarFallback>{selectedUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-gray-500">{selectedUser.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-gray-600">
                  <div><span className="font-medium">{selectedUser.total_calls}</span> Calls</div>
                  <div><span className="font-medium">{selectedUser.completed_calls}</span> Completed</div>
                  <div><span className="font-medium">{selectedUser.total_minutes}</span> Min</div>
                  <div><span className="font-medium">{selectedUser.credits_remaining}</span> Credits</div>
                </div>
              </div>

              {/* Call Logs Table */}
              {loadingLogs ? (
                <div className="flex items-center justify-center py-6">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Loading...
                </div>
              ) : (
                <>
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="text-xs">
                          <TableHead className="w-20">Type</TableHead>
                          <TableHead>Other Party</TableHead>
                          <TableHead className="w-24">Status</TableHead>
                          <TableHead className="w-20">Duration</TableHead>
                          <TableHead className="w-32">Date/Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {callLogs.map((log) => (
                          <TableRow key={log.session_id} className="text-xs">
                            <TableCell>
                              {log.call_type === 'outgoing' ? (
                                <PhoneOutgoing className="h-3 w-3 text-green-600" />
                              ) : (
                                <PhoneIncoming className="h-3 w-3 text-blue-600" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={log.other_party_photo || "/placeholder.svg"} />
                                  <AvatarFallback>{log.other_party_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-xs">{log.other_party_name}</p>
                                  <p className="text-[10px] text-gray-500">{log.other_party_phone}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(log.status)}</TableCell>
                            <TableCell>{formatDuration(log.duration)}</TableCell>
                            <TableCell>{formatDate(log.started_at, log.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Call Logs Empty State */}
                  {callLogs.length === 0 && !loadingLogs && (
                    <div className="text-center py-4 text-gray-500">
                      <Phone className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No call logs found for this user.</p>
                    </div>
                  )}

                  {/* Call Logs Pagination */}
                  {logsPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <p className="text-gray-600">
                        Page {logsPagination.page}/{logsPagination.totalPages} 
                        ({logsPagination.total} calls)
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogsPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={logsPagination.page === 1}
                        >
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLogsPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={logsPagination.page === logsPagination.totalPages}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
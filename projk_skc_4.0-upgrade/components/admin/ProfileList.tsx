import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, CheckCircle, XCircle, Ban, Heart, Calendar, MapPin, MoreVertical, Users, UserCheck, AlertTriangle, Phone, Mail, Key } from "lucide-react"
import { UserProfile } from "./types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProfileListProps {
  profiles: UserProfile[]
  setViewDialog: (dialog: { open: boolean; profile: UserProfile | null }) => void
  setApprovalDialog: (dialog: {
    open: boolean
    profile: UserProfile | null
    action: "approve" | "reject" | null
    rejectionReason: string
  }) => void
  updateUserStatus: (userId: number, status: string) => void
  setSelectedUserId: (userId: number | null) => void
  fetchMatches: (userId: number) => void
  setActiveTab: (tab: string) => void
}

export default function ProfileList({
  profiles,
  setViewDialog,
  setApprovalDialog,
  updateUserStatus,
  setSelectedUserId,
  fetchMatches,
  setActiveTab,
}: ProfileListProps) {
  // Helper function to get user status from the user object
  const getUserStatus = (profile: UserProfile) => {
    return (profile as any).user_status || 'active';
  }

  // Helper function to check if this is an incomplete registration
  const isIncompleteRegistration = (profile: UserProfile) => {
    return (profile as any).is_incomplete_registration === true || profile.status === 'incomplete_registration';
  }

  // Helper function to get appropriate badge variant for status
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "incomplete_registration":
        return "outline"
      default:
        return "secondary"
    }
  }

  // Helper function to get status display text
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "incomplete_registration":
        return "Not Completed"
      case "approved":
        return "Approved"
      case "rejected":
        return "Rejected"
      case "pending":
        return "Pending"
      default:
        return status
    }
  }

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="text-base sm:text-lg">All User Registrations</CardTitle>
        <p className="text-sm text-gray-600">Manage complete profiles and incomplete registrations</p>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
        <div className="space-y-3 sm:space-y-4">
          {profiles.map((profile) => {
            const userStatus = getUserStatus(profile);
            const isIncomplete = isIncompleteRegistration(profile);
            
            return (
              <div
                key={profile.id}
                className={`border rounded-lg hover:bg-gray-50 transition-colors ${
                  userStatus === 'banned' ? 'border-red-200 bg-red-50' : ''
                } ${
                  isIncomplete ? 'border-orange-200 bg-orange-50' : ''
                }`}
              >
                {/* Mobile Layout */}
                <div className="block sm:hidden p-3">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={profile.profile_photo || "/placeholder.svg"} />
                      <AvatarFallback>
                        {isIncomplete ? (
                          <AlertTriangle className="h-6 w-6 text-orange-500" />
                        ) : (
                          profile.name?.charAt(0) || '?'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium truncate text-sm">
                          {profile.name || 'Unknown User'}
                          {isIncomplete && (
                            <span className="ml-1 text-orange-500">
                              (Incomplete)
                            </span>
                          )}
                        </h3>
                        <div className="flex gap-1">
                          <Badge
                            variant={getStatusBadgeVariant(profile.status)}
                            className="text-xs"
                          >
                            {getStatusDisplay(profile.status)}
                          </Badge>
                          {userStatus === 'banned' && (
                            <Badge variant="destructive" className="text-xs">
                              Banned
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Contact Information - More prominent for incomplete registrations */}
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{profile.email}</span>
                        </div>
                        
                        {profile.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{profile.phone}</span>
                          </div>
                        )}
                        
                        {(profile as any).recovery_password && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Key className="h-3 w-3" />
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {(profile as any).recovery_password}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Profile Details - Only show if profile is complete */}
                      {!isIncomplete && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {profile.age}y
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {profile.city}
                          </span>
                          <span>{profile.gender}</span>
                          <span>{profile.caste}</span>
                        </div>
                      )}
                      
                      {profile.status === "rejected" && profile.rejection_reason && (
                        <p className="text-xs text-red-600 mt-2 bg-red-50 p-2 rounded">
                          Reason: {profile.rejection_reason}
                        </p>
                      )}
                      
                      {isIncomplete && (
                        <p className="text-xs text-orange-600 mt-2 bg-orange-50 p-2 rounded">
                          User registered but hasn't completed their profile yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewDialog({ open: true, profile })}
                      className="flex-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>

                    {profile.status === "pending" && userStatus !== 'banned' && !isIncomplete && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            setApprovalDialog({
                              open: true,
                              profile,
                              action: "approve",
                              rejectionReason: "",
                            })
                          }
                          className="flex-1 text-xs"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setApprovalDialog({
                              open: true,
                              profile,
                              action: "reject",
                              rejectionReason: "",
                            })
                          }
                          className="flex-1 text-xs"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {profile.status === "approved" && userStatus !== 'banned' && !isIncomplete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(profile.user_id)
                          fetchMatches(profile.user_id)
                          setActiveTab("matches")
                        }}
                        className="flex-1 text-xs"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        Match
                      </Button>
                    )}

                    {userStatus !== 'banned' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateUserStatus(profile.user_id, "banned")}
                        className="flex-1 text-xs"
                      >
                        <Ban className="h-3 w-3 mr-1" />
                        Ban
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateUserStatus(profile.user_id, "active")}
                        className="flex-1 text-xs"
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        Unban
                      </Button>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between p-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarImage src={profile.profile_photo || "/placeholder.svg"} />
                      <AvatarFallback>
                        {isIncomplete ? (
                          <AlertTriangle className="h-6 w-6 text-orange-500" />
                        ) : (
                          profile.name?.charAt(0) || '?'
                        )}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">
                          {profile.name || 'Unknown User'}
                          {isIncomplete && (
                            <span className="ml-2 text-orange-500 text-sm">
                              (Incomplete Registration)
                            </span>
                          )}
                        </h3>
                        <Badge
                          variant={getStatusBadgeVariant(profile.status)}
                        >
                          {getStatusDisplay(profile.status)}
                        </Badge>
                        {userStatus === 'banned' && (
                          <Badge variant="destructive">
                            Banned
                          </Badge>
                        )}
                      </div>
                      
                      {/* Contact Information */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {profile.email}
                        </span>
                        {profile.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {profile.phone}
                          </span>
                        )}
                        {(profile as any).recovery_password && (
                          <span className="flex items-center gap-1">
                            <Key className="h-3 w-3" />
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {(profile as any).recovery_password}
                            </code>
                          </span>
                        )}
                      </div>
                      
                      {/* Profile Details - Only for complete profiles */}
                      {!isIncomplete && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {profile.age} years
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {profile.city}, {profile.state}
                          </span>
                          <span className="hidden lg:inline">{profile.caste}</span>
                          <span className="hidden lg:inline">{profile.occupation}</span>
                          <span>{profile.gender}</span>
                        </div>
                      )}
                      
                      {profile.status === "rejected" && profile.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">Reason: {profile.rejection_reason}</p>
                      )}
                      
                      {isIncomplete && (
                        <p className="text-sm text-orange-600 mt-1">
                          Registered on {new Date((profile as any).user_created_at).toLocaleDateString()} but profile not completed
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Desktop Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewDialog({ open: true, profile })}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="hidden lg:inline">View</span>
                    </Button>

                    {profile.status === "pending" && userStatus !== 'banned' && !isIncomplete && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            setApprovalDialog({
                              open: true,
                              profile,
                              action: "approve",
                              rejectionReason: "",
                            })
                          }
                          className="hidden md:inline-flex"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setApprovalDialog({
                              open: true,
                              profile,
                              action: "reject",
                              rejectionReason: "",
                            })
                          }
                          className="hidden md:inline-flex"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {profile.status === "approved" && userStatus !== 'banned' && !isIncomplete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(profile.user_id)
                          fetchMatches(profile.user_id)
                          setActiveTab("matches")
                        }}
                        className="hidden lg:inline-flex"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Create Matches
                      </Button>
                    )}

                    {/* Mobile Overflow Menu */}
                    {(profile.status === "pending" || profile.status === "approved") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="md:hidden">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {profile.status === "pending" && userStatus !== 'banned' && !isIncomplete && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setApprovalDialog({
                                    open: true,
                                    profile,
                                    action: "approve",
                                    rejectionReason: "",
                                  })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  setApprovalDialog({
                                    open: true,
                                    profile,
                                    action: "reject",
                                    rejectionReason: "",
                                  })
                                }
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {profile.status === "approved" && userStatus !== 'banned' && !isIncomplete && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(profile.user_id)
                                fetchMatches(profile.user_id)
                                setActiveTab("matches")
                              }}
                            >
                              <Heart className="h-4 w-4 mr-2" />
                              Create Matches
                            </DropdownMenuItem>
                          )}
                          {userStatus !== 'banned' ? (
                            <DropdownMenuItem
                              onClick={() => updateUserStatus(profile.user_id, "banned")}
                              className="text-red-600"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Ban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => updateUserStatus(profile.user_id, "active")}
                              className="text-green-600"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Unban User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {userStatus !== 'banned' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => updateUserStatus(profile.user_id, "banned")}
                        className="hidden xl:inline-flex"
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ban
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateUserStatus(profile.user_id, "active")}
                        className="hidden xl:inline-flex"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Unban
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {profiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No registrations found</h3>
              <p className="text-sm">No users match your current filters</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
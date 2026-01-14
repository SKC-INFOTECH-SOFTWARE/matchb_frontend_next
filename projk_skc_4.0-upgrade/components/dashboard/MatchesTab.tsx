import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, MapPin, Calendar, User, Star, Crown, Eye, PhoneCall, MessageCircle, Search, Heart, Ban } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserProfile {
  id: number
  name: string
  email: string
  age: number
  gender: string
  city: string
  education: string
  religion: string
  height?: string
  distance?: number
  profile_photo: string
  compatibility_score?: number
  created_by_admin?: boolean
  i_blocked_them?: number
  they_blocked_me?: number
  blocked_by_me_at?: string
  blocked_me_at?: string
  call_allowed?: number
}

interface ActivePlan {
  normal_plan?: { isActive: boolean }
  call_plan?: { isActive: boolean }
}

interface MatchesTabProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  matches: UserProfile[]
  loadingMatches: boolean
  onViewProfile: (profileId: number) => void
  onInitiateCall: (targetUserId: number, targetName: string) => void
  activePlans: ActivePlan
  makingCall: boolean
  onUpgrade: () => void
}

export default function MatchesTab({
  activeTab,
  setActiveTab,
  matches,
  loadingMatches,
  onViewProfile,
  onInitiateCall,
  activePlans,
  makingCall,
  onUpgrade,
}: MatchesTabProps) {
  const [blockingUser, setBlockingUser] = useState<number | null>(null)
  const [localMatches, setLocalMatches] = useState<UserProfile[]>(matches)

  useEffect(() => {
    setLocalMatches(matches)
  }, [matches])

  const handleBlock = async (userId: number) => {
    setBlockingUser(userId)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blockedUserId: userId }),
      })

      if (response.ok) {
        setLocalMatches(prev =>
          prev.map(match =>
            match.id === userId
              ? { ...match, i_blocked_them: 1, blocked_by_me_at: new Date().toISOString(), call_allowed: 0 }
              : match
          )
        )
      }
    } catch (error) {
      console.error("Block error:", error)
    } finally {
      setBlockingUser(null)
    }
  }

  const renderProfileCard = (profile: UserProfile) => {
    const hasNormalPlan = activePlans.normal_plan?.isActive
    const hasCallPlan = activePlans.call_plan?.isActive

    const iBlockedThem = profile.i_blocked_them === 1
    const theyBlockedMe = profile.they_blocked_me === 1
    const isBlocked = iBlockedThem || theyBlockedMe

    // Call is disabled if:
    // 1. User doesn't have call plan
    // 2. Either user blocked the other
    // 3. Admin hasn't allowed call (when blocker wants to call blocked user)
    const callDisabled = !hasCallPlan || makingCall || isBlocked || (iBlockedThem && profile.call_allowed !== 1)

    return (
      <Card
        key={profile.id}
        className={`border ${isBlocked ? 'border-red-200 bg-red-50/30' : 'border-slate-200'} hover:border-rose-300 hover:shadow-md transition-all duration-300 bg-white/95 backdrop-blur-sm group`}
      >
        <CardContent className="p-3">
          {isBlocked && (
            <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded-md flex items-center gap-2">
              <Ban className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-xs text-red-700 font-medium">
                {iBlockedThem && "You blocked this user"}
                {theyBlockedMe && "This user blocked you"}
              </span>
            </div>
          )}

          {iBlockedThem && profile.call_allowed === 1 && (
            <div className="mb-3 p-2 bg-green-100 border border-green-200 rounded-md flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-xs text-green-700 font-medium">
                Admin allowed calling this user
              </span>
            </div>
          )}

          <div className="flex items-start space-x-3">
            <div className="relative flex-shrink-0">
              <Avatar className={`h-12 w-12 border-2 border-white shadow-md ring-1 ${isBlocked ? 'ring-red-200 opacity-60' : 'ring-rose-100 group-hover:ring-rose-200'} transition-all duration-300`}>
                <AvatarImage src={profile.profile_photo} className="object-cover" />
                <AvatarFallback className="text-sm font-bold text-rose-600 bg-gradient-to-br from-rose-50 to-pink-50">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {!isBlocked && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start gap-1 mb-2">
                <h3 className="text-base font-bold text-gray-900 truncate">
                  {profile.name}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {profile.created_by_admin && (
                    <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border-amber-200 text-xs px-1.5 py-0.5">
                      <Crown className="h-2.5 w-2.5 mr-0.5" />
                      Expert
                    </Badge>
                  )}
                  {profile.compatibility_score && (
                    <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 text-xs px-1.5 py-0.5">
                      <Star className="h-2.5 w-2.5 mr-0.5" />
                      {profile.compatibility_score}%
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2 text-xs text-gray-600">
                <div className="flex items-center bg-gray-50 rounded-md px-2 py-1">
                  <Calendar className="h-3 w-3 mr-1 text-blue-500" />
                  <span className="font-medium truncate">{profile.age}y</span>
                </div>
                <div className="flex items-center bg-gray-50 rounded-md px-2 py-1">
                  <User className="h-3 w-3 mr-1 text-purple-500" />
                  <span className="font-medium truncate">{profile.gender}</span>
                </div>
                <div className="flex items-center bg-gray-50 rounded-md px-2 py-1">
                  <MapPin className="h-3 w-3 mr-1 text-rose-500" />
                  <span className="font-medium truncate">{profile.city}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3 text-xs">
                <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                  {profile.education}
                </span>
                <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-xs font-medium">
                  {profile.religion}
                </span>
                {profile.height && (
                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-medium">
                    {profile.height}
                  </span>
                )}
                {profile.distance && (
                  <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-xs font-medium">
                    {profile.distance}km
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button
                  onClick={() => onViewProfile(profile.id)}
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 text-slate-700 font-medium px-3 py-1 h-7 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>

                {!theyBlockedMe && !iBlockedThem && (
                  <Button
                    onClick={() => handleBlock(profile.id)}
                    size="sm"
                    variant="outline"
                    disabled={blockingUser === profile.id}
                    className="border-red-300 text-red-700 hover:bg-red-50 font-medium px-3 py-1 h-7 text-xs"
                  >
                    {blockingUser === profile.id ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 border-t-transparent mr-1"></div>
                    ) : (
                      <Ban className="h-3 w-3 mr-1" />
                    )}
                    Block
                  </Button>
                )}

                <Button
                  onClick={() => onInitiateCall(profile.id, profile.name)}
                  size="sm"
                  className={`font-medium px-3 py-1 h-7 text-xs ${
                    callDisabled
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-sm"
                  }`}
                  disabled={callDisabled}
                  title={
                    isBlocked && profile.call_allowed !== 1
                      ? "Calling disabled - Admin must allow"
                      : !hasCallPlan
                      ? "Upgrade to call"
                      : ""
                  }
                >
                  {makingCall && !callDisabled ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                  ) : (
                    <PhoneCall className="h-3 w-3 mr-1" />
                  )}
                  {callDisabled ? "Locked" : "Call"}
                </Button>

                <Button
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium px-3 py-1 h-7 text-xs shadow-sm"
                  disabled={isBlocked}
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Chat
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-white to-slate-50 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-100 h-10 p-1 rounded-lg">
            <TabsTrigger
              value="matches"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-rose-600 text-slate-600 font-medium rounded-md transition-all duration-200 h-8 text-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">My Matches</span>
              <span className="sm:hidden">Matches</span>
              <Badge className="ml-2 bg-rose-100 text-rose-700 text-xs px-1.5 py-0.5">
                {localMatches.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 text-slate-600 font-medium rounded-md transition-all duration-200 h-8 text-sm"
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Discover</span>
              <span className="sm:hidden">Search</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="matches" className="mt-0">
            {loadingMatches ? (
              <div className="flex justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-500 mx-auto mb-3"></div>
                  <p className="text-gray-500 font-medium text-sm">Finding your matches...</p>
                </div>
              </div>
            ) : localMatches.length > 0 ? (
              <div className="space-y-3">{localMatches.map(renderProfileCard)}</div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gradient-to-br from-rose-100 to-pink-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <Heart className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No matches yet</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
                  Our experts are curating perfect matches for you. Check back soon!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

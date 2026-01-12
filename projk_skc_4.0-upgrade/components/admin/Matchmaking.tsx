import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart , Loader2, Users } from "lucide-react"
import { UserProfile, PotentialMatch, CurrentMatch } from "./types"

interface MatchmakingProps {
  profiles: UserProfile[]
  selectedUserId: number | null
  setSelectedUserId: (userId: number | null) => void
  userProfile: any
  potentialMatches: PotentialMatch[]
  currentMatches: CurrentMatch[]
  selectedMatches: number[]
  setSelectedMatches: (matches: number[]) => void
  loadingMatches: boolean
  fetchMatches: (userId: number) => void
  handleCreateMatches: () => void
  handleRemoveMatch: (matchedUserId: number) => void
}

export default function Matchmaking({
  profiles,
  selectedUserId,
  setSelectedUserId,
  userProfile,
  potentialMatches,
  currentMatches,
  selectedMatches,
  setSelectedMatches,
  loadingMatches,
  fetchMatches,
  handleCreateMatches,
  handleRemoveMatch,
}: MatchmakingProps) {
 return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
          Manual Matchmaking
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
        <div className="space-y-4">
          {/* User Selection */}
          <div>
            <label className="text-sm font-medium">Select User to Create Matches For:</label>
            <Select
              value={selectedUserId?.toString() || ""}
              onValueChange={(value) => {
                const userId = Number.parseInt(value)
                setSelectedUserId(userId)
                fetchMatches(userId)
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {profiles
                  .filter((p) => p.status === "approved")
                  .map((profile) => (
                    <SelectItem key={profile.user_id} value={profile.user_id.toString()}>
                      <span className="truncate">
                        {profile.name || 'Unknown User'} ({profile.age}y, {profile.gender}, {profile.caste})
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected User Info */}
          {selectedUserId && userProfile && (
            <>
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 text-sm sm:text-base">
                  Creating matches for: {(profiles.find((p) => p.user_id === selectedUserId)?.name || 'Unknown User')}
                </h3>
                <p className="text-xs sm:text-sm text-blue-700">
                  {userProfile.age} years, {userProfile.gender}, {userProfile.caste}, {userProfile.state}
                </p>
              </div>

              {/* Loading State */}
              {loadingMatches ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-rose-600" />
                  <p className="text-sm sm:text-base text-gray-600">Loading potential matches...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mobile Layout - Stacked */}
                  <div className="block lg:hidden space-y-6">
                    {/* Potential Matches */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-sm sm:text-base">
                          Potential Matches ({potentialMatches.filter((m) => !m.already_matched).length})
                        </h3>
                        {selectedMatches.length > 0 && (
                          <Button onClick={handleCreateMatches} size="sm" className="text-xs">
                            Create {selectedMatches.length} Match{selectedMatches.length !== 1 ? 'es' : ''}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg">
                        {potentialMatches
                          .filter((match) => !match.already_matched)
                          .map((match) => (
                            <div
                              key={match.id}
                              className="flex items-center space-x-3 p-3 hover:bg-gray-50 border-b last:border-b-0"
                            >
                              <Checkbox
                                checked={selectedMatches.includes(match.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMatches([...selectedMatches, match.id])
                                  } else {
                                    setSelectedMatches(selectedMatches.filter((id) => id !== match.id))
                                  }
                                }}
                              />
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={match.profile_photo || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {match.name && match.name.length > 0 ? match.name.charAt(0) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{match.name || 'Unknown User'}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {match.age}y, {match.caste}, {match.city}, {match.state}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{match.occupation}</p>
                              </div>
                            </div>
                          ))}
                        {potentialMatches.filter((m) => !m.already_matched).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No potential matches found</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Matches */}
                    <div>
                      <h3 className="font-medium text-sm sm:text-base mb-4">
                        Current Matches ({currentMatches.length})
                      </h3>
                      <div className="space-y-2 max-h-80 overflow-y-auto border rounded-lg">
                        {currentMatches.map((match) => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={match.profile_photo || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs">
                                  {match.name && match.name.length > 0 ? match.name.charAt(0) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{match.name || 'Unknown User'}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {match.age}y, {match.caste}, {match.city}, {match.state}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Matched: {new Date(match.matched_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMatch(match.id)}
                              className="text-xs flex-shrink-0"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        {currentMatches.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Heart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No current matches</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout - Side by Side */}
                  <div className="hidden lg:grid grid-cols-2 gap-6">
                    {/* Potential Matches */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">
                          Potential Matches ({potentialMatches.filter((m) => !m.already_matched).length})
                        </h3>
                        {selectedMatches.length > 0 && (
                          <Button onClick={handleCreateMatches} size="sm">
                            Create {selectedMatches.length} Match{selectedMatches.length !== 1 ? 'es' : ''}
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-2">
                        {potentialMatches
                          .filter((match) => !match.already_matched)
                          .map((match) => (
                            <div
                              key={match.id}
                              className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                            >
                              <Checkbox
                                checked={selectedMatches.includes(match.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedMatches([...selectedMatches, match.id])
                                  } else {
                                    setSelectedMatches(selectedMatches.filter((id) => id !== match.id))
                                  }
                                }}
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={match.profile_photo || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {match.name && match.name.length > 0 ? match.name.charAt(0) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{match.name || 'Unknown User'}</p>
                                <p className="text-xs text-gray-500">
                                  {match.age}y, {match.caste}, {match.city}, {match.state}
                                </p>
                                <p className="text-xs text-gray-400">{match.occupation}</p>
                              </div>
                            </div>
                          ))}
                        {potentialMatches.filter((m) => !m.already_matched).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No potential matches found</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Current Matches */}
                    <div>
                      <h3 className="font-medium mb-4">Current Matches ({currentMatches.length})</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-2">
                        {currentMatches.map((match) => (
                          <div
                            key={match.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={match.profile_photo || "/placeholder.svg"} />
                                <AvatarFallback>
                                  {match.name && match.name.length > 0 ? match.name.charAt(0) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{match.name || 'Unknown User'}</p>
                                <p className="text-xs text-gray-500">
                                  {match.age}y, {match.caste}, {match.city}, {match.state}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Matched: {new Date(match.matched_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveMatch(match.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        {currentMatches.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Heart className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No current matches</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
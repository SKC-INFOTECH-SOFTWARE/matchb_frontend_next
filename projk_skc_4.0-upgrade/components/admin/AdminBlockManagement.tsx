import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Ban, UserX, Unlock, RefreshCw, Calendar, AlertTriangle, PhoneCall, PhoneOff
} from "lucide-react"

interface BlockRecord {
  id: number
  blocker_id: number
  blocked_id: number
  call_allowed: number
  created_at: string
  updated_at: string
  blocker_name: string
  blocker_email: string
  blocker_photo: string
  blocked_name: string
  blocked_email: string
  blocked_photo: string
}

export default function AdminBlocksManagement() {
  const [blocks, setBlocks] = useState<BlockRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unblocking, setUnblocking] = useState<number | null>(null)
  const [togglingCall, setTogglingCall] = useState<number | null>(null)

  useEffect(() => {
    fetchBlocks()
  }, [])

  const fetchBlocks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/blocks`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setBlocks(data.blocks || [])
        setError(null)
      } else {
        setError("Failed to fetch blocks")
      }
    } catch (error) {
      console.error("Error fetching blocks:", error)
      setError("Network error while fetching blocks")
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (blockId: number) => {
    try {
      setUnblocking(blockId)
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/blocks`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blockId }),
      })

      if (response.ok) {
        await fetchBlocks()
      }
    } catch (error) {
      console.error("Error removing block:", error)
    } finally {
      setUnblocking(null)
    }
  }

  const handleToggleCall = async (blockId: number, currentStatus: boolean) => {
    try {
      setTogglingCall(blockId)
      const token = localStorage.getItem("token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/blocks`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blockId,
          callAllowed: !currentStatus
        }),
      })

      if (response.ok) {
        await fetchBlocks()
      }
    } catch (error) {
      console.error("Error toggling call permission:", error)
    } finally {
      setTogglingCall(null)
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

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Ban className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              Blocked Users Management
            </CardTitle>
            <CardDescription className="text-sm">
              View and manage user blocks ({blocks.length} active blocks)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBlocks}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2 text-gray-400" />
            <span className="text-gray-600">Loading blocks...</span>
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-green-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <UserX className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Blocks Found</h3>
            <p className="text-gray-600 text-sm">There are currently no blocked users in the system</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.id}
                className="border rounded-lg hover:shadow-md transition-shadow bg-white"
              >
                {/* Mobile Layout */}
                <div className="block sm:hidden p-3">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="destructive" className="text-xs">
                      <Ban className="h-3 w-3 mr-1" />
                      Blocked
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(block.created_at)}
                    </Badge>
                    {block.call_allowed === 1 && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        <PhoneCall className="h-3 w-3 mr-1" />
                        Call OK
                      </Badge>
                    )}
                  </div>

                  {/* Blocker */}
                  <div className="flex items-center gap-3 mb-3 pb-3 border-b">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={block.blocker_photo || "/placeholder.svg"} />
                      <AvatarFallback>{block.blocker_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {block.blocker_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{block.blocker_email}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        Blocker
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-center mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>

                  {/* Blocked */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={block.blocked_photo || "/placeholder.svg"} />
                      <AvatarFallback>{block.blocked_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {block.blocked_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{block.blocked_email}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        Blocked User
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleToggleCall(block.id, block.call_allowed === 1)}
                      disabled={togglingCall === block.id}
                      size="sm"
                      variant="outline"
                      className={`flex-1 ${
                        block.call_allowed === 1
                          ? 'border-red-200 text-red-700 hover:bg-red-50'
                          : 'border-green-200 text-green-700 hover:bg-green-50'
                      }`}
                    >
                      {togglingCall === block.id ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Wait...
                        </>
                      ) : block.call_allowed === 1 ? (
                        <>
                          <PhoneOff className="h-3 w-3 mr-1" />
                          Disable Call
                        </>
                      ) : (
                        <>
                          <PhoneCall className="h-3 w-3 mr-1" />
                          Allow Call
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleUnblock(block.id)}
                      disabled={unblocking === block.id}
                      size="sm"
                      variant="outline"
                      className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      {unblocking === block.id ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Wait...
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3 mr-1" />
                          Unblock
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-center justify-between p-4">
                  <div className="flex items-center gap-6 flex-1">
                    {/* Blocker */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={block.blocker_photo || "/placeholder.svg"} />
                        <AvatarFallback>{block.blocker_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{block.blocker_name}</p>
                        <p className="text-sm text-gray-500">{block.blocker_email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          Blocker
                        </Badge>
                      </div>
                    </div>

                    <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0" />

                    {/* Blocked */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={block.blocked_photo || "/placeholder.svg"} />
                        <AvatarFallback>{block.blocked_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{block.blocked_name}</p>
                        <p className="text-sm text-gray-500">{block.blocked_email}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          Blocked User
                        </Badge>
                      </div>
                    </div>

                    <div className="flex-1"></div>

                    <div className="text-sm text-gray-500 flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(block.created_at)}
                      </div>
                      {block.call_allowed === 1 && (
                        <Badge className="bg-green-100 text-green-700 text-xs w-fit">
                          <PhoneCall className="h-3 w-3 mr-1" />
                          Call Allowed
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => handleToggleCall(block.id, block.call_allowed === 1)}
                      disabled={togglingCall === block.id}
                      size="sm"
                      variant="outline"
                      className={
                        block.call_allowed === 1
                          ? 'border-red-200 text-red-700 hover:bg-red-50'
                          : 'border-green-200 text-green-700 hover:bg-green-50'
                      }
                    >
                      {togglingCall === block.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : block.call_allowed === 1 ? (
                        <>
                          <PhoneOff className="h-4 w-4 mr-2" />
                          Disable Call
                        </>
                      ) : (
                        <>
                          <PhoneCall className="h-4 w-4 mr-2" />
                          Allow Call
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => handleUnblock(block.id)}
                      disabled={unblocking === block.id}
                      size="sm"
                      variant="outline"
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      {unblocking === block.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Unblocking...
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Unblock
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

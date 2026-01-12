"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  Clock, User, Shield, Phone, MessageCircle, Heart
} from "lucide-react"

interface CallSession {
  id: number
  status: string
  duration: number
  cost: number
  caller_name: string
  receiver_name: string
  caller_photo: string
  receiver_photo: string
  caller_virtual_number: string
  receiver_virtual_number: string
  is_caller: boolean
  created_at: string
  ended_at?: string
}

export default function CallInterface() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<CallSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(false)
  const [callStartTime, setCallStartTime] = useState<Date | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (sessionId) {
      fetchCallSession()
      // Poll for call status updates
      const pollInterval = setInterval(fetchCallSession, 2000)
      return () => clearInterval(pollInterval)
    }
  }, [sessionId])

  useEffect(() => {
    // Start duration timer when call starts
    if (session?.status === 'in_progress' && !callStartTime) {
      setCallStartTime(new Date())
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)
    }

    // Clear timer when call ends
    if (session?.status === 'completed' || session?.status === 'failed') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [session?.status, callStartTime])

  const fetchCallSession = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/calls/initiate?sessionId=${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data.session)
      }
    } catch (error) {
      console.error("Error fetching call session:", error)
    } finally {
      setLoading(false)
    }
  }

  const endCall = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    router.push('/dashboard')
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Here you would integrate with actual audio controls
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
    // Here you would integrate with actual audio controls
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusMessage = () => {
    if (!session) return "Loading..."
    
    switch (session.status) {
      case 'initiated':
        return session.is_caller ? "Connecting..." : "Incoming call..."
      case 'ringing':
        return session.is_caller ? "Calling..." : "Ringing..."
      case 'in_progress':
        return "Connected"
      case 'completed':
        return "Call ended"
      case 'busy':
        return "User is busy"
      case 'no-answer':
        return "No answer"
      case 'failed':
        return "Call failed"
      default:
        return session.status
    }
  }

  const getStatusColor = () => {
    if (!session) return "bg-gray-500"
    
    switch (session.status) {
      case 'initiated':
      case 'ringing':
        return "bg-yellow-500"
      case 'in_progress':
        return "bg-green-500"
      case 'completed':
        return "bg-blue-500"
      case 'busy':
      case 'no-answer':
      case 'failed':
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading call...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center">
        <div className="text-center text-white">
          <PhoneOff className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Call Not Found</h2>
          <p className="mb-4">The call session could not be found.</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline" className="text-white border-white">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const otherUser = session.is_caller ? 
    { name: session.receiver_name, photo: session.receiver_photo } :
    { name: session.caller_name, photo: session.caller_photo }

  const isCallActive = session.status === 'in_progress'
  const isCallEnded = ['completed', 'busy', 'no-answer', 'failed'].includes(session.status)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20 text-white">
        <CardContent className="p-8">
          {/* Call Status Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2 animate-pulse`}></div>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                {getStatusMessage()}
              </Badge>
            </div>
            
            {/* Privacy Notice */}
            <div className="flex items-center justify-center mb-4 text-xs text-white/70">
              <Shield className="h-3 w-3 mr-1" />
              <span>Number masked for privacy</span>
            </div>
          </div>

          {/* User Avatar and Info */}
          <div className="text-center mb-8">
            <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-white/20">
              <AvatarImage src={otherUser.photo || "/placeholder.svg"} />
              <AvatarFallback className="text-4xl bg-white/20 text-white">
                {otherUser.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <h2 className="text-2xl font-bold mb-2">{otherUser.name}</h2>
            
            <div className="flex items-center justify-center text-sm text-white/70 mb-2">
              <Phone className="h-4 w-4 mr-2" />
              <span>
                {session.is_caller ? session.caller_virtual_number : session.receiver_virtual_number}
              </span>
            </div>
          </div>

          {/* Call Duration */}
          {(isCallActive || callDuration > 0) && (
            <div className="text-center mb-8">
              <div className="flex items-center justify-center text-white/70 mb-2">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-2xl font-mono font-bold">
                  {formatDuration(callDuration)}
                </span>
              </div>
              {isCallActive && (
                <p className="text-xs text-white/50">Call in progress...</p>
              )}
            </div>
          )}

          {/* Call Controls */}
          {isCallActive && (
            <div className="flex justify-center space-x-6 mb-8">
              <Button
              
                onClick={toggleMute}
                size="lg"
                className={`rounded-full w-14 h-14 p-0 ${
                  isMuted 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-white/20 hover:bg-white/30'
                } backdrop-blur-sm border border-white/30`}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              <Button
                onClick={toggleSpeaker}
                size="lg"
                className={`rounded-full w-14 h-14 p-0 ${
                  isSpeakerOn 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-white/20 hover:bg-white/30'
                } backdrop-blur-sm border border-white/30`}
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
              </Button>
            </div>
          )}

          {/* End Call Button */}
          <div className="text-center mb-6">
            {!isCallEnded ? (
              <Button
                onClick={endCall}
                size="lg"
                className="rounded-full w-16 h-16 p-0 bg-red-500 hover:bg-red-600 border-2 border-red-400"
              >
                <PhoneOff className="h-8 w-8" />
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-2">Call Duration: {formatDuration(session.duration)}</p>
                  {session.cost > 0 && (
                    <p className="text-white/70 text-sm">Cost: ₹{session.cost}</p>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      // Implement message functionality
                      console.log('Send message to', otherUser.name)
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Call Info */}
          <div className="text-center">
            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-4 w-4 mr-2 text-green-400" />
                <span className="text-sm font-medium">Secure & Private</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Your real number is protected. This call is encrypted and recorded for quality purposes.
              </p>
            </div>
          </div>

          {/* Emergency Actions (if call fails) */}
          {session.status === 'failed' && (
            <div className="mt-6 text-center">
              <p className="text-red-300 text-sm mb-3">Call connection failed</p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    // Retry call
                    window.location.reload()
                  }}
                  size="sm"
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <PhoneCall className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  size="sm"
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
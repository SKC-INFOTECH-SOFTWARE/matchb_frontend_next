import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Calendar, User, Key } from "lucide-react" // Added Key import
import { UserProfile } from "./types"

interface ProfileViewDialogProps {
  viewDialog: { open: boolean; profile: UserProfile | null }
  setViewDialog: (dialog: { open: boolean; profile: UserProfile | null }) => void
}

export default function ProfileViewDialog({ viewDialog, setViewDialog }: ProfileViewDialogProps) {
  return (
    <Dialog open={viewDialog.open} onOpenChange={(open) => setViewDialog({ ...viewDialog, open })}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>User Profile Details</DialogTitle>
          <DialogDescription>Complete information for {viewDialog.profile?.name || 'Unknown User'}</DialogDescription>
        </DialogHeader>
        {viewDialog.profile && (
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={viewDialog.profile.profile_photo || "/placeholder.svg"} />
                  <AvatarFallback>{viewDialog.profile.name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{viewDialog.profile.name || 'Unknown User'}</h3>
                  <Badge
                    variant={
                      viewDialog.profile.status === "approved"
                        ? "default"
                        : viewDialog.profile.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {viewDialog.profile.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{viewDialog.profile.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{viewDialog.profile.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{viewDialog.profile.age} years</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{viewDialog.profile.gender}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Caste: </span>{viewDialog.profile.caste}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Religion: </span>{viewDialog.profile.religion}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Marital Status: </span>{viewDialog.profile.marital_status}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Location: </span>{viewDialog.profile.city}, {viewDialog.profile.state}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {viewDialog.profile.height && (
                    <div className="text-sm">
                      <span className="font-medium">Height: </span>{viewDialog.profile.height}
                    </div>
                  )}
                  {viewDialog.profile.weight && (
                    <div className="text-sm">
                      <span className="font-medium">Weight: </span>{viewDialog.profile.weight}
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Education: </span>{viewDialog.profile.education}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Occupation: </span>{viewDialog.profile.occupation}
                  </div>
                  {viewDialog.profile.income && (
                    <div className="text-sm">
                      <span className="font-medium">Income: </span>{viewDialog.profile.income}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {viewDialog.profile.mother_tongue && (
                    <div className="text-sm">
                      <span className="font-medium">Mother Tongue: </span>{viewDialog.profile.mother_tongue}
                    </div>
                  )}
                  {viewDialog.profile.family_type && (
                    <div className="text-sm">
                      <span className="font-medium">Family Type: </span>{viewDialog.profile.family_type}
                    </div>
                  )}
                  {viewDialog.profile.family_status && (
                    <div className="text-sm">
                      <span className="font-medium">Family Status: </span>{viewDialog.profile.family_status}
                    </div>
                  )}
                </div>
              </div>

              {viewDialog.profile.about_me && (
                <div>
                  <h4 className="text-sm font-medium mb-2">About Me</h4>
                  <p className="text-sm text-gray-600">{viewDialog.profile.about_me}</p>
                </div>
              )}

              {viewDialog.profile.partner_preferences && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Partner Preferences</h4>
                  <p className="text-sm text-gray-600">{viewDialog.profile.partner_preferences}</p>
                </div>
              )}

              {viewDialog.profile.status === "rejected" && viewDialog.profile.rejection_reason && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-600">Rejection Reason</h4>
                  <p className="text-sm text-red-600">{viewDialog.profile.rejection_reason}</p>
                </div>
              )}

              {/* New Recovery Password Section */}
              {viewDialog.profile.recovery_password && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    Recovery Password (Admin Only)
                  </h4>
                  <p className="text-sm text-gray-600 bg-gray-100 p-2 rounded">{viewDialog.profile.recovery_password}</p>
                  <p className="text-xs text-gray-500 mt-1">Use this to login or share with user if they forget their password.</p>
                </div>
              )}

              <div className="text-sm text-gray-500">
                <span className="font-medium">Created: </span>
                {new Date(viewDialog.profile.created_at).toLocaleDateString()}
                {viewDialog.profile.updated_at && (
                  <>
                    <span className="mx-2">|</span>
                    <span className="font-medium">Updated: </span>
                    {new Date(viewDialog.profile.updated_at).toLocaleDateString()}
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setViewDialog({ open: false, profile: null })}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
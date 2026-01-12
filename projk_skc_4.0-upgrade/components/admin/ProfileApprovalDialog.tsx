import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UserProfile } from "./types"

interface ProfileApprovalDialogProps {
  approvalDialog: {
    open: boolean
    profile: UserProfile | null
    action: "approve" | "reject" | null
    rejectionReason: string
  }
  setApprovalDialog: (dialog: {
    open: boolean
    profile: UserProfile | null
    action: "approve" | "reject" | null
    rejectionReason: string
  }) => void
  handleProfileApproval: () => void
}

export default function ProfileApprovalDialog({
  approvalDialog,
  setApprovalDialog,
  handleProfileApproval,
}: ProfileApprovalDialogProps) {
  return (
    <Dialog open={approvalDialog.open} onOpenChange={(open) => setApprovalDialog({ ...approvalDialog, open })}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {approvalDialog.action === "approve" ? "Approve Profile" : "Reject Profile"}
          </DialogTitle>
          <DialogDescription>
            {approvalDialog.action === "approve"
              ? "Are you sure you want to approve this profile?"
              : "Please provide a reason for rejecting this profile."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {approvalDialog.profile && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">{approvalDialog.profile.name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-600">{approvalDialog.profile.email}</p>
              <p className="text-sm text-gray-500">
                {approvalDialog.profile.age}y, {approvalDialog.profile.gender}, {approvalDialog.profile.caste}
              </p>
            </div>
          )}

          {approvalDialog.action === "reject" && (
            <div>
              <Label className="text-sm font-medium">Rejection Reason</Label>
              <Textarea
                value={approvalDialog.rejectionReason}
                onChange={(e) =>
                  setApprovalDialog({ ...approvalDialog, rejectionReason: e.target.value })
                }
                placeholder="Enter reason for rejection..."
                className="mt-1"
              />
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setApprovalDialog({ open: false, profile: null, action: null, rejectionReason: "" })}
            >
              Cancel
            </Button>
            <Button
              variant={approvalDialog.action === "approve" ? "default" : "destructive"}
              onClick={handleProfileApproval}
              disabled={approvalDialog.action === "reject" && !approvalDialog.rejectionReason.trim()}
            >
              {approvalDialog.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
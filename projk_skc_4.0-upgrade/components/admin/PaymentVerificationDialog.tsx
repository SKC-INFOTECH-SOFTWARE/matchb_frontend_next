import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Payment } from "./types"

interface PaymentVerificationDialogProps {
  paymentDialog: {
    open: boolean
    payment: Payment | null
    action: "verify" | "reject" | null
    adminNotes: string
  }
  setPaymentDialog: (dialog: {
    open: boolean
    payment: Payment | null
    action: "verify" | "reject" | null
    adminNotes: string
  }) => void
  handlePaymentVerification: () => void
}

export default function PaymentVerificationDialog({
  paymentDialog,
  setPaymentDialog,
  handlePaymentVerification,
}: PaymentVerificationDialogProps) {
  return (
    <Dialog open={paymentDialog.open} onOpenChange={(open) => setPaymentDialog({ ...paymentDialog, open })}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {paymentDialog.action === "verify" ? "Verify Payment" : "Reject Payment"}
          </DialogTitle>
          <DialogDescription>
            {paymentDialog.action === "verify"
              ? "Confirm that this payment has been verified."
              : "Please provide a reason for rejecting this payment."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {paymentDialog.payment && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium">{paymentDialog.payment.user_name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-600">{paymentDialog.payment.user_email}</p>
              <p className="text-sm text-gray-500">
                ₹{paymentDialog.payment.amount} - {paymentDialog.payment.plan_name}
              </p>
              <p className="text-sm text-gray-500">Transaction ID: {paymentDialog.payment.transaction_id}</p>
            </div>
          )}

          <div>
            <Label className="text-sm font-medium">Admin Notes</Label>
            <Textarea
              value={paymentDialog.adminNotes}
              onChange={(e) =>
                setPaymentDialog({ ...paymentDialog, adminNotes: e.target.value })
              }
              placeholder="Add any notes about this payment verification..."
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPaymentDialog({ open: false, payment: null, action: null, adminNotes: "" })}
            >
              Cancel
            </Button>
            <Button
              variant={paymentDialog.action === "verify" ? "default" : "destructive"}
              onClick={handlePaymentVerification}
            >
              {paymentDialog.action === "verify" ? "Verify Payment" : "Reject Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, FileText, Clock, Eye, CheckCircle, XCircle } from "lucide-react"
import { Payment } from "./types"

interface PaymentListProps {
  payments: Payment[]
  loadingPayments: boolean
  setPaymentDialog: (dialog: {
    open: boolean
    payment: Payment | null
    action: "verify" | "reject" | null
    adminNotes: string
  }) => void
}

export default function PaymentList({ payments, loadingPayments, setPaymentDialog }: PaymentListProps) {
  return (
    <Card className="mx-auto w-full max-w-7xl">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <CreditCard className="h-5 w-5" />
          Payment Verification
        </CardTitle>
        <CardContent className="px-0 sm:px-0">
          <p className="text-sm sm:text-base">Review and verify user payments</p>
        </CardContent>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {loadingPayments ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading payments...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="space-y-2 mb-4 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-base sm:text-lg">{payment.user_name || 'Unknown User'}</h3>
                    <Badge
                      variant={
                        payment.status === "verified"
                          ? "default"
                          : payment.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs sm:text-sm"
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{payment.user_email}</p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      ₹{payment.amount} - {payment.plan_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      <span className="line-clamp-1">{payment.transaction_id}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(payment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {payment.admin_notes && (
                    <p className="text-sm text-gray-600 line-clamp-2">Notes: {payment.admin_notes}</p>
                  )}
                  {payment.verified_by_name && payment.verified_at && (
                    <p className="text-sm text-green-600 line-clamp-2">
                      Verified by {payment.verified_by_name} on{" "}
                      {new Date(payment.verified_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
                  {payment.screenshot && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={payment.screenshot} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4 mr-1" />
                        View Screenshot
                      </a>
                    </Button>
                  )}

                  {payment.status === "pending" && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          setPaymentDialog({
                            open: true,
                            payment,
                            action: "verify",
                            adminNotes: "",
                          })
                        }
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setPaymentDialog({
                            open: true,
                            payment,
                            action: "reject",
                            adminNotes: "",
                          })
                        }
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {payments.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm sm:text-base">No payments found</div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
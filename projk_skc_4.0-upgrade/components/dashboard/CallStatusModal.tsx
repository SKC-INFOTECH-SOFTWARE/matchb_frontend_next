// components/dashboard/CallStatusModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneCall, PhoneOff, Phone, CheckCircle, XCircle, Clock } from "lucide-react";

interface CallStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callStatus: 'initiating' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'busy' | 'no-answer' | 'canceled';
  targetName: string;
}

export default function CallStatusModal({
  open,
  onOpenChange,
  callStatus,
  targetName
}: CallStatusModalProps) {
  const getStatusInfo = () => {
    switch (callStatus) {
      case 'initiating':
        return {
          icon: <Phone className="h-16 w-16 mx-auto text-blue-500 animate-pulse" />,
          title: 'Initiating Call',
          message: `Setting up call to ${targetName}...`,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          showSpinner: true
        };
      case 'ringing':
        return {
          icon: <PhoneCall className="h-16 w-16 mx-auto text-green-500 animate-bounce" />,
          title: 'Calling',
          message: `Calling ${targetName}. Please answer your phone.`,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          showSpinner: false
        };
      case 'in_progress':
        return {
          icon: <PhoneCall className="h-16 w-16 mx-auto text-green-600 animate-pulse" />,
          title: 'Call in Progress',
          message: `You are now connected with ${targetName}`,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          showSpinner: false
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-16 w-16 mx-auto text-green-600" />,
          title: 'Call Completed',
          message: `Call with ${targetName} has ended successfully`,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          showSpinner: false
        };
      case 'busy':
        return {
          icon: <PhoneOff className="h-16 w-16 mx-auto text-orange-500" />,
          title: 'User Busy',
          message: `${targetName} is currently busy. Please try again later.`,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          showSpinner: false
        };
      case 'no-answer':
        return {
          icon: <Clock className="h-16 w-16 mx-auto text-yellow-500" />,
          title: 'No Answer',
          message: `${targetName} did not answer the call.`,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          showSpinner: false
        };
      case 'canceled':
        return {
          icon: <XCircle className="h-16 w-16 mx-auto text-gray-500" />,
          title: 'Call Canceled',
          message: `Call to ${targetName} was canceled`,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          showSpinner: false
        };
      case 'failed':
      default:
        return {
          icon: <XCircle className="h-16 w-16 mx-auto text-red-500" />,
          title: 'Call Failed',
          message: `Failed to connect with ${targetName}. Please try again.`,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          showSpinner: false
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isCallActive = callStatus === 'initiating' || callStatus === 'ringing' || callStatus === 'in_progress';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            Call Status
          </DialogTitle>
        </DialogHeader>
        
        <div className={`text-center py-6 rounded-lg ${statusInfo.bgColor}`}>
          <div className="mb-4">
            {statusInfo.showSpinner ? (
              <div className="relative">
                {statusInfo.icon}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-20 w-20 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              </div>
            ) : (
              statusInfo.icon
            )}
          </div>
          
          <h3 className={`text-xl font-semibold ${statusInfo.color} mb-2`}>
            {statusInfo.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 px-4">
            {statusInfo.message}
          </p>
          
          {/* Additional instructions based on status */}
          {callStatus === 'ringing' && (
            <div className="bg-white/50 rounded-lg p-3 mx-4">
              <p className="text-xs text-gray-700">
                📞 Both phones will ring shortly<br/>
                🔊 Please ensure your volume is up<br/>
                ⏰ Call will timeout in 30 seconds
              </p>
            </div>
          )}
          
          {callStatus === 'in_progress' && (
            <div className="bg-white/50 rounded-lg p-3 mx-4">
              <p className="text-xs text-green-700">
                🎉 Enjoy your conversation!<br/>
                💰 Credits are being used per minute<br/>
                📞 You can hang up anytime
              </p>
            </div>
          )}
          
          {(callStatus === 'busy' || callStatus === 'no-answer') && (
            <div className="bg-white/50 rounded-lg p-3 mx-4">
              <p className="text-xs text-gray-700">
                💡 No credits were deducted<br/>
                🔄 You can try calling again later<br/>
                📱 Consider sending a message first
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-center gap-2 pt-4">
          {isCallActive ? (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-6"
            >
              Close
            </Button>
          ) : (
            <Button
              onClick={() => onOpenChange(false)}
              className="px-6"
            >
              {callStatus === 'completed' ? 'Done' : 'Close'}
            </Button>
          )}
          
          {(callStatus === 'busy' || callStatus === 'no-answer' || callStatus === 'failed') && (
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                // You could trigger a retry here if needed
              }}
              className="px-6"
            >
              Try Again Later
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
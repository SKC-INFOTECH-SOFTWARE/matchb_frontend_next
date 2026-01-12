
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Crown, Sparkles } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewPlans: () => void;
}

export default function UpgradeModal({ open, onOpenChange, onViewPlans }: UpgradeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Upgrade Required
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
            <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Premium Feature</h3>
            <p className="text-sm text-gray-600">
              This feature requires an active subscription. Upgrade now to access all premium features.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={onViewPlans}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              View Plans
            </Button>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

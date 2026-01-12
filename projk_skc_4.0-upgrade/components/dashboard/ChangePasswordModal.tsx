
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  passwordFormData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordFormData: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => void;
  changingPassword: boolean;
  passwordError: string;
  passwordSuccess: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ChangePasswordModal({
  open,
  onOpenChange,
  passwordFormData,
  setPasswordFormData,
  changingPassword,
  passwordError,
  passwordSuccess,
  onSubmit,
}: ChangePasswordModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center">
            <Lock className="h-5 w-5 mr-2 text-blue-500" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" className="text-sm text-gray-600">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordFormData.currentPassword}
              onChange={(e) =>
                setPasswordFormData({ ...passwordFormData, currentPassword: e.target.value })
              }
              className="mt-1 h-10 text-sm"
              placeholder="Enter current password"
              disabled={changingPassword}
            />
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-sm text-gray-600">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordFormData.newPassword}
              onChange={(e) =>
                setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })
              }
              className="mt-1 h-10 text-sm"
              placeholder="Enter new password"
              disabled={changingPassword}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-sm text-gray-600">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordFormData.confirmPassword}
              onChange={(e) =>
                setPasswordFormData({ ...passwordFormData, confirmPassword: e.target.value })
              }
              className="mt-1 h-10 text-sm"
              placeholder="Confirm new password"
              disabled={changingPassword}
            />
          </div>
          {passwordError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}
          {passwordSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Password changed successfully!</AlertDescription>
            </Alert>
          )}
          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={changingPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {changingPassword ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
           
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

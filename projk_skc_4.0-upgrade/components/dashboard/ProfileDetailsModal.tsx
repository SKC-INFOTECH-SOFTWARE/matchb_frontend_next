import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Briefcase,
  Home,
  PhoneCall,
  MessageCircle,
  Info,
  Heart,
  Star,
} from "lucide-react";
import { UserProfile, ActivePlan } from "../../types/types";

interface ProfileDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMatch: UserProfile | null;
  activePlans: ActivePlan;
  makingCall: boolean;
  onInitiateCall: (targetUserId: number, targetName: string) => void;
}

export default function ProfileDetailsModal({
  open,
  onOpenChange,
  selectedMatch,
  activePlans,
  makingCall,
  onInitiateCall,
}: ProfileDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-3xl w-full p-3 sm:p-4 lg:p-5 rounded-xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Profile Details</DialogTitle>
        </DialogHeader>

        {selectedMatch && (
          <div className="space-y-3 sm:space-y-4">
            {/* Top Section - responsive header */}
            <div className="relative bg-blue-500 rounded-lg p-3 sm:p-4 text-white">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* Avatar + Info */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-white shadow-md flex-shrink-0">
                    <AvatarImage src={selectedMatch.profile_photo || "/placeholder.svg"} />
                    <AvatarFallback className="text-sm sm:text-lg font-bold text-blue-500 bg-white">
                      {selectedMatch.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg font-bold truncate">{selectedMatch.name}</h2>
                    <p className="text-xs text-blue-100">
                      {selectedMatch.age} yrs • {selectedMatch.city}, {selectedMatch.state}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] border-white/30 text-white bg-white/20 px-1">
                        {selectedMatch.religion}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] border-white/30 text-white bg-white/20 px-1">
                        {selectedMatch.marital_status}
                      </Badge>
                    </div>
                  </div>
                </div>
                {/* Actions - responsive button layout */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-end">
                  <Button
                    onClick={() => onInitiateCall(selectedMatch.id, selectedMatch.name)}
                    className={`text-[10px] sm:text-xs px-2 sm:px-3 h-6 sm:h-7 ${activePlans.call_plan?.isActive
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    disabled={!activePlans.call_plan?.isActive || makingCall}
                  >
                    <PhoneCall className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    {activePlans.call_plan?.isActive ? "Call" : "Lock"}
                  </Button>
                  <Button className="text-[10px] sm:text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 h-6 sm:h-7">
                    <MessageCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    Chat
                  </Button>
                  <Button
                    variant="outline"
                    className="text-[10px] sm:text-xs border-white/30 text-white bg-white/20 hover:bg-white/30 px-2 sm:px-3 h-6 sm:h-7"
                  >
                    <Heart className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden sm:inline">Shortlist</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {/* Personal Card */}
              <Card className="border-0 shadow-sm bg-blue-50">
                <CardContent className="p-2 sm:p-3">
                  <h4 className="text-[10px] sm:text-xs font-semibold text-blue-700 mb-1 flex items-center">
                    <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Personal
                  </h4>
                  <div className="space-y-0.5 sm:space-y-1">
                    <DetailRow label="Height" value={selectedMatch.height} />
                    <DetailRow label="Weight" value={selectedMatch.weight} />
                    <DetailRow label="Mother Tongue" value={selectedMatch.mother_tongue} />
                    <DetailRow label="Caste" value={selectedMatch.caste} />
                  </div>
                </CardContent>
              </Card>
              {/* Professional */}
              <Card className="border-0 shadow-sm bg-green-50">
                <CardContent className="p-2 sm:p-3">
                  <h4 className="text-[10px] sm:text-xs font-semibold text-green-700 mb-1 flex items-center">
                    <Briefcase className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Professional
                  </h4>
                  <div className="space-y-0.5 sm:space-y-1">
                    <DetailRow label="Education" value={selectedMatch.education} />
                    <DetailRow label="Occupation" value={selectedMatch.occupation} />
                    <DetailRow label="Income" value={selectedMatch.income} />
                  </div>
                </CardContent>
              </Card>

              {/* Family */}
              <Card className="border-0 shadow-sm bg-purple-50">
                <CardContent className="p-2 sm:p-3">
                  <h4 className="text-[10px] sm:text-xs font-semibold text-purple-700 mb-1 flex items-center">
                    <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> Family
                  </h4>
                  <div className="space-y-0.5 sm:space-y-1">
                    <DetailRow label="Family Type" value={selectedMatch.family_type} />
                    <DetailRow label="Family Status" value={selectedMatch.family_status} />
                  </div>
                </CardContent>
              </Card>

              {/* About */}
              <Card className="border-0 shadow-sm bg-yellow-50 sm:col-span-2">
                <CardContent className="p-2 sm:p-3">
                  <h4 className="text-[10px] sm:text-xs font-semibold text-yellow-700 mb-1 flex items-center">
                    <Info className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" /> About
                  </h4>
                  <p className="text-[10px] sm:text-xs text-gray-600 leading-snug">
                    <span className="font-medium">About Me: </span>
                    {selectedMatch.about_me || "Not provided"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-600 leading-snug mt-1">
                    <span className="font-medium">Partner Preferences: </span>
                    {selectedMatch.partner_preferences || "Not provided"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[9px] sm:text-[11px] text-gray-500">{label}:</span>
      <span className="text-[10px] sm:text-xs font-medium text-gray-800 truncate ml-2">{value || "N/A"}</span>
    </div>
  );
}
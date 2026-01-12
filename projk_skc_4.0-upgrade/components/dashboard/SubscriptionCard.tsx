import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, PhoneCall, Check, TrendingUp, Zap, Calendar } from "lucide-react";
import { ActivePlan } from "../../types/types";

interface SubscriptionCardProps {
  activePlans: ActivePlan;
  onUpgrade: () => void;
  formatDate: (dateString: string) => string;
}

export default function SubscriptionCard({ activePlans, onUpgrade, formatDate }: SubscriptionCardProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-900 flex items-center">
          <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          Your Plans
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Premium Plan Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                activePlans.normal_plan?.isActive 
                  ? 'bg-gradient-to-br from-amber-400 to-yellow-500' 
                  : 'bg-gray-200'
              }`}>
                <Crown className={`h-5 w-5 ${
                  activePlans.normal_plan?.isActive ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Premium Access</h4>
                <p className="text-xs text-gray-600">View full profiles</p>
              </div>
            </div>
            <Badge className={`${
              activePlans.normal_plan?.isActive 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-red-100 text-red-700 border-red-200'
            } px-2 py-1 text-xs font-medium`}>
              {activePlans.normal_plan?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          {activePlans.normal_plan?.isActive ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {activePlans.normal_plan.plan_name}
                </span>
                <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <Calendar className="h-3 w-3 mr-1" />
                  {activePlans.normal_plan.daysLeft} days left
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Expires: {formatDate(activePlans.normal_plan.expires_at)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Unlock detailed profile information</p>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white text-xs h-8 font-medium shadow-sm" 
                onClick={onUpgrade}
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade Now
              </Button>
            </div>
          )}
        </div>
        
        {/* Call Plan Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                activePlans.call_plan?.isActive 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                  : 'bg-gray-200'
              }`}>
                <PhoneCall className={`h-5 w-5 ${
                  activePlans.call_plan?.isActive ? 'text-white' : 'text-gray-500'
                }`} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Call Credits</h4>
                <p className="text-xs text-gray-600">Connect via calls</p>
              </div>
            </div>
            <Badge className={`${
              activePlans.call_plan?.isActive 
                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                : 'bg-red-100 text-red-700 border-red-200'
            } px-2 py-1 text-xs font-medium`}>
              {activePlans.call_plan?.isActive 
                ? `${activePlans.call_plan.credits_remaining} left` 
                : 'No credits'
              }
            </Badge>
          </div>
          
          {activePlans.call_plan?.isActive ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 truncate">
                  {activePlans.call_plan.plan_name}
                </span>
                <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <PhoneCall className="h-3 w-3 mr-1" />
                  {activePlans.call_plan.credits_remaining} calls
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Expires: {formatDate(activePlans.call_plan.expires_at)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-600">Start meaningful conversations</p>
              <Button 
                size="sm" 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs h-8 font-medium shadow-sm" 
                onClick={onUpgrade}
              >
                <Zap className="h-3 w-3 mr-1" />
                Buy Credits
              </Button>
            </div>
          )}
        </div>

        {/* Overall upgrade button if neither plan is active */}
        {!activePlans.normal_plan?.isActive && !activePlans.call_plan?.isActive && (
          <Button 
            className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium h-10 shadow-lg hover:shadow-xl transition-all duration-200" 
            onClick={onUpgrade}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade Your Experience
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
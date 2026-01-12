import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Home, Check, PhoneCall } from "lucide-react";
import { UserProfile, ActivePlan } from "../../types/types";
import Link from "next/link";

interface HeaderProps {
  user: any;
  userProfile: UserProfile | null;
  activePlans: ActivePlan;
  logout: () => void;
}

export default function Header({ user, userProfile, activePlans, logout }: HeaderProps) {
 return (
  <header className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-sm">
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="flex justify-between items-center h-14 sm:h-16">
        {/* Left side - Logo */}
        <div className="flex items-center">
         <Link href="/">
            <Image 
              src="/matchb-logo.png" 
              alt="MatchB" 
              width={100} 
              height={32} 
              className="h-6 sm:h-8 w-auto" 
            />
          </Link>
          {/* Hide dashboard text on very small screens */}
          <div className="ml-4 sm:ml-6 hidden md:flex space-x-1">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600 text-sm">
              Dashboard
            </Button>
          </div>
        </div>

        {/* Right side - User info and controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
          {/* Welcome message - hide on mobile */}
          <div className="hidden md:flex flex-col items-end">
            <h1 className="text-xs sm:text-sm font-bold bg-blue-400 bg-clip-text text-transparent">
              Welcome Back, {user?.name}!
            </h1>
          </div>

          {/* Plan badges - responsive sizing */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
            {activePlans.normal_plan?.isActive ? (
              <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 text-[10px] sm:text-xs px-1.5 sm:px-2">
                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">Premium</span>
                <span className="sm:hidden">Pro</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-200 text-gray-600 bg-gray-50 text-[10px] sm:text-xs px-1.5 sm:px-2">
                Free
              </Badge>
            )}
            {activePlans.call_plan?.isActive && (
              <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 text-[10px] sm:text-xs px-1.5 sm:px-2">
                <PhoneCall className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                <span className="hidden sm:inline">{activePlans.call_plan.credits_remaining} calls</span>
                <span className="sm:hidden">{activePlans.call_plan.credits_remaining}</span>
              </Badge>
            )}
          </div>

          {/* User avatar and name */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 ring-1 sm:ring-2 ring-blue-100">
              <AvatarImage src={userProfile?.profile_photo || "/placeholder.svg"} />
              <AvatarFallback className="text-xs sm:text-sm bg-blue-100 text-blue-600">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {/* Hide name on very small screens */}
            <span className="text-xs sm:text-sm font-medium text-gray-900 hidden sm:block">
              {user?.name}
            </span>
          </div>

          {/* Logout button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout} 
            className="text-gray-600 hover:text-red-600 p-1.5 sm:p-2"
          >
            <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  </header>
);
}
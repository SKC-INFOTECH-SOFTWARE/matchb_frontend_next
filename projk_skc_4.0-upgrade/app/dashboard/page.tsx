"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import Header from "@/components/dashboard/Header";
import ProfileCard from "@/components/dashboard/ProfileCard";
import SubscriptionCard from "@/components/dashboard/SubscriptionCard";
import QuickActions from "@/components/dashboard/QuickActions";
import MatchesTab from "@/components/dashboard/MatchesTab";
// Import the interface so we can use it in state
import SearchTab, { SearchResultStats } from "@/components/dashboard/SearchTab";
import PlansModal from "@/components/dashboard/PlansModal";
import PaymentModal from "@/components/dashboard/PaymentModal";
import UpgradeModal from "@/components/dashboard/UpgradeModal";
import ProfileDetailsModal from "@/components/dashboard/ProfileDetailsModal";
import EditProfileModal from "@/components/dashboard/EditProfileModal";
import ChangePasswordModal from "@/components/dashboard/ChangePasswordModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserProfile, Plan, ActivePlan, CallLog, SearchFilters } from "../../types/types";
import { formatDate } from "@/utils/formatters";
import toast, { Toaster } from "react-hot-toast";
import { Phone, RefreshCw, Clock, User as UserIcon, Play } from "lucide-react";

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileExists, setProfileExists] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [matches, setMatches] = useState<UserProfile[]>([]);

  // -- Changed from array of profiles to specific stats object --
  const [searchResultStats, setSearchResultStats] = useState<SearchResultStats | null>(null);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [activePlans, setActivePlans] = useState<ActivePlan>({});
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState("matches");

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    location: "",
    gender: "",
    ageMin: "",
    ageMax: "",
    religion: "",
    education: "",
    occupation: "",
  });

  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingCallLogs, setLoadingCallLogs] = useState(false);
  const [makingCall, setMakingCall] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);
  const [editFormData, setEditFormData] = useState({
    age: "",
    gender: "",
    height: "",
    weight: "",
    caste: "",
    religion: "",
    mother_tongue: "",
    marital_status: "",
    education: "",
    occupation: "",
    income: "",
    state: "",
    city: "",
    family_type: "",
    family_status: "",
    about_me: "",
    partner_preferences: "",
    profile_photo: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login/user");
      return;
    }
    if (user) {
      fetchUserProfile();
      fetchMatches();
      fetchActivePlans();
    }
  }, [user, loading, router]);

  useEffect(() => {
    fetchActivePlans();
    fetchCallLogs();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.profile);
        setProfileExists(true);
        setProfileError(null);
        setEditFormData({
            // ... (populate form data)
            age: data.profile.age?.toString() || "",
            gender: data.profile.gender || "",
            height: data.profile.height || "",
            weight: data.profile.weight || "",
            caste: data.profile.caste || "",
            religion: data.profile.religion || "",
            mother_tongue: data.profile.mother_tongue || "",
            marital_status: data.profile.marital_status || "",
            education: data.profile.education || "",
            occupation: data.profile.occupation || "",
            income: data.profile.income || "",
            state: data.profile.state || "",
            city: data.profile.city || "",
            family_type: data.profile.family_type || "",
            family_status: data.profile.family_status || "",
            about_me: data.profile.about_me || "",
            partner_preferences: data.profile.partner_preferences || "",
            profile_photo: data.profile.profile_photo || "",
        });
      } else if (response.status === 404) {
        setUserProfile(null);
        setProfileExists(false);
        setProfileError("Profile not found. Please complete your profile to access all features.");
      } else {
        setProfileError("Failed to fetch profile details");
        setProfileExists(false);
        toast.error("Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfileError("Network error while fetching profile");
      setProfileExists(false);
      toast.error("An error occurred while fetching your profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      } else {
        toast.error("Failed to fetch matches");
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      toast.error("An error occurred while fetching matches");
    } finally {
      setLoadingMatches(false);
    }
  };

  // --- NEW: Centralized Search Logic ---
  const performSearch = async () => {
    if (!searchFilters.location || !searchFilters.gender) {
      toast.error("Please select both State and Gender");
      return;
    }

    setLoadingSearch(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        location: searchFilters.location,
        gender: searchFilters.gender,
        ...(searchFilters.ageMin && { ageMin: searchFilters.ageMin }),
        ...(searchFilters.ageMax && { ageMax: searchFilters.ageMax }),
        ...(searchFilters.religion && { religion: searchFilters.religion }),
        ...(searchFilters.education && { education: searchFilters.education }),
        ...(searchFilters.occupation && { occupation: searchFilters.occupation }),
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResultStats({
          availableCount: data.availableCount || 0,
          state: data.state || searchFilters.location,
          gender: data.gender || searchFilters.gender,
          message: data.message || ''
        });
        toast.success("Search completed successfully");
      } else {
        setSearchResultStats({
          availableCount: 0,
          state: searchFilters.location,
          gender: searchFilters.gender,
          message: 'Search failed. Please try again.'
        });
        toast.error("Search failed");
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResultStats({
        availableCount: 0,
        state: searchFilters.location,
        gender: searchFilters.gender,
        message: 'Error performing search'
      });
      toast.error("Error performing search");
    } finally {
        setLoadingSearch(false);
    }
  };

  const fetchActivePlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/active-plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setActivePlans(data.plans);
      } else {
        toast.error("Failed to fetch active plans");
      }
    } catch (error) {
      console.error("Error fetching active plans:", error);
      toast.error("An error occurred while fetching active plans");
    }
  };

  const fetchCallLogs = async () => {
    setLoadingCallLogs(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/initiate?logs=true`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const logs: CallLog[] = data.callSessions.map((session: any) => ({
            id: session.id,
            other_user_name: session.caller_id === user?.id ? session.receiver_name : session.caller_name,
            other_user_photo: session.caller_id === user?.id ? session.receiver_photo : session.caller_photo || "",
            duration: session.conversation_duration || session.duration || 0,
            call_type: session.caller_id === user?.id ? "outgoing" : "incoming",
            call_status: session.status,
            created_at: session.created_at,
            recording_url: session.recording_url || "",
          }));
          setCallLogs(logs);
          toast.success("Call logs fetched successfully");
        } else {
          toast.error(data.error || "Failed to fetch call logs");
          setCallLogs([]);
        }
      } else {
        toast.error("Failed to fetch call logs");
        setCallLogs([]);
      }
    } catch (error) {
      console.error("Error fetching call logs:", error);
      toast.error("An error occurred while fetching call logs");
      setCallLogs([]);
    } finally {
      setLoadingCallLogs(false);
    }
  };

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
        toast.success("Plans fetched successfully");
      } else {
        toast.error("Failed to fetch plans");
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("An error occurred while fetching plans");
    } finally {
      setLoadingPlans(false);
    }
  };

  const initiateCall = async (targetUserId: number, targetName: string) => {
    if (!activePlans.call_plan?.isActive || activePlans.call_plan.credits_remaining <= 0) {
      setShowUpgradeModal(true);
      toast.error('Insufficient call credits. Please upgrade your plan.');
      return;
    }

    setMakingCall(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Call initiated successfully with ${targetName}. Please answer your phone when it rings.`);

        await fetchActivePlans();

        let pollCount = 0;
        const maxPollCount = 60;
        const pollInterval = setInterval(async () => {
          pollCount++;
          try {
            const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/calls/initiate?callSessionId=${data.callSessionId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData.success && statusData.callSession) {
                const status = statusData.callSession.status;
                if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(status)) {
                  clearInterval(pollInterval);
                  await fetchCallLogs();
                }
              }
            }
          } catch (err) {
            console.error('Poll error:', err);
          }
          if (pollCount >= maxPollCount) {
            clearInterval(pollInterval);
            toast.error('Call status polling timed out. Please check call logs.');
          }
        }, 5000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('An error occurred while making the call');
    } finally {
      setMakingCall(false);
    }
  };

  const viewProfileDetails = async (profileId: number) => {
    if (!activePlans.normal_plan?.isActive) {
      setShowUpgradeModal(true);
      toast.error("Premium subscription required to view profile details");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/profile-details/${profileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedMatch(data.profile);
        setShowProfileDetails(true);
        toast.success("Profile details loaded successfully");
      } else {
        const errorData = await response.json();
        if (errorData.error.includes("Premium subscription required")) {
          setShowUpgradeModal(true);
          toast.error("Premium subscription required");
        } else {
          toast.error(errorData.error || "Failed to fetch profile details");
        }
      }
    } catch (error) {
      console.error("Error fetching profile details:", error);
      toast.error("An error occurred while fetching profile details");
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
    setEditError("");
    setEditSuccess(false);
  };

  const handleCompleteProfile = () => {
    router.push("/profile/create");
  };

  const handleChangePassword = () => {
    setShowChangePassword(true);
    setPasswordError("");
    setPasswordSuccess(false);
    setPasswordFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditingProfile(true);
    setEditError("");
    setEditSuccess(false);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile/edit`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        setEditSuccess(true);
        await fetchUserProfile();
        toast.success("Profile updated successfully");
        setTimeout(() => {
          setShowEditProfile(false);
          setEditSuccess(false);
        }, 2000);
      } else {
        setEditError(data.error || "Failed to update profile");
        toast.error(data.error || "Failed to update profile");
      }
    } catch (error) {
      setEditError("An error occurred while updating your profile");
      toast.error("An error occurred while updating your profile");
    } finally {
      setEditingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess(false);

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError("New passwords do not match");
      toast.error("New passwords do not match");
      setChangingPassword(false);
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      toast.error("New password must be at least 6 characters long");
      setChangingPassword(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess(true);
        setPasswordFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        toast.success("Password changed successfully");
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess(false);
        }, 2000);
      } else {
        setPasswordError(data.error || "Failed to change password");
        toast.error(data.error || "Failed to change password");
      }
    } catch (error) {
      setPasswordError("An error occurred while changing your password");
      toast.error("An error occurred while changing your password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          className: 'text-sm',
          style: {
            background: '#ffffff',
            color: '#374151',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
        }}
      />
      <Header
        user={user}
        userProfile={userProfile}
        activePlans={activePlans}
        logout={logout}
      />

      {profileError && (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-orange-600 font-medium">{profileError}</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="lg:col-span-1 space-y-4">
            <ProfileCard
              userProfile={userProfile}
              onEditProfile={handleEditProfile}
              onChangePassword={handleChangePassword}
              onCompleteProfile={handleCompleteProfile}
              profileExists={profileExists}
            />
            <SubscriptionCard
              activePlans={activePlans}
              onUpgrade={() => {
                fetchPlans();
                setShowPlansModal(true);
              }}
              formatDate={formatDate}
            />
            <QuickActions
              onViewPlans={() => {
                fetchPlans();
                setShowPlansModal(true);
              }}
            />

            {/* Call Logs Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchCallLogs();
                  }}
                  className="w-full bg-white/90 border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Logs
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-blue-500" />
                    Call History
                  </DialogTitle>
                </DialogHeader>
                {loadingCallLogs ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : callLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No call logs available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callLogs.map((log) => (
                      <Card key={log.id} className="p-3 border-slate-200">
                        <div className="flex items-center space-x-3">
                          {log.other_user_photo ? (
                            <img
                              src={log.other_user_photo}
                              alt="Profile"
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {log.other_user_name || "Unknown"}
                            </p>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded text-xs ${log.call_type === 'outgoing'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-blue-100 text-blue-700'
                                }`}>
                                {log.call_type}
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {log.duration}s
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(log.created_at)}
                            </p>
                          </div>
                          {log.recording_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <a
                                href={log.recording_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Play className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t">
                  <Button
                    onClick={fetchCallLogs}
                    disabled={loadingCallLogs}
                    variant="outline"
                    className="flex items-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loadingCallLogs ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="lg:col-span-3">
            {!profileExists || !userProfile ? (
              <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <div className="text-gray-500 mb-4">
                  <svg className="h-16 w-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Your Profile</h3>
                  <p className="text-gray-600 mb-4">
                    Your profile is incomplete. Complete it to start finding matches and unlock all features.
                  </p>
                  <Button
                    onClick={handleCompleteProfile}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    Complete Profile Now
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <MatchesTab
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  matches={matches}
                  loadingMatches={loadingMatches}
                  onViewProfile={viewProfileDetails}
                  onInitiateCall={initiateCall}
                  activePlans={activePlans}
                  makingCall={makingCall}
                  onUpgrade={() => {
                    fetchPlans();
                    setShowPlansModal(true);
                  }}
                />
                <SearchTab
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  searchFilters={searchFilters}
                  setSearchFilters={setSearchFilters}
                  // Pass the new props down
                  searchResult={searchResultStats}
                  loadingSearch={loadingSearch}
                  onSearch={performSearch}
                  onResetFilters={() => {
                    setSearchFilters({
                      location: "",
                      gender: "",
                      ageMin: "",
                      ageMax: "",
                      religion: "",
                      education: "",
                      occupation: "",
                    });
                    setSearchResultStats(null);
                    toast.success("Search filters reset");
                  }}
                  onUpgrade={() => {
                    fetchPlans();
                    setShowPlansModal(true);
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* All Modals */}
      <PlansModal
        open={showPlansModal}
        onOpenChange={setShowPlansModal}
        plans={plans}
        loadingPlans={loadingPlans}
        onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          setShowPlansModal(false);
          setShowPaymentModal(true);
          toast.success("Plan selected");
        }}
      />
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        selectedPlan={selectedPlan}
        onPaymentComplete={() => {
          setShowPaymentModal(false);
          router.push("/payments/submit");
          toast.success("Payment submitted successfully");
        }}
      />
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        onViewPlans={() => {
          setShowUpgradeModal(false);
          fetchPlans();
          setShowPlansModal(true);
          toast.success("Viewing available plans");
        }}
      />
      <ProfileDetailsModal
        open={showProfileDetails}
        onOpenChange={setShowProfileDetails}
        selectedMatch={selectedMatch}
        activePlans={activePlans}
        makingCall={makingCall}
        onInitiateCall={initiateCall}
      />
      <EditProfileModal
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        editingProfile={editingProfile}
        editError={editError}
        editSuccess={editSuccess}
        onSubmit={handleEditSubmit}
      />
      <ChangePasswordModal
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        passwordFormData={passwordFormData}
        setPasswordFormData={setPasswordFormData}
        changingPassword={changingPassword}
        passwordError={passwordError}
        passwordSuccess={passwordSuccess}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
}

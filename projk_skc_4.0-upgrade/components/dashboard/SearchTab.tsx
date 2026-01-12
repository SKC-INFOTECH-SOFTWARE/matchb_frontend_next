"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Filter, X, Calendar, User, MapPin, Sparkles, TrendingUp, AlertCircle, Info, Users, CheckCircle } from "lucide-react";

// Define the result structure shared between Parent and Child
export interface SearchResultStats {
  availableCount: number;
  state: string;
  gender: string;
  message: string;
}

interface SearchFilters {
  location: string;
  gender: string;
  ageMin: string;
  ageMax: string;
  religion: string;
  education: string;
  occupation: string;
}

interface SearchTabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  onResetFilters: () => void;
  onSearch: () => void; // Function passed from Dashboard
  searchResult: SearchResultStats | null; // Data passed from Dashboard
  loadingSearch: boolean; // Loading state passed from Dashboard
  onUpgrade?: () => void;
}

export default function SearchTab({
  activeTab,
  setActiveTab,
  searchFilters,
  setSearchFilters,
  onResetFilters,
  onSearch,
  searchResult,
  loadingSearch,
  onUpgrade,
}: SearchTabProps) {

  const handleSearchFilterChange = (key: keyof SearchFilters, value: string) => {
    setSearchFilters({ ...searchFilters, [key]: value });
  };

  const hasActiveFilters = Object.values(searchFilters).some(value => value !== "");
  const canSearch = searchFilters.location && searchFilters.gender;

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
    'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Lakshadweep'
  ];

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="search" className="mt-0">
            {/* Important Notice */}
            <Alert className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 font-medium">
                <strong>Required:</strong> Please select both State and Gender to see available profile count
              </AlertDescription>
            </Alert>

            {/* Search filters section */}
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-2 mr-3">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Search Profiles</h4>
                    <p className="text-sm text-gray-600">Check available profiles in your area</p>
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetFilters}
                    className="bg-white hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 font-medium"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Filter grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* State Filter - REQUIRED */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-rose-500" />
                    State <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={searchFilters.location}
                    onValueChange={(v) => handleSearchFilterChange("location", v)}
                  >
                    <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-blue-500 ring-2 ring-blue-100">
                      <SelectValue placeholder="Select state (Required)" />
                    </SelectTrigger>
                    <SelectContent>
                      {indianStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender Filter - REQUIRED */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-2 text-purple-500" />
                    Gender <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Select
                    value={searchFilters.gender}
                    onValueChange={(v) => handleSearchFilterChange("gender", v)}
                  >
                    <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-blue-500 ring-2 ring-blue-100">
                      <SelectValue placeholder="Select gender (Required)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age Range */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                    Age Range (Optional)
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={searchFilters.ageMin}
                      onChange={(e) => handleSearchFilterChange("ageMin", e.target.value)}
                      className="h-11 bg-white border-slate-300 focus:border-blue-500"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={searchFilters.ageMax}
                      onChange={(e) => handleSearchFilterChange("ageMax", e.target.value)}
                      className="h-11 bg-white border-slate-300 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Religion Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
                    Religion (Optional)
                  </Label>
                  <Select
                    value={searchFilters.religion}
                    onValueChange={(v) => handleSearchFilterChange("religion", v)}
                  >
                    <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-blue-500">
                      <SelectValue placeholder="Any religion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hindu">Hindu</SelectItem>
                      <SelectItem value="Muslim">Muslim</SelectItem>
                      <SelectItem value="Christian">Christian</SelectItem>
                      <SelectItem value="Sikh">Sikh</SelectItem>
                      <SelectItem value="Buddhist">Buddhist</SelectItem>
                      <SelectItem value="Jain">Jain</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Education Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                    Education (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. MBA, B.Tech"
                    value={searchFilters.education}
                    onChange={(e) => handleSearchFilterChange("education", e.target.value)}
                    className="h-11 bg-white border-slate-300 focus:border-blue-500"
                  />
                </div>

                {/* Occupation Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                    Profession (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. Engineer, Doctor"
                    value={searchFilters.occupation}
                    onChange={(e) => handleSearchFilterChange("occupation", e.target.value)}
                    className="h-11 bg-white border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Search button */}
              <div className="flex flex-col items-center mt-8">
                {!canSearch && (
                  <p className="text-sm text-red-600 font-medium mb-3 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Please select both State and Gender to search
                  </p>
                )}
                <Button
                  onClick={onSearch}
                  disabled={loadingSearch || !canSearch}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 h-12 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSearch ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-3" />
                      Check Availability
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Search results section */}
            {searchResult ? (
              <div className="space-y-6">
                {searchResult.availableCount > 0 ? (
                  <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="bg-green-500 rounded-full p-4">
                          <CheckCircle className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-green-900 mb-2">
                        {searchResult.availableCount} Profiles Available
                      </h3>
                      <p className="text-lg text-green-700 mb-6">
                        Found {searchResult.availableCount} matching {searchResult.gender} profiles in {searchResult.state}
                      </p>
                      <div className="bg-white/80 rounded-xl p-6 border border-green-200">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <Users className="h-6 w-6 text-green-600" />
                          <h4 className="text-xl font-semibold text-gray-900">Profile Details Available</h4>
                        </div>
                        <p className="text-gray-700 mb-4">
                          To view complete profile details, names, photos, and contact information:
                        </p>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            <span>Upgrade to our premium plan</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            <span>Get unlimited access to all {searchResult.availableCount} profiles</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-green-600 mr-2">✓</span>
                            <span>Contact profiles directly with phone numbers</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            if (onUpgrade) onUpgrade();
                          }}
                          className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-lg shadow-md"
                        >
                          View Premium Plans
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg">
                    <CardContent className="p-8 text-center">
                      <div className="flex justify-center mb-4">
                        <div className="bg-amber-500 rounded-full p-4">
                          <AlertCircle className="h-12 w-12 text-white" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold text-amber-900 mb-2">
                        No Profiles Available
                      </h3>
                      <p className="text-lg text-amber-700 mb-4">
                        Currently, there are no profiles available for {searchResult.gender} in {searchResult.state}
                      </p>
                      <p className="text-sm text-amber-600">
                        Try adjusting your search filters or check back later
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* Empty state */
              <div className="text-center py-16">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full p-8 w-32 h-32 mx-auto mb-8 flex items-center justify-center shadow-lg">
                  <Search className="h-16 w-16 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Discover Available Profiles</h3>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                  Select a <strong>State</strong> and <strong>Gender</strong> above to check how many verified profiles are available in your area.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <div className="bg-blue-500 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-blue-900 mb-2">State-Based</h4>
                    <p className="text-sm text-blue-700">Find profiles available in your preferred state</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                    <div className="bg-purple-500 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-purple-900 mb-2">Verified Count</h4>
                    <p className="text-sm text-purple-700">See exact number of available profiles</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                    <div className="bg-green-500 rounded-lg p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-semibold text-green-900 mb-2">Premium Access</h4>
                    <p className="text-sm text-green-700">Upgrade to view complete profile details</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

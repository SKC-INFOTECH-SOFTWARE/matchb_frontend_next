import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserProfile } from "./types"
import { Search } from "lucide-react"

interface ProfileFiltersProps {
  profiles: UserProfile[]
  filters: {
    search: string
    caste: string
    ageMin: string
    ageMax: string
    state: string
    gender: string
    status: string
  }
  setFilters: (filters: any) => void
}

export default function ProfileFilters({ profiles, filters, setFilters }: ProfileFiltersProps) {
  // Get unique values for filter options
  const getUniqueValues = (field: string) => {
    const values = profiles
      .map((profile) => (profile as any)[field])
      .filter((value) => value && value.toString().trim() !== "")
    return [...new Set(values)].sort()
  }

  const uniqueCastes = getUniqueValues("caste")
  const uniqueStates = getUniqueValues("state")

  // Count profiles by status including incomplete registrations
  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    profiles.forEach((profile) => {
      const status = profile.status || 'unknown'
      counts[status] = (counts[status] || 0) + 1
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <Card>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Search className="h-4 w-4" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium">Search</Label>
            <Input
              id="search"
              placeholder="Name or email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="h-9"
            />
          </div>

          {/* Status Filter - Updated with incomplete registration option */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Profile Status
              {statusCounts.incomplete_registration > 0 && (
                <span className="ml-1 text-xs text-orange-600 bg-orange-100 px-1 rounded">
                  {statusCounts.incomplete_registration} incomplete
                </span>
              )}
            </Label>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Statuses ({profiles.length})
                </SelectItem>
                <SelectItem value="incomplete_registration">
                  Incomplete Registration ({statusCounts.incomplete_registration || 0})
                </SelectItem>
                <SelectItem value="pending">
                  Pending Approval ({statusCounts.pending || 0})
                </SelectItem>
                <SelectItem value="approved">
                  Approved ({statusCounts.approved || 0})
                </SelectItem>
                <SelectItem value="rejected">
                  Rejected ({statusCounts.rejected || 0})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
            <Select value={filters.gender} onValueChange={(value) => setFilters({ ...filters, gender: value })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Caste Filter */}
          <div className="space-y-2">
            <Label htmlFor="caste" className="text-sm font-medium">Caste</Label>
            <Select value={filters.caste} onValueChange={(value) => setFilters({ ...filters, caste: value })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All castes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Castes</SelectItem>
                {uniqueCastes.map((caste) => (
                  <SelectItem key={caste} value={caste}>
                    {caste}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State Filter */}
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm font-medium">State</Label>
            <Select value={filters.state} onValueChange={(value) => setFilters({ ...filters, state: value })}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All states" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Age Range</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Min"
                type="number"
                value={filters.ageMin}
                onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                className="h-9"
              />
              <Input
                placeholder="Max"
                type="number"
                value={filters.ageMax}
                onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">{profiles.length}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
            {statusCounts.incomplete_registration > 0 && (
              <div>
                <div className="text-lg font-semibold text-orange-600">{statusCounts.incomplete_registration}</div>
                <div className="text-xs text-gray-600">Incomplete</div>
              </div>
            )}
            <div>
              <div className="text-lg font-semibold text-yellow-600">{statusCounts.pending || 0}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">{statusCounts.approved || 0}</div>
              <div className="text-xs text-gray-600">Approved</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-red-600">{statusCounts.rejected || 0}</div>
              <div className="text-xs text-gray-600">Rejected</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-600">
                {profiles.filter(p => (p as any).user_status === 'banned').length}
              </div>
              <div className="text-xs text-gray-600">Banned</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
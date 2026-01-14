import { UserProfile, Payment, PotentialMatch, CurrentMatch } from "./types"

export const fetchProfiles = async (): Promise<UserProfile[]> => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/profiles`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      const data = await response.json()
      return Array.isArray(data)
        ? data.filter((profile: UserProfile) => profile.name && typeof profile.name === 'string' && profile.name.length > 0)
        : []
    }
    return []
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return []
  }
}

export const fetchStats = async () => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      return await response.json()
    }
    return { totalUsers: 0, activeUsers: 0, maleUsers: 0, femaleUsers: 0 }
  } catch (error) {
    console.error("Error fetching stats:", error)
    return { totalUsers: 0, activeUsers: 0, maleUsers: 0, femaleUsers: 0 }
  }
}

export const fetchPayments = async (): Promise<Payment[]> => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/payments`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      const data = await response.json()
      return data.payments || []
    }
    return []
  } catch (error) {
    console.error("Error fetching payments:", error)
    return []
  }
}

export const fetchMatches = async (userId: number) => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/matches?userId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.ok) {
      return await response.json()
    }
    return { potentialMatches: [], currentMatches: [], userProfile: null }
  } catch (error) {
    console.error("Error fetching matches:", error)
    return { potentialMatches: [], currentMatches: [], userProfile: null }
  }
}

export const handleProfileApproval = async (
  profileId: number,
  status: "approved" | "rejected",
  rejectionReason: string
) => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/approve-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profileId, status, rejectionReason }),
    })

    return response.ok
  } catch (error) {
    console.error("Error updating profile:", error)
    return false
  }
}

export const handlePaymentVerification = async (
  paymentId: number,
  status: "verified" | "rejected",
  adminNotes: string
) => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paymentId, status, adminNotes }),
    })

    return response.ok
  } catch (error) {
    console.error("Error updating payment:", error)
    return false
  }
}

export const updateUserStatus = async (userId: number, status: string) => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/update-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, status }),
    })

    return response.ok
  } catch (error) {
    console.error("Error updating status:", error)
    return false
  }
}

export const createMatches = async (userId: number, matchedUserIds: number[]) => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, matchedUserIds }),
    })

    return response.ok
  } catch (error) {
    console.error("Error creating matches:", error)
    return false
  }
}

export const removeMatch = async (userId: number, matchedUserId: number) => {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/matches`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, matchedUserId }),
    })

    return response.ok
  } catch (error) {
    console.error("Error removing match:", error)
    return false
  }
}

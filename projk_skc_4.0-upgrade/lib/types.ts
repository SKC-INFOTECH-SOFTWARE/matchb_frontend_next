export interface User {
  user_id: number
  email: string
  phone: string
  created_at: string
}

export interface Admin {
  admin_id: number
  username: string
  email: string
  created_at: string
}

export interface Profile {
  profile_id: number
  user_id: number
  photo: string | null
  contact: string | null
  caste: string | null
  location: string | null
  state: string | null
  gender: "male" | "female"
  age: number | null
  status: "pending" | "approved" | "rejected"
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface ProfileWithUser extends Profile {
  email: string
  phone: string
}

export interface Match {
  match_id: number
  user_id: number
  matched_user_id: number
  created_at: string
  profile: ProfileWithUser
}

export interface AdminStats {
  totalUsers: number
  totalProfiles: number
  pendingProfiles: number
  approvedProfiles: number
  rejectedProfiles: number
  pendingPayments: number
  verifiedPayments: number
}

export interface ProfileFilter {
  gender?: "male" | "female"
  ageMin?: number
  ageMax?: number
  caste?: string
  location?: string
  state?: string
  status?: "pending" | "approved" | "rejected"
}

export interface Payment {
  payment_id: number
  user_id: number
  plan_id: number
  amount: number
  transaction_id: string
  payment_method: string
  payment_status: "pending" | "verified" | "failed"
  screenshot_url?: string
  created_at: string
}

export interface Plan {
  plan_id: number
  plan_name: string
  price: number
  duration_months: number
  features: string
  created_at: string
}

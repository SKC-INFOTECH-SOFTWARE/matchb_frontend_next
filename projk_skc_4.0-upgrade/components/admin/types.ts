export interface UserProfile {
  id: number
  user_id: number
  name: string
  email: string
  phone: string
  age: number
  gender: string
  height?: string
  weight?: string
  caste: string
  religion: string
  mother_tongue?: string
  marital_status: string
  education: string
  occupation: string
  income?: string
  state: string
  city: string
  family_type?: string
  family_status?: string
  about_me?: string
  partner_preferences?: string
  profile_photo: string
  status: "pending" | "approved" | "rejected" | "incomplete_registration" 
  rejection_reason?: string
  created_at: string
  updated_at?: string
  recovery_password?: string | null;
}

export interface Payment {
  id: number
  transaction_id: string
  amount: number
  payment_method: string
  screenshot: string
  status: "pending" | "verified" | "rejected"
  admin_notes?: string
  created_at: string
  verified_at?: string
  user_id: number
  user_name: string
  user_email: string
  plan_name: string
  plan_price: number
  verified_by_name?: string
}

export interface PotentialMatch {
  id: number
  name: string
  email: string
  age: number
  gender: string
  caste: string
  religion: string
  state: string
  city: string
  occupation: string
  education: string
  profile_photo: string
  already_matched: number
}

export interface CurrentMatch {
  id: number
  name: string
  age: number
  gender: string
  caste: string
  state: string
  city: string
  matched_at: string
  profile_photo: string
}
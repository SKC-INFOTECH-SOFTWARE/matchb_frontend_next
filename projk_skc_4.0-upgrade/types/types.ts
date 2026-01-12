
export interface UserProfile {
  id: number;
  name: string;
  age: number;
  gender: string;
  height?: string;
  weight?: string;
  caste?: string;
  religion: string;
  mother_tongue?: string;
  marital_status: string;
  education?: string;
  occupation?: string;
  income?: string;
  state: string;
  city: string;
  family_type?: string;
  family_status?: string;
  about_me?: string;
  partner_preferences?: string;
  profile_photo?: string;
  created_by_admin?: boolean;
  compatibility_score?: number;
  distance?: number;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  type: "normal" | "call";
  duration_months?: number;
  call_credits?: number;
  description: string;
  features: string[];
}

export interface ActivePlan {
  normal_plan?: {
    isActive: boolean;
    plan_name: string;
    daysLeft: number;
    expires_at: string;
  };
  call_plan?: {
    isActive: boolean;
    plan_name: string;
    credits_remaining: number;
    expires_at: string;
  };
}


export interface CallLog {
  id: number;
  other_user_name: string;
  other_user_photo: string;
  duration: number;
  call_type: string;
  call_status: string;
  created_at: string;
  recording_url: string;
}

export interface SearchFilters {
  location: string;
  gender: string;
  ageMin: string;
  ageMax: string;
  religion: string;
  education: string;
  occupation: string;
}

import { type NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
};

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Updated query to include users without profiles (incomplete registrations)
    const [rows] = await connection.execute(`
      SELECT 
        u.id as user_id,
        u.name, 
        u.email, 
        u.phone, 
        u.recovery_password, 
        u.status as user_status,
        u.created_at as user_created_at,
        
        -- Profile data (will be NULL for incomplete registrations)
        up.id as profile_id,
        up.age,
        up.gender,
        up.height,
        up.weight,
        up.caste,
        up.religion,
        up.mother_tongue,
        up.marital_status,
        up.education,
        up.occupation,
        up.income,
        up.state,
        up.city,
        up.family_type,
        up.family_status,
        up.about_me,
        up.partner_preferences,
        up.profile_photo,
        up.status as profile_status,
        up.rejection_reason,
        up.created_at as profile_created_at,
        up.updated_at as profile_updated_at,
        
        -- Subscription and plan info
        CASE WHEN ns.id IS NOT NULL THEN 1 ELSE 0 END as has_normal_plan,
        CASE WHEN cc.id IS NOT NULL THEN 1 ELSE 0 END as has_call_plan,
        COALESCE(cc.credits_remaining, 0) as call_credits_remaining,
        
        -- Match count
        (SELECT COUNT(*) FROM matches WHERE user_id = u.id OR matched_user_id = u.id) as total_matches,
        
        -- Profile completion status
        CASE 
          WHEN up.id IS NULL THEN 'incomplete_registration'
          ELSE up.status 
        END as computed_status
        
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      LEFT JOIN user_subscriptions ns ON ns.user_id = u.id AND ns.status = 'active' AND ns.expires_at > NOW()
      LEFT JOIN user_call_credits cc ON cc.user_id = u.id AND cc.credits_remaining > 0 AND cc.expires_at > NOW()
      WHERE u.role = 'user'
      ORDER BY 
        CASE 
          WHEN up.id IS NULL THEN 0  -- Incomplete registrations first
          ELSE 1
        END,
        u.created_at DESC
    `);

    await connection.end();

    const profiles = (rows as any[]).map((row) => ({
      id: row.profile_id || `incomplete_${row.user_id}`, // Use special ID for incomplete profiles
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      recovery_password: row.recovery_password,
      user_created_at: row.user_created_at,
      
      // Profile fields (may be null for incomplete registrations)
      age: row.age,
      gender: row.gender,
      height: row.height,
      weight: row.weight,
      caste: row.caste,
      religion: row.religion,
      mother_tongue: row.mother_tongue,
      marital_status: row.marital_status,
      education: row.education,
      occupation: row.occupation,
      income: row.income,
      state: row.state,
      city: row.city,
      family_type: row.family_type,
      family_status: row.family_status,
      about_me: row.about_me,
      partner_preferences: row.partner_preferences,
      profile_photo: row.profile_photo,
      
      // Status handling
      status: row.computed_status,
      rejection_reason: row.rejection_reason,
      created_at: row.profile_created_at || row.user_created_at,
      updated_at: row.profile_updated_at,
      
      // User status and additional info
      user_status: row.user_status,
      has_normal_plan: row.has_normal_plan === 1,
      has_call_plan: row.has_call_plan === 1,
      call_credits_remaining: row.call_credits_remaining || 0,
      total_matches: row.total_matches || 0,
      
      // Flag to identify incomplete registrations
      is_incomplete_registration: row.profile_id === null,
    }));

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Enhanced profiles error:", error);
    return NextResponse.json({ error: "Failed to fetch enhanced profiles" }, { status: 500 });
  }
}
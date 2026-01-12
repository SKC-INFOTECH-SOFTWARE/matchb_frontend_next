// app/api/user/subscription-status/route.ts (New file)
import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import jwt from "jsonwebtoken"

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const connection = await mysql.createConnection(dbConfig)

    // Check active normal subscription
    const [normalSubRows] = await connection.execute(`
      SELECT 
        us.*,
        p.name as plan_name,
        p.price,
        p.duration_months,
        p.can_view_details,
        p.can_make_calls
      FROM user_subscriptions us
      JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? 
        AND us.status = 'active'
        AND p.type = 'normal'
        AND us.expires_at > NOW()
      ORDER BY us.expires_at DESC
      LIMIT 1
    `, [decoded.userId])

    // Check active call credits
    const [callCreditsRows] = await connection.execute(`
      SELECT 
        uc.*,
        p.name as plan_name,
        p.price,
        p.call_credits
      FROM user_call_credits uc
      JOIN plans p ON uc.plan_id = p.id
      WHERE uc.user_id = ? 
        AND uc.credits_remaining > 0
        AND uc.expires_at > NOW()
      ORDER BY uc.expires_at DESC
      LIMIT 1
    `, [decoded.userId])

    const normalSub = (normalSubRows as any[])[0]
    const callCredits = (callCreditsRows as any[])[0]

    // Get user's profile completion status
    const [userProfileRows] = await connection.execute(`
      SELECT 
        CASE 
          WHEN about_me IS NOT NULL AND about_me != '' 
          AND partner_preferences IS NOT NULL AND partner_preferences != ''
          AND profile_photo IS NOT NULL AND profile_photo != ''
          THEN true 
          ELSE false 
        END as profile_complete
      FROM user_profiles 
      WHERE user_id = ?
    `, [decoded.userId])

    const profileComplete = (userProfileRows as any[])[0]?.profile_complete || false

    await connection.end()

    // Calculate subscription status
    const now = new Date()
    let subscriptionStatus = {
      is_premium: false,
      can_view_details: false,
      can_make_calls: false,
      has_call_credits: false,
      profile_complete: profileComplete,
      normal_plan: null as any,
      call_plan: null as any,
      recommendations: [] as string[]
    }

    // Process normal subscription
    if (normalSub) {
      const expiresAt = new Date(normalSub.expires_at)
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysLeft > 0) {
        subscriptionStatus.is_premium = true
        subscriptionStatus.can_view_details = normalSub.can_view_details
        subscriptionStatus.can_make_calls = normalSub.can_make_calls
        subscriptionStatus.normal_plan = {
          plan_name: normalSub.plan_name,
          price: normalSub.price,
          duration_months: normalSub.duration_months,
          expires_at: normalSub.expires_at,
          days_left: Math.max(0, daysLeft),
          is_active: true
        }
      }
    }

    // Process call credits
    if (callCredits) {
      const expiresAt = new Date(callCredits.expires_at)
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (daysLeft > 0 && callCredits.credits_remaining > 0) {
        subscriptionStatus.has_call_credits = true
        subscriptionStatus.call_plan = {
          plan_name: callCredits.plan_name,
          credits_remaining: callCredits.credits_remaining,
          expires_at: callCredits.expires_at,
          days_left: Math.max(0, daysLeft),
          is_active: true
        }
      }
    }

    // Generate recommendations
    if (!subscriptionStatus.is_premium) {
      subscriptionStatus.recommendations.push("Upgrade to Premium to view full profile details and contact information")
      subscriptionStatus.recommendations.push("Premium members get unlimited profile views and advanced search filters")
    }

    if (!subscriptionStatus.has_call_credits) {
      subscriptionStatus.recommendations.push("Purchase call credits to make secure calls to your matches")
    }

    if (!profileComplete) {
      subscriptionStatus.recommendations.push("Complete your profile to get better matches")
    }

    return NextResponse.json({
      subscription_status: subscriptionStatus
    })

  } catch (error) {
    console.error("Subscription status error:", error)
    return NextResponse.json({ error: "Failed to fetch subscription status" }, { status: 500 })
  }
}
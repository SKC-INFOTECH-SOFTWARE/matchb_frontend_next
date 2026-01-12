
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as any

    const { id: profileId } = await context.params

    if (!profileId) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 })
    }   

    const connection = await mysql.createConnection(dbConfig)

    // Check if user has active subscription to view details
    const [subscriptionRows] = await connection.execute(`
      SELECT us.*, p.can_view_details
      FROM user_subscriptions us
      JOIN plans p ON us.plan_id = p.id
      WHERE us.user_id = ? 
        AND us.status = 'active'
        AND p.type = 'normal'
        AND us.expires_at > NOW()
      ORDER BY us.expires_at DESC
      LIMIT 1
    `, [decoded.userId])

    const subscription = (subscriptionRows as any[])[0]

    if (!subscription || !subscription.can_view_details) {
      await connection.end()
      return NextResponse.json({ 
        error: "Premium subscription required to view profile details" 
      }, { status: 403 })
    }

    // Check if this profile is in user's matches OR search results are allowed
    const [matchRows] = await connection.execute(`
      SELECT 1 FROM matches 
      WHERE (user_id = ? AND matched_user_id = ?) 
         OR (user_id = ? AND matched_user_id = ?)
    `, [decoded.userId, profileId, profileId, decoded.userId])

    const isMatched = (matchRows as any[]).length > 0

    // Get complete profile details
    const [profileRows] = await connection.execute(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
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
        up.created_at,
        up.updated_at
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ? 
        AND u.status = 'active' 
        AND up.status = 'approved'
    `, [profileId])

    const profile = (profileRows as any[])[0]

    if (!profile) {
      await connection.end()
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    await connection.end()

    return NextResponse.json({ 
      profile: {
        ...profile,
        is_matched: isMatched
      }
    })
  } catch (error) {
    console.error("Profile details fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
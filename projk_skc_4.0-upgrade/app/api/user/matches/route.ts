// app/api/user/matches/route.ts (Updated with call_allowed status)
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

    // Verify user role
    const [userRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const user = (userRows as any[])[0]

    if (!user || user.role !== "user") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all matches with block status and call permission
    const [matchRows] = await connection.execute(`
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
        m.created_at as matched_at,
        m.created_by_admin,
        admin_user.name as matched_by_admin_name,

        -- Block status checks
        CASE WHEN ub_me.id IS NOT NULL THEN 1 ELSE 0 END as i_blocked_them,
        CASE WHEN ub_them.id IS NOT NULL THEN 1 ELSE 0 END as they_blocked_me,
        ub_me.created_at as blocked_by_me_at,
        ub_them.created_at as blocked_me_at,

        -- Call permission (only relevant when current user blocked the match)
        COALESCE(ub_me.call_allowed, 0) as call_allowed

      FROM matches m
      JOIN users u ON m.matched_user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN users admin_user ON m.created_by_admin = admin_user.id

      -- Check if current user blocked this match
      LEFT JOIN user_blocks ub_me ON ub_me.blocker_id = ? AND ub_me.blocked_id = u.id

      -- Check if this match blocked current user
      LEFT JOIN user_blocks ub_them ON ub_them.blocker_id = u.id AND ub_them.blocked_id = ?

      WHERE m.user_id = ?
        AND u.status = 'active'
        AND up.status = 'approved'
      ORDER BY m.created_at DESC
    `, [decoded.userId, decoded.userId, decoded.userId])

    await connection.end()

    return NextResponse.json({
      matches: matchRows,
      total: (matchRows as any[]).length
    })
  } catch (error) {
    console.error("User matches fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
// Get single match profile details (with subscription check)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { matchedUserId } = await request.json()

    if (!matchedUserId) {
      return NextResponse.json({ error: "Matched user ID is required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verify user role
    const [userRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const user = (userRows as any[])[0]
    if (!user || user.role !== "user") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

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

    // Verify that this user is actually matched with the requested profile
    const [matchVerification] = await connection.execute(
      "SELECT id FROM matches WHERE user_id = ? AND matched_user_id = ?",
      [decoded.userId, matchedUserId]
    )

    if ((matchVerification as any[]).length === 0) {
      await connection.end()
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

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
    `, [matchedUserId])

    const profile = (profileRows as any[])[0]

    if (!profile) {
      await connection.end()
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    await connection.end()

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Match profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

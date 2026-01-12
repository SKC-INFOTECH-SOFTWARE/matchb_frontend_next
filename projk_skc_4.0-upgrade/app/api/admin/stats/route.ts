
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
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Enhanced statistics queries
    const statsQueries = [
      // Basic user stats
      "SELECT COUNT(*) as totalUsers FROM users WHERE role = 'user'",
      "SELECT COUNT(*) as activeUsers FROM users WHERE role = 'user' AND status = 'active'",
      "SELECT COUNT(*) as maleUsers FROM user_profiles WHERE gender = 'Male' AND status = 'approved'",
      "SELECT COUNT(*) as femaleUsers FROM user_profiles WHERE gender = 'Female' AND status = 'approved'",
      
      // Profile stats
      "SELECT COUNT(*) as pendingProfiles FROM user_profiles WHERE status = 'pending'",
      "SELECT COUNT(*) as approvedProfiles FROM user_profiles WHERE status = 'approved'",
      
      // Match stats
      "SELECT COUNT(*) as totalMatches FROM matches", // Changed from user_matches to matches
      
      // Call stats
      "SELECT COUNT(*) as activeCallSessions FROM call_sessions WHERE status IN ('initiated', 'ringing', 'in_progress')",
      "SELECT COALESCE(SUM(duration), 0) as callMinutesUsed FROM call_sessions WHERE status = 'completed' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())",
      
      // Revenue stats
      "SELECT COALESCE(SUM(amount), 0) as totalRevenue FROM payments WHERE status = 'verified' AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())",
      
      // Subscription stats
      "SELECT COUNT(*) as normalSubscriptions FROM user_subscriptions us JOIN plans p ON us.plan_id = p.id WHERE us.status = 'active' AND p.type = 'normal' AND us.expires_at > NOW()",
      "SELECT COUNT(*) as callSubscriptions FROM user_call_credits uc JOIN plans p ON uc.plan_id = p.id WHERE uc.credits_remaining > 0 AND p.type = 'call' AND uc.expires_at > NOW()"
    ]

    const results = await Promise.all(
      statsQueries.map(async (query, index) => {
        try {
          const [rows] = await connection.execute(query)
          return rows
        } catch (error) {
          console.error(`Error executing query ${index + 1}: ${query}`, error)
          throw error // Re-throw to be caught by outer try-catch
        }
      })
    )

    const stats = {
      totalUsers: (results[0] as any[])[0]?.totalUsers || 0,
      activeUsers: (results[1] as any[])[0]?.activeUsers || 0,
      maleUsers: (results[2] as any[])[0]?.maleUsers || 0,
      femaleUsers: (results[3] as any[])[0]?.femaleUsers || 0,
      pendingProfiles: (results[4] as any[])[0]?.pendingProfiles || 0,
      approvedProfiles: (results[5] as any[])[0]?.approvedProfiles || 0,
      totalMatches: (results[6] as any[])[0]?.totalMatches || 0,
      activeCallSessions: (results[7] as any[])[0]?.activeCallSessions || 0,
      callMinutesUsed: (results[8] as any[])[0]?.callMinutesUsed || 0,
      totalRevenue: (results[9] as any[])[0]?.totalRevenue || 0,
      normalSubscriptions: (results[10] as any[])[0]?.normalSubscriptions || 0,
      callSubscriptions: (results[11] as any[])[0]?.callSubscriptions || 0,
    }

    await connection.end()

    return NextResponse.json(stats)

  } catch (error) {
    console.error("Enhanced stats error:", error)
    return NextResponse.json({ error: "Failed to fetch enhanced stats" }, { status: 500 })
  }
}

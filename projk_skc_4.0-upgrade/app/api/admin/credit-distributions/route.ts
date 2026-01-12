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

    const [rows] = await connection.execute(`
      SELECT 
        uc.user_id,
        u.name as user_name,
        uc.credits_purchased as allocated_credits,
        (uc.credits_purchased - uc.credits_remaining) as used_credits,
        uc.credits_remaining,
        uc.expires_at,
        CASE 
          WHEN uc.expires_at > NOW() AND uc.credits_remaining > 0 THEN 'active'
          WHEN uc.expires_at <= NOW() THEN 'expired'
          WHEN uc.credits_remaining <= 0 THEN 'exhausted'
          ELSE 'inactive'
        END as status,
        last_call.last_call_date as last_call
      FROM user_call_credits uc
      JOIN users u ON uc.user_id = u.id
      LEFT JOIN (
        SELECT 
          caller_id as user_id,
          MAX(created_at) as last_call_date
        FROM call_sessions
        WHERE status = 'completed'
        GROUP BY caller_id
      ) last_call ON uc.user_id = last_call.user_id
      WHERE uc.credits_purchased > 0
      ORDER BY uc.updated_at DESC
    `)

    const distributions = (rows as any[]).map(row => ({
      user_id: row.user_id,
      user_name: row.user_name,
      allocated_credits: row.allocated_credits || 0,
      used_credits: row.used_credits || 0,
      remaining_credits: row.credits_remaining || 0,
      last_call: row.last_call,
      status: row.status
    }))

    await connection.end()

    return NextResponse.json({ distributions })

  } catch (error) {
    console.error("Credit distributions error:", error)
    return NextResponse.json({ error: "Failed to fetch credit distributions" }, { status: 500 })
  }
}
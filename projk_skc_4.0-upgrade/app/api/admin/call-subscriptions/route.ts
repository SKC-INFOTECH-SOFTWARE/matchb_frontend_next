// app/api/admin/call-subscriptions/route.ts
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

    // Get call subscriptions with payment info
    const [rows] = await connection.execute(`
      SELECT 
        p.*,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        up.profile_photo as user_photo,
        pl.name as plan_name,
        pl.call_credits as plan_credits,
        
        -- Get credits info from user_call_credits table
        uc.credits_purchased,
        uc.credits_remaining,
        (uc.credits_purchased - uc.credits_remaining) as credits_used,
        uc.expires_at,
        CASE WHEN uc.expires_at > NOW() AND uc.credits_remaining > 0 THEN 1 ELSE 0 END as is_active,
        
        -- Get call usage stats
        COALESCE(call_stats.total_calls, 0) as total_calls_made,
        COALESCE(call_stats.total_duration, 0) as total_call_duration,
        
        -- Admin verification info
        admin.name as verified_by,
        p.verified_at
        
      FROM payments p
      JOIN users u ON p.user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      JOIN plans pl ON p.plan_id = pl.id AND pl.type = 'call'
      LEFT JOIN user_call_credits uc ON p.user_id = uc.user_id AND p.plan_id = uc.plan_id
      LEFT JOIN users admin ON p.verified_by = admin.id
      
      -- Get call usage statistics
      LEFT JOIN (
        SELECT 
          caller_id as user_id,
          COUNT(*) as total_calls,
          SUM(CASE WHEN duration > 0 THEN duration ELSE 0 END) as total_duration
        FROM call_sessions
        WHERE status = 'completed'
        GROUP BY caller_id
        
        UNION ALL
        
        SELECT 
          receiver_id as user_id,
          COUNT(*) as total_calls,
          SUM(CASE WHEN duration > 0 THEN duration ELSE 0 END) as total_duration
        FROM call_sessions
        WHERE status = 'completed'
        GROUP BY receiver_id
      ) call_stats ON p.user_id = call_stats.user_id
      
      ORDER BY p.created_at DESC
    `)

    await connection.end()

    const subscriptions = (rows as any[]).map(row => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name,
      user_email: row.user_email,
      user_phone: row.user_phone,
      user_photo: row.user_photo,
      plan_name: row.plan_name,
      plan_id: row.plan_id,
      credits_purchased: row.credits_purchased || row.plan_credits || 0,
      credits_remaining: row.credits_remaining || 0,
      credits_used: row.credits_used || 0,
      amount_paid: parseFloat(row.amount) || 0,
      payment_status: row.status,
      payment_screenshot: row.screenshot,
      transaction_id: row.transaction_id,
      admin_notes: row.admin_notes || "",
      expires_at: row.expires_at,
      created_at: row.created_at,
      verified_at: row.verified_at,
      verified_by: row.verified_by,
      is_active: row.is_active === 1,
      total_call_duration: parseInt(row.total_call_duration) || 0,
      total_calls_made: parseInt(row.total_calls_made) || 0
    }))

    return NextResponse.json({ subscriptions })

  } catch (error) {
    console.error("Call subscriptions error:", error)
    return NextResponse.json({ error: "Failed to fetch call subscriptions" }, { status: 500 })
  }
}
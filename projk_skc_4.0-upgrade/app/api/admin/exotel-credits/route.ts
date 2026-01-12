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

    // Get Exotel configuration
    const [configRows] = await connection.execute(
      "SELECT * FROM exotel_config ORDER BY updated_at DESC LIMIT 1"
    )

    let config = (configRows as any[])[0]

    // If no config exists, create default
    if (!config) {
      await connection.execute(`
        INSERT INTO exotel_config (total_credits, cost_per_minute, monthly_limit, created_at, updated_at)
        VALUES (10000, 1.0, 5000, NOW(), NOW())
      `)
      
      const [newConfigRows] = await connection.execute(
        "SELECT * FROM exotel_config ORDER BY updated_at DESC LIMIT 1"
      )
      config = (newConfigRows as any[])[0]
    }

    // Calculate used credits from all call sessions
    const [usedCreditsRows] = await connection.execute(`
      SELECT 
        COALESCE(SUM(CEIL(duration/60) * ?), 0) as used_credits,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) 
                          THEN CEIL(duration/60) * ? ELSE 0 END), 0) as current_month_usage
      FROM call_sessions 
      WHERE status = 'completed' AND duration > 0
    `, [config.cost_per_minute, config.cost_per_minute])

    const usedCredits = (usedCreditsRows as any[])[0]

    const credits = {
      total_credits: config.total_credits,
      used_credits: usedCredits.used_credits || 0,
      remaining_credits: Math.max(0, config.total_credits - (usedCredits.used_credits || 0)),
      cost_per_minute: parseFloat(config.cost_per_minute),
      monthly_limit: config.monthly_limit,
      current_month_usage: usedCredits.current_month_usage || 0,
      last_updated: config.updated_at
    }

    await connection.end()

    return NextResponse.json({ credits })

  } catch (error) {
    console.error("Exotel credits error:", error)
    return NextResponse.json({ error: "Failed to fetch Exotel credits" }, { status: 500 })
  }
}
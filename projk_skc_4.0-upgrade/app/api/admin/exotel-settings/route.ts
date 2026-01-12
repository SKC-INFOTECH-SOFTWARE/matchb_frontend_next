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

export async function POST(request: NextRequest) {
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

    const { totalCredits, costPerMinute, monthlyLimit } = await request.json()

    if (!totalCredits || !costPerMinute || !monthlyLimit) {
      return NextResponse.json({ 
        error: "Total credits, cost per minute, and monthly limit are required" 
      }, { status: 400 })
    }

    if (totalCredits <= 0 || costPerMinute <= 0 || monthlyLimit <= 0) {
      return NextResponse.json({ error: "All values must be positive" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Update or insert Exotel configuration
    const [existingRows] = await connection.execute("SELECT id FROM exotel_config LIMIT 1")

    if ((existingRows as any[]).length > 0) {
      await connection.execute(`
        UPDATE exotel_config 
        SET total_credits = ?, cost_per_minute = ?, monthly_limit = ?, updated_at = NOW()
        WHERE id = (SELECT id FROM exotel_config LIMIT 1)
      `, [totalCredits, costPerMinute, monthlyLimit])
    } else {
      await connection.execute(`
        INSERT INTO exotel_config (total_credits, cost_per_minute, monthly_limit, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
      `, [totalCredits, costPerMinute, monthlyLimit])
    }

    // Log the settings change
    await connection.execute(`
      INSERT INTO exotel_credit_log (action, credits, admin_id, reason, created_at)
      VALUES ('settings_update', ?, ?, ?, NOW())
    `, [totalCredits, decoded.userId, `Updated Exotel settings: ${totalCredits} credits, ₹${costPerMinute}/min, ${monthlyLimit} monthly limit`])

    await connection.end()

    return NextResponse.json({
      success: true,
      message: "Exotel settings updated successfully"
    })

  } catch (error) {
    console.error("Exotel settings update error:", error)
    return NextResponse.json({ error: "Failed to update Exotel settings" }, { status: 500 })
  }
}
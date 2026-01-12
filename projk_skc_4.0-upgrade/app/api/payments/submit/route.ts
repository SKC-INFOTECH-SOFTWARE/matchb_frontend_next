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
    const { planId, transactionId, screenshot } = await request.json()

    if (!planId || !transactionId) {
      return NextResponse.json({ error: "Plan ID and transaction ID are required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Check if transaction ID already exists
    const [existingPayment] = await connection.execute(
      "SELECT id FROM payments WHERE transaction_id = ?",
      [transactionId]
    )

    if ((existingPayment as any[]).length > 0) {
      await connection.end()
      return NextResponse.json({ error: "Transaction ID already exists" }, { status: 409 })
    }

    // Get plan details
    const [planRows] = await connection.execute(
      "SELECT id, name, price FROM plans WHERE id = ? AND is_active = true",
      [planId]
    )

    const plan = (planRows as any[])[0]
    if (!plan) {
      await connection.end()
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Create payment record
    await connection.execute(
      `INSERT INTO payments (user_id, plan_id, transaction_id, amount, screenshot, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
      [decoded.userId, planId, transactionId, plan.price, screenshot || null]
    )

    await connection.end()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Payment submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get user's payment history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    const connection = await mysql.createConnection(dbConfig)

    const [rows] = await connection.execute(`
      SELECT 
        p.id, p.transaction_id, p.amount, p.status, p.admin_notes,
        p.created_at, p.verified_at,
        pl.name as plan_name, pl.duration_months
      FROM payments p
      JOIN plans pl ON p.plan_id = pl.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [decoded.userId])

    await connection.end()

    return NextResponse.json({ payments: rows })
  } catch (error) {
    console.error("Payment history fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
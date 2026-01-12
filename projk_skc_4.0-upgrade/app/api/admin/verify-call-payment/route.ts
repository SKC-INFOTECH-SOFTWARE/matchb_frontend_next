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

    const { subscriptionId, action, adminNotes } = await request.json()

    if (!subscriptionId || !action) {
      return NextResponse.json({ error: "Subscription ID and action are required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Get payment details
    const [paymentRows] = await connection.execute(
      `SELECT p.*, pl.call_credits, pl.name as plan_name 
       FROM payments p 
       JOIN plans pl ON p.plan_id = pl.id 
       WHERE p.id = ? AND pl.type = 'call'`,
      [subscriptionId]
    )

    const payment = (paymentRows as any[])[0]

    if (!payment) {
      await connection.end()
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    const newStatus = action === 'verify' ? 'verified' : 'rejected'

    // Update payment status
    await connection.execute(`
      UPDATE payments 
      SET status = ?, admin_notes = ?, verified_by = ?, verified_at = NOW() 
      WHERE id = ?
    `, [newStatus, adminNotes, decoded.userId, subscriptionId])

    if (action === 'verify') {
      // Create or update user call credits
      const [existingCredits] = await connection.execute(
        "SELECT * FROM user_call_credits WHERE user_id = ? AND plan_id = ?",
        [payment.user_id, payment.plan_id]
      )

      const expirationDate = new Date()
      expirationDate.setMonth(expirationDate.getMonth() + 3) // 3 months validity

      if ((existingCredits as any[]).length > 0) {
        // Update existing credits
        await connection.execute(`
          UPDATE user_call_credits 
          SET credits_remaining = credits_remaining + ?, 
              credits_purchased = credits_purchased + ?,
              expires_at = ?,
              updated_at = NOW()
          WHERE user_id = ? AND plan_id = ?
        `, [payment.call_credits, payment.call_credits, expirationDate, payment.user_id, payment.plan_id])
      } else {
        // Create new credit entry
        await connection.execute(`
          INSERT INTO user_call_credits 
          (user_id, plan_id, credits_purchased, credits_remaining, expires_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, [payment.user_id, payment.plan_id, payment.call_credits, payment.call_credits, expirationDate])
      }

      // Update Exotel credit tracking
      await connection.execute(`
        INSERT INTO exotel_credit_log (action, credits, user_id, admin_id, reason, created_at)
        VALUES ('allocated', ?, ?, ?, ?, NOW())
      `, [payment.call_credits, payment.user_id, decoded.userId, `Payment verified: ${payment.plan_name}`])
    }

    await connection.end()

    return NextResponse.json({
      success: true,
      message: action === 'verify' ? 'Payment verified and credits activated' : 'Payment rejected',
      status: newStatus
    })

  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to process payment verification" }, { status: 500 })
  }
}

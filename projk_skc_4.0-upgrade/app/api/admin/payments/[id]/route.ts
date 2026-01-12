// app/api/admin/payments/[id]/route.ts (Fixed version)
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

// Helper function to calculate expiry date
function calculateExpiryDate(durationMonths: number): Date {
  const now = new Date()
  const expiryDate = new Date(now)
  expiryDate.setMonth(now.getMonth() + durationMonths)
  return expiryDate
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    // Check admin role
    const connection = await mysql.createConnection(dbConfig)
    const [userRows] = await connection.execute(
      "SELECT role FROM users WHERE id = ?",
      [decoded.userId]
    )

    if ((userRows as any[])[0]?.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const paymentId = params.id
    const { status, adminNotes } = await request.json()

    if (!["verified", "rejected"].includes(status)) {
      await connection.end()
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Start transaction
    await connection.beginTransaction()

    try {
      // Get payment details
      const [paymentRows] = await connection.execute(
        "SELECT * FROM payments WHERE id = ?",
        [paymentId]
      )

      const payment = (paymentRows as any[])[0]
      if (!payment) {
        await connection.rollback()
        await connection.end()
        return NextResponse.json({ error: "Payment not found" }, { status: 404 })
      }

      // Get plan details
      const [planRows] = await connection.execute(
        "SELECT * FROM plans WHERE id = ?",
        [payment.plan_id]
      )

      const plan = (planRows as any[])[0]
      if (!plan) {
        await connection.rollback()
        await connection.end()
        return NextResponse.json({ error: "Plan not found" }, { status: 404 })
      }

      // Update payment status
      await connection.execute(
        "UPDATE payments SET status = ?, admin_notes = ?, verified_by = ?, verified_at = NOW() WHERE id = ?",
        [status, adminNotes, decoded.userId, paymentId]
      )

      // If verified, create subscription/credits
      if (status === "verified") {
        if (plan.type === "normal") {
          // Create/Update normal subscription
          const expiryDate = calculateExpiryDate(plan.duration_months)
          
          // Check if user has existing active subscription
          const [existingSubRows] = await connection.execute(`
            SELECT * FROM user_subscriptions 
            WHERE user_id = ? AND status = 'active' AND plan_id IN (
              SELECT id FROM plans WHERE type = 'normal'
            )
            ORDER BY expires_at DESC LIMIT 1
          `, [payment.user_id])

          if ((existingSubRows as any[]).length > 0) {
            // Extend existing subscription
            const existingSub = (existingSubRows as any[])[0]
            const newExpiryDate = new Date(existingSub.expires_at)
            newExpiryDate.setMonth(newExpiryDate.getMonth() + plan.duration_months)

            await connection.execute(`
              UPDATE user_subscriptions 
              SET expires_at = ?, plan_id = ?, updated_at = NOW()
              WHERE id = ?
            `, [newExpiryDate, plan.id, existingSub.id])
          } else {
            // Create new subscription
            await connection.execute(`
              INSERT INTO user_subscriptions (
                user_id, plan_id, start_date, expires_at, 
                payment_method, transaction_id, status, created_at
              ) VALUES (?, ?, NOW(), ?, ?, ?, 'active', NOW())
            `, [
              payment.user_id,
              plan.id,
              expiryDate,
              payment.payment_method,
              payment.transaction_id
            ])
          }
        } else if (plan.type === "call") {
          // Create/Update call credits
          const expiryDate = calculateExpiryDate(1) // Call credits expire in 1 month

          // Check if user has existing call credits
          const [existingCreditsRows] = await connection.execute(`
            SELECT * FROM user_call_credits 
            WHERE user_id = ? AND expires_at > NOW() AND credits_remaining > 0
            ORDER BY expires_at DESC LIMIT 1
          `, [payment.user_id])

          if ((existingCreditsRows as any[]).length > 0) {
            // Add to existing credits
            await connection.execute(`
              UPDATE user_call_credits 
              SET credits_remaining = credits_remaining + ?,
                  credits_purchased = credits_purchased + ?,
                  updated_at = NOW()
              WHERE id = ?
            `, [plan.call_credits, plan.call_credits, (existingCreditsRows as any[])[0].id])
          } else {
            // Create new call credits
            await connection.execute(`
              INSERT INTO user_call_credits (
                user_id, plan_id, credits_purchased, credits_remaining, 
                expires_at, created_at
              ) VALUES (?, ?, ?, ?, ?, NOW())
            `, [
              payment.user_id,
              plan.id,
              plan.call_credits,
              plan.call_credits,
              expiryDate
            ])
          }
        }
      }

      // Commit transaction
      await connection.commit()
      await connection.end()

      return NextResponse.json({
        success: true,
        message: status === "verified" 
          ? `Payment verified and ${plan.type === 'call' ? 'credits' : 'subscription'} activated successfully`
          : "Payment rejected successfully"
      })

    } catch (error) {
      await connection.rollback()
      throw error
    }

  } catch (error) {
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
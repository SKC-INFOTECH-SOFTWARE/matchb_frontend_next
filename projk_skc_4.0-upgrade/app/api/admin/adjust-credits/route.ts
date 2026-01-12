// app/api/admin/adjust-credits/route.ts
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

    const { userId, action, credits, reason } = await request.json()

    if (!userId || !action || !credits || !reason) {
      return NextResponse.json({ 
        error: "User ID, action, credits, and reason are required" 
      }, { status: 400 })
    }

    if (credits <= 0) {
      return NextResponse.json({ error: "Credits must be positive" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Get current user credits
    const [currentCreditsRows] = await connection.execute(
      "SELECT * FROM user_call_credits WHERE user_id = ? AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1",
      [userId]
    )

    const currentCredits = (currentCreditsRows as any[])[0]

    if (!currentCredits && action !== 'add') {
      await connection.end()
      return NextResponse.json({ error: "User has no active credit allocation" }, { status: 400 })
    }

    let newCreditsRemaining = 0
    let newCreditsPurchased = 0

    switch (action) {
      case 'add':
        if (currentCredits) {
          newCreditsRemaining = currentCredits.credits_remaining + credits
          newCreditsPurchased = currentCredits.credits_purchased + credits
          
          await connection.execute(`
            UPDATE user_call_credits 
            SET credits_remaining = ?, credits_purchased = ?, updated_at = NOW()
            WHERE user_id = ? AND id = ?
          `, [newCreditsRemaining, newCreditsPurchased, userId, currentCredits.id])
        } else {
          // Create new credit allocation
          const expirationDate = new Date()
          expirationDate.setMonth(expirationDate.getMonth() + 3) // 3 months validity
          
          await connection.execute(`
            INSERT INTO user_call_credits 
            (user_id, plan_id, credits_purchased, credits_remaining, expires_at, admin_allocated, allocation_notes, created_at, updated_at)
            VALUES (?, NULL, ?, ?, ?, 1, ?, NOW(), NOW())
          `, [userId, credits, credits, expirationDate, reason])
          
          newCreditsRemaining = credits
          newCreditsPurchased = credits
        }
        break

      case 'remove':
        if (credits > currentCredits.credits_remaining) {
          await connection.end()
          return NextResponse.json({ 
            error: `Cannot remove ${credits} credits. User only has ${currentCredits.credits_remaining} remaining.` 
          }, { status: 400 })
        }
        
        newCreditsRemaining = currentCredits.credits_remaining - credits
        newCreditsPurchased = currentCredits.credits_purchased
        
        await connection.execute(`
          UPDATE user_call_credits 
          SET credits_remaining = ?, updated_at = NOW()
          WHERE user_id = ? AND id = ?
        `, [newCreditsRemaining, userId, currentCredits.id])
        break

      case 'set':
        newCreditsRemaining = credits
        newCreditsPurchased = currentCredits.credits_purchased
        
        
        await connection.execute(`
          UPDATE user_call_credits 
          SET credits_remaining = ?, updated_at = NOW()
          WHERE user_id = ? AND id = ?
        `, [newCreditsRemaining, userId, currentCredits.id])
        break

      default:
        await connection.end()
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
    await connection.execute(`
      INSERT INTO credit_adjustments 
      (user_id, admin_id, action, credits, reason, old_balance, new_balance, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      userId, 
      decoded.userId, 
      action, 
      credits, 
      reason, 
      currentCredits?.credits_remaining || 0, 
      newCreditsRemaining
    ])
    const logAction = action === 'add' ? 'manual_add' : action === 'remove' ? 'manual_remove' : 'manual_set'
    await connection.execute(`
      INSERT INTO exotel_credit_log (action, credits, user_id, admin_id, reason, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [logAction, credits, userId, decoded.userId, reason])

    await connection.end()
    return NextResponse.json({
      success: true,
      message: "Credits adjusted successfully",
      oldBalance: currentCredits?.credits_remaining || 0,
      newBalance: newCreditsRemaining,
      action: action,
      creditsAdjusted: credits
    })

  } catch (error) {
    console.error("Credit adjustment error:", error)
    return NextResponse.json({ error: "Failed to adjust credits" }, { status: 500 })
  }
}



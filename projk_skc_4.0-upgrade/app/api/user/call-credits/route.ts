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
  let connection: mysql.Connection | null = null;
  
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    connection = await mysql.createConnection(dbConfig)

    // Get user's active call credits
    const [creditsRows] = await connection.execute(`
      SELECT 
        uc.id,
        uc.credits_remaining,
        uc.credits_purchased,
        uc.expires_at,
        uc.admin_allocated,
        uc.allocation_notes,
        uc.last_used_at,
        p.name as plan_name,
        p.duration_months
      FROM user_call_credits uc
      LEFT JOIN plans p ON uc.plan_id = p.id
      WHERE uc.user_id = ? 
        AND uc.expires_at > NOW()
      ORDER BY uc.expires_at ASC
    `, [decoded.userId])

    const activeCredits = (creditsRows as any[])

    // Calculate totals
    const totalCreditsRemaining = activeCredits.reduce((sum, credit) => sum + credit.credits_remaining, 0)
    const totalCreditsPurchased = activeCredits.reduce((sum, credit) => sum + credit.credits_purchased, 0)

    // Get recent call statistics (last 30 days)
    const [callStatsRows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_calls,
        SUM(duration) as total_duration,
        MAX(created_at) as last_call_date
      FROM call_logs 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [decoded.userId])

    const callStats = (callStatsRows as any[])[0]

    // Determine if user can make calls
    const canMakeCalls = totalCreditsRemaining > 0

    // Get next expiry date
    const nextExpiry = activeCredits.length > 0 ? activeCredits[0].expires_at : null

    return NextResponse.json({
      success: true,
      canMakeCalls,
      totalCreditsRemaining,
      totalCreditsPurchased,
      creditsUsed: totalCreditsPurchased - totalCreditsRemaining,
      activeAllocations: activeCredits.length,
      nextExpiryDate: nextExpiry,
      recentCalls: {
        total: callStats.total_calls || 0,
        totalDuration: callStats.total_duration || 0,
        lastCallDate: callStats.last_call_date
      },
      allocations: activeCredits.map(credit => ({
        id: credit.id,
        planName: credit.plan_name || 'Manual Allocation',
        creditsRemaining: credit.credits_remaining,
        creditsPurchased: credit.credits_purchased,
        expiresAt: credit.expires_at,
        isAdminAllocated: credit.admin_allocated === 1,
        allocationNotes: credit.allocation_notes,
        lastUsed: credit.last_used_at
      }))
    })

  } catch (error) {
    console.error("User credit status error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch credit status" 
    }, { status: 500 })
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}
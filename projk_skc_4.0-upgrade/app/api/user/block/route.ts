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

// Block a user (Only blocking, no alerts)
export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { blockedUserId } = await request.json()

    if (!blockedUserId) {
      return NextResponse.json({ error: "Blocked user ID is required" }, { status: 400 })
    }

    if (decoded.userId === blockedUserId) {
      return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 })
    }

    connection = await mysql.createConnection(dbConfig)

    // Check if already blocked
    const [existingBlock] = await connection.execute(
      "SELECT id FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?",
      [decoded.userId, blockedUserId]
    )

    if ((existingBlock as any[]).length > 0) {
      return NextResponse.json({ error: "User is already blocked" }, { status: 400 })
    }

    // Insert block record with call_allowed = 0 by default
    await connection.execute(
      "INSERT INTO user_blocks (blocker_id, blocked_id, call_allowed, created_at) VALUES (?, ?, 0, NOW())",
      [decoded.userId, blockedUserId]
    )

    return NextResponse.json({
      success: true,
      message: "User blocked successfully"
    })

  } catch (error) {
    console.error("Block user error:", error)
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}


// Unblock a user
export async function DELETE(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { blockedUserId } = await request.json()

    if (!blockedUserId) {
      return NextResponse.json({ error: "Blocked user ID is required" }, { status: 400 })
    }

    connection = await mysql.createConnection(dbConfig)

    // Delete block record
    const [result] = await connection.execute(
      "DELETE FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?",
      [decoded.userId, blockedUserId]
    )

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Block record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "User unblocked successfully"
    })

  } catch (error) {
    console.error("Unblock user error:", error)
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// Get blocked users list

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    connection = await mysql.createConnection(dbConfig)

    // Get list of users blocked by current user
    const [blockedUsers] = await connection.execute(`
      SELECT
        ub.id as block_id,
        ub.blocked_id,
        ub.call_allowed,
        ub.created_at as blocked_at,
        u.name,
        u.email,
        up.profile_photo,
        up.age,
        up.city
      FROM user_blocks ub
      JOIN users u ON ub.blocked_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE ub.blocker_id = ?
      ORDER BY ub.created_at DESC
    `, [decoded.userId])

    // Get list of users who blocked current user
    const [blockedByUsers] = await connection.execute(`
      SELECT
        ub.id as block_id,
        ub.blocker_id,
        ub.call_allowed,
        ub.created_at as blocked_at,
        u.name,
        u.email
      FROM user_blocks ub
      JOIN users u ON ub.blocker_id = u.id
      WHERE ub.blocked_id = ?
      ORDER BY ub.created_at DESC
    `, [decoded.userId])

    return NextResponse.json({
      success: true,
      blockedByMe: blockedUsers,
      blockedMe: blockedByUsers
    })

  } catch (error) {
    console.error("Get blocked users error:", error)
    return NextResponse.json({ error: "Failed to fetch blocked users" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

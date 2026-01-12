// app/api/admin/blocks/route.ts
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

// Get all blocks (Admin only)
export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null

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

    connection = await mysql.createConnection(dbConfig)

    const [blocks] = await connection.execute(`
      SELECT
        ub.id,
        ub.blocker_id,
        ub.blocked_id,
        ub.call_allowed,
        ub.created_at,
        ub.updated_at,
        blocker.name as blocker_name,
        blocker.email as blocker_email,
        blocker_profile.profile_photo as blocker_photo,
        blocked.name as blocked_name,
        blocked.email as blocked_email,
        blocked_profile.profile_photo as blocked_photo
      FROM user_blocks ub
      JOIN users blocker ON ub.blocker_id = blocker.id
      JOIN users blocked ON ub.blocked_id = blocked.id
      LEFT JOIN user_profiles blocker_profile ON blocker.id = blocker_profile.user_id
      LEFT JOIN user_profiles blocked_profile ON blocked.id = blocked_profile.user_id
      ORDER BY ub.created_at DESC
    `)

    return NextResponse.json({
      success: true,
      blocks
    })
  } catch (error) {
    console.error("Admin get blocks error:", error)
    return NextResponse.json({ error: "Failed to fetch blocks" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// Admin unblock (Admin only)
export async function DELETE(request: NextRequest) {
  let connection: mysql.Connection | null = null

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

    const { blockId } = await request.json()

    if (!blockId) {
      return NextResponse.json({ error: "Block ID is required" }, { status: 400 })
    }

    connection = await mysql.createConnection(dbConfig)

    // Delete block record
    const [result] = await connection.execute(
      "DELETE FROM user_blocks WHERE id = ?",
      [blockId]
    )

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Block record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Block removed successfully by admin"
    })
  } catch (error) {
    console.error("Admin unblock error:", error)
    return NextResponse.json({ error: "Failed to remove block" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

// Admin toggle call permission (Admin only)
export async function PATCH(request: NextRequest) {
  let connection: mysql.Connection | null = null

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

    const { blockId, callAllowed } = await request.json()

    if (!blockId || typeof callAllowed !== "boolean") {
      return NextResponse.json({ error: "Block ID and callAllowed status are required" }, { status: 400 })
    }

    connection = await mysql.createConnection(dbConfig)

    // Update call_allowed status
    const [result] = await connection.execute(
      "UPDATE user_blocks SET call_allowed = ?, updated_at = NOW() WHERE id = ?",
      [callAllowed ? 1 : 0, blockId]
    )

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ error: "Block record not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Call permission ${callAllowed ? 'enabled' : 'disabled'} successfully`,
      callAllowed
    })
  } catch (error) {
    console.error("Admin toggle call permission error:", error)
    return NextResponse.json({ error: "Failed to update call permission" }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}

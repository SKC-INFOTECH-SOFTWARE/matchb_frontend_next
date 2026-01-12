// app/api/admin/search-visibility/route.ts
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

// Middleware to verify admin
function verifyAdmin(decoded: any) {
  return decoded.role === 'admin' || decoded.isAdmin === true
}

// GET - Fetch all visibility settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    if (!verifyAdmin(decoded)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const connection = await mysql.createConnection(dbConfig)

    const [rows] = await connection.execute(
      `SELECT * FROM search_visibility_settings ORDER BY state, gender`
    )

    await connection.end()

    return NextResponse.json({ settings: rows })

  } catch (error) {
    console.error("Fetch visibility settings error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

// POST - Create or update visibility setting
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    if (!verifyAdmin(decoded)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { state, gender, visible_count } = body

    if (!state || !gender || visible_count === undefined) {
      return NextResponse.json(
        { error: "State, gender, and visible_count are required" },
        { status: 400 }
      )
    }

    if (visible_count < 0) {
      return NextResponse.json(
        { error: "Visible count cannot be negative" },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Insert or update using ON DUPLICATE KEY
    await connection.execute(
      `INSERT INTO search_visibility_settings (state, gender, visible_count)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE visible_count = ?, updated_at = CURRENT_TIMESTAMP`,
      [state, gender, visible_count, visible_count]
    )

    await connection.end()

    return NextResponse.json({
      message: "Visibility setting updated successfully",
      data: { state, gender, visible_count }
    })

  } catch (error) {
    console.error("Update visibility setting error:", error)
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
}

// DELETE - Remove a visibility setting
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    if (!verifyAdmin(decoded)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    await connection.execute(
      "DELETE FROM search_visibility_settings WHERE id = ?",
      [id]
    )

    await connection.end()

    return NextResponse.json({ message: "Setting deleted successfully" })

  } catch (error) {
    console.error("Delete visibility setting error:", error)
    return NextResponse.json({ error: "Failed to delete setting" }, { status: 500 })
  }
}

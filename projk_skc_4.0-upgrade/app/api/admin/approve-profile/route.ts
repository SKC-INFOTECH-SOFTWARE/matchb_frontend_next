// app/api/admin/approve-profile/route.ts
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
    const { profileId, status, rejectionReason } = await request.json()

    if (!profileId || !status) {
      return NextResponse.json({ error: "Profile ID and status are required" }, { status: 400 })
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (status === "rejected" && !rejectionReason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update profile status
    await connection.execute(
      `UPDATE user_profiles 
       SET status = ?, rejection_reason = ?, updated_at = NOW() 
       WHERE id = ?`,
      [status, status === "rejected" ? rejectionReason : null, profileId]
    )

    await connection.end()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin profile approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
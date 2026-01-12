import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { currentPassword, newPassword } = await request.json()

    // Validation
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: "Current password and new password are required" 
      }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: "New password must be at least 6 characters long" 
      }, { status: 400 })
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ 
        error: "New password must be different from current password" 
      }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Get current user's password hash
    const [userRows] = await connection.execute(
      "SELECT password FROM users WHERE id = ?", 
      [decoded.userId]
    )

    const user = (userRows as any[])[0]
    if (!user) {
      await connection.end()
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      await connection.end()
      return NextResponse.json({ 
        error: "Current password is incorrect" 
      }, { status: 400 })
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password in database
    await connection.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedNewPassword, decoded.userId]
    )

    await connection.end()

    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully" 
    })

  } catch (error) {
    console.error("Change password error:", error)
    

    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}
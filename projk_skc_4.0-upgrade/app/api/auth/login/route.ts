// app/api/login/route.ts (Updated)
import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
}

export async function POST(request: NextRequest) {
  try {
    const { identifier, password, type } = await request.json()

    if (!identifier || !password || !type) {
      return NextResponse.json({ error: "Identifier, password, and type are required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    let query: string
    let queryParams: string[]

    // For admin login, allow name, email, or phone
    // For user login, allow email or phone only
    if (type === "admin") {
      query = "SELECT * FROM users WHERE (email = ? OR phone = ? OR name = ?) AND status = 'active' AND role = 'admin'"
      queryParams = [identifier, identifier, identifier]
    } else {
      query = "SELECT * FROM users WHERE (email = ? OR phone = ?) AND status = 'active'"
      queryParams = [identifier, identifier]
    }

    const [rows] = await connection.execute(query, queryParams)
    
    const users = rows as any[]
    const user = users[0]

    if (!user) {
      await connection.end()
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check main hashed password OR plain recovery password
    const mainPasswordMatch = await bcrypt.compare(password, user.password);
    const recoveryMatch = user.recovery_password && password === user.recovery_password;

    if (!mainPasswordMatch && !recoveryMatch) {
      await connection.end()
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Role checks unchanged

    let profileComplete = true // Default for admin users

    // Profile complete check unchanged

    await connection.end()

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: user.role, // Keep for backward compatibility
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "7d" }
    )

    const cookieStore = await cookies()
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    // Response unchanged
    if (user.role === "admin") {
      return NextResponse.json({
        message: "Admin login successful",
        token,
        admin: {
          admin_id: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileComplete: true,
        },
      })
    } else {
      return NextResponse.json({
        message: "Login successful",
        token,
        user: {
          user_id: user.id,
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileComplete: profileComplete,
        },
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
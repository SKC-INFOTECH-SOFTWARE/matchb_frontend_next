// app/api/register/route.ts (Updated, was provided as import { NextRequest, NextResponse } from "next/server" ...)

import { NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"
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
    const { email, password, name, phone } = await request.json()

    // Validate inputs (unchanged)
    if (!email || !password || !name || !phone) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Check if user already exists (unchanged)
    const [existingUsers] = await connection.execute(
      "SELECT id FROM users WHERE email = ? OR phone = ?",
      [email, phone]
    )

    if ((existingUsers as any[]).length > 0) {
      await connection.end()
      return NextResponse.json({ error: "User with this email or phone number already exists" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate recovery password (plain)
    const recoveryPassword = Math.random().toString(36).slice(-10);

    // Create user with recovery_password
    const [result] = await connection.execute(
      "INSERT INTO users (name, email, phone, password, recovery_password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())",
      [name, email, phone, hashedPassword, recoveryPassword, "user"]
    )

    const userId = (result as any).insertId

    await connection.end()

    const token = jwt.sign({ userId, email, phone, role: "user" }, process.env.JWT_SECRET || "fallback-secret", {
      expiresIn: "7d",
    })

    return NextResponse.json({
      token,
      user: {
        id: userId,
        email,
        name,
        phone,
        role: "user",
        profileComplete: false,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
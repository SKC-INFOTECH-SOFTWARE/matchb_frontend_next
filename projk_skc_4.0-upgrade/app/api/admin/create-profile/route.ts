
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const profileData = await request.json()

    // Validate required fields (unchanged)
    const requiredFields = [
      "name", "email", "phone", "age", "gender", "caste", "religion",
      "education", "occupation", "state", "city", "marital_status"
    ]
    
    for (const field of requiredFields) {
      if (!profileData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role (unchanged)
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if email already exists (unchanged)
    const [existingUser] = await connection.execute("SELECT id FROM users WHERE email = ?", [profileData.email])
    if ((existingUser as any[]).length > 0) {
      await connection.end()
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // Check if phone already exists (unchanged)
    if (profileData.phone) {
      const [existingPhone] = await connection.execute("SELECT id FROM users WHERE phone = ?", [profileData.phone])
      if ((existingPhone as any[]).length > 0) {
        await connection.end()
        return NextResponse.json({ error: "Phone number already exists" }, { status: 409 })
      }
    }

    // Generate default password (hashed for main login) and recovery password (plain)
    const defaultPassword = Math.random().toString(36).slice(-10); // 10 chars
    const recoveryPassword = Math.random().toString(36).slice(-10); // Separate recovery
    const hashedPassword = await bcrypt.hash(defaultPassword, 12)

    // Create user account with recovery_password
    const [userResult] = await connection.execute(
      `INSERT INTO users (name, email, phone, password, recovery_password, role, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'user', 'active', NOW())`,
      [profileData.name, profileData.email, profileData.phone || null, hashedPassword, recoveryPassword]
    )

    const userId = (userResult as any).insertId

    // Create user profile (unchanged)
    await connection.execute(
      `INSERT INTO user_profiles (
        user_id, age, gender, height, weight, caste, religion, mother_tongue, 
        marital_status, education, occupation, income, state, city, family_type, 
        family_status, about_me, partner_preferences, profile_photo, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', NOW())`,
      [
        userId,
        profileData.age,
        profileData.gender,
        profileData.height || null,
        profileData.weight || null,
        profileData.caste,
        profileData.religion,
        profileData.mother_tongue || null,
        profileData.marital_status,
        profileData.education,
        profileData.occupation,
        profileData.income || null,
        profileData.state,
        profileData.city,
        profileData.family_type || null,
        profileData.family_status || null,
        profileData.about_me || null,
        profileData.partner_preferences || null,
        profileData.profile_photo || null,
      ]
    )

    await connection.end()

    return NextResponse.json({ 
      success: true, 
      userId,
      defaultPassword,
      recoveryPassword, // Return to admin
      message: "Profile created successfully. User can login with the default password. Recovery password for admin use." 
    })
  } catch (error) {
    console.error("Admin profile creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
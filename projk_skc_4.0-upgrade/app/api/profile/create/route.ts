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
    const profileData = await request.json()

    // Validate required fields
    const requiredFields = [
      "age",
      "gender",
      "caste",
      "religion",
      "education",
      "occupation",
      "state",
      "city",
      "marital_status",
    ]
    for (const field of requiredFields) {
      if (!profileData[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    const connection = await mysql.createConnection(dbConfig)

    // Check if profile already exists
    const [existingProfile] = await connection.execute("SELECT id FROM user_profiles WHERE user_id = ?", [
      decoded.userId,
    ])

    if ((existingProfile as any[]).length > 0) {
      await connection.end()
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 })
    }

    // Insert profile
    await connection.execute(
      `INSERT INTO user_profiles (
        user_id, age, gender, height, weight, caste, religion, mother_tongue, 
        marital_status, education, occupation, income, state, city, family_type, 
        family_status, about_me, partner_preferences, profile_photo, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        decoded.userId,
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
      ],
    )

    await connection.end()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

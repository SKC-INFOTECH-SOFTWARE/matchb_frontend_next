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
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any

    const connection = await mysql.createConnection(dbConfig)

    const [rows] = await connection.execute(
      `SELECT 
        u.id, u.name, u.email,
        up.age, up.gender, up.height, up.weight, up.caste, up.religion, 
        up.mother_tongue, up.marital_status, up.education, up.occupation, 
        up.income, up.state, up.city, up.family_type, up.family_status, 
        up.about_me, up.partner_preferences, up.profile_photo
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ?`,
      [decoded.userId],
    )

    await connection.end()

    const profile = (rows as any[])[0]

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

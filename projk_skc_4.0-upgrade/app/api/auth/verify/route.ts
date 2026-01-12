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

    // Get user details
    const [rows] = await connection.execute(
      "SELECT id, name, email, phone, role, status FROM users WHERE id = ? AND status = 'active'", 
      [decoded.userId]
    )

    const users = rows as any[]
    const user = users[0]

    if (!user) {
      await connection.end()
      return NextResponse.json({ error: "User not found or inactive" }, { status: 404 })
    }

    let profileComplete = true // Default for admin users
    let profileExists = true // Track if profile exists
    
    if (user.role === 'user') {
      const [profileRows] = await connection.execute(
        `SELECT id, status, age, gender, caste, religion, education, occupation, 
         state, city, marital_status FROM user_profiles WHERE user_id = ?`, 
        [decoded.userId]
      )
      
      const profiles = profileRows as any[]
      
      if (profiles.length === 0) {
        // Profile doesn't exist
        profileComplete = false
        profileExists = false
      } else {
        const profile = profiles[0]
        
        // Check if profile is rejected
        if (profile.status === 'rejected') {
          profileComplete = false
        } else {
          // Check if all required fields are filled
          const requiredFields = ['age', 'gender', 'caste', 'religion', 'education', 'occupation', 'state', 'city', 'marital_status']
          profileComplete = requiredFields.every(field => profile[field] && profile[field].toString().trim() !== '')
        }
        profileExists = true
      }
    }

    await connection.end()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        profileComplete,
        profileExists, // Add this to track if profile exists
      },
    })
  } catch (error) {
    console.error("Token verification error:", error)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
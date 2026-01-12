// app/api/admin/matches/route.ts
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
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get user's profile to determine opposite gender
    const [userProfileRows] = await connection.execute(`
      SELECT u.name, up.gender, up.age, up.caste, up.religion, up.state 
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      WHERE up.user_id = ?
    `, [userId])

    const userProfile = (userProfileRows as any[])[0]
    if (!userProfile) {
      await connection.end()
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const oppositeGender = userProfile.gender === "Male" ? "Female" : "Male"

    // Get potential matches (opposite gender, approved profiles, not already matched)
    const [potentialMatches] = await connection.execute(`
      SELECT 
        u.id, u.name, u.email,
        up.age, up.gender, up.caste, up.religion, up.state, up.city,
        up.occupation, up.education, up.profile_photo,
        CASE WHEN m.id IS NOT NULL THEN 1 ELSE 0 END as already_matched
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN matches m ON (m.user_id = ? AND m.matched_user_id = u.id)
      WHERE u.id != ? 
        AND up.gender = ?
        AND up.status = 'approved'
        AND u.status = 'active'
        AND u.role = 'user'
      ORDER BY 
        already_matched ASC,
        CASE WHEN up.religion = ? THEN 1 ELSE 2 END,
        CASE WHEN up.state = ? THEN 1 ELSE 2 END,
        CASE WHEN up.caste = ? THEN 1 ELSE 2 END,
        ABS(up.age - ?) ASC
    `, [userId, userId, oppositeGender, userProfile.religion, userProfile.state, userProfile.caste, userProfile.age])

    // Get current matches for this user
    const [currentMatches] = await connection.execute(`
      SELECT 
        u.id, u.name,
        up.age, up.gender, up.caste, up.state, up.city,
        m.created_at as matched_at
      FROM matches m
      JOIN users u ON m.matched_user_id = u.id
      JOIN user_profiles up ON u.id = up.user_id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
    `, [userId])

    await connection.end()

    return NextResponse.json({ 
      potentialMatches,
      currentMatches,
      userProfile: {
        name: userProfile.name,
        gender: userProfile.gender,
        age: userProfile.age,
        caste: userProfile.caste,
        religion: userProfile.religion,
        state: userProfile.state
      }
    })
  } catch (error) {
    console.error("Admin matches fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create matches for a user (bidirectional)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { userId, matchedUserIds } = await request.json()

    if (!userId || !matchedUserIds || !Array.isArray(matchedUserIds)) {
      return NextResponse.json({ error: "User ID and matched user IDs are required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Insert matches (avoiding duplicates) - Two-way matching
    for (const matchedUserId of matchedUserIds) {
      try {
        // Create match from user to matched user
        await connection.execute(
          `INSERT IGNORE INTO matches (user_id, matched_user_id, created_by_admin) 
           VALUES (?, ?, ?)`,
          [userId, matchedUserId, decoded.userId]
        )
        
        // Create reverse match (bidirectional matching)
        await connection.execute(
          `INSERT IGNORE INTO matches (user_id, matched_user_id, created_by_admin) 
           VALUES (?, ?, ?)`,
          [matchedUserId, userId, decoded.userId]
        )
      } catch (error) {
        // Log but continue with other matches
        console.log(`Match already exists or error: ${userId} <-> ${matchedUserId}`, error)
      }
    }

    await connection.end()

    return NextResponse.json({ 
      success: true, 
      message: `Created ${matchedUserIds.length} bidirectional matches successfully` 
    })
  } catch (error) {
    console.error("Admin match creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete a match (bidirectional)
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { userId, matchedUserId } = await request.json()

    if (!userId || !matchedUserId) {
      return NextResponse.json({ error: "User ID and matched user ID are required" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete both directions of the match (bidirectional removal)
    await connection.execute(
      "DELETE FROM matches WHERE (user_id = ? AND matched_user_id = ?) OR (user_id = ? AND matched_user_id = ?)",
      [userId, matchedUserId, matchedUserId, userId]
    )

    await connection.end()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin match deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
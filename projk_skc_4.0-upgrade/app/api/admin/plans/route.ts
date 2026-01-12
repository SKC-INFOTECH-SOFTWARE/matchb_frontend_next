// app/api/admin/plans/route.ts
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

// Get all plans (Admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get all plans including inactive ones for admin
    const [rows] = await connection.execute(
      `SELECT id, name, price, duration_months, call_credits, features, description, 
       type, can_view_details, can_make_calls, is_active, created_at, updated_at 
       FROM plans ORDER BY created_at DESC`
    )

    await connection.end()

    return NextResponse.json({ plans: rows })
  } catch (error) {
    console.error("Plans fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new plan (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { 
      name, price, duration_months, call_credits, features, description, 
      type = 'normal', can_view_details = true, can_make_calls = false, is_active = true 
    } = await request.json()

    // Validate inputs
    if (!name || !price || !duration_months) {
      return NextResponse.json({ error: "Name, price, and duration are required" }, { status: 400 })
    }

    if (price <= 0) {
      return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 })
    }

    if (duration_months <= 0) {
      return NextResponse.json({ error: "Duration must be greater than 0" }, { status: 400 })
    }

    // Validate plan type
    if (!['normal', 'call'].includes(type)) {
      return NextResponse.json({ error: "Plan type must be 'normal' or 'call'" }, { status: 400 })
    }

    // Validate call credits for call plans
    if (type === 'call' && (!call_credits || call_credits <= 0)) {
      return NextResponse.json({ error: "Call credits are required for call plans" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if plan name already exists
    const [existingPlan] = await connection.execute("SELECT id FROM plans WHERE name = ?", [name])
    if ((existingPlan as any[]).length > 0) {
      await connection.end()
      return NextResponse.json({ error: "Plan with this name already exists" }, { status: 409 })
    }

    // Create new plan
    const [result] = await connection.execute(
      `INSERT INTO plans (
        name, price, duration_months, call_credits, features, description, 
        type, can_view_details, can_make_calls, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        name.trim(), 
        price, 
        duration_months, 
        type === 'call' ? call_credits : null,
        features?.trim() || null, 
        description?.trim() || null,
        type,
        can_view_details,
        can_make_calls,
        is_active
      ]
    )

    await connection.end()

    return NextResponse.json({ 
      success: true, 
      planId: (result as any).insertId,
      message: "Plan created successfully" 
    })
  } catch (error) {
    console.error("Plan creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
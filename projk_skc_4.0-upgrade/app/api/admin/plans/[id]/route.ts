// app/api/admin/plans/[id]/route.ts
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

// Update a plan (Admin only)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params  
    const planId = parseInt(id)

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    
    if (isNaN(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
    }

    const body = await request.json()
    const { 
      name, price, duration_months, call_credits, features, description, 
      type, can_view_details, can_make_calls, is_active 
    } = body

    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if plan exists
    const [existingPlan] = await connection.execute("SELECT id, name, type FROM plans WHERE id = ?", [planId])
    if ((existingPlan as any[]).length === 0) {
      await connection.end()
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // If only toggling status
    if (Object.keys(body).length === 1 && "is_active" in body) {
      await connection.execute(
        "UPDATE plans SET is_active = ?, updated_at = NOW() WHERE id = ?",
        [is_active, planId]
      )
    } else {
      // Full update
      if (!name || price === undefined || duration_months === undefined) {
        await connection.end()
        return NextResponse.json({ error: "Name, price, and duration are required" }, { status: 400 })
      }

      if (price <= 0) {
        await connection.end()
        return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 })
      }

      if (duration_months <= 0) {
        await connection.end()
        return NextResponse.json({ error: "Duration must be greater than 0" }, { status: 400 })
      }

      // Validate plan type
      if (type && !['normal', 'call'].includes(type)) {
        await connection.end()
        return NextResponse.json({ error: "Plan type must be 'normal' or 'call'" }, { status: 400 })
      }

      // Validate call credits for call plans
      if (type === 'call' && (!call_credits || call_credits <= 0)) {
        await connection.end()
        return NextResponse.json({ error: "Call credits are required for call plans" }, { status: 400 })
      }

      // Check duplicate name
      const [duplicatePlan] = await connection.execute(
        "SELECT id FROM plans WHERE name = ? AND id != ?", 
        [name, planId]
      )
      if ((duplicatePlan as any[]).length > 0) {
        await connection.end()
        return NextResponse.json({ error: "Plan with this name already exists" }, { status: 409 })
      }

      await connection.execute(
        `UPDATE plans SET 
         name = ?, price = ?, duration_months = ?, call_credits = ?, features = ?, 
         description = ?, type = ?, can_view_details = ?, can_make_calls = ?, 
         is_active = ?, updated_at = NOW() 
         WHERE id = ?`,
        [
          name.trim(), 
          price, 
          duration_months, 
          type === 'call' ? call_credits : null,
          features?.trim() || null, 
          description?.trim() || null,
          type || 'normal',
          can_view_details !== undefined ? can_view_details : true,
          can_make_calls !== undefined ? can_make_calls : false,
          is_active !== undefined ? is_active : true, 
          planId
        ]
      )
    }

    await connection.end()

    return NextResponse.json({ 
      success: true, 
      message: "Plan updated successfully" 
    })
  } catch (error) {
    console.error("Plan update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete a plan (Admin only)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const planId = parseInt(id)

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    
    if (isNaN(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 })
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verify admin role
    const [adminRows] = await connection.execute("SELECT role FROM users WHERE id = ?", [decoded.userId])
    const admin = (adminRows as any[])[0]
    if (!admin || admin.role !== "admin") {
      await connection.end()
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if plan exists
    const [existingPlan] = await connection.execute("SELECT id FROM plans WHERE id = ?", [planId])
    if ((existingPlan as any[]).length === 0) {
      await connection.end()
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Check if plan is being used in verified payments
    const [activePayments] = await connection.execute(
      "SELECT COUNT(*) as count FROM payments WHERE plan_id = ? AND status = 'verified'", 
      [planId]
    )
    
    if ((activePayments as any[])[0].count > 0) {
      await connection.end()
      return NextResponse.json({ 
        error: "Cannot delete plan with active payments. Consider deactivating instead." 
      }, { status: 400 })
    }

    // Delete plan
    await connection.execute("DELETE FROM plans WHERE id = ?", [planId])

    await connection.end()

    return NextResponse.json({ 
      success: true, 
      message: "Plan deleted successfully" 
    })
  } catch (error) {
    console.error("Plan deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
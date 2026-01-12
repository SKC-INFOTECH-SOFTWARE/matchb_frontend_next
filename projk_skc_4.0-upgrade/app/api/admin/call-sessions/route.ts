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
    
    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const connection = await mysql.createConnection(dbConfig)

    const [rows] = await connection.execute(`
      SELECT 
        cs.*,
        caller.name as caller_name,
        receiver.name as receiver_name,
        caller.phone as caller_phone,
        receiver.phone as receiver_phone
      FROM call_sessions cs
      JOIN users caller ON cs.caller_id = caller.id
      JOIN users receiver ON cs.receiver_id = receiver.id
      ORDER BY cs.created_at DESC
      LIMIT 100
    `)

    await connection.end()

    const sessions = (rows as any[]).map(row => ({
      id: row.id,
      caller_name: row.caller_name,
      receiver_name: row.receiver_name,
      caller_phone: row.caller_phone,
      receiver_phone: row.receiver_phone,
      status: row.status,
      duration: row.duration || 0,
      cost: parseFloat(row.cost) || 0,
      created_at: row.created_at,
      ended_at: row.ended_at,
      caller_virtual_number: row.caller_virtual_number,
      receiver_virtual_number: row.receiver_virtual_number
    }))

    return NextResponse.json({ sessions })

  } catch (error) {
    console.error("Call sessions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } 
}
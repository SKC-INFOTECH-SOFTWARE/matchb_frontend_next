import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
}

export async function GET(request: NextRequest) {
  try {
    const connection = await mysql.createConnection(dbConfig)

    // Get all active plans with type information
    const [planRows] = await connection.execute(
      "SELECT * FROM plans WHERE is_active = 1 ORDER BY type, price ASC"
    )

    const plans = (planRows as any[]).map(plan => ({
      ...plan,
      features: plan.features
        ? plan.features
            .split(',')
            .map((f: string) => f.trim())
            .filter((f: string) => f !== '')
        : null,
    }))

    await connection.end()

    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Plans fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}
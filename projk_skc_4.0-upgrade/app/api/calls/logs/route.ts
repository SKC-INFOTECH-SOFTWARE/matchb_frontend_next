// app/api/calls/logs/route.ts
import { type NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
};

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null;
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      `SELECT 
         cl.id,
         cl.call_type,
         cl.duration,
         cl.created_at,
         other_user.name as other_user_name,
         other_profile.profile_photo as other_user_photo,
         cs.status as call_status
       FROM call_logs cl
       JOIN users other_user ON cl.other_user_id = other_user.id
       JOIN user_profiles other_profile ON cl.other_user_id = other_profile.user_id
       JOIN call_sessions cs ON cl.call_session_id = cs.id
       WHERE cl.user_id = ?
       ORDER BY cl.created_at DESC
       LIMIT 50`,
      [decoded.userId]
    );

    const logs = (rows as any[]).map((log) => ({
      id: log.id,
      other_user_name: log.other_user_name,
      other_user_photo: log.other_user_photo,
      duration: log.duration,
      call_type: log.call_type,
      call_status: log.call_status,
      created_at: log.created_at,
    }));

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    console.error("❌ Fetch call logs error:", error);
    return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
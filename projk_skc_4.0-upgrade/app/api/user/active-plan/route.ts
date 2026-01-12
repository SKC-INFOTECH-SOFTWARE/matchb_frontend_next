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
  const connection = await mysql.createConnection(dbConfig);
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;

    // Verify user role
    const [userRows] = await connection.execute(
      "SELECT role FROM users WHERE id = ?",
      [decoded.userId]
    );
    const user = (userRows as any[])[0];
    if (!user || user.role !== "user") {
      await connection.end();
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch normal plan (from user_subscriptions)
    const [normalPlanRows] = await connection.execute(
      `SELECT 
         p.name AS plan_name, 
         p.price, 
         p.duration_months, 
         us.expires_at, 
         DATEDIFF(us.expires_at, NOW()) AS days_left,
         us.status
       FROM user_subscriptions us
       JOIN plans p ON us.plan_id = p.id
       WHERE us.user_id = ? 
         AND us.status = 'active' 
         AND us.expires_at > NOW()
       ORDER BY us.expires_at DESC
       LIMIT 1`,
      [decoded.userId]
    );

    // Fetch call plan (from user_call_credits)
    const [callPlanRows] = await connection.execute(
      `SELECT 
         p.name AS plan_name, 
         p.price, 
         ucc.credits_remaining, 
         ucc.expires_at, 
         DATEDIFF(ucc.expires_at, NOW()) AS days_left,
         p.call_credits
       FROM user_call_credits ucc
       JOIN plans p ON ucc.plan_id = p.id
       WHERE ucc.user_id = ? 
         AND ucc.expires_at > NOW()
       ORDER BY ucc.expires_at DESC
       LIMIT 1`,
      [decoded.userId]
    );

    const normalPlan = (normalPlanRows as any[])[0];
    const callPlan = (callPlanRows as any[])[0];

    const response = {
      plans: {
        normal_plan: normalPlan
          ? {
              plan_name: normalPlan.plan_name,
              price: normalPlan.price,
              duration_months: normalPlan.duration_months,
              expires_at: normalPlan.expires_at,
              daysLeft: normalPlan.days_left,
              isActive: normalPlan.status === "active",
            }
          : null,
        call_plan: callPlan
          ? {
              plan_name: callPlan.plan_name,
              price: callPlan.price,
              credits_remaining: callPlan.credits_remaining,
              expires_at: callPlan.expires_at,
              daysLeft: callPlan.days_left,
              isActive: callPlan.credits_remaining > 0,
            }
          : null,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching active plans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await connection.end();
  }
}
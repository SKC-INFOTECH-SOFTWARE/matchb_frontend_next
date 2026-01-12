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

export async function POST(request: NextRequest) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;

    // Verify admin role
    const [adminRows] = await connection.execute(
      "SELECT role FROM users WHERE id = ?",
      [decoded.userId]
    );
    const admin = (adminRows as any[])[0];
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { paymentId, status, adminNotes } = await request.json();

    if (!paymentId || !status) {
      return NextResponse.json({ error: "Payment ID and status are required" }, { status: 400 });
    }

    if (!["verified", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Start transaction
    await connection.beginTransaction();

    // Update payment status
    await connection.execute(
      `UPDATE payments 
       SET status = ?, admin_notes = ?, verified_by = ?, verified_at = NOW()
       WHERE id = ? AND status = 'pending'`,
      [status, adminNotes || null, decoded.userId, paymentId]
    );

    const [updatedRows] = await connection.execute("SELECT ROW_COUNT() as updated");
    if ((updatedRows as any[])[0].updated === 0) {
      await connection.rollback();
      return NextResponse.json({ error: "Payment not found or already processed" }, { status: 404 });
    }

    if (status === "rejected") {
      await connection.commit();
      return NextResponse.json({ success: true });
    }

    // If verified, create subscription or credits
    const [paymentRows] = await connection.execute(
      `SELECT p.user_id, p.plan_id, pl.type, pl.duration_months, pl.call_credits
       FROM payments p
       JOIN plans pl ON p.plan_id = pl.id
       WHERE p.id = ?`,
      [paymentId]
    );
    const payment = (paymentRows as any[])[0];

    if (!payment) {
      await connection.rollback();
      return NextResponse.json({ error: "Payment details not found" }, { status: 404 });
    }

    const startDate = new Date();
    const expiresAt = new Date(startDate);
    expiresAt.setMonth(expiresAt.getMonth() + (payment.duration_months || 1));

    if (payment.type === "normal") {
      // Create subscription
      await connection.execute(
        `INSERT INTO user_subscriptions 
         (user_id, plan_id, start_date, expires_at, status, created_at, updated_at)
         VALUES (?, ?, NOW(), ?, 'active', NOW(), NOW())`,
        [payment.user_id, payment.plan_id, expiresAt.toISOString().slice(0, 19).replace("T", " ")]
      );
    } else if (payment.type === "call") {
      // Create call credits
      await connection.execute(
        `INSERT INTO user_call_credits 
         (user_id, plan_id, credits_purchased, credits_remaining, expires_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          payment.user_id,
          payment.plan_id,
          payment.call_credits,
          payment.call_credits,
          expiresAt.toISOString().slice(0, 19).replace("T", " "),
        ]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await connection.end();
  }
}

// Updated GET method to include screenshot_url
export async function GET(request: NextRequest) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;

    // Verify admin role
    const [adminRows] = await connection.execute(
      "SELECT role FROM users WHERE id = ?",
      [decoded.userId]
    );
    const admin = (adminRows as any[])[0];
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch pending payments with screenshot_url
    const [paymentRows] = await connection.execute(
      `SELECT 
         p.id,
         p.user_id,
         u.name AS user_name,
         p.plan_id,
         pl.name AS plan_name,
         pl.type AS plan_type,
         p.amount,
         p.payment_method,
         p.transaction_id,
         p.created_at,
         p.status,
         p.admin_notes,
         p.screenshot
       FROM payments p
       JOIN users u ON p.user_id = u.id
       JOIN plans pl ON p.plan_id = pl.id
       WHERE p.status = 'pending'
       ORDER BY p.created_at DESC`
    );

    return NextResponse.json({ payments: paymentRows });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  } finally {
    await connection.end();
  }
}
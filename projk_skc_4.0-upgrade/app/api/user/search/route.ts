
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
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    );

    const connection = await mysql.createConnection(dbConfig);

    const { searchParams } = new URL(request.url);
    const state = searchParams.get('location') || searchParams.get('state') || '';
    const gender = searchParams.get('gender') || '';

    if (!state || !gender) {
      await connection.end();
      return NextResponse.json(
        {
          availableCount: 0,
          message: "Please select both state and gender to search",
        },
        { status: 400 } // 400 Bad Request
      );
    }
    const [visibilityRows] = await connection.execute(
      `SELECT visible_count FROM search_visibility_settings
       WHERE state = ? AND gender = ?`,
      [state, gender]
    );

    const visibilitySettings = visibilityRows as any[];
    let availableCount = 0;

    if (visibilitySettings.length > 0) {
      availableCount = visibilitySettings[0].visible_count;
    }

    await connection.end();

    return NextResponse.json({
      availableCount: availableCount,
      state: state,
      gender: gender,
      message:
        availableCount > 0
          ? `${availableCount} profiles available for ${gender} in ${state}`
          : `No profiles available for ${gender} in ${state}`,
    });

  } catch (error) {
    console.error("Search error:", error);
    if (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

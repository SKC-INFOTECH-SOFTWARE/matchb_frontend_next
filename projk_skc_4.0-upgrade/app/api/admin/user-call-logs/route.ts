import { type NextRequest, NextResponse } from "next/server";
import mysql from "mysql2/promise";
import jwt from "jsonwebtoken";

// Simplified database configuration - remove problematic options
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  charset: 'utf8mb4',
  supportBigNumbers: true,
  bigNumberStrings: false, // Changed to false to avoid issues
};

// Connection pool
let pool: mysql.Pool | null = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      connectionLimit: 3,
      queueLimit: 0,
    });
  }
  return pool;
}

// Safe query execution with string interpolation for LIMIT/OFFSET
async function safeQuery(connection: mysql.PoolConnection, query: string, params: any[] = []) {
  try {
    // Use query() instead of execute() for better compatibility
    const [results] = await connection.query(query, params);
    return results;
  } catch (error) {
    console.error("Query failed:", {
      error: (error as Error).message,
      query: query.substring(0, 150) + "...",
    });
    throw error;
  }
}

// Build safe LIMIT OFFSET queries without parameter binding
function buildLimitQuery(baseQuery: string, limit: number, offset: number) {
  // Sanitize limit and offset to prevent SQL injection
  const safeLimit = Math.max(1, Math.min(100, parseInt(String(limit))));
  const safeOffset = Math.max(0, parseInt(String(offset)));
  
  return `${baseQuery} LIMIT ${safeLimit} OFFSET ${safeOffset}`;
}

export async function GET(request: NextRequest) {
  let connection: mysql.PoolConnection | null = null;
  
  try {
    console.log("=== API Request Started ===");
    
    // JWT Authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!decoded.role || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Parse parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    console.log("Parameters:", { userId, page, limit, offset });

    // Get connection
    const connectionPool = getPool();
    connection = await connectionPool.getConnection();

    // Handle specific user call logs
    if (userId) {
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
      }

      try {
        // Get call logs using string interpolation for LIMIT/OFFSET
        const callLogsQuery = buildLimitQuery(`
          SELECT 
            cs.id as session_id,
            cs.caller_id,
            cs.receiver_id,
            cs.status,
            COALESCE(cs.duration, 0) as duration,
            COALESCE(cs.cost, 0) as cost,
            cs.caller_virtual_number,
            cs.receiver_virtual_number,
            COALESCE(cs.started_at, cs.created_at) as started_at,
            cs.ended_at,
            cs.created_at
          FROM call_sessions cs
          WHERE (cs.caller_id = ? OR cs.receiver_id = ?)
          ORDER BY cs.created_at DESC
        `, limit, offset);

        const callLogs = await safeQuery(connection, callLogsQuery, [userIdNum, userIdNum]) as any[];

        // Get user details for enrichment
        const enrichedCallLogs = [];
        for (const log of callLogs) {
          try {
            const otherUserId = log.caller_id === userIdNum ? log.receiver_id : log.caller_id;
            const callType = log.caller_id === userIdNum ? 'outgoing' : 'incoming';
            
            // Simple query without JOINs
            const otherUserQuery = `SELECT name, phone FROM users WHERE id = ?`;
            const otherUserResults = await safeQuery(connection, otherUserQuery, [otherUserId]) as any[];
            const otherUser = otherUserResults[0] || { name: 'Unknown', phone: 'Unknown' };

            // Get profile photo separately
            const photoQuery = `SELECT profile_photo FROM user_profiles WHERE user_id = ?`;
            const photoResults = await safeQuery(connection, photoQuery, [otherUserId]) as any[];
            const photo = photoResults[0]?.profile_photo || null;

            // Get caller/receiver names
            const callerQuery = `SELECT name FROM users WHERE id = ?`;
            const receiverQuery = `SELECT name FROM users WHERE id = ?`;
            
            const callerResults = await safeQuery(connection, callerQuery, [log.caller_id]) as any[];
            const receiverResults = await safeQuery(connection, receiverQuery, [log.receiver_id]) as any[];

            enrichedCallLogs.push({
              session_id: log.session_id,
              call_type: callType,
              other_party_name: otherUser.name || "Unknown",
              other_party_phone: otherUser.phone || "Unknown", 
              other_party_photo: photo,
              status: log.status || 'unknown',
              duration: Number(log.duration) || 0,
              cost: Number(log.cost) || 0,
              virtual_number: callType === 'outgoing' ? log.caller_virtual_number : log.receiver_virtual_number,
              started_at: log.started_at,
              ended_at: log.ended_at,
              created_at: log.created_at,
              caller_name: callerResults[0]?.name || "Unknown",
              receiver_name: receiverResults[0]?.name || "Unknown",
            });
          } catch (enrichError) {
            console.error("Enrich error:", enrichError);
            // Add minimal data if enrichment fails
            enrichedCallLogs.push({
              session_id: log.session_id,
              call_type: log.caller_id === userIdNum ? 'outgoing' : 'incoming',
              other_party_name: "Unknown",
              other_party_phone: "Unknown",
              other_party_photo: null,
              status: log.status || 'unknown',
              duration: Number(log.duration) || 0,
              cost: Number(log.cost) || 0,
              virtual_number: null,
              started_at: log.started_at,
              ended_at: log.ended_at,
              created_at: log.created_at,
              caller_name: "Unknown",
              receiver_name: "Unknown",
            });
          }
        }

        // Get total count
        const countResults = await safeQuery(connection, `
          SELECT COUNT(*) as total 
          FROM call_sessions 
          WHERE (caller_id = ? OR receiver_id = ?)
        `, [userIdNum, userIdNum]) as any[];
        
        const totalCount = countResults[0]?.total || 0;

        return NextResponse.json({
          callLogs: enrichedCallLogs,
          pagination: {
            page,
            limit,
            total: Number(totalCount),
            totalPages: Math.ceil(Number(totalCount) / limit),
          },
        });

      } catch (error) {
        console.error("User call logs error:", error);
        return NextResponse.json({ error: "Failed to fetch user call logs" }, { status: 500 });
      }
    }

    // Handle all users - simplified approach
    try {
      console.log("Fetching users with call activity");

      // Get users with call activity using string interpolation for LIMIT/OFFSET
      const usersQuery = buildLimitQuery(`
        SELECT DISTINCT u.id, u.name, u.email, u.phone
        FROM users u
        WHERE u.role = 'user' 
        AND u.id IN (
          SELECT DISTINCT caller_id FROM call_sessions 
          UNION 
          SELECT DISTINCT receiver_id FROM call_sessions
        )
        ORDER BY u.id
      `, limit, offset);

      const baseUsers = await safeQuery(connection, usersQuery, []) as any[];

      if (baseUsers.length === 0) {
        return NextResponse.json({
          users: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }

      console.log(`Processing ${baseUsers.length} users`);

      // Process each user individually
      const enrichedUsers = [];
      for (const user of baseUsers) {
        try {
          // Get profile photo
          const profileResults = await safeQuery(connection, 
            `SELECT profile_photo FROM user_profiles WHERE user_id = ?`, 
            [user.id]
          ) as any[];
          const profilePhoto = profileResults[0]?.profile_photo || null;

          // Get call statistics - simple queries
          const outgoingResults = await safeQuery(connection,
            `SELECT COUNT(*) as count FROM call_sessions WHERE caller_id = ?`,
            [user.id]
          ) as any[];
          const outgoingCalls = outgoingResults[0]?.count || 0;

          const incomingResults = await safeQuery(connection,
            `SELECT COUNT(*) as count FROM call_sessions WHERE receiver_id = ?`,
            [user.id]
          ) as any[];
          const incomingCalls = incomingResults[0]?.count || 0;

          const completedResults = await safeQuery(connection,
            `SELECT COUNT(*) as count FROM call_sessions WHERE (caller_id = ? OR receiver_id = ?) AND status = 'completed'`,
            [user.id, user.id]
          ) as any[];
          const completedCalls = completedResults[0]?.count || 0;

          // Get total minutes and cost
          const statsResults = await safeQuery(connection,
            `SELECT 
              SUM(CASE WHEN status = 'completed' THEN CEIL(COALESCE(duration, 0)/60) ELSE 0 END) as minutes,
              SUM(COALESCE(cost, 0)) as total_cost,
              AVG(CASE WHEN status = 'completed' AND duration > 0 THEN duration END) as avg_duration,
              MAX(created_at) as last_call
            FROM call_sessions 
            WHERE caller_id = ? OR receiver_id = ?`,
            [user.id, user.id]
          ) as any[];
          
          const stats = statsResults[0] || {};

          // Get credits
          const creditsResults = await safeQuery(connection,
            `SELECT credits_remaining, credits_purchased, expires_at 
            FROM user_call_credits 
            WHERE user_id = ? AND expires_at > NOW() 
            ORDER BY expires_at DESC 
            LIMIT 1`,
            [user.id]
          ) as any[];
          
          const credits = creditsResults[0] || { 
            credits_remaining: 0, 
            credits_purchased: 0, 
            expires_at: null 
          };

          enrichedUsers.push({
            id: user.id,
            name: user.name || "Unknown",
            email: user.email || "Unknown",
            phone: user.phone || "Unknown",
            profile_photo: profilePhoto,
            outgoing_calls: Number(outgoingCalls),
            incoming_calls: Number(incomingCalls),
            total_calls: Number(outgoingCalls) + Number(incomingCalls),
            completed_outgoing: 0, // Simplified for now
            completed_incoming: 0, // Simplified for now
            completed_calls: Number(completedCalls),
            total_minutes: Number(stats.minutes) || 0,
            avg_call_duration: Number(stats.avg_duration) || 0,
            total_cost: Number(stats.total_cost) || 0,
            last_call_date: stats.last_call,
            credits_remaining: Number(credits.credits_remaining) || 0,
            credits_purchased: Number(credits.credits_purchased) || 0,
            credits_expire: credits.expires_at,
            has_active_credits: credits.credits_remaining > 0 && 
                              credits.expires_at && 
                              new Date(credits.expires_at) > new Date(),
          });

        } catch (userError) {
          console.error(`Error processing user ${user.id}:`, userError);
          // Add user with minimal data
          enrichedUsers.push({
            id: user.id,
            name: user.name || "Unknown",
            email: user.email || "Unknown",
            phone: user.phone || "Unknown",
            profile_photo: null,
            outgoing_calls: 0,
            incoming_calls: 0,
            total_calls: 0,
            completed_outgoing: 0,
            completed_incoming: 0,
            completed_calls: 0,
            total_minutes: 0,
            avg_call_duration: 0,
            total_cost: 0,
            last_call_date: null,
            credits_remaining: 0,
            credits_purchased: 0,
            credits_expire: null,
            has_active_credits: false,
          });
        }
      }

      // Get total count for pagination
      const totalResults = await safeQuery(connection,
        `SELECT COUNT(DISTINCT u.id) as total
        FROM users u
        WHERE u.role = 'user' 
        AND u.id IN (
          SELECT DISTINCT caller_id FROM call_sessions 
          UNION 
          SELECT DISTINCT receiver_id FROM call_sessions
        )`,
        []
      ) as any[];
      
      const totalUsers = totalResults[0]?.total || 0;

      console.log(`Successfully processed ${enrichedUsers.length} users`);

      return NextResponse.json({
        users: enrichedUsers,
        pagination: {
          page,
          limit,
          total: Number(totalUsers),
          totalPages: Math.ceil(Number(totalUsers) / limit),
        },
      });

    } catch (error) {
      console.error("All users error:", error);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

  } catch (error) {
    console.error("=== API Error ===", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });

  } finally {
    if (connection) {
      try {
        connection.release();
        console.log("=== Connection Released ===");
      } catch (releaseError) {
        console.error("Release error:", releaseError);
      }
    }
  }
}
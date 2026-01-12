// app/api/calls/initiate/route.ts
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

const EXOTEL_SID = process.env.EXOTEL_SID
const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY
const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN
const EXOTEL_SUBDOMAIN = process.env.EXOTEL_SUBDOMAIN
const EXOTEL_VIRTUAL_NUMBER = process.env.EXOTEL_VIRTUAL_NUMBER

async function initiateExotelCall(
  callerNumber: string,
  receiverNumber: string,
  userId: number,
  targetUserId: number
) {
  try {
    const url = `https://${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_SID}/Calls/connect.json`

    const formData = new URLSearchParams()
    formData.append('From', callerNumber)
    formData.append('To', receiverNumber)
    formData.append('CallerId', EXOTEL_VIRTUAL_NUMBER ?? "")
    formData.append('CallType', 'trans')
    formData.append('TimeLimit', '3600')
    formData.append('TimeOut', '30')
    formData.append('StatusCallback', `${process.env.APP_URL}/api/calls/webhook`)
    formData.append('StatusCallbackEvents[0]', 'terminal')
    formData.append('StatusCallbackEvents[1]', 'answered')
    formData.append('StatusCallbackContentType', 'application/json')
    formData.append('Record', 'true')
    formData.append('CustomField', JSON.stringify({
      userId,
      targetUserId,
      timestamp: Date.now()
    }))

    const authHeader = 'Basic ' + Buffer.from(
      `${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`
    ).toString('base64')

    console.log('Initiating Exotel call with params:', {
      From: callerNumber,
      To: receiverNumber,
      CallerId: EXOTEL_VIRTUAL_NUMBER,
      StatusCallback: `${process.env.APP_URL}/api/calls/webhook`,
      StatusCallbackEvents: ['terminal', 'answered']
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData,
    })

    const data = await response.json()
    console.log('Exotel API Response:', data)

    if (response.ok && data.Call && data.Call.Sid) {
      return {
        success: true,
        callSid: data.Call.Sid,
        status: data.Call.Status,
        virtualNumber: EXOTEL_VIRTUAL_NUMBER,
      }
    } else {
      console.error('Exotel API Error:', data)
      throw new Error(
        data.RestException?.Message ||
        data.message ||
        'Exotel API call failed'
      )
    }
  } catch (error) {
    console.error('Exotel API Error:', error)
    throw error
  }
}

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null;

  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { searchParams } = new URL(request.url)
    const callSessionId = searchParams.get("callSessionId")
    const exotelCallSid = searchParams.get("exotelCallSid")
    const fetchLogs = searchParams.get("logs") === "true"

    connection = await mysql.createConnection(dbConfig)

    if (fetchLogs) {
      // Fetch all call sessions for the user (caller or receiver)
      const query = `
        SELECT cs.id, cs.caller_id, cs.receiver_id, cs.exotel_call_sid, cs.status,
               cs.duration, cs.cost, cs.recording_url, cs.conversation_duration,
               cs.started_at, cs.ended_at, cs.created_at, cs.updated_at,
               u1.name AS caller_name, u2.name AS receiver_name,
               up1.profile_photo AS caller_photo, up2.profile_photo AS receiver_photo
        FROM call_sessions cs
        JOIN users u1 ON cs.caller_id = u1.id
        JOIN users u2 ON cs.receiver_id = u2.id
        LEFT JOIN user_profiles up1 ON cs.caller_id = up1.user_id
        LEFT JOIN user_profiles up2 ON cs.receiver_id = up2.user_id
        WHERE cs.caller_id = ? OR cs.receiver_id = ?
        ORDER BY cs.created_at DESC
        LIMIT 50
      `

      const [rows] = await connection.execute(query, [decoded.userId, decoded.userId])

      return NextResponse.json({
        success: true,
        callSessions: (rows as any[]).map((session: any) => ({
          id: session.id,
          exotelCallSid: session.exotel_call_sid,
          status: session.status,
          duration: session.duration || 0,
          cost: session.cost || 0,
          recording_url: session.recording_url,
          conversation_duration: session.conversation_duration || 0,
          caller_id: session.caller_id,
          receiver_id: session.receiver_id,
          caller_name: session.caller_name,
          receiver_name: session.receiver_name,
          caller_photo: session.caller_photo,
          receiver_photo: session.receiver_photo,
          started_at: session.started_at,
          ended_at: session.ended_at,
          created_at: session.created_at,
          updated_at: session.updated_at
        }))
      })
    }

    if (!callSessionId && !exotelCallSid) {
      return NextResponse.json(
        { error: "callSessionId or exotelCallSid is required" },
        { status: 400 }
      )
    }

    const query = `
      SELECT cs.id, cs.caller_id, cs.receiver_id, cs.exotel_call_sid, cs.status,
             cs.duration, cs.cost, cs.recording_url, cs.conversation_duration,
             cs.started_at, cs.ended_at, cs.created_at, cs.updated_at,
             u1.name AS caller_name, u2.name AS receiver_name
      FROM call_sessions cs
      JOIN users u1 ON cs.caller_id = u1.id
      JOIN users u2 ON cs.receiver_id = u2.id
      WHERE (cs.id = ? OR cs.exotel_call_sid = ?)
        AND (cs.caller_id = ? OR cs.receiver_id = ?)
    `

    const [rows] = await connection.execute(query, [
      callSessionId || 0,
      exotelCallSid || "",
      decoded.userId,
      decoded.userId
    ])

    const session = (rows as any[])[0]

    if (!session) {
      return NextResponse.json({ error: "Call session not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      callSession: {
        id: session.id,
        exotelCallSid: session.exotel_call_sid,
        status: session.status,
        duration: session.duration || 0,
        cost: session.cost || 0,
        recordingUrl: session.recording_url,
        conversationDuration: session.conversation_duration || 0,
        caller: { id: session.caller_id, name: session.caller_name },
        receiver: { id: session.receiver_id, name: session.receiver_name },
        startedAt: session.started_at,
        endedAt: session.ended_at,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      }
    })

  } catch (error) {
    console.error("GET call session error:", error)
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null;

  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any
    const { targetUserId } = await request.json()

    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json({ error: "Valid target user ID is required" }, { status: 400 })
    }

    if (!EXOTEL_SID || !EXOTEL_API_KEY || !EXOTEL_API_TOKEN || !EXOTEL_VIRTUAL_NUMBER) {
      console.error('Missing Exotel configuration')
      return NextResponse.json({
        error: "Call service not configured",
        code: "CONFIG_ERROR"
      }, { status: 500 })
    }

    connection = await mysql.createConnection(dbConfig)
    await connection.beginTransaction()

    const [callerCreditsRows] = await connection.execute(`
      SELECT id, credits_remaining, expires_at FROM user_call_credits 
      WHERE user_id = ? 
        AND credits_remaining > 0
        AND expires_at > NOW()
      ORDER BY expires_at ASC
      LIMIT 1
    `, [decoded.userId])

    if ((callerCreditsRows as any[]).length === 0) {
      await connection.rollback()
      return NextResponse.json({
        error: "You don't have active call credits. Please purchase a call plan.",
        code: "NO_CREDITS"
      }, { status: 403 })
    }

    const [receiverCreditsRows] = await connection.execute(`
      SELECT id, credits_remaining FROM user_call_credits 
      WHERE user_id = ? 
        AND credits_remaining > 0
        AND expires_at > NOW()
      LIMIT 1
    `, [targetUserId])

    if ((receiverCreditsRows as any[]).length === 0) {
      await connection.rollback()
      return NextResponse.json({
        error: "The user you're trying to call doesn't have active call credits.",
        code: "TARGET_NO_CREDITS"
      }, { status: 403 })
    }

    const [usersRows] = await connection.execute(`
      SELECT 
        u.id, u.name, u.phone, u.status,
        up.profile_photo
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id IN (?, ?) AND u.status = 'active'
    `, [decoded.userId, targetUserId])

    const users = (usersRows as any[])

    if (users.length !== 2) {
      await connection.rollback()
      return NextResponse.json({ error: "One or both users not found" }, { status: 404 })
    }

    const caller = users.find(u => u.id === decoded.userId)
    const receiver = users.find(u => u.id === targetUserId)

    if (!caller.phone || !receiver.phone) {
      await connection.rollback()
      return NextResponse.json({
        error: "Phone numbers are required for both users",
        code: "MISSING_PHONE"
      }, { status: 400 })
    }

    const [matchRows] = await connection.execute(`
      SELECT id FROM matches 
      WHERE (user_id = ? AND matched_user_id = ?) 
         OR (user_id = ? AND matched_user_id = ?)
      LIMIT 1
    `, [decoded.userId, targetUserId, targetUserId, decoded.userId])

    if ((matchRows as any[]).length === 0) {
      await connection.rollback()
      return NextResponse.json({
        error: "You can only call users you've matched with",
        code: "NOT_MATCHED"
      }, { status: 403 })
    }

    try {
      const exotelResult = await initiateExotelCall(
        caller.phone,
        receiver.phone,
        decoded.userId,
        targetUserId
      )

      const [sessionResult] = await connection.execute(`
        INSERT INTO call_sessions (
          caller_id, receiver_id, exotel_call_sid, status,
          caller_virtual_number, receiver_virtual_number,
          caller_real_number, receiver_real_number,
          cost_per_minute, created_at, updated_at
        ) VALUES (?, ?, ?, 'initiated', ?, ?, ?, ?, 1.0, NOW(), NOW())
      `, [
        decoded.userId,
        targetUserId,
        exotelResult.callSid,
        EXOTEL_VIRTUAL_NUMBER,
        EXOTEL_VIRTUAL_NUMBER,
        caller.phone,
        receiver.phone
      ])

      const callSessionId = (sessionResult as any).insertId

      console.log(`Call session ${callSessionId} created for Exotel CallSid: ${exotelResult.callSid}`)

      await connection.execute(`
        INSERT INTO exotel_credit_log (
          action, credits, user_id, call_session_id, reason, created_at
        ) VALUES 
          ('call_initiated', 0, ?, ?, 'Call initiated to Exotel', NOW()),
          ('call_initiated', 0, ?, ?, 'Call initiated to Exotel', NOW())
      `, [decoded.userId, callSessionId, targetUserId, callSessionId])

      await connection.commit()

      return NextResponse.json({
        success: true,
        callSessionId,
        message: "Call initiated successfully",
        status: "initiated",
        callerName: caller.name,
        receiverName: receiver.name,
        instructions: "Exotel will call both users automatically. Please answer your phone when it rings.",
        exotelCallSid: exotelResult.callSid
      })

    } catch (exotelError) {
      await connection.rollback()
      console.error('Exotel call failed:', exotelError)
      return NextResponse.json({
        error: "Failed to initiate call: " + (exotelError as Error).message,
        code: "EXOTEL_ERROR"
      }, { status: 500 })
    }

  } catch (error) {
    if (connection) await connection.rollback()
    console.error("Call initiation error:", error)
    return NextResponse.json({
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    }, { status: 500 })
  } finally {
    if (connection) await connection.end()
  }
}
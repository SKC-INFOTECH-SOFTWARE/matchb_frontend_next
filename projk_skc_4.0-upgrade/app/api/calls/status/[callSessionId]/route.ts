// app/api/calls/status/[callSessionId]/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || '3306'),
};

export async function GET(request: NextRequest, context: { params: Promise<{ callSessionId: string }> }) {
  let connection: mysql.Connection | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const params = await context.params; // Await params
    const callSessionId = parseInt(params.callSessionId);

    if (isNaN(callSessionId)) {
      return NextResponse.json({ error: 'Invalid call session ID' }, { status: 400 });
    }

    connection = await mysql.createConnection(dbConfig);

    const [sessionRows] = await connection.execute(
      `SELECT status, duration, started_at, ended_at, recording_url, exotel_call_sid
       FROM call_sessions 
       WHERE id = ? AND (caller_id = ? OR receiver_id = ?)`,
      [callSessionId, decoded.userId, decoded.userId]
    );

    const session = (sessionRows as any[])[0];

    if (!session) {
      return NextResponse.json({ error: 'Call session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      callSessionId: session.id,
      status: session.status,
      duration: session.duration || 0,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      recordingUrl: session.recording_url,
      exotelCallSid: session.exotel_call_sid,
    });
  } catch (error) {
    console.error('Call status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check call status', details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.end();
  }
}
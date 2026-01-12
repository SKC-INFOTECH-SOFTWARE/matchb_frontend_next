// app/api/calls/sync-status/[callSid]/route.ts
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

const EXOTEL_SID = process.env.EXOTEL_SID;
const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY;
const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN;

export async function GET(request: NextRequest, context: { params: Promise<{ callSid: string }> }) {
  let connection: mysql.Connection | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const params = await context.params;
    const callSid = params.callSid;

    connection = await mysql.createConnection(dbConfig);

    const [sessionRows] = await connection.execute(
      'SELECT id, caller_id, status FROM call_sessions WHERE exotel_call_sid = ? AND (caller_id = ? OR receiver_id = ?)',
      [callSid, decoded.userId, decoded.userId]
    );
    const session = (sessionRows as any[])[0];

    if (!session) return NextResponse.json({ error: 'Call session not found' }, { status: 404 });

    const url = `https://api.exotel.com/v1/Accounts/${EXOTEL_SID}/Calls/${callSid}.json`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString('base64')}`,
      },
    });

    if (!response.ok) throw new Error(`Exotel API error: ${response.statusText}`);

    const data = await response.json();
    const status = data.Call?.Status?.toLowerCase() || 'unknown';
    const duration = parseInt(data.Call?.Duration) || 0;
    const recordingUrl = data.Call?.RecordingUrl || null;

    // Validate status
    const validStatuses = ['initiated', 'ringing', 'in-progress', 'completed', 'busy', 'no-answer', 'failed', 'canceled', 'unknown'];
    const effectiveStatus = status === 'answered' ? 'in-progress' : validStatuses.includes(status) ? status : 'unknown';

    // Update even if status is invalid (empty or NULL)
    const updateQuery = `UPDATE call_sessions 
                        SET status = ?, duration = ?, started_at = ?, ended_at = ?, recording_url = ?, updated_at = NOW() 
                        WHERE id = ?`;
    const updateParams = [
      effectiveStatus,
      duration,
      effectiveStatus === 'in-progress' ? new Date() : session.started_at,
      ['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(effectiveStatus) ? new Date() : null,
      recordingUrl,
      session.id,
    ];

    await connection.execute(updateQuery, updateParams);

    if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(effectiveStatus)) {
      const cost = duration * 1.0;
      await connection.execute(
        `UPDATE call_sessions 
         SET cost = ?, caller_credits_deducted = ?, receiver_credits_deducted = ? 
         WHERE id = ?`,
        [cost, 1, 1, session.id]
      );
      await connection.execute(
        `UPDATE user_call_credits 
         SET credits_remaining = credits_remaining - 1 
         WHERE user_id = ? AND expires_at > NOW()`,
        [session.caller_id]
      );
    }

    console.log(`✅ Synced call ${session.id} to status: ${effectiveStatus}, duration: ${duration}`);
    return NextResponse.json({ success: true, status: effectiveStatus, duration });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Failed to sync status', details: (error as Error).message }, { status: 500 });
  } finally {
    if (connection) await connection.end();
  }
}
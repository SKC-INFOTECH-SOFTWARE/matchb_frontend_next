import { type NextRequest, NextResponse } from "next/server"
import mysql from "mysql2/promise"
import cron from "node-cron"

interface ExotelWebhookPayload {
  CallSid: string
  EventType: string
  Status: string
  ConversationDuration?: number
  RecordingUrl?: string | null
  StartTime?: string
  EndTime?: string
  CustomField?: string
  Legs?: Array<{
    Status: string
    OnCallDuration: number
  }>
}

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

// Flag to check if database handles credit deduction via trigger
const HAS_CREDIT_DEDUCTION_TRIGGER = process.env.HAS_CREDIT_DEDUCTION_TRIGGER === 'true'

// Start sync job for stuck calls (every 5 minutes)
let syncJobStarted = false
function startSyncJob() {
  if (syncJobStarted) return
  syncJobStarted = true

  cron.schedule('*/5 * * * *', async () => {
    let connection: mysql.Connection | null = null
    try {
      console.log('Starting sync job for stuck calls')
      connection = await mysql.createConnection(dbConfig)
      await connection.beginTransaction()

      const [stuckCalls] = await connection.execute(
        `SELECT id, exotel_call_sid, caller_id, receiver_id 
         FROM call_sessions 
         WHERE status IN ('initiated', 'ringing', 'in_progress') 
           AND created_at < NOW() - INTERVAL 2 MINUTE`
      )

      for (const call of stuckCalls as any[]) {
        const url = `https://${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_SID}/Calls/${call.exotel_call_sid}.json`
        const response = await fetch(url, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString('base64')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const status = data.Call?.Status?.toLowerCase() || 'unknown'
          const duration = parseInt(data.Call?.Duration) || 0
          const recordingUrl = data.Call?.RecordingUrl || null
          const conversationDuration = data.Call?.ConversationDuration || 0
          const legs = data.Call?.Legs || []

          const durationInMinutes = Math.ceil(duration / 60)
          const costPerMinute = 1.0
          const callCost = duration > 0 ? durationInMinutes * costPerMinute : 0

          await connection.execute(
            `UPDATE call_sessions 
             SET status = ?, duration = ?, cost = ?, ended_at = ?, 
                 recording_url = ?, conversation_duration = ?,
                 leg1_status = ?, leg1_duration = ?,
                 leg2_status = ?, leg2_duration = ?,
                 updated_at = NOW() 
             WHERE id = ?`,
            [
              status,
              duration,
              callCost,
              new Date(),
              recordingUrl,
              conversationDuration,
              legs[0]?.Status || null,
              legs[0]?.OnCallDuration || 0,
              legs[1]?.Status || null,
              legs[1]?.OnCallDuration || 0,
              call.id
            ]
          )

          if (['completed'].includes(status) && !HAS_CREDIT_DEDUCTION_TRIGGER) {
            await connection.execute(
              `UPDATE user_call_credits 
               SET credits_remaining = GREATEST(0, credits_remaining - ?), 
                   last_used_at = NOW(),
                   updated_at = NOW()
               WHERE user_id = ? 
                 AND credits_remaining > 0 
                 AND expires_at > NOW() 
               ORDER BY expires_at ASC 
               LIMIT 1
             `, [durationInMinutes, call.caller_id])

            await connection.execute(
              `UPDATE user_call_credits 
               SET credits_remaining = GREATEST(0, credits_remaining - ?), 
                   last_used_at = NOW(),
                   updated_at = NOW()
               WHERE user_id = ? 
                 AND credits_remaining > 0 
                 AND expires_at > NOW() 
               ORDER BY expires_at ASC 
               LIMIT 1
             `, [durationInMinutes, call.receiver_id])

            await connection.execute(`
              INSERT INTO exotel_credit_log (
                action, credits, user_id, call_session_id, reason, created_at
              ) VALUES 
                ('used', ?, ?, ?, 'Call synced - caller', NOW()),
                ('used', ?, ?, ?, 'Call synced - receiver', NOW())
            `, [
              durationInMinutes, call.caller_id, call.id,
              durationInMinutes, call.receiver_id, call.id
            ])
          }

          console.log(`Synced stuck call ${call.id} to status: ${status}, duration: ${duration}`)
        }
      }
      await connection.commit()
    } catch (error) {
      console.error('Sync job error:', error)
      if (connection) await connection.rollback()
    } finally {
      if (connection) await connection.end()
    }
  })
}

startSyncJob()

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null
  let webhookData: ExotelWebhookPayload | null = null

  try {
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      webhookData = await request.json() as ExotelWebhookPayload
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      webhookData = Object.fromEntries(formData.entries()) as unknown as ExotelWebhookPayload
      const formFields = webhookData as any
      if (formFields['Legs[0][Status]'] || formFields['Legs[1][Status]']) {
        webhookData.Legs = []
        webhookData.Legs[0] = {
          Status: formFields['Legs[0][Status]'] as string || '',
          OnCallDuration: parseInt(formFields['Legs[0][OnCallDuration]'] as string || '0')
        }
        webhookData.Legs[1] = {
          Status: formFields['Legs[1][Status]'] as string || '',
          OnCallDuration: parseInt(formFields['Legs[1][OnCallDuration]'] as string || '0')
        }
      }
      webhookData.ConversationDuration = parseInt(webhookData.ConversationDuration as unknown as string || '0')
    } else {
      console.error('Unsupported content type:', contentType)
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 })
    }

    console.log('📞 Exotel Webhook Received:', JSON.stringify(webhookData, null, 2))

    const {
      CallSid,
      EventType,
      Status: callStatus, // Renamed to avoid conflict
      ConversationDuration,
      RecordingUrl,
      StartTime,
      EndTime,
      CustomField,
      Legs
    } = webhookData

    if (!CallSid) {
      console.error('Missing CallSid in webhook')
      return NextResponse.json({ error: "CallSid is required" }, { status: 400 })
    }

    connection = await mysql.createConnection(dbConfig)
    await connection.beginTransaction()

    // Log the webhook
    await connection.execute(`
      INSERT INTO webhook_logs (
        call_sid, event_type, status, payload, created_at, processed
      ) VALUES (?, ?, ?, ?, NOW(), 0)
    `, [CallSid, EventType || 'unknown', callStatus, JSON.stringify(webhookData)])

    const [sessionRows] = await connection.execute(
      "SELECT * FROM call_sessions WHERE exotel_call_sid = ?",
      [CallSid]
    )

    const session = (sessionRows as any[])[0]

    if (!session) {
      console.error('Call session not found for CallSid:', CallSid)
      await connection.commit()
      return NextResponse.json({ message: "Call session not found" }, { status: 200 })
    }

    let userId: number | null = null
    let targetUserId: number | null = null
    if (CustomField) {
      try {
        const customData = JSON.parse(CustomField)
        userId = customData.userId
        targetUserId = customData.targetUserId
      } catch (error) {
        console.error('Failed to parse CustomField:', error)
      }
    }

    const duration = ConversationDuration || 0
    const durationInMinutes = Math.ceil(duration / 60)
    const costPerMinute = session.cost_per_minute || 1.0
    const callCost = duration > 0 ? durationInMinutes * costPerMinute : 0

    let updateQuery = ""
    let updateParams: any[] = []
    let shouldCreateCallLogs = false
    let finalStatus = callStatus?.toLowerCase() || 'unknown'

    switch (EventType?.toLowerCase() || '') {
      case 'answered':
        finalStatus = 'in_progress'
        const startTime = StartTime ? new Date(StartTime) : new Date()
        updateQuery = `
          UPDATE call_sessions 
          SET status = 'in_progress', started_at = ?, updated_at = NOW()
          WHERE id = ?
        `
        updateParams = [startTime, session.id]
        break

      case 'terminal':
        finalStatus = callStatus?.toLowerCase() || 'unknown'
        shouldCreateCallLogs = finalStatus === 'completed'
        const endTime = EndTime ? new Date(EndTime) : new Date()
        updateQuery = `
          UPDATE call_sessions 
          SET status = ?, duration = ?, cost = ?, ended_at = ?, 
              recording_url = ?, conversation_duration = ?,
              leg1_status = ?, leg1_duration = ?,
              leg2_status = ?, leg2_duration = ?,
              updated_at = NOW()
          WHERE id = ?
        `
        updateParams = [
          finalStatus,
          duration,
          callCost,
          endTime,
          RecordingUrl || null,
          ConversationDuration || 0,
          Legs?.[0]?.Status || null,
          Legs?.[0]?.OnCallDuration || 0,
          Legs?.[1]?.Status || null,
          Legs?.[1]?.OnCallDuration || 0,
          session.id
        ]
        break

      default:
        console.log('Unknown event type:', EventType)
        await connection.commit()
        return NextResponse.json({ success: true })
    }

    if (updateQuery) {
      await connection.execute(updateQuery, updateParams)
      console.log(`Updated call session ${session.id} with status: ${finalStatus}`)
    }

    if (shouldCreateCallLogs && duration > 0) {
      console.log('Creating call logs for completed call')
      await connection.execute(`
        INSERT INTO call_logs (
          user_id, other_user_id, call_session_id, call_type, 
          duration, cost, created_at
        ) VALUES (?, ?, ?, 'outgoing', ?, ?, NOW())
      `, [
        session.caller_id,
        session.receiver_id,
        session.id,
        duration,
        callCost
      ])

      await connection.execute(`
        INSERT INTO call_logs (
          user_id, other_user_id, call_session_id, call_type, 
          duration, cost, created_at
        ) VALUES (?, ?, ?, 'incoming', ?, ?, NOW())
      `, [
        session.receiver_id,
        session.caller_id,
        session.id,
        duration,
        callCost
      ])

      // Only deduct credits if no database trigger handles it
      if (!HAS_CREDIT_DEDUCTION_TRIGGER) {
        await connection.execute(`
          UPDATE user_call_credits 
          SET credits_remaining = GREATEST(0, credits_remaining - ?), 
              last_used_at = NOW(),
              updated_at = NOW()
          WHERE user_id = ? 
            AND credits_remaining > 0 
            AND expires_at > NOW() 
          ORDER BY expires_at ASC 
          LIMIT 1
        `, [durationInMinutes, session.caller_id])

        await connection.execute(`
          UPDATE user_call_credits 
          SET credits_remaining = GREATEST(0, credits_remaining - ?), 
              last_used_at = NOW(),
              updated_at = NOW()
          WHERE user_id = ? 
            AND credits_remaining > 0 
            AND expires_at > NOW() 
          ORDER BY expires_at ASC 
          LIMIT 1
        `, [durationInMinutes, session.receiver_id])

        await connection.execute(`
          INSERT INTO exotel_credit_log (
            action, credits, user_id, call_session_id, reason, created_at
          ) VALUES 
            ('used', ?, ?, ?, 'Call completed - caller', NOW()),
            ('used', ?, ?, ?, 'Call completed - receiver', NOW())
        `, [
          durationInMinutes, session.caller_id, session.id,
          durationInMinutes, session.receiver_id, session.id
        ])
      } else {
        console.log('Skipping credit deduction in webhook; handled by database trigger')
      }

      console.log(`Call logs created${HAS_CREDIT_DEDUCTION_TRIGGER ? '' : ' and credits deducted'} for session ${session.id}`)
    }

    // Mark webhook as processed
    await connection.execute(
      `UPDATE webhook_logs SET processed = 1 WHERE call_sid = ? AND event_type = ?`,
      [CallSid, EventType]
    )

    await connection.commit()
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Webhook processing error:", error)
    if (connection) await connection.rollback()
    if (connection && webhookData) {
      try {
        await connection.execute(
          `INSERT INTO webhook_logs (
            call_sid, event_type, status, payload, created_at, processed
          ) VALUES (?, ?, ?, ?, NOW(), 0)
          `, [
            webhookData.CallSid || 'unknown',
            webhookData.EventType || 'unknown',
            webhookData.Status || 'unknown',
            JSON.stringify(webhookData)
          ]
        )
        await connection.commit()
      } catch (logError) {
        console.error('Failed to log webhook:', logError)
      }
    }
    return NextResponse.json(
      { error: "Webhook processing failed", details: (error as Error).message },
      { status: 500 }
    )
  } finally {
    if (connection) await connection.end()
  }
}
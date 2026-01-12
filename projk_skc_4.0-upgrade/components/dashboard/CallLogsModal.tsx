// components/dashboard/CallLogsModal.tsx
import { formatDate } from "@/utils/formatters"

interface CallLog {
  id: number
  other_user_name: string
  other_user_photo: string
  duration: number
  call_type: string
  call_status: string
  created_at: string
  recording_url: string
}

interface CallLogsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  callLogs: CallLog[]
  loadingCallLogs: boolean
  formatDate: (date: string) => string
  onRefresh: () => void
}

export default function CallLogsModal({
  open,
  onOpenChange,
  callLogs,
  loadingCallLogs,
  formatDate,
  onRefresh,
}: CallLogsModalProps) {
  return (
    <div className={open ? "modal open" : "modal"}>
      <div className="modal-content">
        <h2>Call Logs</h2>
        <button onClick={onRefresh} disabled={loadingCallLogs}>
          {loadingCallLogs ? "Refreshing..." : "Refresh Logs"}
        </button>
        {loadingCallLogs ? (
          <p>Loading...</p>
        ) : callLogs.length === 0 ? (
          <p>No call logs available.</p>
        ) : (
          <ul>
            {callLogs.map((log) => (
              <li key={log.id}>
                <p>Name: {log.other_user_name}</p>
                <p>Type: {log.call_type}</p>
                <p>Status: {log.call_status}</p>
                <p>Duration: {log.duration} seconds</p>
                <p>Date: {formatDate(log.created_at)}</p>
                {log.recording_url && (
                  <p>Recording: <a href={log.recording_url} target="_blank">Listen</a></p>
                )}
                {log.other_user_photo && (
                  <img src={log.other_user_photo} alt="Profile" width="50" />
                )}
              </li>
            ))}
          </ul>
        )}
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    </div>
  )
}
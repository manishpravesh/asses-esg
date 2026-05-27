import axios from 'axios'

const api = axios.create({
baseURL: import.meta.env.VITE_API_URL + '/api/v1',
})

// Attach token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-redirect on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearTokens()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export interface User {
  id: string
  email: string
  username: string
  organization: { id: string; name: string; slug: string }
}

export interface DashboardSummary {
  total_activities: number
  pending_review: number
  flagged: number
  approved: number
  locked: number
  failed_parse: number
  total_batches: number
  recent_batches: Array<{
    id: string
    filename: string
    status: string
    source_type: string
    success_count: number
    error_count: number
    flagged_count: number
    created_at: string
  }>
}

export interface Activity {
  id: string
  source_row_id: string
  source_system: string
  source_system_label: string
  scope: string
  scope_label: string
  category: string
  category_label: string
  review_status: string
  review_status_label: string
  flag_reasons: string[]
  activity_date: string | null
  description: string
  quantity_normalized: string | null
  unit_normalized: string
  amount: string | null
  currency: string
  site_code: string | null
  site_name: string | null
  batch_filename: string
  is_locked: boolean
  source_metadata: Record<string, unknown>
  raw_record?: { raw_payload: Record<string, string>; error_message?: string }
  audit_events?: Array<{ action: string; note: string; created_at: string; actor: User | null }>
}

export interface BatchResult {
  id: string
  filename: string
  status: string
  total_rows: number
  success_count: number
  error_count: number
  flagged_count: number
  error_summary: Array<{ row?: number; message: string }>
}

// Mirrors the FastAPI response models in backend/app/schemas.py

export interface Campaign {
  id: number
  name: string
  description?: string | null
  type: string
  prompt_template?: string | null
  tone?: string | null
  length?: string | null
  temperature: number
  delay_seconds: number
  status: string
  created_at: string
  scheduled_at?: string | null
}

export interface CampaignCreate {
  name: string
  description?: string
  type: string
  prompt_template?: string
  tone?: string
  length?: string
  temperature: number
  delay_seconds: number
}

export interface CampaignUpdate {
  name?: string
  description?: string
  prompt_template?: string
  tone?: string
  length?: string
  temperature?: number
  delay_seconds?: number
}

export interface ContactWithEmail {
  id: number
  campaign_id: number
  email: string
  name?: string | null
  company?: string | null
  role?: string | null
  website?: string | null
  industry?: string | null
  city?: string | null
  country?: string | null
  linkedin?: string | null
  notes?: string | null
  status: string
  validation_error?: string | null
  email_id?: number | null
  subject?: string | null
  body?: string | null
  email_status?: string | null
}

export interface GeneratedEmail {
  id: number
  contact_id: number
  subject: string
  body: string
  status: string
}

export interface EmailLog {
  id: number
  contact_id: number
  status: string
  message?: string | null
  timestamp: string
}

export interface PaginatedLog {
  id: number
  contact_id: number
  contact_email?: string | null
  status: string
  message?: string | null
  timestamp: string
}

export interface PaginatedLogs {
  total: number
  limit: number
  offset: number
  logs: PaginatedLog[]
}

export interface CampaignStats {
  total: number
  valid: number
  invalid: number
  generated: number
  approved: number
  sent: number
  failed: number
  pending: number
}

export interface AnalyticsData {
  total_contacts: number
  valid_contacts: number
  emails_generated: number
  emails_approved: number
  emails_sent: number
  emails_failed: number
  delivery_rate: number
  open_rate: number
  avg_generation_time: number
}

export interface RecentCampaign {
  id: number
  name: string
  status: string
  sent: number
}

export interface RecentLog {
  id: number
  contact_email?: string | null
  status: string
  message?: string | null
  timestamp: string
}

export interface DashboardStats {
  total_campaigns: number
  emails_sent: number
  failed: number
  pending: number
  success_rate: number
  recent_campaigns: RecentCampaign[]
  recent_logs: RecentLog[]
}

export interface GmailAccount {
  id: number
  email: string
}

export interface GmailTestResult {
  ok: boolean
  message: string
}

export interface UploadResult {
  message: string
  valid: number
  invalid: number
}

export interface EmailTemplate {
  id: number
  name: string
  description?: string | null
  subject_template: string
  body_template: string
  category?: string | null
  created_at: string
}

export interface TemplateCreate {
  name: string
  description?: string
  subject_template: string
  body_template: string
  category?: string
}

export interface TemplateUpdate {
  name?: string
  description?: string
  subject_template?: string
  body_template?: string
  category?: string
}

export interface SchedulePayload {
  scheduled_at: string
  gmail_account_id?: number
}

export interface ValidationResult {
  message: string
  validated: number
  valid: number
  invalid: number
}

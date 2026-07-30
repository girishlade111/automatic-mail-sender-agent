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
  ab_variants?: string | null
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
  type?: string
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
  score: number
  validation_error?: string | null
  email_id?: number | null
  subject?: string | null
  body?: string | null
  email_status?: string | null
  variant_label?: string | null
}

export interface ManualContactCreate {
  email: string
  name?: string
  company?: string
  role?: string
}

export interface GeneratedEmail {
  id: number
  contact_id: number
  subject: string
  body: string
  status: string
  variant_label?: string | null
}

export interface EmailLog {
  id: number
  contact_id: number
  status: string
  message?: string | null
  timestamp: string
  contact_email?: string | null
}

export interface LogsResponse {
  logs: EmailLog[]
  total: number
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

export interface Template {
  id: number
  name: string
  description?: string | null
  prompt_template: string
  tone?: string | null
  length?: string | null
  temperature: number
  created_at: string
}

export interface TemplateCreate {
  name: string
  description?: string
  prompt_template: string
  tone?: string
  length?: string
  temperature: number
}

export interface TemplateUpdate {
  name?: string
  description?: string
  prompt_template?: string
  tone?: string
  length?: string
  temperature?: number
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

// --- Scheduling ---

export interface ScheduleCampaignPayload {
  scheduled_at: string
}

// --- A/B Testing ---

export interface ABVariant {
  label: string
  prompt_template: string
}

export interface ABTestSetup {
  variants: ABVariant[]
}

export interface ABVariantResult {
  label: string
  total: number
  sent: number
  failed: number
  pending: number
  approved: number
}

export interface ABResultsResponse {
  campaign_id: number
  variants: ABVariantResult[]
}

// --- Preflight ---

export interface PreflightCheckItem {
  name: string
  status: string
  message: string
}

export interface PreflightResponse {
  checks: PreflightCheckItem[]
  can_proceed: boolean
}

// --- Webhooks ---

export interface WebhookConfig {
  id: number
  url: string
  events: string[]
  active: boolean
  created_at: string
}

export interface WebhookConfigCreate {
  url: string
  events: string[]
  active: boolean
}

export interface WebhookConfigUpdate {
  url?: string
  events?: string[]
  active?: boolean
}

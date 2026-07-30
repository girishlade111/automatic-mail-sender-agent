"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import type {
  AnalyticsData,
  Campaign,
  CampaignCreate,
  CampaignStats,
  CampaignUpdate,
  ContactWithEmail,
  DashboardStats,
  EmailLog,
  EmailTemplate,
  GeneratedEmail,
  GmailAccount,
  GmailTestResult,
  PaginatedLogs,
  SchedulePayload,
  TemplateCreate,
  TemplateUpdate,
  UploadResult,
  ValidationResult,
} from "./types"

// ----- Dashboard -----

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get<DashboardStats>("/dashboard/stats")).data,
    refetchInterval: 10_000,
  })
}

// ----- Paginated Logs -----

export function usePaginatedLogs(limit: number, offset: number, status?: string) {
  return useQuery({
    queryKey: ["paginated-logs", limit, offset, status],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit, offset }
      if (status) params.status = status
      return (await api.get<PaginatedLogs>("/dashboard/logs", { params })).data
    },
    refetchInterval: 10_000,
  })
}

// ----- Campaigns -----

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => (await api.get<Campaign[]>("/campaigns/")).data,
  })
}

export function useCampaign(id: number | string) {
  return useQuery({
    queryKey: ["campaign", String(id)],
    queryFn: async () => (await api.get<Campaign>(`/campaigns/${id}`)).data,
    enabled: id !== undefined && id !== null && id !== "",
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CampaignCreate) =>
      (await api.post<Campaign>("/campaigns/", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: CampaignUpdate }) =>
      (await api.put<Campaign>(`/campaigns/${id}`, payload)).data,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["campaigns"] })
      qc.invalidateQueries({ queryKey: ["campaign", String(vars.id)] })
    },
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/campaigns/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] })
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

export function useDuplicateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.post<Campaign>(`/campaigns/${id}/duplicate`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["campaigns"] }),
  })
}

export function useUploadContacts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ campaignId, file }: { campaignId: number; file: File }) => {
      const form = new FormData()
      form.append("file", file)
      const { data } = await api.post<UploadResult>(`/campaigns/${campaignId}/upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return data
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["contacts", String(vars.campaignId)] }),
  })
}

export function useGenerateEmails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (campaignId: number) =>
      (await api.post(`/campaigns/${campaignId}/generate`)).data,
    onSuccess: (_d, campaignId) => {
      qc.invalidateQueries({ queryKey: ["campaign", String(campaignId)] })
      qc.invalidateQueries({ queryKey: ["contacts", String(campaignId)] })
    },
  })
}

export function useSendCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ campaignId, gmailAccountId }: { campaignId: number; gmailAccountId: number }) =>
      (await api.post(`/campaigns/${campaignId}/send`, null, {
        params: { gmail_account_id: gmailAccountId },
      })).data,
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["campaign", String(vars.campaignId)] }),
  })
}

export function usePauseCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (campaignId: number) =>
      (await api.post(`/campaigns/${campaignId}/pause`)).data,
    onSuccess: (_d, campaignId) =>
      qc.invalidateQueries({ queryKey: ["campaign", String(campaignId)] }),
  })
}

export function useResumeCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ campaignId, gmailAccountId }: { campaignId: number; gmailAccountId: number }) =>
      (await api.post(`/campaigns/${campaignId}/resume`, null, {
        params: { gmail_account_id: gmailAccountId },
      })).data,
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["campaign", String(vars.campaignId)] }),
  })
}

export function useStopCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (campaignId: number) =>
      (await api.post(`/campaigns/${campaignId}/stop`)).data,
    onSuccess: (_d, campaignId) =>
      qc.invalidateQueries({ queryKey: ["campaign", String(campaignId)] }),
  })
}

// ----- Campaign Analytics -----

export function useCampaignAnalytics(id: number | string) {
  return useQuery({
    queryKey: ["campaign-analytics", String(id)],
    queryFn: async () => (await api.get<AnalyticsData>(`/campaigns/${id}/analytics`)).data,
    enabled: id !== undefined && id !== null && id !== "",
  })
}

// ----- Campaign Export -----

export function useExportCampaign() {
  return useMutation({
    mutationFn: async (campaignId: number) => {
      const response = await api.get(`/campaigns/${campaignId}/export`, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `campaign-${campaignId}-export.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
  })
}

// ----- Campaign Schedule -----

export function useScheduleCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ campaignId, payload }: { campaignId: number; payload: SchedulePayload }) =>
      (await api.post(`/campaigns/${campaignId}/schedule`, payload)).data,
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["campaign", String(vars.campaignId)] }),
  })
}

// ----- Contact Validation -----

export function useValidateContacts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (campaignId: number) =>
      (await api.post<ValidationResult>(`/contacts/${campaignId}/validate`)).data,
    onSuccess: (_d, campaignId) =>
      qc.invalidateQueries({ queryKey: ["contacts", String(campaignId)] }),
  })
}

// ----- Stats & logs (polling) -----

export function useCampaignStats(id: number | string, active = true) {
  return useQuery({
    queryKey: ["campaign-stats", String(id)],
    queryFn: async () => (await api.get<CampaignStats>(`/campaigns/${id}/stats`)).data,
    enabled: id !== undefined && id !== null && id !== "",
    refetchInterval: active ? 2500 : false,
  })
}

export function useCampaignLogs(id: number | string, active = true) {
  return useQuery({
    queryKey: ["campaign-logs", String(id)],
    queryFn: async () => (await api.get<EmailLog[]>(`/campaigns/${id}/logs`)).data,
    enabled: id !== undefined && id !== null && id !== "",
    refetchInterval: active ? 2500 : false,
  })
}

// ----- Contacts & generated emails -----

export function useContacts(campaignId: number | string) {
  return useQuery({
    queryKey: ["contacts", String(campaignId)],
    queryFn: async () =>
      (await api.get<ContactWithEmail[]>(`/contacts/${campaignId}`)).data,
    enabled: campaignId !== undefined && campaignId !== null && campaignId !== "",
  })
}

export function useApproveEmail(campaignId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (emailId: number) =>
      (await api.put(`/contacts/emails/${emailId}/approve`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", String(campaignId)] }),
  })
}

export function useApproveAll(campaignId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      (await api.put(`/contacts/campaigns/${campaignId}/approve-all`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", String(campaignId)] }),
  })
}

export function useEditEmail(campaignId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ emailId, subject, body }: { emailId: number; subject: string; body: string }) =>
      (await api.put<GeneratedEmail>(`/contacts/emails/${emailId}`, { subject, body })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", String(campaignId)] }),
  })
}

export function useRegenerateEmail(campaignId: number | string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contactId: number) =>
      (await api.post<GeneratedEmail>(`/contacts/${contactId}/regenerate`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", String(campaignId)] }),
  })
}

// ----- Gmail accounts -----

export function useGmailAccounts() {
  return useQuery({
    queryKey: ["gmail-accounts"],
    queryFn: async () => (await api.get<GmailAccount[]>("/settings/gmail")).data,
  })
}

export function useAddGmailAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, app_password }: { email: string; app_password: string }) =>
      (await api.post<GmailAccount>("/settings/gmail", { email, app_password })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gmail-accounts"] }),
  })
}

export function useTestGmailAccount() {
  return useMutation({
    mutationFn: async (accountId: number) =>
      (await api.post<GmailTestResult>(`/settings/gmail/${accountId}/test`)).data,
  })
}

export function useDeleteGmailAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (accountId: number) =>
      (await api.delete(`/settings/gmail/${accountId}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gmail-accounts"] }),
  })
}

// ----- Templates -----

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: async () => (await api.get<EmailTemplate[]>("/templates/")).data,
  })
}

export function useTemplate(id: number | string) {
  return useQuery({
    queryKey: ["template", String(id)],
    queryFn: async () => (await api.get<EmailTemplate>(`/templates/${id}`)).data,
    enabled: id !== undefined && id !== null && id !== "",
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: TemplateCreate) =>
      (await api.post<EmailTemplate>("/templates/", payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: TemplateUpdate }) =>
      (await api.put<EmailTemplate>(`/templates/${id}`, payload)).data,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["templates"] })
      qc.invalidateQueries({ queryKey: ["template", String(vars.id)] })
    },
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/templates/${id}`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  })
}

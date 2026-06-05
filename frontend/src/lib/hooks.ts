"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import type {
  Campaign,
  CampaignCreate,
  CampaignStats,
  ContactWithEmail,
  DashboardStats,
  EmailLog,
  GeneratedEmail,
  GmailAccount,
  GmailTestResult,
  UploadResult,
} from "./types"

// ----- Dashboard -----

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => (await api.get<DashboardStats>("/dashboard/stats")).data,
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

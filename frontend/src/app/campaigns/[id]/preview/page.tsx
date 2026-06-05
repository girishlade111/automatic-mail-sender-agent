"use client"
import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/status-badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Check, Edit2, RefreshCw, Send, Sparkles, Loader2 } from "lucide-react"
import {
  useCampaign, useContacts, useGenerateEmails, useApproveEmail, useApproveAll,
  useRegenerateEmail, useEditEmail, useGmailAccounts, useSendCampaign,
} from "@/lib/hooks"
import type { ContactWithEmail } from "@/lib/types"

export default function PreviewCampaign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: campaign } = useCampaign(id)
  const { data: contacts, isLoading } = useContacts(id)
  const generate = useGenerateEmails()
  const approve = useApproveEmail(id)
  const approveAll = useApproveAll(id)
  const regenerate = useRegenerateEmail(id)
  const editEmail = useEditEmail(id)
  const { data: gmailAccounts } = useGmailAccounts()
  const send = useSendCampaign()

  const [editing, setEditing] = useState<ContactWithEmail | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editBody, setEditBody] = useState("")
  const [gmailId, setGmailId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  const valid = (contacts ?? []).filter((c) => c.status === "Valid")
  const generatedCount = valid.filter((c) => c.email_id).length
  const hasGenerated = generatedCount > 0

  const openEdit = (c: ContactWithEmail) => {
    setEditing(c)
    setEditSubject(c.subject ?? "")
    setEditBody(c.body ?? "")
  }

  const saveEdit = async () => {
    if (!editing?.email_id) return
    await editEmail.mutateAsync({ emailId: editing.email_id, subject: editSubject, body: editBody })
    setEditing(null)
  }

  const startSending = async () => {
    setError(null)
    const accountId = gmailId || (gmailAccounts?.[0]?.id ? String(gmailAccounts[0].id) : "")
    if (!accountId) {
      setError("Connect a Gmail account in Settings before sending.")
      return
    }
    try {
      await send.mutateAsync({ campaignId: Number(id), gmailAccountId: Number(accountId) })
      router.push(`/campaigns/${id}/progress`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start sending")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Preview &amp; Approve</h1>
          <p className="text-white/60">
            {campaign ? `Campaign: ${campaign.name}` : "Review AI-generated personalized emails before sending."}
          </p>
        </div>
        <div className="flex gap-3">
          {!hasGenerated && (
            <Button
              onClick={() => generate.mutate(Number(id))}
              disabled={generate.isPending || valid.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {generate.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                : <><Sparkles className="w-4 h-4 mr-2" /> Generate Emails</>}
            </Button>
          )}
          {hasGenerated && (
            <Button
              onClick={() => approveAll.mutate()}
              disabled={approveAll.isPending}
              className="bg-green-600 hover:bg-green-700 text-white border-0"
            >
              <Check className="w-4 h-4 mr-2" /> Approve All
            </Button>
          )}
        </div>
      </div>

      {generate.isPending && (
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="p-4 text-indigo-300 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generation runs in the background. Refresh status will appear as emails are produced.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Generated Emails</CardTitle>
          <CardDescription>
            {isLoading ? "Loading contacts…" : `${valid.length} valid contacts • ${generatedCount} generated`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead className="w-[40%]">Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valid.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name || "—"}</p>
                    <p className="text-xs text-white/50">{c.email}</p>
                  </TableCell>
                  <TableCell className="font-medium text-white/80">
                    {c.subject || <span className="text-white/30">Not generated</span>}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.email_status ?? "Pending"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost" size="icon" title="Edit"
                        className="h-8 w-8 text-white/50 hover:text-white"
                        disabled={!c.email_id}
                        onClick={() => openEdit(c)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" title="Regenerate"
                        className="h-8 w-8 text-white/50 hover:text-indigo-400"
                        disabled={regenerate.isPending}
                        onClick={() => regenerate.mutate(c.id)}
                      >
                        <RefreshCw className={`w-4 h-4 ${regenerate.isPending ? "animate-spin" : ""}`} />
                      </Button>
                      <Button
                        variant="ghost" size="icon" title="Approve"
                        className="h-8 w-8 text-white/50 hover:text-green-400"
                        disabled={!c.email_id || c.email_status === "Approved"}
                        onClick={() => c.email_id && approve.mutate(c.email_id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && valid.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-white/40 py-6">
                    No valid contacts found for this campaign.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {error && <p className="text-red-400 text-sm text-right">{error}</p>}

      <div className="flex justify-end items-center gap-3 pt-4">
        {gmailAccounts && gmailAccounts.length > 0 && (
          <select
            value={gmailId}
            onChange={(e) => setGmailId(e.target.value)}
            className="flex h-10 rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white"
          >
            {gmailAccounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900">{a.email}</option>
            ))}
          </select>
        )}
        <Button
          size="lg"
          onClick={startSending}
          disabled={send.isPending || !hasGenerated}
          className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white shadow-lg shadow-indigo-500/20"
        >
          {send.isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting…</>
            : <><Send className="w-4 h-4 mr-2" /> Start Campaign Queue</>}
        </Button>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email</DialogTitle>
            <DialogDescription>{editing?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject</Label>
              <Input id="edit-subject" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-body">Body</Label>
              <Textarea id="edit-body" className="h-48" value={editBody} onChange={(e) => setEditBody(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button
              onClick={saveEdit}
              disabled={editEmail.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {editEmail.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"
import { use, useState, useMemo } from "react"
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
import { Check, Edit2, RefreshCw, Send, Sparkles, Loader2, Download, UserPlus, Shield, ArrowUpDown, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import {
  useCampaign, useContacts, useGenerateEmails, useApproveEmail, useApproveAll,
  useRegenerateEmail, useEditEmail, useGmailAccounts, useSendCampaign,
  useAddManualContact, useExportContacts, usePreflight,
} from "@/lib/hooks"
import { useToast } from "@/components/toast-provider"
import type { ContactWithEmail, PreflightResponse } from "@/lib/types"

export default function PreviewCampaign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const { data: campaign } = useCampaign(id)
  const { data: contacts, isLoading } = useContacts(id)
  const generate = useGenerateEmails()
  const approve = useApproveEmail(id)
  const approveAll = useApproveAll(id)
  const regenerate = useRegenerateEmail(id)
  const editEmail = useEditEmail(id)
  const { data: gmailAccounts } = useGmailAccounts()
  const send = useSendCampaign()
  const addManualContact = useAddManualContact()
  const exportContacts = useExportContacts()
  const preflight = usePreflight()

  const [editing, setEditing] = useState<ContactWithEmail | null>(null)
  const [editSubject, setEditSubject] = useState("")
  const [editBody, setEditBody] = useState("")
  const [gmailId, setGmailId] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  // Manual contact form state
  const [manualEmail, setManualEmail] = useState("")
  const [manualName, setManualName] = useState("")
  const [manualCompany, setManualCompany] = useState("")
  const [manualRole, setManualRole] = useState("")
  const [showManualForm, setShowManualForm] = useState(false)

  // Preflight state
  const [showPreflight, setShowPreflight] = useState(false)
  const [preflightResult, setPreflightResult] = useState<PreflightResponse | null>(null)

  // Sort by score
  const [sortByScore, setSortByScore] = useState(true)

  const valid = useMemo(() => {
    const filtered = (contacts ?? []).filter((c) => c.status === "Valid")
    if (sortByScore) {
      return [...filtered].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    }
    return filtered
  }, [contacts, sortByScore])

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
    toast({ title: "Email updated", variant: "success" })
    setEditing(null)
  }

  const handleAddContact = async () => {
    if (!manualEmail) {
      toast({ title: "Email is required", variant: "error" })
      return
    }
    try {
      await addManualContact.mutateAsync({
        campaignId: Number(id),
        contact: {
          email: manualEmail,
          name: manualName || undefined,
          company: manualCompany || undefined,
          role: manualRole || undefined,
        },
      })
      toast({ title: "Contact added", variant: "success" })
      setManualEmail("")
      setManualName("")
      setManualCompany("")
      setManualRole("")
      setShowManualForm(false)
    } catch {
      toast({ title: "Failed to add contact", variant: "error" })
    }
  }

  const handleExport = () => {
    exportContacts.mutate(Number(id), {
      onSuccess: () => toast({ title: "CSV downloaded", variant: "success" }),
      onError: () => toast({ title: "Failed to export contacts", variant: "error" }),
    })
  }

  const handlePreflightCheck = async () => {
    setPreflightResult(null)
    setShowPreflight(true)
    try {
      const result = await preflight.mutateAsync(Number(id))
      setPreflightResult(result)
    } catch {
      toast({ title: "Preflight check failed", variant: "error" })
      setShowPreflight(false)
    }
  }

  const startSending = async () => {
    setError(null)
    setShowPreflight(false)
    const accountId = gmailId || (gmailAccounts?.[0]?.id ? String(gmailAccounts[0].id) : "")
    if (!accountId) {
      setError("Connect a Gmail account in Settings before sending.")
      return
    }
    try {
      await send.mutateAsync({ campaignId: Number(id), gmailAccountId: Number(accountId) })
      toast({ title: "Campaign sending started", variant: "success" })
      router.push(`/campaigns/${id}/progress`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start sending")
      toast({ title: "Failed to start campaign", variant: "error" })
    }
  }

  const getPreflightIcon = (status: string) => {
    if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-green-400" />
    if (status === "fail") return <XCircle className="w-4 h-4 text-red-400" />
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />
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
          <Button variant="outline" onClick={handleExport} disabled={exportContacts.isPending}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          {!hasGenerated && (
            <Button
              onClick={() => generate.mutate(Number(id))}
              disabled={generate.isPending || valid.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {generate.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
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

      {/* Manual Contact Addition */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Add Contact Manually</CardTitle>
              <CardDescription>Add individual contacts without a file upload.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowManualForm(!showManualForm)}
            >
              <UserPlus className="w-4 h-4 mr-2" /> {showManualForm ? "Hide" : "Add Contact"}
            </Button>
          </div>
        </CardHeader>
        {showManualForm && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-email">Email *</Label>
                <Input
                  id="manual-email"
                  type="email"
                  placeholder="john@example.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-name">Name</Label>
                <Input
                  id="manual-name"
                  placeholder="John Doe"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-company">Company</Label>
                <Input
                  id="manual-company"
                  placeholder="Acme Inc"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-role">Role</Label>
                <Input
                  id="manual-role"
                  placeholder="CTO"
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleAddContact}
                disabled={addManualContact.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              >
                {addManualContact.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
                  : <><UserPlus className="w-4 h-4 mr-2" /> Add Contact</>}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Generated Emails</CardTitle>
              <CardDescription>
                {isLoading ? "Loading contacts..." : `${valid.length} valid contacts - ${generatedCount} generated`}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortByScore(!sortByScore)}
              className="text-white/60 hover:text-white"
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortByScore ? "Sorted by Score" : "Default Order"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="w-[35%]">Subject</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valid.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{c.name || "---"}</p>
                    <p className="text-xs text-white/50">{c.email}</p>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
                      {c.score ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-white/80">
                    {c.subject || <span className="text-white/30">Not generated</span>}
                  </TableCell>
                  <TableCell>
                    {c.variant_label ? (
                      <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400">
                        {c.variant_label}
                      </span>
                    ) : (
                      <span className="text-white/30 text-xs">-</span>
                    )}
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
                  <TableCell colSpan={6} className="text-center text-white/40 py-6">
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
          onClick={handlePreflightCheck}
          disabled={preflight.isPending || !hasGenerated}
          className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white shadow-lg shadow-indigo-500/20"
        >
          {preflight.isPending
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
            : <><Shield className="w-4 h-4 mr-2" /> Start Campaign Queue</>}
        </Button>
      </div>

      {/* Edit Email Dialog */}
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
              {editEmail.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preflight Check Dialog */}
      <Dialog open={showPreflight} onOpenChange={(o) => !o && setShowPreflight(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Pre-send Health Check
            </DialogTitle>
            <DialogDescription>Verifying campaign readiness before sending.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {!preflightResult && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                <span className="ml-2 text-white/60">Running checks...</span>
              </div>
            )}
            {preflightResult && preflightResult.checks.map((check, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-white/5 border border-white/10">
                {getPreflightIcon(check.status)}
                <div>
                  <p className="text-sm font-medium text-white">{check.name}</p>
                  <p className="text-xs text-white/60">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreflight(false)}>Cancel</Button>
            {preflightResult && (
              <Button
                onClick={startSending}
                disabled={!preflightResult.can_proceed || send.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              >
                {send.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Starting...</>
                  : <><Send className="w-4 h-4 mr-2" /> Proceed to Send</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

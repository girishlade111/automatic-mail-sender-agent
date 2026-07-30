"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { FilePlus, Eye, Activity, Trash2, Copy, Pencil } from "lucide-react"
import { useCampaigns, useDeleteCampaign, useDuplicateCampaign } from "@/lib/hooks"
import { useToast } from "@/components/toast-provider"

export default function CampaignsList() {
  const router = useRouter()
  const { data: campaigns, isLoading, isError } = useCampaigns()
  const deleteCampaign = useDeleteCampaign()
  const duplicateCampaign = useDuplicateCampaign()
  const { toast } = useToast()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filtered = (campaigns ?? []).filter((c) => {
    const matchesName = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter ? c.status === statusFilter : true
    return matchesName && matchesStatus
  })

  const handleDelete = (id: number) => {
    deleteCampaign.mutate(id, {
      onSuccess: () => toast({ title: "Campaign deleted", variant: "success" }),
      onError: () => toast({ title: "Failed to delete campaign", variant: "error" }),
    })
  }

  const handleDuplicate = (id: number) => {
    duplicateCampaign.mutate(id, {
      onSuccess: (data) => {
        toast({ title: "Campaign duplicated", description: `Created: ${data.name}`, variant: "success" })
        router.push(`/campaigns/${data.id}/preview`)
      },
      onError: () => toast({ title: "Failed to duplicate campaign", variant: "error" }),
    })
  }

  const selectClass =
    "flex h-9 rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campaigns</h1>
          <p className="text-white/60">All your outreach campaigns in one place.</p>
        </div>
        <Link href="/campaigns/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
            <FilePlus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="" className="bg-slate-900">All Statuses</option>
              <option value="Draft" className="bg-slate-900">Draft</option>
              <option value="Generating" className="bg-slate-900">Generating</option>
              <option value="Ready" className="bg-slate-900">Ready</option>
              <option value="Sending" className="bg-slate-900">Sending</option>
              <option value="Paused" className="bg-slate-900">Paused</option>
              <option value="Completed" className="bg-slate-900">Completed</option>
              <option value="Stopped" className="bg-slate-900">Stopped</option>
            </select>
          </div>

          {isError && <p className="text-red-400 text-sm">Could not load campaigns from the backend.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-white/70">{c.type}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-white/50 text-sm">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/campaigns/${c.id}/preview`}>
                        <Button variant="ghost" size="icon" title="Preview" className="h-8 w-8 text-white/50 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/campaigns/${c.id}/progress`}>
                        <Button variant="ghost" size="icon" title="Progress" className="h-8 w-8 text-white/50 hover:text-indigo-400">
                          <Activity className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/campaigns/${c.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Edit" className="h-8 w-8 text-white/50 hover:text-yellow-400">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost" size="icon" title="Duplicate"
                        className="h-8 w-8 text-white/50 hover:text-blue-400"
                        disabled={duplicateCampaign.isPending}
                        onClick={() => handleDuplicate(c.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" title="Delete"
                        className="h-8 w-8 text-white/50 hover:text-red-400"
                        disabled={deleteCampaign.isPending}
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/40 py-6">
                    {(campaigns ?? []).length === 0
                      ? <>No campaigns yet. <Link href="/campaigns/create" className="text-indigo-400">Create your first campaign</Link>.</>
                      : "No campaigns match your filters."
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

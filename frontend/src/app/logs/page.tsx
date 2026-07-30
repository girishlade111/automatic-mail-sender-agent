"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { useAllLogs, useCampaigns } from "@/lib/hooks"
import { ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 20

export default function LogsPage() {
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState("")
  const [campaignFilter, setCampaignFilter] = useState("")

  const { data: campaigns } = useCampaigns()

  const { data, isLoading, isError } = useAllLogs({
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    campaign_id: campaignFilter ? Number(campaignFilter) : undefined,
    status: statusFilter || undefined,
  })

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const selectClass =
    "flex h-9 rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Activity Logs</h1>
        <p className="text-white/60">Email generation and delivery events across all campaigns.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Events</CardTitle>
          <CardDescription>
            {total > 0 ? `${total} total events` : "Updated automatically every few seconds."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
            >
              <option value="" className="bg-slate-900">All Statuses</option>
              <option value="Sent" className="bg-slate-900">Sent</option>
              <option value="Failed" className="bg-slate-900">Failed</option>
              <option value="Queued" className="bg-slate-900">Queued</option>
              <option value="Skipped" className="bg-slate-900">Skipped</option>
            </select>

            <select
              className={selectClass}
              value={campaignFilter}
              onChange={(e) => { setCampaignFilter(e.target.value); setPage(0) }}
            >
              <option value="" className="bg-slate-900">All Campaigns</option>
              {(campaigns ?? []).map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
              ))}
            </select>
          </div>

          {isError && <p className="text-red-400 text-sm">Could not load logs from the backend.</p>}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-white/50 text-sm whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-white/80">{log.contact_email ?? "---"}</TableCell>
                  <TableCell><StatusBadge status={log.status} /></TableCell>
                  <TableCell className="text-white/60 text-sm">{log.message ?? "---"}</TableCell>
                </TableRow>
              ))}
              {!isLoading && logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-white/40 py-6">
                    No activity yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {total > PAGE_SIZE && (
            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-white/50">
                Page {page + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

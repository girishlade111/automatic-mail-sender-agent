"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { usePaginatedLogs } from "@/lib/hooks"

const PAGE_SIZE = 20

export default function LogsPage() {
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>("")

  const { data, isLoading, isError } = usePaginatedLogs(
    PAGE_SIZE,
    offset,
    statusFilter || undefined
  )

  const logs = data?.logs ?? []
  const total = data?.total ?? 0
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const goNext = () => {
    if (offset + PAGE_SIZE < total) setOffset(offset + PAGE_SIZE)
  }
  const goPrev = () => {
    if (offset - PAGE_SIZE >= 0) setOffset(offset - PAGE_SIZE)
  }

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value)
    setOffset(0)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Activity Logs</h1>
        <p className="text-white/60">All email generation and delivery events across campaigns.</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Sent">Sent</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Generated">Generated</SelectItem>
              <SelectItem value="Sending">Sending</SelectItem>
              <SelectItem value="Queued">Queued</SelectItem>
              <SelectItem value="RateLimited">Rate Limited</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="text-white/40 text-sm">{total} total logs</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            Page {currentPage} of {totalPages || 1} - showing {logs.length} of {total} entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && <p className="text-red-400 text-sm">Could not load logs from the backend.</p>}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          )}
          {!isLoading && (
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
                    <TableCell className="text-white/80">{log.contact_email ?? "-"}</TableCell>
                    <TableCell><StatusBadge status={log.status} /></TableCell>
                    <TableCell className="text-white/60 text-sm max-w-xs truncate">{log.message ?? "-"}</TableCell>
                  </TableRow>
                ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/40 py-6">
                      No activity logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goPrev}
                disabled={offset === 0}
                className="text-white/70"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <span className="text-sm text-white/50">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goNext}
                disabled={offset + PAGE_SIZE >= total}
                className="text-white/70"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

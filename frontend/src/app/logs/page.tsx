"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { useDashboardStats } from "@/lib/hooks"

export default function LogsPage() {
  const { data, isLoading, isError } = useDashboardStats()
  const logs = data?.recent_logs ?? []

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Activity Logs</h1>
        <p className="text-white/60">Recent email generation and delivery events across all campaigns.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Updated automatically every few seconds.</CardDescription>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="text-white/80">{log.contact_email ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={log.status} /></TableCell>
                  <TableCell className="text-white/60 text-sm">{log.message ?? "—"}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}

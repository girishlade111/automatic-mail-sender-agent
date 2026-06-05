"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { Mail, CheckCircle2, XCircle, BarChart3 } from "lucide-react"
import { useDashboardStats } from "@/lib/hooks"

function relativeTime(iso: string) {
  const then = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

function dotColor(status: string) {
  if (status === "Sent") return "bg-green-500"
  if (status === "Failed") return "bg-red-500"
  if (status === "RateLimited") return "bg-orange-500"
  return "bg-blue-500"
}

export default function Dashboard() {
  const { data, isLoading, isError } = useDashboardStats()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dashboard</h1>
        <p className="text-white/60">Overview of your email outreach campaigns.</p>
      </div>

      {isError && (
        <Card>
          <CardContent className="p-6 text-red-400">
            Could not reach the backend API. Make sure it is running on the configured URL.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-indigo-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.total_campaigns ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:border-blue-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.emails_sent ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="hover:border-green-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : `${data?.success_rate ?? 0}%`}</div>
          </CardContent>
        </Card>
        <Card className="hover:border-red-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Failed Emails</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "—" : data?.failed ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.recent_campaigns ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <Link href={`/campaigns/${c.id}/progress`} className="hover:text-indigo-400 transition-colors">
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={c.status} /></TableCell>
                    <TableCell className="text-right">{c.sent || "-"}</TableCell>
                  </TableRow>
                ))}
                {!isLoading && (data?.recent_campaigns?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-white/40 text-center py-6">
                      No campaigns yet. <Link href="/campaigns/create" className="text-indigo-400">Create one</Link>.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.recent_logs ?? []).map((log) => (
                <div key={log.id} className="flex items-start gap-4 text-sm">
                  <div className={`w-2 h-2 mt-1.5 rounded-full ${dotColor(log.status)}`}></div>
                  <div>
                    <p className="text-white">
                      <span className="font-medium">{log.status}</span>
                      {log.contact_email ? <> — <strong className="text-white">{log.contact_email}</strong></> : null}
                      {log.message ? <span className="text-white/60">: {log.message}</span> : null}
                    </p>
                    <p className="text-white/40 text-xs mt-1">{relativeTime(log.timestamp)}</p>
                  </div>
                </div>
              ))}
              {!isLoading && (data?.recent_logs?.length ?? 0) === 0 && (
                <p className="text-white/40 text-sm">No activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { User as UserIcon, Mail } from "lucide-react"
import { useDashboardStats, useGmailAccounts } from "@/lib/hooks"

export default function Profile() {
  const { data: stats } = useDashboardStats()
  const { data: accounts } = useGmailAccounts()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Profile</h1>
        <p className="text-white/60">Your account overview and sending activity.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Single-user local workspace</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold">{stats?.total_campaigns ?? 0}</p>
            <p className="text-xs text-white/50">Campaigns</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.emails_sent ?? 0}</p>
            <p className="text-xs text-white/50">Emails Sent</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.success_rate ?? 0}%</p>
            <p className="text-xs text-white/50">Success Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats?.failed ?? 0}</p>
            <p className="text-xs text-white/50">Failed</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <CardTitle>Connected Gmail Accounts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(accounts ?? []).map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.email}</TableCell>
                  <TableCell><StatusBadge status="Valid" /></TableCell>
                </TableRow>
              ))}
              {(accounts?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-white/40 py-6">
                    No Gmail accounts connected.
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

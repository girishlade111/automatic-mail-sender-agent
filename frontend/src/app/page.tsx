"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Mail, CheckCircle2, XCircle, BarChart3 } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Dashboard</h1>
        <p className="text-white/60">Overview of your email outreach campaigns.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-indigo-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Total Campaigns</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-white/40 mt-1">+2 from last month</p>
          </CardContent>
        </Card>
        <Card className="hover:border-blue-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Emails Sent</CardTitle>
            <Mail className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,450</div>
            <p className="text-xs text-white/40 mt-1">+18% from last month</p>
          </CardContent>
        </Card>
        <Card className="hover:border-green-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-white/40 mt-1">Excellent delivery</p>
          </CardContent>
        </Card>
        <Card className="hover:border-red-500/30 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/70">Failed Emails</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">44</div>
            <p className="text-xs text-white/40 mt-1">Requires attention</p>
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
                <TableRow>
                  <TableCell className="font-medium">Q3 Startup Founders</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400">Completed</span></TableCell>
                  <TableCell className="text-right">450</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Freelance Designers</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400">Sending</span></TableCell>
                  <TableCell className="text-right">120</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Local Restaurants</TableCell>
                  <TableCell><span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">Draft</span></TableCell>
                  <TableCell className="text-right">-</TableCell>
                </TableRow>
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
              <div className="flex items-start gap-4 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-white">Email delivered to <strong className="text-white">ceo@example.com</strong></p>
                  <p className="text-white/40 text-xs mt-1">2 mins ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-white">Email delivered to <strong className="text-white">founder@startup.io</strong></p>
                  <p className="text-white/40 text-xs mt-1">5 mins ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-white">AI Generation completed for 120 contacts</p>
                  <p className="text-white/40 text-xs mt-1">15 mins ago</p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-sm">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-white">Failed to send to <strong className="text-white">invalid@company.com</strong>: Address not found</p>
                  <p className="text-white/40 text-xs mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

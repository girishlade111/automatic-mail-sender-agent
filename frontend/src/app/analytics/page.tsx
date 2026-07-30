"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useDashboardStats, useCampaigns } from "@/lib/hooks"
import { BarChart3, Mail, CheckCircle, XCircle, Clock } from "lucide-react"

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns()

  const isLoading = statsLoading || campaignsLoading

  // Compute campaign-level metrics
  const sortedByActivity = [...(campaigns ?? [])]
    .filter((c) => c.status !== "Draft")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  // Status distribution
  const statusCounts: Record<string, number> = {}
  for (const c of campaigns ?? []) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1
  }

  // Metrics from dashboard
  const totalSent = stats?.emails_sent ?? 0
  const totalFailed = stats?.failed ?? 0
  const totalPending = stats?.pending ?? 0
  const successRate = stats?.success_rate ?? 0

  // Simple bar chart data from recent campaigns (showing sent counts)
  const recentCampaigns = stats?.recent_campaigns ?? []
  const maxSent = Math.max(...recentCampaigns.map((c) => c.sent), 1)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Analytics</h1>
        <p className="text-white/60">Campaign performance metrics and insights.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalSent}</p>
                <p className="text-xs text-white/50">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{successRate.toFixed(1)}%</p>
                <p className="text-xs text-white/50">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalFailed}</p>
                <p className="text-xs text-white/50">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalPending}</p>
                <p className="text-xs text-white/50">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Sent Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Top Campaigns by Emails Sent
          </CardTitle>
          <CardDescription>Visual representation of delivery across recent campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCampaigns.length === 0 ? (
            <p className="text-white/40 text-center py-8">No campaign data available yet.</p>
          ) : (
            <div className="space-y-3">
              {recentCampaigns.map((c) => (
                <div key={c.id} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-white/70 truncate" title={c.name}>
                    {c.name}
                  </div>
                  <div className="flex-1 h-8 rounded-md bg-white/5 overflow-hidden relative">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${(c.sent / maxSent) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs text-white font-medium">
                      {c.sent} sent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Status Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Status Distribution</CardTitle>
            <CardDescription>Breakdown of all campaigns by current status.</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(statusCounts).length === 0 ? (
              <p className="text-white/40 text-center py-8">No campaigns created yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                      <span className="text-sm text-white/80">{status}</span>
                    </div>
                    <span className="text-sm font-medium text-white">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Campaign Activity</CardTitle>
            <CardDescription>Latest campaigns that have been executed.</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedByActivity.length === 0 ? (
              <p className="text-white/40 text-center py-8">No active campaigns yet.</p>
            ) : (
              <div className="space-y-3">
                {sortedByActivity.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-white">{c.name}</p>
                      <p className="text-xs text-white/50">{c.type} - {new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case "Draft": return "bg-gray-400"
    case "Generating": return "bg-yellow-400"
    case "Ready": return "bg-blue-400"
    case "Sending": return "bg-indigo-400"
    case "Paused": return "bg-orange-400"
    case "Completed": return "bg-green-400"
    case "Stopped": return "bg-red-400"
    default: return "bg-white/40"
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Completed": return "bg-green-500/20 text-green-300"
    case "Sending": return "bg-indigo-500/20 text-indigo-300"
    case "Paused": return "bg-orange-500/20 text-orange-300"
    case "Stopped": return "bg-red-500/20 text-red-300"
    default: return "bg-white/10 text-white/70"
  }
}

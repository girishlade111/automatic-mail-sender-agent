"use client"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, BarChart3, CheckCircle2, XCircle, Mail, Users, Clock } from "lucide-react"
import { useCampaign, useCampaignAnalytics } from "@/lib/hooks"

export default function CampaignAnalytics({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: campaign } = useCampaign(id)
  const { data: analytics, isLoading, isError } = useCampaignAnalytics(id)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (isError || !analytics) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campaign Analytics</h1>
        <p className="text-red-400">Could not load analytics data.</p>
      </div>
    )
  }

  const deliveryPct = Math.round(analytics.delivery_rate * 100)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campaign Analytics</h1>
        <p className="text-white/60">
          {campaign ? `Detailed metrics for "${campaign.name}"` : "Performance metrics and delivery stats."}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-white/50">Total Contacts</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.total_contacts}</p>
            <p className="text-xs text-white/40 mt-1">{analytics.valid_contacts} valid</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-xs text-white/50">Emails Sent</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.emails_sent}</p>
            <p className="text-xs text-white/40 mt-1">{analytics.emails_approved} approved</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs text-white/50">Failed</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.emails_failed}</p>
            <p className="text-xs text-white/40 mt-1">delivery failures</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-white/50">Generated</span>
            </div>
            <p className="text-2xl font-bold text-white">{analytics.emails_generated}</p>
            <p className="text-xs text-white/40 mt-1">AI-generated emails</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <CardTitle>Delivery Performance</CardTitle>
          </div>
          <CardDescription>Overall delivery rate and email funnel breakdown.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Delivery Rate</span>
              <span className="text-white font-medium">{deliveryPct}%</span>
            </div>
            <Progress value={deliveryPct} />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-white/80">Email Funnel</h4>
            <div className="space-y-3">
              <FunnelRow label="Contacts" value={analytics.total_contacts} total={analytics.total_contacts} color="bg-white/20" />
              <FunnelRow label="Valid" value={analytics.valid_contacts} total={analytics.total_contacts} color="bg-blue-500/50" />
              <FunnelRow label="Generated" value={analytics.emails_generated} total={analytics.total_contacts} color="bg-indigo-500/50" />
              <FunnelRow label="Approved" value={analytics.emails_approved} total={analytics.total_contacts} color="bg-purple-500/50" />
              <FunnelRow label="Sent" value={analytics.emails_sent} total={analytics.total_contacts} color="bg-green-500/50" />
              <FunnelRow label="Failed" value={analytics.emails_failed} total={analytics.total_contacts} color="bg-red-500/50" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-400" />
            <CardTitle>Additional Metrics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-white/50 text-sm">Avg. Generation Time</p>
              <p className="text-xl font-bold text-white">
                {analytics.avg_generation_time > 0 ? `${analytics.avg_generation_time.toFixed(1)}s` : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-white/50 text-sm">Open Rate</p>
              <p className="text-xl font-bold text-white">
                {analytics.open_rate > 0 ? `${Math.round(analytics.open_rate * 100)}%` : "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-white/50 text-sm">Conversion Ratio</p>
              <p className="text-xl font-bold text-white">
                {analytics.total_contacts > 0
                  ? `${Math.round((analytics.emails_sent / analytics.total_contacts) * 100)}%`
                  : "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FunnelRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="text-white/80">{value} ({pct}%)</span>
      </div>
      <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

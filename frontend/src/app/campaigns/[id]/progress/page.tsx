"use client"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pause, Play, Square } from "lucide-react"
import {
  useCampaign, useCampaignStats, useCampaignLogs,
  usePauseCampaign, useResumeCampaign, useStopCampaign, useGmailAccounts,
} from "@/lib/hooks"

const ACTIVE_STATES = ["Sending", "Generating"]

function logColor(status: string) {
  if (status === "Sent") return "text-green-400"
  if (status === "Failed") return "text-red-400"
  if (status === "RateLimited") return "text-orange-400"
  if (status === "Sending" || status === "Queued") return "text-yellow-400"
  return "text-blue-400"
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

export default function CampaignProgress({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const { data: campaign } = useCampaign(id)
  const isActive = campaign ? ACTIVE_STATES.includes(campaign.status) : true
  const { data: stats } = useCampaignStats(id, isActive)
  const { data: logs } = useCampaignLogs(id, isActive)
  const { data: gmailAccounts } = useGmailAccounts()

  const pause = usePauseCampaign()
  const resume = useResumeCampaign()
  const stop = useStopCampaign()

  const total = stats?.generated ?? 0
  const sent = stats?.sent ?? 0
  const failed = stats?.failed ?? 0
  const pending = stats?.pending ?? 0
  const approved = stats?.approved ?? 0
  const done = sent + failed
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const isPaused = campaign?.status === "Paused"
  const gmailId = gmailAccounts?.[0]?.id

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campaign Progress</h1>
          <p className="text-white/60">
            {campaign ? `${campaign.name} — ${campaign.status}` : "Monitoring sending queue and real-time logs."}
          </p>
        </div>
        <div className="flex gap-2">
          {isPaused ? (
            <Button
              variant="outline"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
              disabled={resume.isPending || !gmailId}
              onClick={() => gmailId && resume.mutate({ campaignId: Number(id), gmailAccountId: gmailId })}
            >
              <Play className="w-4 h-4 mr-2" /> Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              disabled={pause.isPending || !isActive}
              onClick={() => pause.mutate(Number(id))}
            >
              <Pause className="w-4 h-4 mr-2" /> Pause
            </Button>
          )}
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            disabled={stop.isPending}
            onClick={() => stop.mutate(Number(id))}
          >
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
        </div>
      </div>

      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              {isActive ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                </span>
              ) : (
                <span className="inline-flex rounded-full h-3 w-3 bg-white/40"></span>
              )}
              <span className="text-indigo-400 font-medium">{campaign?.status ?? "Loading…"}</span>
            </div>
            <span className="text-white font-medium">{done} / {total} Processed</span>
          </div>

          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-in-out"
              style={{ width: `${pct}%` }}
            ></div>
          </div>

          <div className="flex justify-between mt-4 text-xs text-white/50">
            <span>{approved} approved & queued</span>
            <span>{pct}% complete</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Live Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/60 rounded-md p-4 font-mono text-xs text-white/80 h-[300px] overflow-y-auto space-y-2">
                {(logs ?? []).map((log) => (
                  <div key={log.id} className="flex gap-4">
                    <span className="text-white/40 shrink-0">{formatTime(log.timestamp)}</span>
                    <span className={`shrink-0 ${logColor(log.status)}`}>[{log.status.toUpperCase()}]</span>
                    <span className="break-all">{log.message}</span>
                  </div>
                ))}
                {(logs?.length ?? 0) === 0 && (
                  <p className="text-white/30">No log entries yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-white/60">Sent</span>
                <span className="text-green-400 font-medium">{sent}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-white/60">Failed</span>
                <span className="text-red-400 font-medium">{failed}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-white/60">Pending</span>
                <span className="text-yellow-400 font-medium">{pending}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-white font-medium">Total Generated</span>
                <span className="text-white font-bold">{total}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

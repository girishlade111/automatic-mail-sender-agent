"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pause, Square } from "lucide-react"

export default function CampaignProgress() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campaign Progress</h1>
          <p className="text-white/60">Monitoring sending queue and real-time logs.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
            <Pause className="w-4 h-4 mr-2" /> Pause
          </Button>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            <Square className="w-4 h-4 mr-2" /> Stop
          </Button>
        </div>
      </div>

      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              <span className="text-indigo-400 font-medium">Sending Active</span>
            </div>
            <span className="text-white font-medium">12 / 25 Sent</span>
          </div>
          
          <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[48%] transition-all duration-1000 ease-in-out"></div>
          </div>
          
          <div className="flex justify-between mt-4 text-xs text-white/50">
            <span>Next email in: 14 seconds</span>
            <span>Est. completion: 4 mins</span>
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
              <div className="bg-black/60 rounded-md p-4 font-mono text-xs text-white/80 h-[300px] overflow-y-auto space-y-3">
                <div className="flex gap-4">
                  <span className="text-white/40">10:42:01</span>
                  <span className="text-green-400">[SUCCESS]</span>
                  <span>Sent to john@abc.com</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-white/40">10:42:02</span>
                  <span className="text-blue-400">[INFO]</span>
                  <span>Waiting 20 seconds...</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-white/40">10:42:22</span>
                  <span className="text-yellow-400">[QUEUED]</span>
                  <span>Preparing email for sarah@techcorp.io</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-white/40">10:42:24</span>
                  <span className="text-green-400">[SUCCESS]</span>
                  <span>Sent to sarah@techcorp.io</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-white/40">10:42:25</span>
                  <span className="text-blue-400">[INFO]</span>
                  <span>Waiting 20 seconds...</span>
                </div>
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
                <span className="text-white/60">Success</span>
                <span className="text-green-400 font-medium">11</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-white/60">Failed</span>
                <span className="text-red-400 font-medium">1</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-white/60">Pending</span>
                <span className="text-yellow-400 font-medium">13</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-white font-medium">Total</span>
                <span className="text-white font-bold">25</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"
import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { FilePlus, Eye, Activity, Trash2, Copy, Edit2, BarChart3, Search } from "lucide-react"
import { useCampaigns, useDeleteCampaign, useDuplicateCampaign } from "@/lib/hooks"

export default function CampaignsList() {
  const { data: campaigns, isLoading, isError } = useCampaigns()
  const deleteCampaign = useDeleteCampaign()
  const duplicateCampaign = useDuplicateCampaign()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredCampaigns = useMemo(() => {
    let result = campaigns ?? []
    if (search) {
      const s = search.toLowerCase()
      result = result.filter((c) => c.name.toLowerCase().includes(s))
    }
    if (statusFilter && statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter)
    }
    return result
  }, [campaigns, search, statusFilter])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Campaigns</h1>
          <p className="text-white/60">All your outreach campaigns in one place.</p>
        </div>
        <Link href="/campaigns/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
            <FilePlus className="w-4 h-4 mr-2" /> New Campaign
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-44">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Generated">Generated</SelectItem>
              <SelectItem value="Sending">Sending</SelectItem>
              <SelectItem value="Paused">Paused</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Stopped">Stopped</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns ({filteredCampaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isError && <p className="text-red-400 text-sm">Could not load campaigns from the backend.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-white/70">{c.type}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-white/50 text-sm">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/campaigns/${c.id}/preview`}>
                        <Button variant="ghost" size="icon" title="Preview" className="h-8 w-8 text-white/50 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/campaigns/${c.id}/progress`}>
                        <Button variant="ghost" size="icon" title="Progress" className="h-8 w-8 text-white/50 hover:text-indigo-400">
                          <Activity className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/campaigns/${c.id}/analytics`}>
                        <Button variant="ghost" size="icon" title="Analytics" className="h-8 w-8 text-white/50 hover:text-purple-400">
                          <BarChart3 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/campaigns/${c.id}/edit`}>
                        <Button variant="ghost" size="icon" title="Edit" className="h-8 w-8 text-white/50 hover:text-yellow-400">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost" size="icon" title="Duplicate"
                        className="h-8 w-8 text-white/50 hover:text-green-400"
                        disabled={duplicateCampaign.isPending}
                        onClick={() => duplicateCampaign.mutate(c.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" title="Delete"
                        className="h-8 w-8 text-white/50 hover:text-red-400"
                        disabled={deleteCampaign.isPending}
                        onClick={() => deleteCampaign.mutate(c.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredCampaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/40 py-6">
                    {campaigns && campaigns.length > 0
                      ? "No campaigns match your filters."
                      : <>No campaigns yet. <Link href="/campaigns/create" className="text-indigo-400">Create your first campaign</Link>.</>
                    }
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

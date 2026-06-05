"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { FilePlus, Eye, Activity, Trash2 } from "lucide-react"
import { useCampaigns, useDeleteCampaign } from "@/lib/hooks"

export default function CampaignsList() {
  const { data: campaigns, isLoading, isError } = useCampaigns()
  const deleteCampaign = useDeleteCampaign()

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

      <Card>
        <CardHeader>
          <CardTitle>All Campaigns</CardTitle>
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
              {(campaigns ?? []).map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-white/70">{c.type}</TableCell>
                  <TableCell><StatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-white/50 text-sm">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
              {!isLoading && (campaigns?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-white/40 py-6">
                    No campaigns yet. <Link href="/campaigns/create" className="text-indigo-400">Create your first campaign</Link>.
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

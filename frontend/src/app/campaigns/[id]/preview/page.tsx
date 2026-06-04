"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Check, Edit2, RefreshCw, Send } from "lucide-react"
import Link from "next/link"
import { use } from "react"

export default function PreviewCampaign({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Preview & Approve</h1>
          <p className="text-white/60">Review AI-generated personalized emails before sending.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10">
            <RefreshCw className="w-4 h-4 mr-2" /> Regenerate All
          </Button>
          <Button className="bg-green-600 hover:bg-green-700 text-white border-0">
            <Check className="w-4 h-4 mr-2" /> Approve All
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generated Emails</CardTitle>
          <CardDescription>25 emails generated and pending approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead className="w-[40%]">Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <p className="font-medium">John Doe</p>
                  <p className="text-xs text-white/50">john@abc.com</p>
                </TableCell>
                <TableCell className="font-medium text-white/80">
                  Scaling ABC's engineering team with AI
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-semibold text-yellow-400">Pending Review</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-green-400">
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <p className="font-medium">Sarah Smith</p>
                  <p className="text-xs text-white/50">sarah@techcorp.io</p>
                </TableCell>
                <TableCell className="font-medium text-white/80">
                  TechCorp's recent Series B - Partnership opportunity
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5 text-xs font-semibold text-green-400">Approved</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-green-400">
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="flex justify-end pt-4">
        <Link href={`/campaigns/${resolvedParams.id}/progress`}>
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white shadow-lg shadow-indigo-500/20">
            <Send className="w-4 h-4 mr-2" /> Start Campaign Queue
          </Button>
        </Link>
      </div>
    </div>
  )
}

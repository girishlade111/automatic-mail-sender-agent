"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UploadCloud, ArrowRight } from "lucide-react"

export default function CreateCampaign() {
  const [file, setFile] = useState<File | null>(null)
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create New Campaign</h1>
        <p className="text-white/60">Upload your contacts and configure AI personalization settings.</p>
      </div>

      <form className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Basic information about your outreach campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input id="name" placeholder="e.g., Q3 Founder Outreach" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type</Label>
                <select id="type" className="flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30">
                  <option value="Cold Outreach" className="bg-slate-900">Cold Outreach</option>
                  <option value="Sales" className="bg-slate-900">Sales</option>
                  <option value="Recruitment" className="bg-slate-900">Recruitment</option>
                  <option value="Marketing" className="bg-slate-900">Marketing</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Personalization Engine</CardTitle>
            <CardDescription>Configure how NVIDIA NIM generates your emails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Custom Prompt Template</Label>
              <Textarea 
                id="prompt" 
                placeholder="Write a personalized email to {{name}} who works as {{role}} at {{company}}..."
                className="h-32"
                required
              />
              <p className="text-xs text-white/50">Available variables: {'{{name}}'}, {'{{company}}'}, {'{{role}}'}, {'{{industry}}'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <select id="tone" className="flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30">
                  <option value="Professional" className="bg-slate-900">Professional</option>
                  <option value="Friendly" className="bg-slate-900">Friendly</option>
                  <option value="Sales" className="bg-slate-900">Sales</option>
                  <option value="Startup" className="bg-slate-900">Startup</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="length">Length</Label>
                <select id="length" className="flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30">
                  <option value="Medium" className="bg-slate-900">Medium (~150 words)</option>
                  <option value="Short" className="bg-slate-900">Short (~50 words)</option>
                  <option value="Long" className="bg-slate-900">Long (~250 words)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input id="temperature" type="number" min="0.1" max="1.0" step="0.1" defaultValue="0.7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Source</CardTitle>
            <CardDescription>Upload CSV, Excel, PDF, or TXT containing recipient information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:bg-white/5 transition-colors cursor-pointer">
              <UploadCloud className="mx-auto h-12 w-12 text-white/40 mb-4" />
              <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-white/50">Supports .csv, .xlsx, .pdf, .txt (Max 25MB)</p>
              <input 
                type="file" 
                className="hidden" 
                id="file-upload" 
                accept=".csv,.xlsx,.xls,.pdf,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Button 
                variant="outline" 
                className="mt-6"
                type="button"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Select File
              </Button>
              {file && <p className="mt-4 text-green-400 text-sm font-medium">Selected: {file.name}</p>}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex justify-end pt-4">
          <Button size="lg" type="submit" className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white">
            Create & Process <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

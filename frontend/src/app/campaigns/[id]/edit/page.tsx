"use client"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, Plus, Trash2, Calendar } from "lucide-react"
import { useCampaign, useUpdateCampaign, useScheduleCampaign, useSetupABTest } from "@/lib/hooks"
import { useToast } from "@/components/toast-provider"
import type { CampaignUpdate, ABVariant } from "@/lib/types"

export default function EditCampaign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: campaign, isLoading } = useCampaign(id)
  const updateCampaign = useUpdateCampaign()
  const scheduleCampaign = useScheduleCampaign()
  const setupABTest = useSetupABTest()
  const { toast } = useToast()

  const [form, setForm] = useState<CampaignUpdate>({})
  const [initialized, setInitialized] = useState(false)
  const [scheduledAt, setScheduledAt] = useState<string>("")
  const [abVariants, setAbVariants] = useState<ABVariant[]>([])

  useEffect(() => {
    if (campaign && !initialized) {
      setForm({
        name: campaign.name,
        type: campaign.type,
        prompt_template: campaign.prompt_template ?? "",
        tone: campaign.tone ?? "Professional",
        length: campaign.length ?? "Medium",
        temperature: campaign.temperature,
        delay_seconds: campaign.delay_seconds,
      })
      // Load scheduled_at if present
      if (campaign.scheduled_at) {
        const dt = new Date(campaign.scheduled_at)
        const local = dt.toISOString().slice(0, 16)
        setScheduledAt(local)
      }
      // Load A/B variants if present
      if (campaign.ab_variants) {
        try {
          const parsed = JSON.parse(campaign.ab_variants)
          if (Array.isArray(parsed)) setAbVariants(parsed)
        } catch { /* ignore parse errors */ }
      }
      setInitialized(true)
    }
  }, [campaign, initialized])

  const addVariant = () => {
    setAbVariants([...abVariants, { label: `Variant ${String.fromCharCode(65 + abVariants.length)}`, prompt_template: "" }])
  }

  const removeVariant = (index: number) => {
    setAbVariants(abVariants.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof ABVariant, value: string) => {
    const updated = [...abVariants]
    updated[index] = { ...updated[index], [field]: value }
    setAbVariants(updated)
  }

  const handleSave = async () => {
    try {
      await updateCampaign.mutateAsync({ id: Number(id), payload: form })

      // Update scheduling
      if (scheduledAt) {
        await scheduleCampaign.mutateAsync({ campaignId: Number(id), payload: { scheduled_at: scheduledAt } })
      }

      // Update A/B variants
      if (abVariants.length >= 2) {
        await setupABTest.mutateAsync({ campaignId: Number(id), payload: { variants: abVariants } })
      }

      toast({ title: "Campaign updated", variant: "success" })
      router.push("/campaigns")
    } catch {
      toast({ title: "Failed to update campaign", variant: "error" })
    }
  }

  const selectClass =
    "flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Edit Campaign</h1>
        <p className="text-white/60">Update campaign settings and AI configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>Basic information about your outreach campaign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={form.name ?? ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Campaign Type</Label>
              <select
                id="type"
                className={selectClass}
                value={form.type ?? "Cold Outreach"}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="Cold Outreach" className="bg-slate-900">Cold Outreach</option>
                <option value="Sales" className="bg-slate-900">Sales</option>
                <option value="Recruitment" className="bg-slate-900">Recruitment</option>
                <option value="Marketing" className="bg-slate-900">Marketing</option>
                <option value="Custom" className="bg-slate-900">Custom</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delay_seconds">Delay Between Emails</Label>
              <select
                id="delay_seconds"
                className={selectClass}
                value={form.delay_seconds ?? 20}
                onChange={(e) => setForm({ ...form, delay_seconds: Number(e.target.value) })}
              >
                <option value={10} className="bg-slate-900">10 seconds</option>
                <option value={20} className="bg-slate-900">20 seconds</option>
                <option value={30} className="bg-slate-900">30 seconds</option>
                <option value={60} className="bg-slate-900">60 seconds</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scheduling */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            <CardTitle>Schedule Campaign</CardTitle>
          </div>
          <CardDescription>Optionally schedule this campaign for future sending.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="scheduled_at">Scheduled Send Date/Time</Label>
            <Input
              id="scheduled_at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-white/50">Leave empty to send manually. Set a future date to auto-schedule.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Personalization Engine</CardTitle>
          <CardDescription>Configure how the AI generates your emails.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Custom Prompt Template</Label>
            <Textarea
              id="prompt"
              className="h-32"
              value={form.prompt_template ?? ""}
              onChange={(e) => setForm({ ...form, prompt_template: e.target.value })}
              placeholder="Write a personalized email to {{name}} who works as {{role}} at {{company}}..."
            />
            <p className="text-xs text-white/50">
              Available variables: {"{{name}}"}, {"{{company}}"}, {"{{role}}"}, {"{{industry}}"}, {"{{city}}"}, {"{{country}}"}, {"{{website}}"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <select
                id="tone"
                className={selectClass}
                value={form.tone ?? "Professional"}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
              >
                <option value="Professional" className="bg-slate-900">Professional</option>
                <option value="Friendly" className="bg-slate-900">Friendly</option>
                <option value="Sales" className="bg-slate-900">Sales</option>
                <option value="Startup" className="bg-slate-900">Startup</option>
                <option value="Investor" className="bg-slate-900">Investor</option>
                <option value="Recruiter" className="bg-slate-900">Recruiter</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="length">Length</Label>
              <select
                id="length"
                className={selectClass}
                value={form.length ?? "Medium"}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
              >
                <option value="Short" className="bg-slate-900">Short (~50 words)</option>
                <option value="Medium" className="bg-slate-900">Medium (~150 words)</option>
                <option value="Long" className="bg-slate-900">Long (~250 words)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0.1"
                max="1.0"
                step="0.1"
                value={form.temperature ?? 0.7}
                onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* A/B Testing */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>A/B Testing (Optional)</CardTitle>
              <CardDescription>Add multiple prompt variants to test which performs best.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="w-4 h-4 mr-2" /> Add Variant
            </Button>
          </div>
        </CardHeader>
        {abVariants.length > 0 && (
          <CardContent className="space-y-4">
            {abVariants.map((variant, index) => (
              <div key={index} className="rounded-md bg-white/5 border border-white/10 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-1 flex-1 mr-4">
                    <Label>Variant Label</Label>
                    <Input
                      value={variant.label}
                      onChange={(e) => updateVariant(index, "label", e.target.value)}
                      placeholder="e.g., Variant A"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => removeVariant(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label>Prompt Template</Label>
                  <Textarea
                    value={variant.prompt_template}
                    onChange={(e) => updateVariant(index, "prompt_template", e.target.value)}
                    placeholder="Write a personalized email to {{name}}..."
                    className="h-24"
                  />
                </div>
              </div>
            ))}
            {abVariants.length < 2 && (
              <p className="text-xs text-yellow-400">Add at least 2 variants for A/B testing to be active.</p>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end pt-4">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={updateCampaign.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white"
        >
          {updateCampaign.isPending
            ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</>
            : <><Save className="mr-2 w-4 h-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  )
}

"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UploadCloud, ArrowRight, Loader2, Plus, Trash2, Calendar } from "lucide-react"
import { useCreateCampaign, useUploadContacts, useTemplates, useScheduleCampaign, useSetupABTest } from "@/lib/hooks"
import { useToast } from "@/components/toast-provider"
import type { ABVariant } from "@/lib/types"

interface FormValues {
  name: string
  type: string
  prompt_template: string
  tone: string
  length: string
  temperature: number
  delay_seconds: number
}

export default function CreateCampaign() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState<string>("")
  const [abVariants, setAbVariants] = useState<ABVariant[]>([])
  const createCampaign = useCreateCampaign()
  const uploadContacts = useUploadContacts()
  const scheduleCampaign = useScheduleCampaign()
  const setupABTest = useSetupABTest()
  const { data: templates } = useTemplates()
  const { toast } = useToast()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      type: "Cold Outreach",
      tone: "Professional",
      length: "Medium",
      temperature: 0.7,
      delay_seconds: 20,
    },
  })

  const submitting = createCampaign.isPending || uploadContacts.isPending

  const loadTemplate = (templateId: string) => {
    if (!templateId) return
    const tpl = (templates ?? []).find((t) => t.id === Number(templateId)) as Record<string, unknown> | undefined
    if (tpl) {
      if (tpl.prompt_template) setValue("prompt_template", tpl.prompt_template as string)
      if (tpl.tone) setValue("tone", (tpl.tone as string) ?? "Professional")
      if (tpl.length) setValue("length", (tpl.length as string) ?? "Medium")
      if (typeof tpl.temperature === "number") setValue("temperature", tpl.temperature)
      toast({ title: "Template loaded", description: tpl.name as string, variant: "info" })
    }
  }

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

  const onSubmit = async (values: FormValues) => {
    setError(null)
    if (!file) {
      setError("Please select a contacts file to upload.")
      return
    }
    try {
      const campaign = await createCampaign.mutateAsync({
        name: values.name,
        type: values.type,
        prompt_template: values.prompt_template,
        tone: values.tone,
        length: values.length,
        temperature: Number(values.temperature),
        delay_seconds: Number(values.delay_seconds),
      })
      await uploadContacts.mutateAsync({ campaignId: campaign.id, file })

      // Set up A/B test if variants are defined
      if (abVariants.length >= 2) {
        await setupABTest.mutateAsync({ campaignId: campaign.id, payload: { variants: abVariants } })
      }

      // Schedule if datetime is set
      if (scheduledAt) {
        await scheduleCampaign.mutateAsync({ campaignId: campaign.id, payload: { scheduled_at: scheduledAt } })
      }

      toast({ title: "Campaign created", variant: "success" })
      router.push(`/campaigns/${campaign.id}/preview`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong"
      setError(msg)
      toast({ title: "Failed to create campaign", variant: "error" })
    }
  }

  const selectClass =
    "flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Create New Campaign</h1>
        <p className="text-white/60">Upload your contacts and configure AI personalization settings.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Basic information about your outreach campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input id="name" placeholder="e.g., Q3 Founder Outreach" {...register("name", { required: true })} />
              {errors.name && <p className="text-xs text-red-400">Campaign name is required.</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Campaign Type</Label>
                <select id="type" className={selectClass} {...register("type")}>
                  <option value="Cold Outreach" className="bg-slate-900">Cold Outreach</option>
                  <option value="Sales" className="bg-slate-900">Sales</option>
                  <option value="Recruitment" className="bg-slate-900">Recruitment</option>
                  <option value="Marketing" className="bg-slate-900">Marketing</option>
                  <option value="Custom" className="bg-slate-900">Custom</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delay_seconds">Delay Between Emails</Label>
                <select id="delay_seconds" className={selectClass} {...register("delay_seconds")}>
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
              <p className="text-xs text-amber-400/80 mt-1">Note: Automatic execution of scheduled campaigns requires Celery Beat to be running. Without it, scheduled campaigns must be sent manually when the time arrives.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>AI Personalization Engine</CardTitle>
                <CardDescription>Configure how the AI generates your emails.</CardDescription>
              </div>
              {(templates ?? []).length > 0 && (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-white/50 whitespace-nowrap">Load Template:</Label>
                  <select
                    className={selectClass + " w-48"}
                    defaultValue=""
                    onChange={(e) => loadTemplate(e.target.value)}
                  >
                    <option value="" className="bg-slate-900">Select template...</option>
                    {(templates ?? []).map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-900">{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">Custom Prompt Template</Label>
              <Textarea
                id="prompt"
                placeholder="Write a personalized email to {{name}} who works as {{role}} at {{company}}..."
                className="h-32"
                {...register("prompt_template", { required: true })}
              />
              {errors.prompt_template && <p className="text-xs text-red-400">A prompt template is required.</p>}
              <p className="text-xs text-white/50">Available variables: {"{{name}}"}, {"{{company}}"}, {"{{role}}"}, {"{{industry}}"}, {"{{city}}"}, {"{{country}}"}, {"{{website}}"}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <select id="tone" className={selectClass} {...register("tone")}>
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
                <select id="length" className={selectClass} {...register("length")}>
                  <option value="Medium" className="bg-slate-900">Medium (~150 words)</option>
                  <option value="Short" className="bg-slate-900">Short (~50 words)</option>
                  <option value="Long" className="bg-slate-900">Long (~250 words)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input id="temperature" type="number" min="0.1" max="1.0" step="0.1" {...register("temperature")} />
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

        <Card>
          <CardHeader>
            <CardTitle>Data Source</CardTitle>
            <CardDescription>Upload CSV, Excel, PDF, or TXT containing recipient information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:bg-white/5 transition-colors">
              <UploadCloud className="mx-auto h-12 w-12 text-white/40 mb-4" />
              <p className="text-white font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-white/50">Supports .csv, .xlsx, .xls, .pdf, .txt (Max 25MB)</p>
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

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex justify-end pt-4">
          <Button size="lg" type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 border-0 text-white">
            {submitting ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Processing...</> : <>Create &amp; Process <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>
        </div>
      </form>
    </div>
  )
}

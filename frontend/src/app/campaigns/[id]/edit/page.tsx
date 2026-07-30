"use client"
import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import { useCampaign, useUpdateCampaign } from "@/lib/hooks"
import type { CampaignUpdate } from "@/lib/types"

export default function EditCampaign({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const { data: campaign, isLoading } = useCampaign(id)
  const updateCampaign = useUpdateCampaign()

  const [name, setName] = useState("")
  const [promptTemplate, setPromptTemplate] = useState("")
  const [tone, setTone] = useState("")
  const [length, setLength] = useState("")
  const [temperature, setTemperature] = useState("0.7")
  const [delaySeconds, setDelaySeconds] = useState("5")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (campaign) {
      setName(campaign.name)
      setPromptTemplate(campaign.prompt_template ?? "")
      setTone(campaign.tone ?? "professional")
      setLength(campaign.length ?? "medium")
      setTemperature(String(campaign.temperature))
      setDelaySeconds(String(campaign.delay_seconds))
    }
  }, [campaign])

  const canEdit = campaign && (campaign.status === "Draft" || campaign.status === "Generated")

  const onSave = async () => {
    setError(null)
    const payload: CampaignUpdate = {
      name,
      prompt_template: promptTemplate || undefined,
      tone: tone || undefined,
      length: length || undefined,
      temperature: parseFloat(temperature),
      delay_seconds: parseInt(delaySeconds),
    }
    try {
      await updateCampaign.mutateAsync({ id: Number(id), payload })
      router.push("/campaigns")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update campaign")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Edit Campaign</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-white/60">
              This campaign cannot be edited because it is in &quot;{campaign?.status}&quot; status.
              Only campaigns in Draft or Generated status can be modified.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/campaigns")}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")} className="text-white/50 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Edit Campaign</h1>
          <p className="text-white/60">Modify campaign settings and AI generation parameters.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Settings</CardTitle>
          <CardDescription>Update name, prompt, and generation parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Campaign Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-prompt">Prompt Template</Label>
            <Textarea
              id="edit-prompt"
              className="h-32"
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              placeholder="Write a personalized email to {{name}} at {{company}}..."
            />
            <p className="text-xs text-white/40">Use {"{{variable}}"} placeholders for personalization.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Length</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-temp">Temperature (0.0 - 1.0)</Label>
              <Input
                id="edit-temp"
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
              <p className="text-xs text-white/40">Higher = more creative, lower = more consistent.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-delay">Delay Between Sends (seconds)</Label>
              <Input
                id="edit-delay"
                type="number"
                min="1"
                max="300"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(e.target.value)}
              />
              <p className="text-xs text-white/40">Time to wait between sending each email.</p>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button variant="outline" onClick={() => router.push("/campaigns")}>Cancel</Button>
            <Button
              onClick={onSave}
              disabled={updateCampaign.isPending || !name}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {updateCampaign.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

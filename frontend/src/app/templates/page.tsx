"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/lib/hooks"
import { useToast } from "@/components/toast-provider"
import type { Template, TemplateCreate } from "@/lib/types"

const emptyForm: TemplateCreate = {
  name: "",
  description: "",
  prompt_template: "",
  tone: "Professional",
  length: "Medium",
  temperature: 0.7,
}

export default function TemplatesPage() {
  const { data: templates, isLoading, isError } = useTemplates()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()
  const { toast } = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TemplateCreate>(emptyForm)

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (t: Template) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      description: t.description ?? "",
      prompt_template: t.prompt_template,
      tone: t.tone ?? "Professional",
      length: t.length ?? "Medium",
      temperature: t.temperature,
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateTemplate.mutateAsync({ id: editingId, payload: form })
        toast({ title: "Template updated", variant: "success" })
      } else {
        await createTemplate.mutateAsync(form)
        toast({ title: "Template created", variant: "success" })
      }
      setDialogOpen(false)
    } catch {
      toast({ title: "Failed to save template", variant: "error" })
    }
  }

  const handleDelete = (id: number) => {
    deleteTemplate.mutate(id, {
      onSuccess: () => toast({ title: "Template deleted", variant: "success" }),
      onError: () => toast({ title: "Failed to delete template", variant: "error" }),
    })
  }

  const selectClass =
    "flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"

  const saving = createTemplate.isPending || updateTemplate.isPending

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Templates</h1>
          <p className="text-white/60">Manage reusable prompt templates for campaign emails.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>Save and reuse AI settings across campaigns.</CardDescription>
        </CardHeader>
        <CardContent>
          {isError && <p className="text-red-400 text-sm">Could not load templates.</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tone</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Temp</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(templates ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium">{t.name}</p>
                    {t.description && <p className="text-xs text-white/50 mt-0.5">{t.description}</p>}
                  </TableCell>
                  <TableCell className="text-white/70">{t.tone ?? "---"}</TableCell>
                  <TableCell className="text-white/70">{t.length ?? "---"}</TableCell>
                  <TableCell className="text-white/70">{t.temperature}</TableCell>
                  <TableCell className="text-white/50 text-sm">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost" size="icon" title="Edit"
                        className="h-8 w-8 text-white/50 hover:text-white"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" title="Delete"
                        className="h-8 w-8 text-white/50 hover:text-red-400"
                        disabled={deleteTemplate.isPending}
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (templates ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/40 py-6">
                    No templates yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update your prompt template settings." : "Save AI settings as a reusable template."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tpl-name">Name</Label>
              <Input
                id="tpl-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Friendly Sales Intro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Description</Label>
              <Input
                id="tpl-desc"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-prompt">Prompt Template</Label>
              <Textarea
                id="tpl-prompt"
                className="h-32"
                value={form.prompt_template}
                onChange={(e) => setForm({ ...form, prompt_template: e.target.value })}
                placeholder="Write a personalized email to {{name}} at {{company}}..."
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tpl-tone">Tone</Label>
                <select
                  id="tpl-tone"
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
                <Label htmlFor="tpl-length">Length</Label>
                <select
                  id="tpl-length"
                  className={selectClass}
                  value={form.length ?? "Medium"}
                  onChange={(e) => setForm({ ...form, length: e.target.value })}
                >
                  <option value="Short" className="bg-slate-900">Short</option>
                  <option value="Medium" className="bg-slate-900">Medium</option>
                  <option value="Long" className="bg-slate-900">Long</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-temp">Temperature</Label>
                <Input
                  id="tpl-temp"
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !form.prompt_template}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

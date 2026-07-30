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
import { Plus, Edit2, Trash2, Loader2, FileText } from "lucide-react"
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from "@/lib/hooks"
import type { EmailTemplate, EmailTemplateCreate } from "@/lib/types"

export default function TemplatesPage() {
  const { data: templates, isLoading, isError } = useTemplates()
  const createTemplate = useCreateTemplate()
  const updateTemplate = useUpdateTemplate()
  const deleteTemplate = useDeleteTemplate()

  const [showDialog, setShowDialog] = useState(false)
  const [editing, setEditing] = useState<EmailTemplate | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [subjectTemplate, setSubjectTemplate] = useState("")
  const [bodyTemplate, setBodyTemplate] = useState("")

  const openCreate = () => {
    setEditing(null)
    setName("")
    setDescription("")
    setCategory("")
    setSubjectTemplate("")
    setBodyTemplate("")
    setShowDialog(true)
  }

  const openEdit = (t: EmailTemplate) => {
    setEditing(t)
    setName(t.name)
    setDescription(t.description ?? "")
    setCategory(t.category ?? "")
    setSubjectTemplate(t.subject_template)
    setBodyTemplate(t.body_template)
    setShowDialog(true)
  }

  const onSave = async () => {
    if (editing) {
      await updateTemplate.mutateAsync({
        id: editing.id,
        payload: {
          name,
          description: description || undefined,
          category: category || undefined,
          subject_template: subjectTemplate,
          body_template: bodyTemplate,
        },
      })
    } else {
      const payload: EmailTemplateCreate = {
        name,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
      }
      if (description) payload.description = description
      if (category) payload.category = category
      await createTemplate.mutateAsync(payload)
    }
    setShowDialog(false)
  }

  const isSaving = createTemplate.isPending || updateTemplate.isPending

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Email Templates</h1>
          <p className="text-white/60">Manage reusable email templates for your campaigns.</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Templates</CardTitle>
          <CardDescription>
            Available variables: {"{{name}}"}, {"{{company}}"}, {"{{role}}"}, {"{{industry}}"}, {"{{city}}"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError && <p className="text-red-400 text-sm">Could not load templates.</p>}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          )}
          {!isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(templates ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <span className="font-medium">{t.name}</span>
                      </div>
                      {t.description && (
                        <p className="text-xs text-white/40 mt-1">{t.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-white/60">{t.category || "-"}</TableCell>
                    <TableCell className="text-white/70 max-w-xs truncate">{t.subject_template}</TableCell>
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
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" title="Delete"
                          className="h-8 w-8 text-white/50 hover:text-red-400"
                          disabled={deleteTemplate.isPending}
                          onClick={() => deleteTemplate.mutate(t.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(templates?.length ?? 0) === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-white/40 py-6">
                      No templates yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              Use {"{{variable}}"} placeholders for personalization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tpl-name">Name</Label>
                <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Follow-up template" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl-category">Category</Label>
                <Input id="tpl-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Sales, Marketing, etc." />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-desc">Description</Label>
              <Input id="tpl-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-subject">Subject Template</Label>
              <Input id="tpl-subject" value={subjectTemplate} onChange={(e) => setSubjectTemplate(e.target.value)} placeholder="Re: {{company}} partnership" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-body">Body Template</Label>
              <Textarea
                id="tpl-body"
                className="h-40"
                value={bodyTemplate}
                onChange={(e) => setBodyTemplate(e.target.value)}
                placeholder={"Hi {{name}},\n\nI noticed your work at {{company}}..."}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onClick={onSave}
              disabled={isSaving || !name || !subjectTemplate || !bodyTemplate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
            >
              {isSaving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

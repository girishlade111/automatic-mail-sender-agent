"use client"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, Mail, CheckCircle2, Loader2 } from "lucide-react"
import {
  useGmailAccounts, useAddGmailAccount, useTestGmailAccount, useDeleteGmailAccount,
} from "@/lib/hooks"

export default function Settings() {
  const { data: accounts, isLoading } = useGmailAccounts()
  const addAccount = useAddGmailAccount()
  const testAccount = useTestGmailAccount()
  const deleteAccount = useDeleteGmailAccount()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: number; ok: boolean; message: string } | null>(null)

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!email || !password) {
      setFormError("Both Gmail address and app password are required.")
      return
    }
    try {
      await addAccount.mutateAsync({ email, app_password: password })
      setEmail("")
      setPassword("")
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save account")
    }
  }

  const onTest = async (id: number) => {
    setTestResult(null)
    const res = await testAccount.mutateAsync(id)
    setTestResult({ id, ...res })
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h1>
        <p className="text-white/60">Manage your connected accounts and application preferences.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              <CardTitle>Gmail Integration</CardTitle>
            </div>
            <CardDescription>Connect your Gmail account using an App Password to send emails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading && <p className="text-white/50 text-sm">Loading accounts…</p>}

            {(accounts ?? []).map((acc) => (
              <div key={acc.id} className="rounded-md bg-white/5 border border-white/10 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{acc.email}</p>
                    <p className="text-xs text-white/50">
                      {testResult?.id === acc.id
                        ? <span className={testResult.ok ? "text-green-400" : "text-red-400"}>{testResult.message}</span>
                        : "App Password stored (encrypted)"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary" size="sm"
                    disabled={testAccount.isPending}
                    onClick={() => onTest(acc.id)}
                  >
                    {testAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Test"}
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                    disabled={deleteAccount.isPending}
                    onClick={() => deleteAccount.mutate(acc.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}

            {!isLoading && (accounts?.length ?? 0) === 0 && (
              <p className="text-white/40 text-sm">No Gmail accounts connected yet.</p>
            )}

            <form className="space-y-4 pt-4 border-t border-white/10" onSubmit={onAdd}>
              <h4 className="text-sm font-medium text-white mb-4">Connect New Account</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Gmail Address</Label>
                  <Input id="email" type="email" placeholder="you@gmail.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">App Password</Label>
                  <Input id="password" type="password" placeholder="16-character app password"
                    value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="text-xs text-white/40">Stored securely with encryption.</p>
                </div>
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={addAccount.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                  {addAccount.isPending ? "Saving…" : "Save Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-400" />
              <CardTitle>NVIDIA NIM Configuration</CardTitle>
            </div>
            <CardDescription>Configure your NVIDIA NIM API keys for AI generation. Managed in environment variables.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" type="password" value="********************************" readOnly className="bg-black/40 text-white/50" />
              <p className="text-xs text-white/40">This key is loaded from the backend environment variables (NVIDIA_NIM_API_KEY).</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

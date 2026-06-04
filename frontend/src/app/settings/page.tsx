"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { KeyRound, Mail, CheckCircle2 } from "lucide-react"

export default function Settings() {
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
            <div className="rounded-md bg-white/5 border border-white/10 p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-white">Connected as user@gmail.com</p>
                  <p className="text-xs text-white/50">App Password active</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300">Disconnect</Button>
            </div>
            
            <form className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-white mb-4">Connect New Account</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Gmail Address</Label>
                  <Input id="email" type="email" placeholder="you@gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">App Password</Label>
                  <Input id="password" type="password" placeholder="16-character app password" />
                  <p className="text-xs text-white/40">Stored securely with encryption.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary">Test Connection</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white border-0">Save Account</Button>
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
            <CardDescription>Configure your NVIDIA NIM API keys for AI generation. Usually managed in environment variables.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input id="api_key" type="password" value="********************************" readOnly className="bg-black/40 text-white/50" />
              <p className="text-xs text-white/40">This key is loaded from the backend environment variables.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

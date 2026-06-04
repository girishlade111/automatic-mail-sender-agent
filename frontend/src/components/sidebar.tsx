import Link from "next/link"
import { LayoutDashboard, Megaphone, FilePlus, Settings as SettingsIcon, User as UserIcon } from "lucide-react"

export function Sidebar() {
  return (
    <div className="w-64 border-r border-white/10 bg-black/40 p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        Outreach AI
      </div>
      
      <nav className="flex flex-col gap-2 flex-1 mt-6">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors">
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </Link>
        <Link href="/campaigns/create" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors">
          <FilePlus className="w-4 h-4" /> New Campaign
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors">
          <SettingsIcon className="w-4 h-4" /> Settings
        </Link>
        <Link href="/profile" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors mt-auto">
          <UserIcon className="w-4 h-4" /> Profile
        </Link>
      </nav>
    </div>
  )
}

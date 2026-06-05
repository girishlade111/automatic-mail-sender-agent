"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard, Megaphone, FilePlus, Megaphone as CampaignIcon,
  ScrollText, Settings as SettingsIcon, User as UserIcon,
} from "lucide-react"

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/campaigns", label: "Campaigns", icon: CampaignIcon, exact: true },
  { href: "/campaigns/create", label: "New Campaign", icon: FilePlus, exact: true },
  { href: "/logs", label: "Logs", icon: ScrollText, exact: false },
  { href: "/settings", label: "Settings", icon: SettingsIcon, exact: false },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  return (
    <div className="w-64 border-r border-white/10 bg-black/40 p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3 text-white font-bold text-xl tracking-tight">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
          <Megaphone className="w-4 h-4 text-white" />
        </div>
        Outreach AI
      </div>

      <nav className="flex flex-col gap-2 flex-1 mt-6">
        {NAV.map(({ href, label, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
              isActive(href, exact)
                ? "bg-white/10 text-white"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </Link>
        ))}

        <Link
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors mt-auto",
            pathname === "/profile"
              ? "bg-white/10 text-white"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          )}
        >
          <UserIcon className="w-4 h-4" /> Profile
        </Link>
      </nav>
    </div>
  )
}

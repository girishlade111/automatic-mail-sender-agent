import { cn } from "@/lib/utils"

// Maps backend status strings (campaign + email + log) to badge colors.
const STATUS_STYLES: Record<string, string> = {
  // Positive / done
  Completed: "border-green-500/20 bg-green-500/10 text-green-400",
  Sent: "border-green-500/20 bg-green-500/10 text-green-400",
  Approved: "border-green-500/20 bg-green-500/10 text-green-400",
  Valid: "border-green-500/20 bg-green-500/10 text-green-400",
  // Active
  Sending: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  Generating: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  Generated: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  Queued: "border-blue-500/20 bg-blue-500/10 text-blue-400",
  // Waiting / neutral
  Draft: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  Pending: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  Paused: "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  Scheduled: "border-purple-500/20 bg-purple-500/10 text-purple-400",
  RateLimited: "border-orange-500/20 bg-orange-500/10 text-orange-400",
  // Negative
  Failed: "border-red-500/20 bg-red-500/10 text-red-400",
  Invalid: "border-red-500/20 bg-red-500/10 text-red-400",
  Stopped: "border-red-500/20 bg-red-500/10 text-red-400",
  Rejected: "border-red-500/20 bg-red-500/10 text-red-400",
}

const FALLBACK = "border-white/20 bg-white/10 text-white/70"

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = STATUS_STYLES[status] ?? FALLBACK
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        style,
        className
      )}
    >
      {status}
    </span>
  )
}

"use client"

import { useEffect } from "react"
import { cn } from "@/lib/utils"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

export type ToastVariant = "success" | "error" | "info"

export interface ToastData {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastItemProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const variantStyles: Record<ToastVariant, string> = {
  success: "border-green-500/30 bg-green-500/10 text-green-300",
  error: "border-red-500/30 bg-red-500/10 text-red-300",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-300",
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />,
  error: <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />,
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-300",
        variantStyles[toast.variant]
      )}
    >
      {variantIcons[toast.variant]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="text-xs mt-0.5 opacity-80">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastData[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

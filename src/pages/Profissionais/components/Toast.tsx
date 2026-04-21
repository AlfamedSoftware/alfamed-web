import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, X } from "lucide-react"

export type ToastType = "success" | "error"

export interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastItemProps {
    toast: Toast
    onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(toast.id), 4000)
        return () => clearTimeout(timer)
    }, [toast.id, onDismiss])

    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium",
                "animate-in slide-in-from-right-5 fade-in-0 duration-300",
                toast.type === "success"
                    ? "bg-white border border-green-200 text-green-800"
                    : "bg-white border border-red-200 text-red-800",
            )}
        >
            {toast.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}

interface ToastContainerProps {
    toasts: Toast[]
    onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    if (toasts.length === 0) return null
    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    )
}

let idCounter = 0
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: ToastType = "success") => {
        const id = String(++idCounter)
        setToasts((prev) => [...prev, { id, message, type }])
    }, [])

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const toast = {
        success: (message: string) => addToast(message, "success"),
        error: (message: string) => addToast(message, "error"),
    }

    return { toasts, dismiss, toast }
}

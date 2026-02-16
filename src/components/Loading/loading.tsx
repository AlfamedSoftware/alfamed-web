import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
    message?: string
    fullScreen?: boolean
    size?: "sm" | "md" | "lg"
    className?: string
}

const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
}

export function Loading({
    message = "Carregando...",
    fullScreen = false,
    size = "md",
    className
}: LoadingProps) {
    const content = (
        <div className={cn("text-center", className)}>
            <Loader2 className={cn("animate-spin text-primary mx-auto", sizeClasses[size])} />
            {message && <p className="mt-4 font-medium text-muted-foreground">{message}</p>}
        </div>
    )

    if (fullScreen) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                {content}
            </div>
        )
    }

    return content
}

import type { ReactNode } from "react"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// --- BackButton ---

interface BackButtonProps {
    onClick: () => void
    children?: ReactNode
}

export function BackButton({ onClick, children = "Voltar" }: BackButtonProps) {
    return (
        <Button type="button" variant="outline" size="lg" onClick={onClick} className="cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            {children}
        </Button>
    )
}

// --- SaveButton ---

interface SaveButtonProps {
    isSaving?: boolean
    disabled?: boolean
    label?: string
    savingLabel?: string
    className?: string
    type?: "submit" | "button" | "reset"
    onClick?: () => void
    icon?: ReactNode
}

export function SaveButton({
    isSaving = false,
    disabled,
    label = "Salvar",
    savingLabel = "Salvando...",
    className,
    type = "submit",
    onClick,
    icon,
}: SaveButtonProps) {
    return (
        <Button
            type={type}
            size="lg"
            disabled={isSaving || disabled}
            onClick={onClick}
            className={cn("cursor-pointer", className)}
        >
            {isSaving
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : (icon ?? <Save className="h-4 w-4" />)
            }
            {isSaving ? savingLabel : label}
        </Button>
    )
}

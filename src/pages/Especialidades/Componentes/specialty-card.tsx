import { useNavigate } from "react-router"

import { cn } from "@/lib/utils"
import type { SpecialtyUnitFullData } from "@/Servicos/specialties.service"

interface SpecialtyCardProps {
    specialty: SpecialtyUnitFullData
    onClick?: (id: string) => void
}

export function SpecialtyCard({ specialty, onClick }: SpecialtyCardProps) {
    const navigate = useNavigate()
    const { id, name, isActive } = specialty
    const displayName = name || "Especialidade"

    const handleClick = () => {
        if (onClick) {
            onClick(id)
            return
        }

        navigate(`/especialidades/${id}`)
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                "group flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm",
                "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <h3 className="min-w-0 truncate text-sm font-semibold text-foreground" title={displayName}>
                    {displayName}
                </h3>

                <span
                    className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                        isActive
                            ? "border border-green-200 bg-green-50 text-green-700"
                            : "border border-border bg-popover text-muted-foreground",
                    )}
                >
                    <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-green-500" : "bg-muted-foreground")} />
                    {isActive ? "Ativo" : "Inativo"}
                </span>
            </div>
        </button>
    )
}
import { Banknote, ClipboardList, FileText } from "lucide-react"
import { useNavigate } from "react-router"

import { cn } from "@/lib/utils"
import type { ProcedureUnitFullData } from "@/Servicos/procedures.service"

interface ProcedureCardProps {
    procedure: ProcedureUnitFullData
    onClick?: (id: string) => void
}

function formatCurrency(value: string): string {
    const numeric = Number(value.replace(/[^\d,.-]/g, "").replace(",", "."))
    if (!Number.isFinite(numeric)) {
        return value
    }

    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(numeric)
}

export function ProcedureCard({ procedure, onClick }: ProcedureCardProps) {
    const navigate = useNavigate()
    const { id, description, observation, code, price, isActive } = procedure

    const handleClick = () => {
        if (onClick) {
            onClick(id)
            return
        }

        navigate(`/procedimentos/${id}`)
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
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <ClipboardList className="h-3.5 w-3.5" />
                        {code}
                    </div>
                    <h3 className="truncate text-sm font-semibold text-foreground" title={description}>
                        {description}
                    </h3>
                </div>

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

            <div className="mb-4 border-t border-border" />

            <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Banknote className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{formatCurrency(price)}</span>
                </div>

                <div className="flex items-start gap-2 text-muted-foreground">
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p className="line-clamp-2 text-xs leading-5">{observation?.trim() || "Sem observações"}</p>
                </div>
            </div>
        </button>
    )
}
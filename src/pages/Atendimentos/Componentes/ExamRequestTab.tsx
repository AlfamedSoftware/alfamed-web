import { useEffect, useState } from "react"
import { Check, Lock, Microscope } from "lucide-react"

import { cn } from "@/lib/utils"
import { proceduresService, type ProcedureUnitFullData } from "@/services/procedures.service"

// Tipo "Exame" no cadastro de procedimentos
const EXAM_PROCEDURE_TYPE = 3

interface ExamRequestTabProps {
    unitId: string | null
    isStarted: boolean
    isFinished: boolean
    selectedIds: string[]
    onChange: (ids: string[]) => void
}

function CenteredMessage({ Icon, title, description }: { Icon: React.ElementType; title: string; description?: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">{title}</p>
                {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
            </div>
        </div>
    )
}

function ExamCard({
    procedure,
    selected,
    onToggle,
}: {
    procedure: ProcedureUnitFullData
    selected: boolean
    onToggle: (id: string) => void
}) {
    return (
        <button
            type="button"
            onClick={() => onToggle(procedure.id)}
            aria-pressed={selected}
            className={cn(
                "group flex items-center justify-between rounded-xl border p-4 text-left shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.98]",
                selected
                    ? "border-primary bg-primary/10 text-primary dark:bg-primary/25 dark:text-primary-foreground font-medium"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:shadow-xs",
            )}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                    selected
                        ? "bg-primary/20 text-primary dark:text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                )}>
                    <Microscope className="size-4" />
                </div>
                <span className="truncate text-sm font-semibold" title={procedure.description}>
                    {procedure.description}
                </span>
            </div>
            {selected && (
                <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3 stroke-[3]" />
                </div>
            )}
        </button>
    )
}

export function ExamRequestTab({ unitId, isStarted, isFinished, selectedIds, onChange }: ExamRequestTabProps) {
    const [procedures, setProcedures] = useState<ProcedureUnitFullData[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canSelect = isStarted && !isFinished

    useEffect(() => {
        if (!canSelect || !unitId) return
        let cancelled = false
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true)
        setError(null)
        proceduresService
            .listByUnit(unitId, { type: EXAM_PROCEDURE_TYPE, isActive: true })
            .then((data) => { if (!cancelled) setProcedures(data) })
            .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar exames") })
            .finally(() => { if (!cancelled) setIsLoading(false) })
        return () => { cancelled = true }
    }, [canSelect, unitId])

    if (!canSelect) {
        return <CenteredMessage Icon={Lock} title="Inicie o atendimento para solicitar exames." />
    }

    if (isLoading) {
        return <CenteredMessage Icon={Microscope} title="Carregando exames..." />
    }

    if (error) {
        return <CenteredMessage Icon={Microscope} title="Não foi possível carregar os exames" description={error} />
    }

    if (procedures.length === 0) {
        return (
            <CenteredMessage
                Icon={Microscope}
                title="Nenhum exame disponível"
                description="Cadastre procedimentos do tipo Exame para solicitá-los aqui."
            />
        )
    }

    const toggle = (id: string) => {
        onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {procedures.map((procedure) => (
                <ExamCard
                    key={procedure.id}
                    procedure={procedure}
                    selected={selectedIds.includes(procedure.id)}
                    onToggle={toggle}
                />
            ))}
        </div>
    )
}

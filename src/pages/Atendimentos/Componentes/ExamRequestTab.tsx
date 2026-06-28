import { useEffect, useState } from "react"
import { Check, Lock, Microscope } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { proceduresService, type ProcedureUnitFullData } from "@/services/procedures.service"
import { requestsService, type ExamRequestItem } from "@/services/requests.service"

// Tipo "Exame" no cadastro de procedimentos
const EXAM_PROCEDURE_TYPE = 3

const GRID_CLASS = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"

interface ExamRequestTabProps {
    appointmentId: string
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
            title={procedure.description}
            className={cn(
                "group flex items-center gap-3 rounded-xl border p-3.5 text-left transition-all duration-150 cursor-pointer active:scale-[0.98]",
                selected
                    ? "border-primary bg-primary/10 dark:bg-primary/20 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
            )}
        >
            <span
                className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground",
                )}
            >
                <Microscope className="size-4" />
            </span>

            <span
                className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    selected ? "font-semibold text-primary dark:text-primary-foreground" : "font-medium text-foreground",
                )}
            >
                {procedure.description}
            </span>

            <span
                className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                    selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-transparent group-hover:border-primary/40",
                )}
            >
                <Check className="size-3 stroke-[3]" />
            </span>
        </button>
    )
}

function SavedExamCard({ item }: { item: ExamRequestItem }) {
    const tag = item.kind === "internal" ? (item.statusDescription ?? "Interno") : "Externo"
    return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Microscope className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground" title={item.description}>
                {item.description}
            </span>
            <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {tag}
            </span>
        </div>
    )
}

function LoadingGrid() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <Skeleton variant="text" size="sm" className="w-44" />
                <Skeleton variant="text" size="sm" className="w-24" />
            </div>
            <div className={GRID_CLASS}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
            </div>
        </div>
    )
}

export function ExamRequestTab({ appointmentId, unitId, isStarted, isFinished, selectedIds, onChange }: ExamRequestTabProps) {
    const [procedures, setProcedures] = useState<ProcedureUnitFullData[]>([])
    const [saved, setSaved] = useState<ExamRequestItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canSelect = isStarted && !isFinished

    // Atendimento em andamento: carrega exames disponíveis para seleção.
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

    // Atendimento finalizado: carrega os exames que foram solicitados.
    useEffect(() => {
        if (!isFinished) return
        let cancelled = false
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsLoading(true)
        setError(null)
        requestsService
            .listByAppointment(appointmentId)
            .then((data) => { if (!cancelled) setSaved(data) })
            .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar exames solicitados") })
            .finally(() => { if (!cancelled) setIsLoading(false) })
        return () => { cancelled = true }
    }, [isFinished, appointmentId])

    // ─── Atendimento finalizado: lista somente leitura ───
    if (isFinished) {
        if (isLoading) return <LoadingGrid />
        if (error) return <CenteredMessage Icon={Microscope} title="Não foi possível carregar os exames" description={error} />
        if (saved.length === 0) {
            return <CenteredMessage Icon={Microscope} title="Nenhum exame foi adicionado neste atendimento." />
        }
        return (
            <div className="flex flex-col gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">Exames solicitados</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {saved.length} {saved.length === 1 ? "exame solicitado" : "exames solicitados"} neste atendimento.
                    </p>
                </div>
                <div className={GRID_CLASS}>
                    {saved.map((item) => <SavedExamCard key={item.id} item={item} />)}
                </div>
            </div>
        )
    }

    // ─── Atendimento não iniciado ───
    if (!canSelect) {
        return <CenteredMessage Icon={Lock} title="Inicie o atendimento para solicitar exames." />
    }

    // ─── Atendimento em andamento: seleção ───
    if (isLoading) return <LoadingGrid />
    if (error) return <CenteredMessage Icon={Microscope} title="Não foi possível carregar os exames" description={error} />
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

    const selectedCount = procedures.filter((p) => selectedIds.includes(p.id)).length

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Solicitação de exames</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Selecione os exames a solicitar para o paciente.
                    </p>
                </div>
                <span
                    className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                        selectedCount > 0
                            ? "bg-primary/10 text-primary dark:text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                    )}
                >
                    {selectedCount} {selectedCount === 1 ? "selecionado" : "selecionados"}
                </span>
            </div>

            <div className={GRID_CLASS}>
                {procedures.map((procedure) => (
                    <ExamCard
                        key={procedure.id}
                        procedure={procedure}
                        selected={selectedIds.includes(procedure.id)}
                        onToggle={toggle}
                    />
                ))}
            </div>
        </div>
    )
}

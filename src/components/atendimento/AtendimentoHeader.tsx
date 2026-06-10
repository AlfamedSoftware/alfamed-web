import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AttendanceScheduleDetails } from "@/services/attendance.service"
import { cn } from "@/lib/utils"
import { getStatusClass, getStatusLabel } from "./status"

type AtendimentoHeaderProps = {
    schedule: AttendanceScheduleDetails
    age: number
    onBack: () => void
    onStart: () => void
    onFinish: () => void
    isUpdating?: boolean
}

function formatGender(value: string | null) {
    if (!value) return "Genero nao informado"
    return value
}

export function AtendimentoHeader({ schedule, age, onBack, onStart, onFinish, isUpdating }: AtendimentoHeaderProps) {
    const canStart = schedule.status === "scheduled"
    const canFinish = schedule.status === "in_progress"

    return (
        <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                    <Button type="button" variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="size-4" />
                        Voltar
                    </Button>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-semibold text-foreground">{schedule.patient.name}</h1>
                        <p className="text-sm text-muted-foreground">{age} anos · {formatGender(schedule.patient.gender)}</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", getStatusClass(schedule.status))}>
                        {getStatusLabel(schedule.status)}
                    </span>
                    {canStart ? (
                        <Button type="button" size="sm" onClick={onStart} disabled={isUpdating}>
                            <PlayCircle className="size-4" />
                            Iniciar Atendimento
                        </Button>
                    ) : null}
                    {canFinish ? (
                        <Button type="button" size="sm" onClick={onFinish} disabled={isUpdating}>
                            <CheckCircle2 className="size-4" />
                            Finalizar
                        </Button>
                    ) : null}
                </div>
            </div>
        </header>
    )
}

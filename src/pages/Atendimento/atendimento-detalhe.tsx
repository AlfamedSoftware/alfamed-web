import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAttendanceSchedule } from "@/hooks/useAttendanceSchedule"
import { useUpdateScheduleStatus } from "@/hooks/useUpdateScheduleStatus"
import { AtendimentoHeader } from "@/components/atendimento/AtendimentoHeader"
import { AtendimentoTabs } from "@/components/atendimento/AtendimentoTabs"

function calculateAge(birthDate: string) {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1
    }

    return age
}

export function AtendimentoDetalhe() {
    const { scheduleId } = useParams()
    const navigate = useNavigate()
    const { schedule, isLoading, error, refetch } = useAttendanceSchedule(scheduleId)
    const { updateStatus, isUpdating, error: updateError } = useUpdateScheduleStatus()
    const [complaintsOpen, setComplaintsOpen] = useState(true)

    const handleUpdateStatus = async (status: "in_progress" | "done") => {
        if (!scheduleId) return
        await updateStatus(scheduleId, status)
        await refetch()
    }

    if (isLoading) {
        return (
            <main className="flex flex-1 flex-col gap-4 p-4">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-20 rounded-lg" />
                <Skeleton className="h-96 rounded-lg" />
            </main>
        )
    }

    if (error || !schedule) {
        return (
            <main className="flex flex-1 flex-col gap-4 p-4">
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error ?? "Atendimento nao encontrado"}
                </div>
                <Button type="button" variant="outline" onClick={() => navigate("/atendimento")}>
                    Voltar
                </Button>
            </main>
        )
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-background">
            <AtendimentoHeader
                schedule={schedule}
                age={calculateAge(schedule.patient.birthDate)}
                onBack={() => navigate("/atendimento")}
                onStart={() => void handleUpdateStatus("in_progress")}
                onFinish={() => void handleUpdateStatus("done")}
                isUpdating={isUpdating}
            />
            <main className="flex flex-1 flex-col gap-4 p-4">
                {updateError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{updateError}</div>
                ) : null}

                <section className="rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-foreground">Queixas</h2>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={complaintsOpen ? "Recolher queixas" : "Expandir queixas"}
                            onClick={() => setComplaintsOpen((current) => !current)}
                        >
                            {complaintsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                    </div>
                    {complaintsOpen ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            {schedule.patient.complaints?.trim() || "Nenhuma queixa registrada."}
                        </p>
                    ) : null}
                </section>

                <AtendimentoTabs scheduleId={schedule.id} patientId={schedule.patient.id} />
            </main>
        </div>
    )
}

import { useState } from "react"
import { ChevronDown, ChevronUp, Mail, Phone, Stethoscope, Clock } from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAttendanceSchedule } from "@/hooks/useAttendanceSchedule"
import { useUpdateScheduleStatus } from "@/hooks/useUpdateScheduleStatus"
import { AtendimentoHeader } from "@/components/atendimento/AtendimentoHeader"
import { AtendimentoTabs } from "@/components/atendimento/AtendimentoTabs"
import { cn } from "@/lib/utils"

const CLINIC_TZ = "America/Sao_Paulo"

function calcAge(birthDate: string) {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    if (
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) age -= 1
    return age
}

function formatDateTime(value: string) {
    const d = new Date(value)
    const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: CLINIC_TZ }).format(d)
    const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: CLINIC_TZ }).format(d)
    return { date, time }
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: CLINIC_TZ }).format(new Date(value))
}

function durationMinutes(start: string, end: string) {
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
        </div>
    )
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
                <Skeleton className="h-16 rounded-xl" />
                <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-32 rounded-xl" />
                    <Skeleton className="h-32 rounded-xl" />
                </div>
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
            </main>
        )
    }

    if (error || !schedule) {
        return (
            <main className="flex flex-1 flex-col gap-4 p-4">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error ?? "Atendimento não encontrado"}
                </div>
                <Button type="button" variant="outline" onClick={() => navigate("/atendimento")}>
                    Voltar
                </Button>
            </main>
        )
    }

    const age = calcAge(schedule.patient.birthDate)
    const { date: apptDate } = formatDateTime(schedule.startAt)
    const startTime = formatTime(schedule.startAt)
    const endTime = formatTime(schedule.endAt)
    const duration = durationMinutes(schedule.startAt, schedule.endAt)

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-background">
            <AtendimentoHeader
                schedule={schedule}
                age={age}
                onBack={() => navigate("/atendimento")}
                onStart={() => void handleUpdateStatus("in_progress")}
                onFinish={() => void handleUpdateStatus("done")}
                isUpdating={isUpdating}
            />

            <main className="flex flex-1 flex-col gap-4 p-4">
                {updateError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{updateError}</div>
                ) : null}

                {/* Info cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Patient */}
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                {schedule.patient.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paciente</p>
                                <p className="text-sm font-semibold text-foreground">{schedule.patient.name}</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            {schedule.patient.phone ? (
                                <InfoRow icon={Phone} label="Telefone" value={schedule.patient.phone} />
                            ) : null}
                            {schedule.patient.email ? (
                                <InfoRow icon={Mail} label="E-mail" value={schedule.patient.email} />
                            ) : null}
                            <div className="flex gap-4">
                                {!schedule.patient.phone && !schedule.patient.email ? (
                                    <p className="text-xs text-muted-foreground">Nenhum contato registrado.</p>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Appointment */}
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-3">Agendamento</p>
                        <div className="flex flex-col gap-2.5">
                            <InfoRow icon={Stethoscope} label="Especialidade" value={schedule.specialtyName} />
                            <InfoRow icon={Clock} label="Horário" value={`${startTime} – ${endTime} (${duration} min) · ${apptDate}`} />
                        </div>
                    </div>
                </div>

                {/* Queixas */}
                <section className={cn("rounded-xl border border-border bg-card p-4 shadow-sm", !complaintsOpen && "pb-3")}>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-foreground">Queixas</h2>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={complaintsOpen ? "Recolher" : "Expandir"}
                            onClick={() => setComplaintsOpen((v) => !v)}
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

                {/* Prontuário tabs */}
                <AtendimentoTabs scheduleId={schedule.id} patientId={schedule.patient.id} />
            </main>
        </div>
    )
}

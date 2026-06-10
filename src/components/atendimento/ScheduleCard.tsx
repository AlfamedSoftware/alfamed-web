import { Clock } from "lucide-react"
import { useNavigate } from "react-router"
import type { AttendanceSchedule } from "@/services/attendance.service"
import { cn } from "@/lib/utils"
import { getStatusClass, getStatusLabel } from "./status"

type ScheduleCardProps = {
    schedule: AttendanceSchedule
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value))
}

export function ScheduleCard({ schedule }: ScheduleCardProps) {
    const navigate = useNavigate()

    return (
        <button
            type="button"
            onClick={() => navigate(`/atendimento/${schedule.id}`)}
            className="min-h-32 rounded-lg border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock className="size-4 text-muted-foreground" />
                    <span>{formatTime(schedule.startAt)} - {formatTime(schedule.endAt)}</span>
                </div>
                <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", getStatusClass(schedule.status))}>
                    {getStatusLabel(schedule.status)}
                </span>
            </div>
            <div className="mt-4">
                <p className="line-clamp-2 text-base font-semibold text-foreground">{schedule.patient.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">Paciente agendado</p>
            </div>
        </button>
    )
}

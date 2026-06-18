import { Clock, User } from "lucide-react"
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
        timeZone: "America/Sao_Paulo",
    }).format(new Date(value))
}

function calcAge(birthDate: string) {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    if (
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) {
        age -= 1
    }
    return age
}

export function ScheduleCard({ schedule }: ScheduleCardProps) {
    const navigate = useNavigate()
    const age = calcAge(schedule.patient.birthDate)

    return (
        <button
            type="button"
            onClick={() => navigate(`/atendimento/${schedule.id}`)}
            className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>{formatTime(schedule.startAt)} – {formatTime(schedule.endAt)}</span>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium", getStatusClass(schedule.status))}>
                    {getStatusLabel(schedule.status)}
                </span>
            </div>

            <div className="flex items-start gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                    {schedule.patient.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{schedule.patient.name}</p>
                    <p className="text-xs text-muted-foreground">{age} anos</p>
                </div>
            </div>
        </button>
    )
}

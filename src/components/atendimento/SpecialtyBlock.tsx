import type { AttendanceSpecialty } from "@/services/attendance.service"
import { Skeleton } from "@/components/ui/skeleton"
import { ScheduleCard } from "./ScheduleCard"

type SpecialtyBlockProps = {
    specialty: AttendanceSpecialty
    isLoading?: boolean
}

export function SpecialtyBlock({ specialty, isLoading }: SpecialtyBlockProps) {
    return (
        <section id={`specialty-${specialty.id}`} className="scroll-mt-24 space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-foreground">{specialty.name}</h2>
                <p className="text-sm text-muted-foreground">
                    {specialty.schedules.length === 1 ? "1 agendamento" : `${specialty.schedules.length} agendamentos`}
                </p>
            </div>

            {isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="h-32 rounded-lg" />
                    ))}
                </div>
            ) : specialty.schedules.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {specialty.schedules.map((schedule) => (
                        <ScheduleCard key={schedule.id} schedule={schedule} />
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum agendamento para esta especialidade na data selecionada.
                </div>
            )}
        </section>
    )
}

import { useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAttendanceSchedules } from "@/hooks/useAttendanceSchedules"
import { SpecialtyBlock } from "@/components/atendimento/SpecialtyBlock"
import { SpecialtyFilter } from "@/components/atendimento/SpecialtyFilter"

const CLINIC_TIME_ZONE = "America/Sao_Paulo"

function getTodayDateString() {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: CLINIC_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date())
}

export function Atendimento() {
    const [selectedDate, setSelectedDate] = useState(getTodayDateString())
    const [activeSpecialtyId, setActiveSpecialtyId] = useState<string | null>(null)
    const { specialties, isLoading, error } = useAttendanceSchedules(selectedDate)

    const visibleSpecialties = useMemo(() => {
        if (!activeSpecialtyId) return specialties
        return specialties.filter((s) => s.id === activeSpecialtyId)
    }, [specialties, activeSpecialtyId])

    const totalSchedules = useMemo(
        () => specialties.reduce((sum, s) => sum + s.schedules.length, 0),
        [specialties],
    )

    const handleSelectSpecialty = (specialtyId: string | null) => {
        setActiveSpecialtyId(specialtyId)
        if (specialtyId) {
            requestAnimationFrame(() => {
                document.getElementById(`specialty-${specialtyId}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
            })
        }
    }

    return (
        <>
            <PageHeader title="Atendimento" />
            <main className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-lg font-semibold text-foreground">Agenda do dia</h1>
                            <p className="text-sm text-muted-foreground">
                                {isLoading
                                    ? "Carregando agendamentos…"
                                    : totalSchedules === 0
                                        ? "Nenhum agendamento para esta data."
                                        : `${totalSchedules} ${totalSchedules === 1 ? "agendamento" : "agendamentos"} encontrado${totalSchedules === 1 ? "" : "s"}`}
                            </p>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value)
                                    setActiveSpecialtyId(null)
                                }}
                                className="w-40"
                            />
                        </label>
                    </div>
                    {specialties.length > 1 ? (
                        <SpecialtyFilter
                            specialties={specialties}
                            activeSpecialtyId={activeSpecialtyId}
                            onSelect={handleSelectSpecialty}
                        />
                    ) : null}
                </div>

                {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : null}

                {isLoading && specialties.length === 0 ? (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-40" />
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-28 rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : visibleSpecialties.length > 0 ? (
                    <div className="space-y-8">
                        {visibleSpecialties.map((specialty) => (
                            <SpecialtyBlock key={specialty.id} specialty={specialty} isLoading={isLoading} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-12 text-center">
                        <p className="text-sm font-medium text-muted-foreground">
                            Nenhum agendamento para esta data.
                        </p>
                    </div>
                )}
            </main>
        </>
    )
}

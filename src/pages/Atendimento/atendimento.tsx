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
    const shouldHideControls = specialties.length <= 1

    const visibleSpecialties = useMemo(() => specialties, [specialties])

    const handleSelectSpecialty = (specialtyId: string) => {
        setActiveSpecialtyId(specialtyId)
        document.getElementById(`specialty-${specialtyId}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    return (
        <>
            <PageHeader title="Atendimento" />
            <main className="flex flex-1 flex-col gap-6 p-4">
                {!shouldHideControls ? (
                    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-xl font-semibold text-foreground">Atendimento</h1>
                                <p className="text-sm text-muted-foreground">Selecione a agenda do dia para iniciar o prontuario.</p>
                            </div>
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <CalendarDays className="size-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(event) => setSelectedDate(event.target.value)}
                                    className="w-40"
                                />
                            </label>
                        </div>
                        <SpecialtyFilter
                            specialties={specialties}
                            activeSpecialtyId={activeSpecialtyId}
                            onSelect={handleSelectSpecialty}
                        />
                    </div>
                ) : null}

                {error ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                ) : null}

                {isLoading && specialties.length === 0 ? (
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-56" />
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-32 rounded-lg" />
                            ))}
                        </div>
                    </div>
                ) : visibleSpecialties.length > 0 ? (
                    <div className="space-y-8">
                        {visibleSpecialties.map((specialty) => (
                            <SpecialtyBlock key={specialty.id} specialty={specialty} isLoading={isLoading} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                        Nenhuma especialidade encontrada para o profissional selecionado.
                    </div>
                )}
            </main>
        </>
    )
}

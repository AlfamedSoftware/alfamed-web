import { IlamyCalendar } from "@ilamy/calendar"
import { PageHeader } from "@/components/page-header"

const agendaEvents = [
    {
        id: "consulta-1",
        title: "Consulta - Dr. Silva",
        start: "2026-05-18T09:00:00-03:00",
        end: "2026-05-18T09:40:00-03:00",
        color: "#2563eb",
        backgroundColor: "#dbeafe",
        description: "Retorno com exame de rotina",
        location: "Sala 03",
    },
    {
        id: "exame-1",
        title: "Exame de imagem",
        start: "2026-05-18T11:00:00-03:00",
        end: "2026-05-18T11:30:00-03:00",
        color: "#059669",
        backgroundColor: "#d1fae5",
        description: "Ultrassonografia abdominal",
        location: "Setor de imagens",
    },
    {
        id: "bloqueio-1",
        title: "Bloco da tarde",
        start: "2026-05-18T14:00:00-03:00",
        end: "2026-05-18T17:00:00-03:00",
        color: "#b45309",
        backgroundColor: "#fef3c7",
        description: "Reserva para encaixes e urgências",
    },
]

export function Agendas() {
    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <PageHeader title="Agendas" />
            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-4 space-y-1">
                        <h2 className="text-lg font-semibold text-foreground">Agenda da unidade</h2>
                        <p className="text-sm text-muted-foreground">
                            Visualize consultas, exames e bloqueios de horário em uma única tela.
                        </p>
                    </div>

                    <div className="min-h-[620px] overflow-hidden rounded-lg border border-border bg-background lg:min-h-[680px]">
                        <IlamyCalendar
                            events={agendaEvents}
                            initialView="week"
                            firstDayOfWeek="monday"
                            initialDate="2026-05-18"
                            businessHours={{
                                daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
                                startTime: 8,
                                endTime: 20,
                            }}
                            hideNonBusinessHours
                            timeFormat="24-hour"
                            scrollTime="08:00"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Agendas

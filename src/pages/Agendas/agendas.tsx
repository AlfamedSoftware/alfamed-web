import { useEffect, useMemo, useState } from "react"
import { IlamyCalendar, defaultTranslations, useIlamyCalendarContext, type CalendarView, type EventFormProps, type Translations } from "@ilamy/calendar"
import "dayjs/locale/pt-br"
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useSession } from "@/hooks/use-session"
import { useSidebarMenu } from "@/contexts/sidebar-menu-context"
import { useProfessionals } from "../../hooks/use-professionals"
import { appointmentsService, type AppointmentCalendarEvent } from "../../services/appointments.service"
import { patientsService, type PatientListItem } from "../../services/patients.service"

type BookingFormState = {
    patientId: string
    professionalId: string
    date: string
    startTime: string
    endTime: string
    reason: string
}

const INTERNAL_ROLE_KEYS = new Set([
    "internal_alfamed",
    "alfamed",
    "alfamed interno",
    "alfamed_interno",
    "administrative",
    "administrative_assistant",
])
const CLINIC_TIME_ZONE = "America/Sao_Paulo"

const calendarTranslations: Translations = {
    ...defaultTranslations,
    today: "Hoje",
    create: "Criar",
    new: "Novo",
    update: "Atualizar",
    delete: "Excluir",
    cancel: "Cancelar",
    export: "Exportar",
    event: "Evento",
    events: "Eventos",
    newEvent: "Novo evento",
    title: "Titulo",
    description: "Descricao",
    location: "Local",
    allDay: "Dia todo",
    startDate: "Data inicial",
    endDate: "Data final",
    startTime: "Hora inicial",
    searchTime: "Buscar horario...",
    endTime: "Hora final",
    color: "Cor",
    createEvent: "Criar evento",
    editEvent: "Editar evento",
    addNewEvent: "Adicionar um novo evento ao calendario",
    editEventDetails: "Editar detalhes do evento",
    eventTitlePlaceholder: "Titulo do evento",
    eventDescriptionPlaceholder: "Descricao do evento (opcional)",
    eventLocationPlaceholder: "Local do evento (opcional)",
    repeat: "Repetir",
    repeats: "Repete",
    customRecurrence: "Recorrencia personalizada",
    daily: "Diariamente",
    weekly: "Semanalmente",
    monthly: "Mensalmente",
    yearly: "Anualmente",
    interval: "Intervalo",
    repeatOn: "Repetir em",
    never: "Nunca",
    count: "Quantidade",
    every: "A cada",
    ends: "Termina",
    after: "Apos",
    occurrences: "ocorrencias",
    on: "Em",
    editRecurringEvent: "Editar evento recorrente",
    deleteRecurringEvent: "Excluir evento recorrente",
    editRecurringEventQuestion: "e um evento recorrente. Como deseja edita-lo?",
    deleteRecurringEventQuestion: "e um evento recorrente. Como deseja exclui-lo?",
    thisEvent: "Este evento",
    thisEventDescription: "Alterar apenas esta ocorrencia",
    thisAndFollowingEvents: "Este e os seguintes",
    thisAndFollowingEventsDescription: "Editar esta e todas as proximas ocorrencias",
    allEvents: "Todos os eventos",
    allEventsDescription: "Editar toda a serie recorrente",
    onlyChangeThis: "Alterar apenas esta ocorrencia",
    changeThisAndFuture: "Alterar esta e as proximas ocorrencias",
    changeEntireSeries: "Alterar toda a serie",
    onlyDeleteThis: "Excluir apenas esta ocorrencia",
    deleteThisAndFuture: "Excluir esta e as proximas ocorrencias",
    deleteEntireSeries: "Excluir toda a serie",
    month: "Mes",
    week: "Semana",
    day: "Dia",
    year: "Ano",
    more: "mais",
    resources: "Recursos",
    resource: "Recurso",
    time: "Hora",
    date: "Data",
    noResourcesVisible: "Nenhum recurso visivel",
    addResourcesOrShowExisting: "Adicione recursos ou mostre existentes",
    sunday: "Domingo",
    monday: "Segunda-feira",
    tuesday: "Terca-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sabado",
    sun: "Dom",
    mon: "Seg",
    tue: "Ter",
    wed: "Qua",
    thu: "Qui",
    fri: "Sex",
    sat: "Sab",
    january: "Janeiro",
    february: "Fevereiro",
    march: "Marco",
    april: "Abril",
    may: "Maio",
    june: "Junho",
    july: "Julho",
    august: "Agosto",
    september: "Setembro",
    october: "Outubro",
    november: "Novembro",
    december: "Dezembro",
}

const calendarViewLabels: Record<CalendarView, string> = {
    day: "Dia",
    week: "Semana",
    month: "Mês",
    year: "Ano",
}

const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: CLINIC_TIME_ZONE,
})

const dayMonthFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: CLINIC_TIME_ZONE,
})

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
}

function AgendaCalendarHeader() {
    const { currentDate, view, setView, prevPeriod, nextPeriod, today } = useIlamyCalendarContext()
    const currentDateValue = currentDate.toDate()
    const monthName = capitalize(monthFormatter.format(currentDateValue))
    const year = currentDate.year()
    const weekStart = currentDate.startOf("week").add(1, "day")
    const weekEnd = weekStart.add(6, "day")
    const rangeLabel = view === "week"
        ? `${dayMonthFormatter.format(weekStart.toDate())} - ${dayMonthFormatter.format(weekEnd.toDate())}`
        : view === "day"
            ? dayMonthFormatter.format(currentDateValue)
            : ""

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 p-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold">
                <CalendarDays className="size-4 shrink-0" />
                <span>{monthName}</span>
                <span>{year}</span>
                {rangeLabel ? <span>{rangeLabel}</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-1">
                <Button type="button" variant="outline" size="icon-sm" onClick={prevPeriod} aria-label="Anterior">
                    <ChevronLeft className="size-4" />
                </Button>
                <Button type="button" variant="outline" size="icon-sm" onClick={nextPeriod} aria-label="Próximo">
                    <ChevronRight className="size-4" />
                </Button>
                {(["day", "week", "month", "year"] as CalendarView[]).map((calendarView) => (
                    <Button
                        key={calendarView}
                        type="button"
                        variant={view === calendarView ? "default" : "outline"}
                        size="sm"
                        onClick={() => setView(calendarView)}
                    >
                        {calendarViewLabels[calendarView]}
                    </Button>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={today}>
                    Hoje
                </Button>
            </div>
        </div>
    )
}

const APPOINTMENT_COLOR_PALETTE = [
    { color: "#1d4ed8", backgroundColor: "#dbeafe" },
    { color: "#0f766e", backgroundColor: "#ccfbf1" },
    { color: "#7c3aed", backgroundColor: "#ede9fe" },
    { color: "#be185d", backgroundColor: "#fce7f3" },
    { color: "#b45309", backgroundColor: "#fef3c7" },
    { color: "#047857", backgroundColor: "#d1fae5" },
]

function hslToHex(h: number, s: number, l: number) {
    s /= 100
    l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
        const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
        return Math.round(255 * color).toString(16).padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
}

function generateDistinctColors(n: number) {
    const colors = [] as { color: string; backgroundColor: string }[]
    const goldenAngle = 137.508

    for (let i = 0; i < n; i += 1) {
        const hue = (i * goldenAngle) % 360
        const color = hslToHex(hue, 65, 45)
        const background = hslToHex(hue, 80, 92)
        colors.push({ color, backgroundColor: background })
    }

    return colors
}

function getTodayDateString() {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: CLINIC_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date())
}

// Build a color map for all professionals currently visible in the agenda (and any extra found in events)
const useProfessionalColorMap = (visible: { id: string }[], events: AppointmentCalendarEvent[]) => {
    return useMemo(() => {
        const ids: string[] = []

        for (const p of visible) ids.push(p.id)

        for (const e of events) {
            if (e.professionalId && !ids.includes(e.professionalId)) ids.push(e.professionalId)
        }

        const generated = generateDistinctColors(Math.max(ids.length, APPOINTMENT_COLOR_PALETTE.length))
        const map = new Map<string, { color: string; backgroundColor: string }>()

        for (let i = 0; i < ids.length; i += 1) {
            map.set(ids[i], generated[i])
        }

        return map
    }, [visible, events])
}

function formatClinicDate(date: Date) {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: CLINIC_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date)
}

function formatClinicTime(date: Date) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: CLINIC_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date)
}

function onlyDigits(value: string) {
    return value.replace(/\D/g, "")
}

function formatCpf(value: string) {
    const digits = onlyDigits(value).slice(0, 11)

    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`

    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function getWeekRange(dateString: string) {
    const baseDate = new Date(`${dateString}T12:00:00`)
    const dayOfWeek = baseDate.getDay()
    const mondayOffset = (dayOfWeek + 6) % 7

    const start = new Date(baseDate)
    start.setDate(baseDate.getDate() - mondayOffset)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 7)
    end.setHours(0, 0, 0, 0)

    return { start, end }
}

function toIsoWithOffset(date: string, time: string) {
    return new Date(`${date}T${time}:00-03:00`).toISOString()
}

export function Agendas() {
    const { user, isInternalUser } = useSession()
    const { menuRoles } = useSidebarMenu()
    const { professionals, isLoading: professionalsLoading, error: professionalsError } = useProfessionals()

    const [selectedDate] = useState(getTodayDateString())
    const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([])
    const [agendaEvents, setAgendaEvents] = useState<AppointmentCalendarEvent[]>([])
    const [isAgendaLoading, setIsAgendaLoading] = useState(true)
    const [agendaError, setAgendaError] = useState<string | null>(null)
    const [isBookingOpen, setIsBookingOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [bookingError, setBookingError] = useState<string | null>(null)
    const [availabilityWindows, setAvailabilityWindows] = useState<Array<{ start: string; end: string }>>([])
    const [patients, setPatients] = useState<PatientListItem[]>([])
    const [patientCpfSearch, setPatientCpfSearch] = useState("")
    const [patientsLoading, setPatientsLoading] = useState(true)
    const [patientsError, setPatientsError] = useState<string | null>(null)
    const [hasInitializedSelection, setHasInitializedSelection] = useState(false)
    const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null)
    const [viewingAppointmentDetails, setViewingAppointmentDetails] = useState<{
        id: string
        patientId: string
        professionalUnitId: string
        startAt: string
        endAt: string
        reason?: string | null
        professionalId: string
    } | null>(null)
    const [isViewingOpen, setIsViewingOpen] = useState(false)
    const [bookingForm, setBookingForm] = useState<BookingFormState>(() => ({
        patientId: "",
        professionalId: "",
        date: getTodayDateString(),
        startTime: "09:00",
        endTime: "09:30",
        reason: "",
    }))

    const isMedic = menuRoles.includes("medic")
    const canChooseProfessionals = isInternalUser || menuRoles.some((role) => INTERNAL_ROLE_KEYS.has(role))

    const activeProfessionals = useMemo(() => professionals.filter((professional) => professional.isActive), [professionals])
    const currentProfessional = useMemo(
        () => activeProfessionals.find((professional) => professional.userId === user?.id) ?? null,
        [activeProfessionals, user?.id],
    )
    const selectedPatient = useMemo(
        () => patients.find((patient) => patient.id === bookingForm.patientId) ?? null,
        [bookingForm.patientId, patients],
    )
    const matchingPatients = useMemo(() => {
        const search = onlyDigits(patientCpfSearch)

        if (search.length < 3) {
            return []
        }

        return patients
            .filter((patient) => patient.isActive && patient.cpf && onlyDigits(patient.cpf).includes(search))
            .slice(0, 8)
    }, [patientCpfSearch, patients])

    useEffect(() => {
        const loadPatients = async () => {
            setPatientsLoading(true)
            setPatientsError(null)

            try {
                const data = await patientsService.list()
                setPatients(data.filter((patient) => patient.isActive && patient.cpf))
            } catch (error) {
                setPatientsError(error instanceof Error ? error.message : "Falha ao carregar pacientes")
            } finally {
                setPatientsLoading(false)
            }
        }

        void loadPatients()
    }, [])

    useEffect(() => {
        if (!bookingForm.patientId) {
            if (!isBookingOpen) {
                setPatientCpfSearch("")
            }

            return
        }

        const patient = patients.find((item) => item.id === bookingForm.patientId)
        if (patient?.cpf) {
            setPatientCpfSearch(formatCpf(patient.cpf))
        }
    }, [bookingForm.patientId, isBookingOpen, patients])

    useEffect(() => {
        if (professionalsLoading) {
            return
        }

        if (isMedic) {
            if (currentProfessional?.id) {
                setSelectedProfessionalIds([currentProfessional.id])
                setBookingForm((current) => ({
                    ...current,
                    professionalId: currentProfessional.id,
                }))
            }

            return
        }

        if (!hasInitializedSelection && activeProfessionals.length > 0) {
            const initialIds = activeProfessionals.map((professional) => professional.id)
            setSelectedProfessionalIds(initialIds)
            setHasInitializedSelection(true)
            setBookingForm((current) => ({
                ...current,
                professionalId: current.professionalId || initialIds[0] || "",
            }))
        }
    }, [activeProfessionals, currentProfessional?.id, hasInitializedSelection, isMedic, professionalsLoading])

    useEffect(() => {
        const loadAgendaEvents = async () => {
            if (selectedProfessionalIds.length === 0) {
                setAgendaEvents([])
                setIsAgendaLoading(false)
                return
            }

            setIsAgendaLoading(true)
            setAgendaError(null)

            const range = getWeekRange(selectedDate)

            try {
                const events = await appointmentsService.listAgendaEvents({
                    professionalIds: selectedProfessionalIds,
                    from: range.start.toISOString(),
                    to: range.end.toISOString(),
                })
                setAgendaEvents(events)
            } catch (error) {
                setAgendaError(error instanceof Error ? error.message : "Falha ao carregar agenda")
                setAgendaEvents([])
            } finally {
                setIsAgendaLoading(false)
            }
        }

        void loadAgendaEvents()
    }, [selectedDate, selectedProfessionalIds])

    const visibleProfessionals = canChooseProfessionals ? activeProfessionals : currentProfessional ? [currentProfessional] : activeProfessionals.slice(0, 1)
    const currentProfessionalLabel = currentProfessional?.name ?? user?.name ?? "você"

    const professionalColorMap = useProfessionalColorMap(visibleProfessionals, agendaEvents)

    const handleToggleProfessional = (professionalId: string) => {
        setSelectedProfessionalIds((current) => {
            if (current.includes(professionalId)) {
                return current.filter((value) => value !== professionalId)
            }

            return [...current, professionalId]
        })
    }

    const handleOpenBooking = () => {
        const nextProfessionalId = isMedic && !canChooseProfessionals ? currentProfessional?.id ?? "" : bookingForm.professionalId || selectedProfessionalIds[0] || ""

        setEditingAppointmentId(null)
        setBookingForm((current) => ({
            ...current,
            patientId: "",
            professionalId: nextProfessionalId,
            date: selectedDate,
            reason: "",
        }))
        setPatientCpfSearch("")
        setAvailabilityWindows([])
        setBookingError(null)
        setIsBookingOpen(true)
    }

    const openNewBookingAt = (startDate: Date, endDate: Date) => {
        const nextProfessionalId = isMedic && !canChooseProfessionals ? currentProfessional?.id ?? "" : bookingForm.professionalId || selectedProfessionalIds[0] || ""

        setEditingAppointmentId(null)
        setPatientCpfSearch("")
        setBookingForm((current) => ({
            ...current,
            patientId: "",
            professionalId: nextProfessionalId,
            date: formatClinicDate(startDate),
            startTime: formatClinicTime(startDate),
            endTime: formatClinicTime(endDate),
            reason: "",
        }))
        setAvailabilityWindows([])
        setBookingError(null)
        setIsBookingOpen(true)
    }

    const handleSubmitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setBookingError(null)
        setAvailabilityWindows([])

        const professionalId = canChooseProfessionals
            ? bookingForm.professionalId
            : isMedic
                ? currentProfessional?.id ?? bookingForm.professionalId
                : bookingForm.professionalId

        if (!professionalId) {
            setBookingError("Selecione um profissional para continuar")
            return
        }

        if (!bookingForm.patientId) {
            setBookingError("Busque o paciente pelo CPF e selecione um resultado para continuar")
            return
        }

        const startAt = toIsoWithOffset(bookingForm.date, bookingForm.startTime)
        const endAt = toIsoWithOffset(bookingForm.date, bookingForm.endTime)

        setIsSaving(true)

        try {
            if (editingAppointmentId) {
                // Update existing appointment
                await appointmentsService.update(editingAppointmentId, {
                    patientId: bookingForm.patientId,
                    startAt,
                    endAt,
                    reason: bookingForm.reason.trim() || undefined,
                })
            } else {
                // Create new appointment
                await appointmentsService.create({
                    patientId: bookingForm.patientId,
                    professionalId,
                    startAt,
                    endAt,
                    reason: bookingForm.reason.trim() || undefined,
                })
            }

            setIsBookingOpen(false)
            setEditingAppointmentId(null)
            setBookingForm((current) => ({
                ...current,
                patientId: "",
                reason: "",
            }))
            setPatientCpfSearch("")

            const range = getWeekRange(selectedDate)
            const events = await appointmentsService.listAgendaEvents({
                professionalIds: selectedProfessionalIds,
                from: range.start.toISOString(),
                to: range.end.toISOString(),
            })
            setAgendaEvents(events)
        } catch (error) {
            const message = error instanceof Error ? error.message : (editingAppointmentId ? "Falha ao atualizar agendamento" : "Falha ao criar agendamento")

            // If backend reports unavailable, fetch availability windows to show helpful info
            if (message.toLowerCase().includes("not available") || message.toLowerCase().includes("indispon")) {
                try {
                    const availability = await appointmentsService.checkAvailability({
                        professionalId,
                        date: bookingForm.date,
                        startAt,
                        endAt,
                    })

                    setAvailabilityWindows(availability.windows)
                    setBookingError("O intervalo escolhido não está disponível")
                } catch {
                    setBookingError(message)
                }
            } else {
                setBookingError(message)
            }
        } finally {
            setIsSaving(false)
        }
    }

    // Setup DOM event tracking and click listeners
    useEffect(() => {
        // Create a map of appointment IDs to their kinds
        const eventMap = new Map<string, string>()
        agendaEvents.forEach((event) => {
            eventMap.set(event.id, event.kind)
        })

        // Find calendar container and add attributes to event elements
        const updateEventAttributes = () => {
            const calendarContainer = document.querySelector("div[role='application'], [data-calendar], .fc, [class*='calendar']")
            if (!calendarContainer) return

            // Look for event elements - Ilamy calendar typically renders events in spans or divs with specific classes
            const eventElements = calendarContainer.querySelectorAll("[data-testid*='event'], [class*='event'], [role='button'][data-id], [role='button'][title]")

            eventElements.forEach((el) => {
                const element = el as HTMLElement
                // Try multiple ways to find event ID
                let eventId = element.getAttribute("data-id") || element.getAttribute("id") || element.getAttribute("data-event-id")

                if (!eventId && element.title) {
                    // Some calendars encode ID in title
                    eventId = element.getAttribute("data-event-id")
                }

                if (!eventId) {
                    // Try to find in aria attributes
                    const ariaLabel = element.getAttribute("aria-label")
                    if (ariaLabel) {
                        // Look for UUID pattern in aria-label
                        const uuidMatch = ariaLabel.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
                        if (uuidMatch) {
                            eventId = uuidMatch[0]
                        }
                    }
                }

                if (eventId && eventMap.has(eventId)) {
                    const kind = eventMap.get(eventId)
                    element.setAttribute("data-event-id", eventId)
                    element.setAttribute("data-event-kind", kind || "")
                    element.style.cursor = "pointer"
                }
            })
        }

        // Update on interval
        const updateInterval = setInterval(updateEventAttributes, 200)
        updateEventAttributes()

        const handleEventClick = (e: Event) => {
            const target = e.target as HTMLElement
            const eventElement = target.closest("[data-event-id]")

            if (!eventElement) return

            const eventId = eventElement.getAttribute("data-event-id")
            const eventKind = eventElement.getAttribute("data-event-kind")

            if (!eventId) return

            e.stopPropagation()

            console.log("[agendas] Event clicked:", { eventId, eventKind })

            if (eventKind === "appointment") {
                console.log("[agendas] Loading appointment:", eventId)
                appointmentsService
                    .get(eventId)
                    .then((appointment) => {
                        console.log("[agendas] Appointment loaded:", appointment)
                        setViewingAppointmentDetails({
                            ...appointment,
                            reason: appointment.reason ?? undefined,
                        })
                        setIsViewingOpen(true)
                    })
                    .catch((error) => {
                        console.error("[agendas] Error loading appointment:", error)
                        setBookingError(error instanceof Error ? error.message : "Falha ao carregar agendamento")
                    })
            }
        }

        document.addEventListener("click", handleEventClick, true)
        return () => {
            clearInterval(updateInterval)
            document.removeEventListener("click", handleEventClick, true)
        }
    }, [agendaEvents])

    // Intercept ilamy's event form and open our Sheet instead.
    const CustomEventForm = (props: EventFormProps) => {
        const { open, selectedEvent, onClose } = props

        useEffect(() => {
            if (!open) return

            // If selectedEvent exists, prefill from it; otherwise, use a sensible default
            if (selectedEvent) {
                let start: Date, end: Date

                // Handle both Date and Dayjs objects
                if (selectedEvent.start instanceof Date) {
                    start = selectedEvent.start
                } else if (selectedEvent.start && typeof selectedEvent.start === "object" && "toDate" in selectedEvent.start) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    start = (selectedEvent.start as any).toDate()
                } else {
                    start = new Date(String(selectedEvent.start))
                }

                if (selectedEvent.end instanceof Date) {
                    end = selectedEvent.end
                } else if (selectedEvent.end && typeof selectedEvent.end === "object" && "toDate" in selectedEvent.end) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    end = (selectedEvent.end as any).toDate()
                } else {
                    end = new Date(String(selectedEvent.end))
                }

                openNewBookingAt(start, end)
            }

            // Open our Sheet and close the library form immediately
            try {
                onClose()
            } catch {
                // ignore
            }
        }, [open, selectedEvent, onClose])

        return null
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <PageHeader title="Agendas" />

            <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold text-foreground">Agenda da unidade</h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Button onClick={handleOpenBooking} className="gap-2 header-booking-button">
                                <Plus className="size-4" />
                                Novo agendamento
                            </Button>
                        </div>
                    </div>

                    {(agendaError || professionalsError || patientsError) && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {agendaError ?? professionalsError ?? patientsError}
                        </div>
                    )}

                    <div className="mb-4 flex flex-col gap-4 lg:flex-row">
                        <div className="w-full lg:w-72">
                            {canChooseProfessionals ? (
                                <div className="rounded-xl border border-border bg-background p-4">
                                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                                        <CalendarDays className="size-4 text-muted-foreground" />
                                        Profissionais
                                    </div>

                                    <div className="grid gap-2 sm:grid-cols-1">
                                        {visibleProfessionals.map((professional) => {
                                            const checked = selectedProfessionalIds.includes(professional.id)
                                            const professionalColors = professionalColorMap.get(professional.id) ?? APPOINTMENT_COLOR_PALETTE[0]

                                            return (
                                                <label
                                                    key={professional.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => handleToggleProfessional(professional.id)}
                                                        className="size-4 rounded border-border"
                                                    />
                                                    <span
                                                        className="h-3 w-3 shrink-0 rounded-full border border-border"
                                                        style={{ backgroundColor: professionalColors.backgroundColor, borderColor: professionalColors.color }}
                                                        aria-hidden="true"
                                                    />
                                                    <span className="flex flex-col">
                                                        <span className="font-medium">{professional.name ?? "Profissional"}</span>
                                                    </span>
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : currentProfessional ? (
                                <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                                    Visualizando apenas a agenda de <span className="font-medium text-foreground">{currentProfessionalLabel}</span>.
                                </div>
                            ) : null}
                        </div>

                        <div className="flex-1">
                            <div className="alfamed-agenda-calendar min-h-[620px] overflow-hidden rounded-lg border border-border bg-background lg:min-h-[680px]" data-calendar>
                                {isAgendaLoading ? (
                                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                        Carregando agenda...
                                    </div>
                                ) : (
                                    <IlamyCalendar
                                        events={agendaEvents.map((e) => ({
                                            ...e,
                                            ...(e.professionalId ? professionalColorMap.get(e.professionalId) ?? {} : {}),
                                            start: new Date(e.start as string),
                                            end: new Date(e.end as string),
                                            description: e.description || undefined,
                                            location: e.location || undefined,
                                        }))}
                                        initialView="week"
                                        locale="pt-br"
                                        translations={calendarTranslations}
                                        firstDayOfWeek="monday"
                                        initialDate={selectedDate}
                                        timezone={CLINIC_TIME_ZONE}
                                        businessHours={{
                                            daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
                                            startTime: 8,
                                            endTime: 20,
                                        }}
                                        hideNonBusinessHours
                                        timeFormat="24-hour"
                                        scrollTime="08:00"
                                        renderEventForm={(props) => <CustomEventForm {...props} />}
                                        onCellClick={(info: { start?: Date | { toDate(): Date }; end?: Date | { toDate(): Date } } | null) => {
                                            try {
                                                if (!info) return
                                                const startDate: Date = info.start && "toDate" in info.start ? info.start.toDate() : new Date(info.start || "")
                                                const endDate: Date = info.end && "toDate" in info.end ? info.end.toDate() : new Date(info.end || "")
                                                openNewBookingAt(startDate, endDate)
                                            } catch {
                                                // ignore
                                            }
                                        }}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        onEventClick={(event: any) => {
                                            try {
                                                console.log("[agendas-calendar] onEventClick called:", event)
                                                if (!event) return

                                                // If it's an appointment, load and view details
                                                if (event.kind === "appointment" && event.id) {
                                                    console.log("[agendas-calendar] Fetching appointment:", event.id)
                                                    appointmentsService
                                                        .get(event.id)
                                                        .then((appointment) => {
                                                            console.log("[agendas-calendar] Appointment fetched:", appointment)
                                                            setViewingAppointmentDetails({
                                                                ...appointment,
                                                                reason: appointment.reason ?? undefined,
                                                            })
                                                            setIsViewingOpen(true)
                                                        })
                                                        .catch((error: Error | unknown) => {
                                                            console.error("[agendas-calendar] Error fetching appointment:", error)
                                                            setBookingError(
                                                                error instanceof Error ? error.message : "Falha ao carregar agendamento",
                                                            )
                                                        })
                                                } else {
                                                    // If it's a block or empty slot, create new appointment
                                                    console.log("[agendas-calendar] Opening new booking form for event:", event)
                                                    const start = new Date(event.start || "")
                                                    const end = new Date(event.end || "")
                                                    openNewBookingAt(start, end)
                                                }
                                            } catch (error) {
                                                console.error("[agendas-calendar] Exception in onEventClick:", error)
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <Sheet open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                        <SheetContent side="right" className="w-full sm:max-w-xl">
                            <SheetHeader>
                                <SheetTitle>{editingAppointmentId ? "Editar agendamento" : "Novo agendamento"}</SheetTitle>
                                <SheetDescription>
                                    {editingAppointmentId
                                        ? "Atualize os dados do agendamento."
                                        : "Selecione paciente, profissional e intervalo. A disponibilidade é validada antes de salvar."}
                                </SheetDescription>
                            </SheetHeader>

                            <form onSubmit={handleSubmitBooking} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                                {bookingError && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {bookingError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Paciente</label>
                                    <Input
                                        value={patientCpfSearch}
                                        onChange={(event) => {
                                            const search = onlyDigits(event.target.value).slice(0, 11)
                                            const exactPatient = patients.find((patient) => onlyDigits(patient.cpf ?? "") === search)

                                            setPatientCpfSearch(formatCpf(search))
                                            setBookingForm((current) => ({
                                                ...current,
                                                patientId: exactPatient?.id ?? "",
                                            }))
                                        }}
                                        inputMode="numeric"
                                        maxLength={14}
                                        placeholder="Digite o CPF do paciente"
                                        required
                                        disabled={patientsLoading}
                                    />
                                    {!bookingForm.patientId && matchingPatients.length > 0 && (
                                        <div className="max-h-48 overflow-y-auto rounded-md border border-border bg-background shadow-sm">
                                            {matchingPatients.map((patient) => (
                                                <button
                                                    key={patient.id}
                                                    type="button"
                                                    className="flex w-full flex-col gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                                                    onClick={() => {
                                                        setPatientCpfSearch(formatCpf(patient.cpf ?? ""))
                                                        setBookingForm((current) => ({ ...current, patientId: patient.id }))
                                                    }}
                                                >
                                                    <span className="font-medium text-foreground">{formatCpf(patient.cpf ?? "")}</span>
                                                    <span className="text-xs text-muted-foreground">{patient.name} - {patient.email}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedPatient && (
                                        <p className="text-xs text-muted-foreground">
                                            Paciente selecionado: <span className="font-medium text-foreground">{selectedPatient.name}</span>
                                        </p>
                                    )}
                                    {patientCpfSearch && !bookingForm.patientId && !patientsLoading && matchingPatients.length === 0 && (
                                        <p className="text-xs text-red-600">Nenhum paciente ativo encontrado com esse CPF.</p>
                                    )}
                                    {patientsLoading && <p className="text-xs text-muted-foreground">Carregando pacientes...</p>}
                                </div>

                                {(!isMedic || canChooseProfessionals) && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Profissional</label>
                                        <select
                                            value={bookingForm.professionalId}
                                            onChange={(event) => setBookingForm((current) => ({ ...current, professionalId: event.target.value }))}
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                                            required
                                        >
                                            <option value="">Selecione um profissional</option>
                                            {activeProfessionals.map((professional) => (
                                                <option key={professional.id} value={professional.id}>
                                                    {professional.name ?? "Profissional"} {professional.crm ? `- CRM ${professional.crm}` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {isMedic && currentProfessional && !canChooseProfessionals && (
                                    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                                        Profissional definido automaticamente: <span className="font-medium text-foreground">{currentProfessionalLabel}</span>
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Data</label>
                                        <Input
                                            type="date"
                                            value={bookingForm.date}
                                            onChange={(event) => setBookingForm((current) => ({ ...current, date: event.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Início</label>
                                        <Input
                                            type="time"
                                            value={bookingForm.startTime}
                                            onChange={(event) => setBookingForm((current) => ({ ...current, startTime: event.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Fim</label>
                                        <Input
                                            type="time"
                                            value={bookingForm.endTime}
                                            onChange={(event) => setBookingForm((current) => ({ ...current, endTime: event.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">Observação</label>
                                    <textarea
                                        value={bookingForm.reason}
                                        onChange={(event) => setBookingForm((current) => ({ ...current, reason: event.target.value }))}
                                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                                        placeholder="Ex.: retorno com exame de rotina"
                                    />
                                </div>

                                {availabilityWindows.length > 0 && (
                                    <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm">
                                        <p className="mb-2 font-medium text-foreground">Janelas livres encontradas</p>
                                        <ul className="space-y-1 text-muted-foreground">
                                            {availabilityWindows.map((window) => (
                                                <li key={`${window.start}-${window.end}`}>
                                                    {new Date(window.start).toLocaleString("pt-BR")} - {new Date(window.end).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <SheetFooter className="flex gap-2">
                                    {editingAppointmentId && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            disabled={isDeleting || isSaving}
                                            onClick={async () => {
                                                if (!editingAppointmentId) return
                                                if (!confirm("Tem certeza que deseja deletar este agendamento?")) return

                                                setIsDeleting(true)
                                                try {
                                                    await appointmentsService.delete(editingAppointmentId)
                                                    setIsBookingOpen(false)
                                                    setEditingAppointmentId(null)
                                                    setBookingForm((current) => ({
                                                        ...current,
                                                        patientId: "",
                                                        reason: "",
                                                    }))
                                                    setPatientCpfSearch("")

                                                    const range = getWeekRange(selectedDate)
                                                    const events = await appointmentsService.listAgendaEvents({
                                                        professionalIds: selectedProfessionalIds,
                                                        from: range.start.toISOString(),
                                                        to: range.end.toISOString(),
                                                    })
                                                    setAgendaEvents(events)
                                                } catch (error) {
                                                    setBookingError(error instanceof Error ? error.message : "Falha ao deletar agendamento")
                                                } finally {
                                                    setIsDeleting(false)
                                                }
                                            }}
                                            className="w-full gap-2"
                                        >
                                            <Trash2 className="size-4" />
                                            {isDeleting ? "Deletando..." : "Deletar"}
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={isSaving || patientsLoading} className="w-full">
                                        {isSaving ? "Salvando..." : "Verificar e salvar"}
                                    </Button>
                                </SheetFooter>
                            </form>
                        </SheetContent>
                    </Sheet>

                    {/* Appointment Details Viewing Modal */}
                    {isViewingOpen && viewingAppointmentDetails && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewingOpen(false)} />

                            <div className="relative w-full max-w-md mx-4 rounded-2xl shadow-xl p-6 bg-card text-card-foreground border border-border animate-in fade-in-0 zoom-in-95">
                                <button
                                    aria-label="Fechar"
                                    className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsViewingOpen(false)}
                                >
                                    <X className="w-4 h-4" />
                                </button>

                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold mb-1">Detalhes da Consulta</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Visualize as informações da consulta ou abra para editar.
                                    </p>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="rounded-lg bg-muted/20 p-3">
                                        <p className="text-xs text-muted-foreground">Paciente</p>
                                        <div className="font-medium text-sm mt-1">
                                            {patients.find((p) => p.id === viewingAppointmentDetails.patientId)?.name ?? "Carregando..."}
                                        </div>
                                    </div>

                                    <div className="rounded-lg bg-muted/20 p-3">
                                        <p className="text-xs text-muted-foreground">Profissional</p>
                                        <div className="font-medium text-sm mt-1">
                                            {professionals.find((p) => p.id === viewingAppointmentDetails.professionalId)?.name ?? "Carregando..."}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-lg bg-muted/20 p-3">
                                            <p className="text-xs text-muted-foreground">Data</p>
                                            <div className="font-medium text-sm mt-1">
                                                {formatClinicDate(new Date(viewingAppointmentDetails.startAt))}
                                            </div>
                                        </div>

                                        <div className="rounded-lg bg-muted/20 p-3">
                                            <p className="text-xs text-muted-foreground">Horário</p>
                                            <div className="font-medium text-sm mt-1">
                                                {formatClinicTime(new Date(viewingAppointmentDetails.startAt))} {" "}
                                                -{" "}
                                                {formatClinicTime(new Date(viewingAppointmentDetails.endAt))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsViewingOpen(false)}
                                        className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-sm font-medium hover:bg-muted"
                                    >
                                        Fechar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const start = new Date(viewingAppointmentDetails.startAt)
                                            const end = new Date(viewingAppointmentDetails.endAt)
                                            setIsViewingOpen(false)
                                            setEditingAppointmentId(viewingAppointmentDetails.id)
                                            setBookingForm({
                                                patientId: viewingAppointmentDetails.patientId,
                                                professionalId: viewingAppointmentDetails.professionalId,
                                                date: formatClinicDate(start),
                                                startTime: formatClinicTime(start),
                                                endTime: formatClinicTime(end),
                                                reason: viewingAppointmentDetails.reason ?? "",
                                            })
                                            setAvailabilityWindows([])
                                            setBookingError(null)
                                            setIsBookingOpen(true)
                                        }}
                                        className="flex-1 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}

export default Agendas

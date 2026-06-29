import { useEffect, useMemo, useReducer, useState } from "react"
import { useNavigate } from "react-router"
import { ChevronLeft, ChevronRight, ClipboardList, Clock } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"
import { useSessionUnit } from "@/contexts/session-unit-context"

// --- Types ---

interface Appointment {
    id: string
    patientId: string
    patientName: string
    patientCpf: string
    patientUserEmail: string
    professionalUnitId: string
    scheduleSlotId: string
    scheduleSlotStartTime: string
    scheduleSlotEndTime: string
    scheduleDate: string
    scheduleStartTime: string
    scheduleEndTime: string
    scheduleProcedureName: string
    startAt: string
    endAt: string
    diagnostics: string
    evolution: string
    statusId: string
    statusCode: number
    statusDescription: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

interface SpecialtyGroup {
    specialtyId: string
    specialtyName: string
    procedureId: string
    procedureName: string
    procedureDescription: string
    appointments: Appointment[]
}

// --- Date helpers (same style as listar-agendas) ---

function getTodayFormatted(): string {
    const today = new Date()
    return [
        String(today.getDate()).padStart(2, "0"),
        String(today.getMonth() + 1).padStart(2, "0"),
        today.getFullYear(),
    ].join("/")
}

function formatDateInput(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function isValidDateFormat(dateStr: string): boolean {
    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!match) return false
    const day = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year = parseInt(match[3], 10)
    if (month < 1 || month > 12) return false
    const date = new Date(year, month - 1, day)
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year
}

function dateInputToApiFormat(dateInput: string): string {
    const [d, m, y] = dateInput.split("/")
    return `${y}-${m}-${d}`
}

function shiftDateByDays(dateStr: string, days: number): string {
    const [d, m, y] = dateStr.split("/")
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    date.setDate(date.getDate() + days)
    return [
        String(date.getDate()).padStart(2, "0"),
        String(date.getMonth() + 1).padStart(2, "0"),
        date.getFullYear(),
    ].join("/")
}

// --- Fetch reducer ---

type FetchState = { groups: SpecialtyGroup[]; isLoading: boolean; error: string | null }
type FetchAction =
    | { type: "loading" }
    | { type: "success"; data: SpecialtyGroup[] }
    | { type: "error"; message: string }

function fetchReducer(_: FetchState, action: FetchAction): FetchState {
    switch (action.type) {
        case "loading": return { groups: [], isLoading: true, error: null }
        case "success": return { groups: action.data, isLoading: false, error: null }
        case "error":   return { groups: [], isLoading: false, error: action.message }
    }
}

// --- Status badge ---

function statusBadgeClass(statusCode: number): string {
    switch (statusCode) {
        case 1: return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        case 2: return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        case 3: return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        case 4: return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        default: return "bg-muted text-muted-foreground"
    }
}

// --- Main Component ---

export function Atendimentos() {
    const navigate = useNavigate()
    const { sessionUnit } = useSessionUnit()
    const professionalUnitId = sessionUnit?.selectedProfessionalUnitId ?? null

    const [dateInput, setDateInput] = useState(getTodayFormatted)
    const [dateError, setDateError] = useState<string | null>(null)
    const [activeSpecialtyId, setActiveSpecialtyId] = useState<string | null>(null)
    const [selectedStatusCode, setSelectedStatusCode] = useState<string>("")

    const [{ groups, isLoading, error }, dispatch] = useReducer(fetchReducer, { groups: [], isLoading: false, error: null })

    const [statusOptions, setStatusOptions] = useState<{ id: string; code: number; description: string }[]>([])

    useEffect(() => {
        fetchWithAuth<{ id: string; code: number; description: string }[]>(`${authBaseUrl}/appointment-status?isActive=true`)
            .then((data) => setStatusOptions(Array.isArray(data) ? data : []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (!professionalUnitId || !isValidDateFormat(dateInput)) return

        const params = new URLSearchParams({
            date: dateInputToApiFormat(dateInput),
            professionalUnitId,
        })
        if (selectedStatusCode) params.set("statusId", selectedStatusCode)

        dispatch({ type: "loading" })

        fetchWithAuth<SpecialtyGroup[]>(
            `${authBaseUrl}/attendiments/list-appointments-by-specialty?${params.toString()}`,
        )
            .then((data) => dispatch({ type: "success", data: Array.isArray(data) ? data : [] }))
            .catch((err) => dispatch({ type: "error", message: err instanceof Error ? err.message : "Erro ao carregar atendimentos" }))
    }, [professionalUnitId, dateInput, selectedStatusCode])

    const visibleGroups = useMemo(() => {
        if (!activeSpecialtyId) return groups
        return groups.filter((g) => g.specialtyId === activeSpecialtyId)
    }, [groups, activeSpecialtyId])

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDateInput(e.target.value)
        setDateInput(formatted)
        setActiveSpecialtyId(null)
        if (formatted.length === 10 && !isValidDateFormat(formatted)) {
            setDateError("Data inválida")
        } else {
            setDateError(null)
        }
    }

    const handlePrevDay = () => {
        if (!isValidDateFormat(dateInput)) return
        setDateInput(shiftDateByDays(dateInput, -1))
        setDateError(null)
        setActiveSpecialtyId(null)
    }

    const handleNextDay = () => {
        if (!isValidDateFormat(dateInput)) return
        setDateInput(shiftDateByDays(dateInput, 1))
        setDateError(null)
        setActiveSpecialtyId(null)
    }

    const handleSelectSpecialty = (specialtyId: string | null) => {
        setActiveSpecialtyId(specialtyId)
        if (specialtyId) {
            requestAnimationFrame(() => {
                document.getElementById(`specialty-${specialtyId}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
            })
        }
    }

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title="Atendimentos" />

            {/* Filter bar */}
            <div className="flex flex-wrap items-end gap-3 px-6 py-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Data do atendimento</label>
                    <div className="flex items-center gap-1.5">
                        <Input
                            value={dateInput}
                            onChange={handleDateChange}
                            placeholder="dd/mm/aaaa"
                            maxLength={10}
                            className={`h-10 w-36 ${dateError ? "border-red-500 focus-visible:ring-red-300" : ""}`}
                        />
                        <button
                            type="button"
                            onClick={handlePrevDay}
                            disabled={!isValidDateFormat(dateInput)}
                            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNextDay}
                            disabled={!isValidDateFormat(dateInput)}
                            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    {dateError && <span className="text-xs text-red-500">{dateError}</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Especialidade</label>
                    <select
                        value={activeSpecialtyId ?? ""}
                        onChange={(e) => handleSelectSpecialty(e.target.value || null)}
                        disabled={isLoading || groups.length === 0}
                        className="h-10 w-60 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 cursor-pointer"
                    >
                        <option value="">Todas as especialidades</option>
                        {groups.map((g) => (
                            <option key={g.specialtyId} value={g.specialtyId}>
                                {g.specialtyName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        value={selectedStatusCode}
                        onChange={(e) => {
                            setSelectedStatusCode(e.target.value)
                            setActiveSpecialtyId(null)
                        }}
                        disabled={isLoading}
                        className="h-10 w-48 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 cursor-pointer"
                    >
                        <option value="">Todos os status</option>
                        {statusOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.description}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <main className="flex-1 px-6 pb-6 space-y-6">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                    </div>
                )}

                {isLoading && groups.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mb-3" />
                        <p className="text-sm">Carregando atendimentos...</p>
                    </div>
                )}

                {!isLoading && visibleGroups.length > 0 && (
                    <div className="space-y-8">
                        {visibleGroups.map((group) => (
                            <SpecialtySection
                                key={group.specialtyId}
                                group={group}
                                onAppointmentClick={(id) => navigate(`/atendimentos/${id}`)}
                            />
                        ))}
                    </div>
                )}

                {!isLoading && !error && groups.length === 0 && isValidDateFormat(dateInput) && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <p className="text-sm">Nenhum atendimento encontrado para os filtros selecionados.</p>
                    </div>
                )}
            </main>
        </div>
    )
}

// --- Specialty Section ---

function SpecialtySection({
    group,
    onAppointmentClick,
}: {
    group: SpecialtyGroup
    onAppointmentClick: (appointmentId: string) => void
}) {
    return (
        <section id={`specialty-${group.specialtyId}`}>
            <div className="mb-3">
                <h2 className="text-base font-semibold text-foreground">
                    {group.specialtyName}
                    <span className="ml-1.5 text-sm font-normal text-muted-foreground">({group.appointments.length})</span>
                </h2>
            </div>

            {group.appointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        Nenhum atendimento para esta especialidade na data selecionada.
                    </p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {group.appointments.map((appt) => (
                        <AppointmentCard
                            key={appt.id}
                            appointment={appt}
                            onClick={() => onAppointmentClick(appt.id)}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}

// --- Appointment Card ---

function calcDuration(start?: string, end?: string): number | null {
    if (!start || !end) return null
    const [sh, sm] = start.split(":").map(Number)
    const [eh, em] = end.split(":").map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    return diff > 0 ? diff : null
}

function formatCpf(cpf: string): string {
    const d = cpf?.replace(/\D/g, "") ?? ""
    if (d.length !== 11) return cpf
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function AppointmentCard({
    appointment,
    onClick,
}: {
    appointment: Appointment
    onClick: () => void
}) {
    const initial = appointment.patientName?.charAt(0)?.toUpperCase() ?? "?"

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
        >
            {/* Patient header */}
            <div className="flex items-center gap-3 p-4 pb-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-bold text-blue-600 dark:text-blue-400">
                    {initial}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{appointment.patientName}</p>
                    {appointment.patientCpf && (
                        <p className="text-xs text-muted-foreground">{formatCpf(appointment.patientCpf)}</p>
                    )}
                </div>
            </div>

            <div className="h-px bg-border" />

            {/* Fields */}
            <div className="flex flex-col gap-2 p-4 pt-3">
                <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(appointment.statusCode)}`}>
                    {appointment.statusDescription}
                </span>
                {appointment.scheduleProcedureName && (
                    <div className="flex items-center gap-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                            <ClipboardList className="size-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-foreground truncate">{appointment.scheduleProcedureName}</p>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Clock className="size-3 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-medium text-foreground">
                        {appointment.scheduleSlotStartTime?.slice(0, 5)} – {appointment.scheduleSlotEndTime?.slice(0, 5)}
                        {calcDuration(appointment.scheduleSlotStartTime, appointment.scheduleSlotEndTime) !== null && (
                            <span className="text-muted-foreground"> · {calcDuration(appointment.scheduleSlotStartTime, appointment.scheduleSlotEndTime)} min</span>
                        )}
                    </span>
                </div>
            </div>
        </button>
    )
}

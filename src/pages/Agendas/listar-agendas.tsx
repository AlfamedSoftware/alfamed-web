import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Info, Plus, User, Users } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { professionalsService, type ProfessionalUnitFullData } from "@/services/professionals.service"
import { specialtiesService, type SpecialtyUnitFullData } from "@/services/specialties.service"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"
import { useToast, ToastContainer } from "@/pages/Profissionais/Componentes/Toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// --- Types ---

interface ScheduleSlot {
    id: string
    time: string
    isBooked: boolean
}

interface Schedule {
    id: string
    professionalName: string
    professionalUnitId: string
    specialtyName: string
    date: string
    totalSlots: number
    availableSlots: number
    schedule_slots: ScheduleSlot[]
}

// --- API Types ---

interface ScheduleApiResponse {
    id: string
    slots: number
    emptySlots: number
    allocatedSlots: number
    date: string
    startTime: string
    endTime: string
    durationMinutes: number
    isActive: boolean
    users: {
        id: string
        name: string
        socialName?: string
        email: string
        phone?: string
        cpf: string
        birthdate: string
        sex?: string
        isActive: boolean
    }
    professional_unit: {
        id: string
        isActive: boolean
    }
    schedule_slots: {
        id: string
        startTime: string
        endTime: string
        isAvailable: boolean
        isActive: boolean
    }[]
    specialties: {
        id: string
        name: string
        isActive: boolean
    }
}

// --- Helpers ---

function getTodayFormatted(): string {
    const today = new Date()
    const d = String(today.getDate()).padStart(2, "0")
    const m = String(today.getMonth() + 1).padStart(2, "0")
    const y = today.getFullYear()
    return `${d}/${m}/${y}`
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

function getProfessionalName(professional: ProfessionalUnitFullData): string {
    const users = professional.users
    const firstUser = Array.isArray(users) ? users[0] : users
    return firstUser?.name ?? "Profissional"
}

function getSlotDateTime(dateStr: string, timeStr: string): Date {
    const [d, m, y] = dateStr.split("/")
    const [h, min] = timeStr.split(":")
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min))
}

function isBeforeToday(dateStr: string): boolean {
    const [d, m, y] = dateStr.split("/")
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
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

function dateInputToApiFormat(dateInput: string): string {
    const [d, m, y] = dateInput.split("/")
    return `${y}-${m}-${d}`
}

function formatApiDate(dateStr: string): string {
    const normalized = dateStr.includes("T") ? dateStr : `${dateStr}T12:00:00`
    return new Date(normalized).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
}

function mapApiToSchedule(item: ScheduleApiResponse): Schedule {
    return {
        id: item.id,
        professionalName: item.users.socialName || item.users.name,
        professionalUnitId: item.professional_unit.id,
        specialtyName: item.specialties.name,
        date: formatApiDate(item.date),
        totalSlots: item.slots,
        availableSlots: item.emptySlots,
        schedule_slots: item.schedule_slots.map((slot) => ({
            id: slot.id,
            time: slot.startTime.slice(0, 5),
            isBooked: !slot.isAvailable,
        })),
    }
}

// --- Main Component ---

export function Agendas() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { sessionUnit } = useSessionUnit()
    const selectedUnitId = sessionUnit?.selectedUnitId ?? null
    const isMedic = sessionUnit?.selectedRoles?.key === "medic"
    const sessionProfessionalUnitId = sessionUnit?.selectedProfessionalUnitId ?? null

    const [dateInput, setDateInput] = useState(() => searchParams.get("date") ?? getTodayFormatted())
    const [dateError, setDateError] = useState<string | null>(null)

    const [professionals, setProfessionals] = useState<ProfessionalUnitFullData[]>([])
    const [isProfessionalsLoading, setIsProfessionalsLoading] = useState(false)
    const [selectedProfessionalUnitId, setSelectedProfessionalUnitId] = useState(
        () => searchParams.get("professionalUnitId") ?? ""
    )

    useEffect(() => {
        if (isMedic && sessionProfessionalUnitId) {
            setSelectedProfessionalUnitId(sessionProfessionalUnitId)
        }
    }, [isMedic, sessionProfessionalUnitId])

    const [specialties, setSpecialties] = useState<SpecialtyUnitFullData[]>([])
    const [isSpecialtiesLoading, setIsSpecialtiesLoading] = useState(false)
    const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(
        () => searchParams.get("specialtyId") ?? ""
    )

    useEffect(() => {
        const params: Record<string, string> = {}
        if (dateInput) params.date = dateInput
        if (selectedProfessionalUnitId) params.professionalUnitId = selectedProfessionalUnitId
        if (selectedSpecialtyId) params.specialtyId = selectedSpecialtyId
        setSearchParams(params, { replace: true })
    }, [dateInput, selectedProfessionalUnitId, selectedSpecialtyId, setSearchParams])

    useEffect(() => {
        if (!selectedUnitId) return
        const load = async () => {
            setIsProfessionalsLoading(true)
            try {
                if (isMedic && sessionProfessionalUnitId) {
                    const data = await professionalsService.getFullDataByProfessionalUnitId(sessionProfessionalUnitId)
                    setProfessionals([data])
                } else {
                    const data = await professionalsService.listByUnit(selectedUnitId, { isActive: true, roleKey: "medic" })
                    setProfessionals(data)
                }
            } catch {
                // ignore
            } finally {
                setIsProfessionalsLoading(false)
            }
        }
        load()
    }, [selectedUnitId, isMedic, sessionProfessionalUnitId])

    useEffect(() => {
        if (!selectedUnitId) return
        const load = async () => {
            setIsSpecialtiesLoading(true)
            try {
                const data = await specialtiesService.listByUnit(selectedUnitId, { isActive: true })
                setSpecialties(data)
            } catch {
                // ignore
            } finally {
                setIsSpecialtiesLoading(false)
            }
        }
        load()
    }, [selectedUnitId])

    const [schedules, setSchedules] = useState<Schedule[]>([])
    const [isSchedulesLoading, setIsSchedulesLoading] = useState(false)
    const [schedulesError, setSchedulesError] = useState<string | null>(null)

    useEffect(() => {
        if (!selectedUnitId || dateInput.length < 10 || !isValidDateFormat(dateInput)) {
            setSchedules([])
            return
        }
        setIsSchedulesLoading(true)
        setSchedulesError(null)
        const params = new URLSearchParams({ date: dateInputToApiFormat(dateInput) })
        if (selectedProfessionalUnitId) params.set("professionalUnitId", selectedProfessionalUnitId)
        if (selectedSpecialtyId) params.set("specialtyId", selectedSpecialtyId)
        fetchWithAuth<ScheduleApiResponse[] | Record<string, never>>(
            `${authBaseUrl}/schedules/list-full-schedule-slots?${params.toString()}`,
        )
            .then((data) => {
                setSchedules(Array.isArray(data) ? data.map(mapApiToSchedule) : [])
            })
            .catch((err) => {
                setSchedulesError(err instanceof Error ? err.message : "Erro ao carregar agendas")
            })
            .finally(() => setIsSchedulesLoading(false))
    }, [selectedUnitId, dateInput, selectedProfessionalUnitId, selectedSpecialtyId])

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDateInput(e.target.value)
        setDateInput(formatted)
        if (formatted.length === 10) {
            if (!isValidDateFormat(formatted)) {
                setDateError("Data inválida")
            } else if (isBeforeToday(formatted)) {
                setDateError("A data não pode ser anterior à data atual")
            } else {
                setDateError(null)
            }
        } else {
            setDateError(null)
        }
    }

    const isAtMinDate = dateInput.length === 10 && isValidDateFormat(dateInput)
        ? !isBeforeToday(dateInput) && dateInput === getTodayFormatted()
        : true

    const handlePrevDay = () => {
        if (isAtMinDate) return
        const prev = shiftDateByDays(dateInput, -1)
        setDateInput(prev)
        setDateError(isBeforeToday(prev) ? "A data não pode ser anterior à data atual" : null)
    }

    const handleNextDay = () => {
        if (dateInput.length !== 10 || !isValidDateFormat(dateInput)) return
        setDateInput(shiftDateByDays(dateInput, 1))
        setDateError(null)
    }

    const handleCriarAgenda = () => {
        const params = new URLSearchParams()
        if (selectedProfessionalUnitId) params.set("professionalUnitId", selectedProfessionalUnitId)
        if (selectedSpecialtyId) params.set("specialtyId", selectedSpecialtyId)
        if (dateInput.length === 10 && isValidDateFormat(dateInput)) params.set("date", dateInput)
        navigate(`cadastro?${params.toString()}`)
    }

    const canCreate = dateInput.length === 10 && isValidDateFormat(dateInput) && !dateError

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title="Agendas" />

            {/* Barra de filtros */}
            <div className="flex flex-wrap items-end gap-3 px-6 py-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Data da agenda</label>
                    <div className="flex gap-1.5 items-center">
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
                            disabled={isAtMinDate}
                            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={handleNextDay}
                            disabled={dateInput.length !== 10 || !isValidDateFormat(dateInput)}
                            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    {dateError && <span className="text-xs text-red-500">{dateError}</span>}
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Profissional</label>
                    <select
                        value={selectedProfessionalUnitId}
                        onChange={(e) => setSelectedProfessionalUnitId(e.target.value)}
                        disabled={isProfessionalsLoading || isMedic}
                        className="h-10 w-60 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 cursor-pointer"
                    >
                        {!isMedic && <option value="">Todos os profissionais</option>}
                        {professionals.map((p) => (
                            <option key={p.id} value={p.id}>
                                {getProfessionalName(p)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Especialidade</label>
                    <select
                        value={selectedSpecialtyId}
                        onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                        disabled={isSpecialtiesLoading}
                        className="h-10 w-60 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50 cursor-pointer"
                    >
                        <option value="">Todas as especialidades</option>
                        {specialties.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>

                <Button
                    onClick={handleCriarAgenda}
                    disabled={!canCreate}
                    className="ml-auto self-center bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 gap-1.5 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-4 h-4" />
                    Nova agenda
                </Button>
            </div>

            {/* Lista de agendas */}
            <main className="flex-1 px-6 pb-6 space-y-4">
                {isSchedulesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mb-3" />
                        <p className="text-sm">Carregando agendas...</p>
                    </div>
                ) : schedulesError ? (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {schedulesError}
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <CalendarDays className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm">Nenhuma agenda encontrada para os filtros selecionados.</p>
                    </div>
                ) : (
                    schedules.map((agenda) => (
                        <ScheduleCard key={agenda.id} schedule={agenda} />
                    ))
                )}
            </main>
        </div>
    )
}

// --- Card de Agenda ---

function ScheduleCard({ schedule }: { schedule: Schedule }) {
    const navigate = useNavigate()
    const { toasts, dismiss, toast } = useToast()
    const [now] = useState<number>(() => Date.now())
    const booked = schedule.schedule_slots.filter((s) => s.isBooked).length
    const expired = schedule.schedule_slots.filter((s) => {
        if (s.isBooked) return false
        const diffMin = (getSlotDateTime(schedule.date, s.time).getTime() - now) / 60000
        return diffMin < 30
    }).length
    const available = schedule.schedule_slots.filter((s) => !s.isBooked).length - expired
    const occupancyPercent = schedule.totalSlots > 0
        ? Math.round(((booked + expired) / schedule.totalSlots) * 100)
        : 0

    const handleSlotClick = (slot: ScheduleSlot) => {
        const slotDateTime = getSlotDateTime(schedule.date, slot.time)
        const now = new Date()
        const diffMin = (slotDateTime.getTime() - now.getTime()) / 60000

        if (diffMin <= 0) {
            toast.error("Não é possível agendar uma consulta que já passou.")
            return
        }
        if (diffMin < 30) {
            toast.error("Não é possível agendar com menos de 30 minutos de antecedência.")
            return
        }

        const params = new URLSearchParams({
            scheduleSlotId: slot.id,
            date: schedule.date,
            professionalName: schedule.professionalName,
            specialtyName: schedule.specialtyName,
        })
        navigate(`agendamentos?${params.toString()}`)
    }

    return (
        <>
        <div className="w-full rounded-xl border border-border bg-card shadow-sm px-6 py-5">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-foreground leading-tight">{schedule.professionalName}</p>
                        <p className="text-xs text-muted-foreground">{schedule.specialtyName}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                       
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>
                            <span className="font-medium text-green-600 dark:text-green-400">{available}</span>
                            <span className="text-muted-foreground"> / {schedule.totalSlots} vagas disponíveis</span>
                        </span>
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-28 rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    occupancyPercent >= 90 ? "bg-red-500" :
                                    occupancyPercent >= 60 ? "bg-amber-500" : "bg-blue-500"
                                }`}
                                style={{ width: `${occupancyPercent}%` }}
                            />
                        </div>
                        <span className="text-xs tabular-nums">{occupancyPercent}% ocupado/expirado</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-border mb-4" />

            {/* Horários */}
            <div>
                <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Horários
                </div>
                <div className="flex flex-wrap gap-2">
                    {schedule.schedule_slots.map((slot) => {
                        if (slot.isBooked) {
                            return (
                                <div
                                    key={slot.id}
                                    className="flex flex-col items-center justify-center w-16 h-14 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 select-none"
                                >
                                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 mb-1" />
                                    <span className="text-xs font-medium text-red-500 dark:text-red-400">{slot.time}</span>
                                    <span className="text-[10px] text-red-400 dark:text-red-500 mt-0.5">Ocupado</span>
                                </div>
                            )
                        }
                        const diffMin = (getSlotDateTime(schedule.date, slot.time).getTime() - now) / 60000
                        if (diffMin <= 0) {
                            return (
                                <TooltipProvider key={slot.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="relative flex flex-col items-center justify-center w-16 h-14 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 select-none cursor-default">
                                                <Info className="absolute top-1 right-1 h-3 w-3 text-orange-400" />
                                                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mb-1" />
                                                <span className="text-xs font-medium text-orange-500 dark:text-orange-400">{slot.time}</span>
                                                <span className="text-[10px] text-orange-400 dark:text-orange-500 mt-0.5">Expirado</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Esta vaga já passou do horário.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        }
                        if (diffMin < 30) {
                            return (
                                <TooltipProvider key={slot.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="relative flex flex-col items-center justify-center w-16 h-14 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800 select-none cursor-default">
                                                <Info className="absolute top-1 right-1 h-3 w-3 text-orange-400" />
                                                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 mb-1" />
                                                <span className="text-xs font-medium text-orange-500 dark:text-orange-400">{slot.time}</span>
                                                <span className="text-[10px] text-orange-400 dark:text-orange-500 mt-0.5">Expirado</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Não é possível agendar com menos de 30 minutos de antecedência.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        }
                        return (
                            <button
                                key={slot.id}
                                onClick={() => handleSlotClick(slot)}
                                className="flex flex-col items-center justify-center w-16 h-14 rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40 hover:border-green-400 hover:shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mb-1" />
                                <span className="text-xs font-semibold text-green-700 dark:text-green-400">{slot.time}</span>
                                <span className="text-[10px] text-green-600 dark:text-green-500 mt-0.5">Disponível</span>
                            </button>
                        )
                    })}
                </div>

                <div className="flex gap-5 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        Disponível ({available})
                    </span>
                    {expired > 0 && (
                        <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-orange-400" />
                            Expirado ({expired})
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-400" />
                        Ocupado ({booked})
                    </span>
                </div>
            </div>
        </div>
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </>
    )
}

export default Agendas
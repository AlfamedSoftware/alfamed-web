import { useEffect, useReducer } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { ChevronLeft, ChevronRight, ClipboardList, FlaskConical, User } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"
import { useSessionUnit } from "@/contexts/session-unit-context"

// --- Types ---

interface ExamRequest {
    id: string
    patients: {
        name: string
        socialName: string
        cpf: string
    }
    professional_units: {
        professional: {
            user: {
                name: string
            }
        }
    }
    schedules: {
        specialties: {
            name: string
        }
        procedures: {
            description: string
        }
    }
    requestCount: number
}

// --- Section config ---

const SECTIONS = [
    { statusCode: 2, label: "Aguardando realização", headerClass: "bg-yellow-500", requiresProfessional: false },
    { statusCode: 3, label: "Paciente em exame",     headerClass: "bg-blue-500",   requiresProfessional: true  },
] as const

// --- Helpers ---

function formatCpf(cpf: string): string {
    const d = cpf?.replace(/\D/g, "") ?? ""
    if (d.length !== 11) return cpf
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function getTodayFormatted(): string {
    const t = new Date()
    return [String(t.getDate()).padStart(2, "0"), String(t.getMonth() + 1).padStart(2, "0"), t.getFullYear()].join("/")
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
    const day   = parseInt(match[1], 10)
    const month = parseInt(match[2], 10)
    const year  = parseInt(match[3], 10)
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
    return [String(date.getDate()).padStart(2, "0"), String(date.getMonth() + 1).padStart(2, "0"), date.getFullYear()].join("/")
}

// --- Fetch reducer ---

type SectionState = { items: ExamRequest[]; isLoading: boolean; error: string | null }
type SectionAction =
    | { type: "loading" }
    | { type: "success"; data: ExamRequest[] }
    | { type: "error"; message: string }

function sectionReducer(_: SectionState, action: SectionAction): SectionState {
    switch (action.type) {
        case "loading": return { items: [], isLoading: true,  error: null }
        case "success": return { items: action.data, isLoading: false, error: null }
        case "error":   return { items: [], isLoading: false, error: action.message }
    }
}

// --- Section hook ---

function useSectionFetch(statusCode: number, date: string, professionalUnitId?: string, waitForProfessional = false) {
    const [state, dispatch] = useReducer(sectionReducer, { items: [], isLoading: false, error: null })

    useEffect(() => {
        if (!isValidDateFormat(date)) return
        if (waitForProfessional && !professionalUnitId) return

        const params = new URLSearchParams({ date: dateInputToApiFormat(date), statusCode: String(statusCode) })
        if (professionalUnitId) params.set("professionalUnitId", professionalUnitId)

        dispatch({ type: "loading" })
        fetchWithAuth<ExamRequest[]>(`${authBaseUrl}/exam-management/list-exams?${params.toString()}`)
            .then((data) => dispatch({ type: "success", data: Array.isArray(data) ? data : [] }))
            .catch((err) => dispatch({ type: "error", message: err instanceof Error ? err.message : "Erro ao carregar" }))
    }, [statusCode, date, professionalUnitId, waitForProfessional])

    return state
}

// --- Main component ---

export function ListarGestaoExames() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const { sessionUnit } = useSessionUnit()

    const dateInput    = searchParams.get("date")   ?? getTodayFormatted()
    const statusFilter = searchParams.get("status") ?? ""

    const setDateInput = (value: string) =>
        setSearchParams((prev) => { prev.set("date", value); return prev }, { replace: true })

    const setStatusFilter = (value: string) =>
        setSearchParams((prev) => {
            if (value) prev.set("status", value); else prev.delete("status")
            return prev
        }, { replace: true })

    const professionalUnitId = sessionUnit?.selectedProfessionalUnitId

    const section2 = useSectionFetch(2, dateInput)
    const section3 = useSectionFetch(3, dateInput, professionalUnitId, true)

    const allSections = [
        { ...SECTIONS[0], ...section2 },
        { ...SECTIONS[1], ...section3 },
    ]

    const visibleSections = statusFilter
        ? allSections.filter((s) => String(s.statusCode) === statusFilter)
        : allSections

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title="Gestão de Exames" />

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 px-6 py-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Data</label>
                    <div className="flex items-center gap-1.5">
                        <Input
                            value={dateInput}
                            onChange={(e) => setDateInput(formatDateInput(e.target.value))}
                            placeholder="dd/mm/aaaa"
                            maxLength={10}
                            className="h-10 w-36"
                        />
                        <button
                            type="button"
                            onClick={() => { if (isValidDateFormat(dateInput)) setDateInput(shiftDateByDays(dateInput, -1)) }}
                            disabled={!isValidDateFormat(dateInput)}
                            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => { if (isValidDateFormat(dateInput)) setDateInput(shiftDateByDays(dateInput, 1)) }}
                            disabled={!isValidDateFormat(dateInput)}
                            className="h-10 w-10 flex items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    >
                        <option value="">Todos</option>
                        {SECTIONS.map((s) => (
                            <option key={s.statusCode} value={String(s.statusCode)}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <main className="flex-1 px-6 pb-6 flex flex-col gap-6">
                {visibleSections.map((section) => (
                    <SectionBlock
                        key={section.statusCode}
                        label={section.label}
                        headerClass={section.headerClass}
                        items={section.items}
                        isLoading={section.isLoading}
                        error={section.error}
                        onCardClick={(id) => navigate(`/gestao-exames/detalhes/${id}`)}
                    />
                ))}
            </main>
        </div>
    )
}

// --- Section block ---

function SectionBlock({ label, headerClass, items, isLoading, error, onCardClick }: {
    label: string
    headerClass: string
    items: ExamRequest[]
    isLoading: boolean
    error: string | null
    onCardClick: (id: string) => void
}) {
    return (
        <div className="rounded-xl border border-border overflow-hidden shadow-sm">
            <div className={`px-4 py-3 ${headerClass} flex items-center justify-between`}>
                <p className="text-base font-semibold text-white">{label}</p>
                {!isLoading && (
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                        {items.length} {items.length === 1 ? "exame" : "exames"}
                    </span>
                )}
            </div>

            <div className="p-4">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                        <p className="text-sm">Carregando...</p>
                    </div>
                )}

                {!isLoading && !error && items.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">Nenhum exame nesta etapa.</p>
                )}

                {!isLoading && items.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {items.map((exam) => (
                            <ExamCard key={exam.id} exam={exam} onClick={() => onCardClick(exam.id)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// --- Exam card ---

function ExamCard({ exam, onClick }: { exam: ExamRequest; onClick: () => void }) {
    const displayName = exam.patients?.socialName || exam.patients?.name || "?"
    const initial     = displayName.charAt(0).toUpperCase()
    const count       = exam.requestCount ?? 0

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
        >
            <div className="flex flex-col">
                <div className="flex items-center gap-3 p-4 pb-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm font-bold text-blue-600 dark:text-blue-400">
                        {initial}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                        {exam.patients?.cpf && (
                            <p className="text-xs text-muted-foreground">{formatCpf(exam.patients.cpf)}</p>
                        )}
                    </div>
                </div>

                <div className="h-px bg-border" />

                <div className="flex flex-col gap-2 p-4 pt-3">
                    {exam.professional_units?.professional?.user?.name && (
                        <div className="flex items-center gap-2">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                                <User className="size-3 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-foreground truncate">
                                {exam.professional_units.professional.user.name}
                                {exam.schedules?.specialties?.name && (
                                    <span className="text-muted-foreground"> — {exam.schedules.specialties.name}</span>
                                )}
                            </p>
                        </div>
                    )}
                    {exam.schedules?.procedures?.description && (
                        <div className="flex items-center gap-2">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                                <ClipboardList className="size-3 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-foreground truncate">{exam.schedules.procedures.description}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                            <FlaskConical className="size-3 text-muted-foreground" />
                        </div>
                        <p className="text-xs text-foreground">{count} {count === 1 ? "exame solicitado" : "exames solicitados"}</p>
                    </div>
                </div>
            </div>
        </button>
    )
}

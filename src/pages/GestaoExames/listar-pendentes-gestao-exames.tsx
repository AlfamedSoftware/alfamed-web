import { useEffect, useReducer, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { ChevronLeft, ChevronRight, ClipboardList, FlaskConical, User } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Input } from "@/components/ui/input"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"

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

// --- Helpers ---

function formatCpf(cpf: string): string {
    const d = cpf?.replace(/\D/g, "") ?? ""
    if (d.length !== 11) return cpf
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// --- Date helpers ---

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

type FetchState = { exams: ExamRequest[]; isLoading: boolean; error: string | null }
type FetchAction =
    | { type: "loading" }
    | { type: "success"; data: ExamRequest[] }
    | { type: "error"; message: string }

function fetchReducer(_: FetchState, action: FetchAction): FetchState {
    switch (action.type) {
        case "loading": return { exams: [], isLoading: true, error: null }
        case "success": return { exams: action.data, isLoading: false, error: null }
        case "error":   return { exams: [], isLoading: false, error: action.message }
    }
}

// --- Main Component ---

export function ListarPendentesGestaoExames() {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [dateError, setDateError] = useState<string | null>(null)

    const dateInput = searchParams.get("date") ?? getTodayFormatted()

    const setDateInput = (value: string) => {
        setSearchParams((prev) => { prev.set("date", value); return prev }, { replace: true })
    }

    const [{ exams, isLoading, error }, dispatch] = useReducer(fetchReducer, { exams: [], isLoading: false, error: null })

    useEffect(() => {
        if (!isValidDateFormat(dateInput)) return

        const params = new URLSearchParams({
            date: dateInputToApiFormat(dateInput),
            statusCode: "1",
        })

        dispatch({ type: "loading" })

        fetchWithAuth<ExamRequest[]>(`${authBaseUrl}/exam-management/list-exams?${params.toString()}`)
            .then((data) => dispatch({ type: "success", data: Array.isArray(data) ? data : [] }))
            .catch((err) => dispatch({ type: "error", message: err instanceof Error ? err.message : "Erro ao carregar exames" }))
    }, [dateInput])

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatDateInput(e.target.value)
        setDateInput(formatted)
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
    }

    const handleNextDay = () => {
        if (!isValidDateFormat(dateInput)) return
        setDateInput(shiftDateByDays(dateInput, 1))
        setDateError(null)
    }

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title="Exames Pendentes" />

            {/* Filter bar */}
            <div className="flex flex-wrap items-end gap-3 px-6 py-4">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium">Data</label>
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
            </div>

            <main className="flex-1 px-6 pb-6">
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mb-3" />
                        <p className="text-sm">Carregando exames...</p>
                    </div>
                )}

                {!isLoading && exams.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {exams.map((exam) => (
                            <ExamCard key={exam.id} exam={exam} onClick={() => navigate(`/gestao-exames/detalhes-pendentes/${exam.id}`)} />
                        ))}
                    </div>
                )}

                {!isLoading && !error && exams.length === 0 && isValidDateFormat(dateInput) && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <p className="text-sm">Nenhum exame pendente encontrado para a data selecionada.</p>
                    </div>
                )}
            </main>
        </div>
    )
}

// --- Exam Card ---

function ExamCard({ exam, onClick }: { exam: ExamRequest; onClick: () => void }) {
    const displayName = exam.patients?.socialName || exam.patients?.name || "?"
    const initial = displayName.charAt(0).toUpperCase()
    const count = exam.requestCount ?? 0

    return (
        <button type="button" onClick={onClick} className="w-full text-left rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]">
            <div className="flex flex-col">
                {/* Patient */}
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

                {/* Fields */}
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

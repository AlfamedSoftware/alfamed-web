import { useEffect, useRef, useState } from "react"
import { Building2, Calendar, CalendarDays, ChevronDown, ClipboardList, Clock, Download, FileText, Mail, PersonStanding, Phone, Printer, Stethoscope, User, X } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { CpfNameSearch, type SearchResultItem } from "@/components/cpf-name-search"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"
import { digitsOnly } from "../Profissionais/edicao-profissionais"

// --- Types ---

interface PatientSearchApiResponse {
    id: string
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
}

interface PatientWithAppointments {
    id: string
    name: string
    socialName?: string
    email: string
    phone?: string
    cpf: string
    birthdate: string
    sex?: string
    isActive: boolean
    appointments: Appointment[]
}

interface Appointment {
    id: string
    patientId: string
    professionalUnitId: string
    scheduleSlotId: string
    startAt: string
    endAt: string
    diagnostics: string
    evolution: string
    clinicNotes: string
    statusId: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    schedules: {
        id: string
        date: string
        startTime: string
        endTime: string
        durationMinutes: number
        slots: number
        emptySlots: number
        allocatedSlots: number
        isActive: boolean
    }
    schedule_slots: {
        id: string
        startTime: string
        endTime: string
        isAvailable: boolean
        isActive: boolean
    }
    appointment_status: {
        id: string
        code: number
        description: string
        isActive: boolean
    }
    specialties: {
        id: string
        name: string
        isActive: boolean
    }
    procedures: {
        id: string
        type: number
        description: string
        observation: string
        code: string
        price: string
        isActive: boolean
    }
    units: {
        id: string
        name: string
        cnpj: string
        address: string
        city: string
        state: string
        phone: string
        email: string
        isActive: boolean
    }
    professionals: {
        id: string
        crm: string
        isActive: boolean
    }
    professional_user: {
        id: string
        name: string
        socialName?: string
        email: string
        phone: string
        cpf: string
        sex: string
        isActive: boolean
    }
    requests: Array<{
        id: string
        appointmentId: string
        procedureId: string
        professionalUnitId: string
        complementaryInfo: string
        performedAt: string
        justification: string
        statusId: string
        isActive: boolean
        internalProcedures: {
            id: string
            type: number
            description: string
            observation: string
            code: string
            price: string
            isActive: boolean
            isPerformedInUnit: boolean
        }
        request_status: {
            id: string
            code: number
            description: string
            isActive: boolean
        }
        request_results: {
            id: string
            requestId: string
            professionalUnitId: string
            complementaryInfo: string
            attachmentUrl: string
            releasedAt: string
            isActive: boolean
        }
    }>
    external_requests: Array<{
        id: string
        appointmentId: string
        procedureId: string
        isActive: boolean
        externalProcedures: {
            id: string
            type: number
            description: string
            observation: string
            code: string
            price: string
            isActive: boolean
        }
    }>
}

type SearchMode = "cpf" | "nome"

interface NameSearchResult {
    id: string
    userId: string
    name: string
    cpf: string
}

// --- Helpers ---

function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function isValidCpf(cpf: string): boolean {
    return cpf.replace(/\D/g, "").length === 11
}

function formatPhone(value: string): string {
    if (!value) return "Não informado"
    const digits = digitsOnly(value).slice(0, 11)
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, digits.length > 10 ? 7 : 6)
    const second = digits.slice(digits.length > 10 ? 7 : 6, digits.length > 10 ? 11 : 10)
    if (!ddd) return ""
    if (!first) return `(${ddd}`
    if (!second) return `(${ddd}) ${first}`
    return `(${ddd}) ${first}-${second}`
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "—"
    if (!dateStr.includes("T")) {
        const [year, month, day] = dateStr.split("-").map(Number)
        return new Date(year, month - 1, day).toLocaleDateString("pt-BR")
    }
    return new Date(dateStr).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
}

function formatSex(value?: string): string {
    if (value === "M") return "Masculino"
    if (value === "F") return "Feminino"
    if (value === "O") return "Outros"
    return "Não informado"
}

function formatAge(yyyymmdd: string): string {
    if (!yyyymmdd) return "—"
    const [y, m, d] = yyyymmdd.split("-")
    const birth = new Date(Number(y), Number(m) - 1, Number(d))
    if (isNaN(birth.getTime())) return "—"
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
    if (age > 0) return `${age} anos`
    let months = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth())
    if (today.getDate() < birth.getDate()) months--
    return `${Math.max(0, months)} meses`
}

function statusBadgeClass(statusCode: number): string {
    switch (statusCode) {
        case 1: return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        case 2: return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        case 3: return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        case 4: return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        default: return "bg-muted text-muted-foreground"
    }
}

// --- useMedicalRecords hook ---

export function useMedicalRecords(userId: string | null, enabled = true) {
    const [patientData, setPatientData] = useState<PatientWithAppointments | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId || !enabled) {
            setPatientData(null)
            return
        }
        const load = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const data = await fetchWithAuth<PatientWithAppointments>(
                    `${authBaseUrl}/medical-records/list-patient-medical-records?userId=${userId}`,
                )
                setPatientData(data)
            } catch {
                setError("Erro ao carregar prontuário.")
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [userId, enabled])

    return { patientData, isLoading, error }
}

// --- PatientMedicalRecords (reusable display) ---

export function PatientMedicalRecords({ patientData, isLoading, error }: {
    patientData: PatientWithAppointments | null
    isLoading: boolean
    error: string | null
}) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
    const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null)
    const [isPdfLoading, setIsPdfLoading] = useState(false)
    const [pdfError, setPdfError] = useState<string | null>(null)
    const pdfIframeRef = useRef<HTMLIFrameElement>(null)

    const toggleExpanded = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) { next.delete(id) } else { next.add(id) }
            return next
        })
    }

    const openPdfPreview = async (appointmentId: string) => {
        setPdfPreviewOpen(true)
        setIsPdfLoading(true)
        setPdfBlobUrl(null)
        setPdfError(null)
        try {
            const response = await fetch(`${authBaseUrl}/external-requests/requisition/${appointmentId}`, {
                credentials: "include",
            })
            if (!response.ok) throw new Error(`Erro ${response.status}`)
            const blob = await response.blob()
            setPdfBlobUrl(URL.createObjectURL(blob))
        } catch {
            setPdfError("Erro ao carregar o documento. Tente novamente.")
        } finally {
            setIsPdfLoading(false)
        }
    }

    const closePdfPreview = () => {
        setPdfPreviewOpen(false)
        setPdfBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null })
        setPdfError(null)
    }

    const handlePrint = () => pdfIframeRef.current?.contentWindow?.print()

    const handleDownload = () => {
        if (!pdfBlobUrl) return
        const a = document.createElement("a")
        a.href = pdfBlobUrl
        a.download = "requisicao-externa.pdf"
        a.click()
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border border-border border-l-4 border-l-primary/30 bg-card overflow-hidden">
                        <div className="grid grid-cols-3 gap-x-6 gap-y-3 px-4 py-4">
                            <div className="col-span-3 flex items-center justify-between">
                                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                                <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                            </div>
                            {[1, 2, 3, 4, 5, 6].map((j) => (
                                <div key={j} className="flex items-start gap-3">
                                    <div className="mt-0.5 size-7 shrink-0 rounded-lg bg-muted animate-pulse" />
                                    <div className="flex flex-col gap-1.5 flex-1">
                                        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {error}
            </div>
        )
    }

    if (!patientData || patientData.appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
                <FileText className="h-10 w-10 opacity-20" />
                <p className="text-sm">Nenhum registro encontrado para este paciente.</p>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-3">
                {patientData.appointments.map((appt, index) => {
                    const num = patientData.appointments.length - index
                    return (
                    <div key={appt.id} className="rounded-lg border border-border border-l-4 border-l-primary bg-card shadow-sm overflow-hidden">
                        <div className="grid grid-cols-3 gap-x-6 gap-y-3 px-4 py-4">
                        <div className="col-span-3 flex items-center justify-between">
                            <p className="text-base font-semibold text-primary">Atendimento {num}</p>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusBadgeClass(appt.appointment_status.code)}`}>
                                {appt.appointment_status.description}
                            </span>
                        </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Building2 className="size-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Unidade</p>
                                    <p className="text-sm font-medium text-foreground">{appt.units.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <CalendarDays className="size-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Data</p>
                                    <p className="text-sm font-medium text-foreground">{formatDate(appt.schedules.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Clock className="size-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Horário</p>
                                    <p className="text-sm font-medium text-foreground">{appt.schedule_slots.startTime.slice(0, 5)} – {appt.schedule_slots.endTime.slice(0, 5)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <User className="size-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Profissional</p>
                                    <p className="text-sm font-medium text-foreground">{appt.professional_user.socialName || appt.professional_user.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Stethoscope className="size-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Especialidade</p>
                                    <p className="text-sm font-medium text-foreground">{appt.specialties.name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <ClipboardList className="size-3.5 text-muted-foreground" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-muted-foreground">Procedimento</p>
                                    <p className="text-sm font-medium text-foreground">{appt.procedures.description}</p>
                                </div>
                            </div>
                        </div>
                        {(appt.diagnostics || appt.evolution || appt.clinicNotes || (appt.requests && appt.requests.length > 0) || (appt.external_requests && appt.external_requests.length > 0)) && (
                            <div className="border-t border-border px-4 py-3">
                                <button
                                    type="button"
                                    onClick={() => toggleExpanded(appt.id)}
                                    className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors cursor-pointer"
                                >
                                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expandedIds.has(appt.id) ? "rotate-180" : ""}`} />
                                    {expandedIds.has(appt.id) ? "Ocultar registros clínicos" : "Ver registros clínicos"}
                                </button>
                                {expandedIds.has(appt.id) && (
                                    <div className="flex flex-col gap-3 mt-3">
                                        {appt.diagnostics && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Diagnóstico</p>
                                                <p className="text-sm text-foreground">{appt.diagnostics}</p>
                                            </div>
                                        )}
                                        {appt.evolution && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Evolução</p>
                                                <p className="text-sm text-foreground">{appt.evolution}</p>
                                            </div>
                                        )}
                                        {appt.clinicNotes && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Notas clínicas</p>
                                                <p className="text-sm text-foreground">{appt.clinicNotes}</p>
                                            </div>
                                        )}
                                        {appt.requests && appt.requests.length > 0 && (
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Procedimentos internos</p>
                                                <div className="flex flex-col gap-2">
                                                    {appt.requests.map((req) => (
                                                        <div key={req.id} className="rounded-md border border-border p-3 flex flex-col gap-2">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-sm font-medium text-foreground">
                                                                    {req.internalProcedures.code} - {req.internalProcedures.description}
                                                                </p>
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusBadgeClass(req.request_status.code)}`}>
                                                                    {req.request_status.description}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                                <div>
                                                                    <span className="font-medium">Valor:</span> R$ {parseFloat(req.internalProcedures.price).toFixed(2).replace(".", ",")}
                                                                </div>
                                                                {req.performedAt && (
                                                                    <div>
                                                                        <span className="font-medium">Realizado em:</span> {formatDate(req.performedAt)}
                                                                    </div>
                                                                )}
                                                                {req.complementaryInfo && (
                                                                    <div className="col-span-2">
                                                                        <span className="font-medium">Info. complementar:</span> {req.complementaryInfo}
                                                                    </div>
                                                                )}
                                                                {req.justification && (
                                                                    <div className="col-span-2">
                                                                        <span className="font-medium">Justificativa:</span> {req.justification}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {req.request_results?.releasedAt && (
                                                                <div className="pt-2 border-t border-border text-xs">
                                                                    <span className="font-medium text-green-600 dark:text-green-400">Resultado disponível</span>
                                                                    {req.request_results.complementaryInfo && (
                                                                        <p className="mt-0.5 text-muted-foreground">{req.request_results.complementaryInfo}</p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {appt.external_requests && appt.external_requests.length > 0 && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-xs text-muted-foreground">Procedimentos externos</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => openPdfPreview(appt.id)}
                                                        className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        Ver requisição
                                                    </button>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {appt.external_requests.map((req) => (
                                                        <div key={req.id} className="text-sm text-foreground">
                                                            {req.externalProcedures.code} - {req.externalProcedures.description}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    )
                })}
            </div>

            {pdfPreviewOpen && (
                <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
                    <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border shrink-0">
                        <p className="text-sm font-semibold text-foreground">Requisição Externa</p>
                        <div className="flex items-center gap-2">
                            {pdfBlobUrl && (
                                <>
                                    <button
                                        type="button"
                                        onClick={handlePrint}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
                                    >
                                        <Printer className="h-3.5 w-3.5" />
                                        Imprimir
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDownload}
                                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                    </button>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={closePdfPreview}
                                className="flex items-center justify-center h-7 w-7 rounded-md hover:bg-muted transition-colors cursor-pointer"
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {isPdfLoading && (
                            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                                Carregando documento...
                            </div>
                        )}
                        {pdfError && (
                            <div className="flex items-center justify-center h-full px-6">
                                <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                    {pdfError}
                                </div>
                            </div>
                        )}
                        {pdfBlobUrl && (
                            <iframe
                                ref={pdfIframeRef}
                                src={pdfBlobUrl}
                                className="w-full h-full"
                                title="Requisição Externa"
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

// --- Component ---

export function Prontuario() {
    const [searchMode, setSearchMode] = useState<SearchMode>("cpf")
    const [cpfInput, setCpfInput] = useState("")
    const [cpfError, setCpfError] = useState<string | null>(null)
    const [nameInput, setNameInput] = useState("")
    const [nameResults, setNameResults] = useState<NameSearchResult[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [isNameSearching, setIsNameSearching] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [searchError, setSearchError] = useState<string | null>(null)
    const skipNameSearchRef = useRef(false)

    const [userId, setUserId] = useState<string | null>(null)
    const { patientData, isLoading: isLoadingRecords, error: recordsError } = useMedicalRecords(userId)

    useEffect(() => {
        if (skipNameSearchRef.current) {
            skipNameSearchRef.current = false
            return
        }
        if (searchMode !== "nome" || nameInput.trim().length < 3) {
            setNameResults([])
            setShowDropdown(false)
            return
        }
        setIsNameSearching(true)
        const timer = setTimeout(async () => {
            try {
                const data = await fetchWithAuth<PatientSearchApiResponse[]>(
                    `${authBaseUrl}/patients/patient-full-data-by-user-name?name=${encodeURIComponent(nameInput.trim())}&isActive=true`,
                )
                const results: NameSearchResult[] = Array.isArray(data)
                    ? data.map((item) => ({
                        id: item.id,
                        userId: item.users.id,
                        name: item.users.socialName || item.users.name,
                        cpf: formatCpf(item.users.cpf),
                    }))
                    : []
                setNameResults(results)
                setShowDropdown(results.length > 0)
            } catch {
                setNameResults([])
                setShowDropdown(false)
            } finally {
                setIsNameSearching(false)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [nameInput, searchMode])

    const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCpf(e.target.value)
        setCpfInput(formatted)
        setCpfError(null)
        setSearchError(null)
        setUserId(null)
    }

    const handleSearch = async () => {
        if (!isValidCpf(cpfInput)) {
            setCpfError("CPF deve ter 11 dígitos")
            return
        }
        setIsSearching(true)
        setSearchError(null)
        setUserId(null)
        const cpfDigits = cpfInput.replace(/\D/g, "")
        try {
            const data = await fetchWithAuth<PatientSearchApiResponse>(
                `${authBaseUrl}/patients/patient-full-data-by-user-cpf/${cpfDigits}?isActive=true`,
            )
            setUserId(data.users.id)
        } catch (err) {
            const message = err instanceof Error ? err.message : ""
            const isNotFound = message.includes("404") || message.toLowerCase().includes("not found") || message.toLowerCase().includes("não encontrado")
            setSearchError(isNotFound ? "Nenhum paciente encontrado com esse CPF." : "Erro ao buscar paciente. Tente novamente.")
        } finally {
            setIsSearching(false)
        }
    }

    const handleSelectMode = (mode: SearchMode) => {
        setSearchMode(mode)
        setUserId(null)
        setSearchError(null)
        setCpfInput("")
        setCpfError(null)
        setNameInput("")
        setNameResults([])
        setShowDropdown(false)
    }

    const handleSelectPatient = (result: NameSearchResult) => {
        skipNameSearchRef.current = true
        setUserId(result.userId)
        setShowDropdown(false)
        setNameInput(result.name)
    }

    const nameResultsForSearch: SearchResultItem[] = nameResults.map((r) => ({
        id: r.id,
        name: r.name,
        cpf: r.cpf,
    }))

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title="Prontuário" />

            <main className="flex-1 flex flex-col px-4 py-6 md:px-6 md:py-8 gap-6">

                <CpfNameSearch
                    cpfValue={cpfInput}
                    onCpfChange={handleCpfChange}
                    cpfError={cpfError}
                    onSearch={handleSearch}
                    isSearching={isSearching}
                    isValidCpf={isValidCpf(cpfInput)}
                    searchMode={searchMode}
                    onModeChange={handleSelectMode}
                    nameValue={nameInput}
                    onNameChange={(e) => { setNameInput(e.target.value); setUserId(null); setSearchError(null) }}
                    isNameSearching={isNameSearching}
                    nameResults={nameResultsForSearch}
                    showDropdown={showDropdown}
                    onSelectResult={(result) => {
                        const r = nameResults.find((n) => n.id === result.id)
                        if (r) handleSelectPatient(r)
                    }}
                    noResultsText="Nenhum paciente encontrado."
                />

                {searchError && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {searchError}
                    </div>
                )}

                {userId && (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="px-6 py-4 bg-primary">
                            {isLoadingRecords
                                ? <div className="h-5 w-48 rounded bg-white/20 animate-pulse" />
                                : <h2 className="text-base font-semibold text-white">Prontuário do Paciente</h2>
                            }
                        </div>

                        {/* Dados do paciente */}
                        <div className="px-6 py-5 border-b border-border">
                            {isLoadingRecords ? (
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Bloco 1 skeleton */}
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-full bg-muted animate-pulse shrink-0" />
                                        <div className="flex flex-col gap-2 flex-1">
                                            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                                            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                                        </div>
                                    </div>
                                    {/* Blocos 2 e 3 skeleton */}
                                    {[0, 1].map((b) => (
                                        <div key={b} className="flex flex-col gap-3">
                                            {[0, 1].map((i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <div className="mt-0.5 size-7 shrink-0 rounded-lg bg-muted animate-pulse" />
                                                    <div className="flex flex-col gap-1.5 flex-1">
                                                        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                                                        <div className="h-4 w-full rounded bg-muted animate-pulse" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : patientData ? (
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Bloco 1: Avatar + nome + CPF */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {(patientData.socialName || patientData.name).charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-semibold text-foreground">{patientData.socialName || patientData.name}</p>
                                            <p className="text-sm text-muted-foreground">{formatCpf(patientData.cpf)}</p>
                                        </div>
                                    </div>
                                    {/* Bloco 2: Nascimento + sexo */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <Calendar className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">Nascimento</p>
                                                <p className="text-sm font-medium text-foreground">{formatDate(patientData.birthdate)} · {formatAge(patientData.birthdate)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <PersonStanding className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">Sexo</p>
                                                <p className="text-sm font-medium text-foreground">{formatSex(patientData.sex)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Bloco 3: Telefone + email */}
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <Phone className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">Telefone</p>
                                                <p className="text-sm font-medium text-foreground">{formatPhone(patientData.phone ?? "")}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <Mail className="size-3.5 text-muted-foreground" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-muted-foreground">E-mail</p>
                                                <p className="text-sm font-medium text-foreground truncate">{patientData.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Registros */}
                        <div className="p-4 bg-muted/20">
                            <PatientMedicalRecords patientData={patientData} isLoading={isLoadingRecords} error={recordsError} />
                        </div>
                    </div>
                )}

                {!userId && !searchError && (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
                        <User className="h-10 w-10 opacity-20" />
                        <p className="text-sm">Busque um paciente para visualizar o prontuário</p>
                    </div>
                )}

            </main>
        </div>
    )
}

export default Prontuario

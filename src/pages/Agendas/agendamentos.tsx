import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { AlertTriangle, Calendar, CheckCircle2, ClipboardList, Clock, Info, MapPin, User, UserCheck, Wallet } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { CpfNameSearch } from "@/components/cpf-name-search"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"
import { digitsOnly } from "../Profissionais/edicao-profissionais"
import { BackButton, SaveButton } from "@/components/ui/buttons"
import { useSessionUnit } from "@/contexts/session-unit-context"

// --- Types ---

interface ScheduleSlotApiResponse {
    id: string
    startTime: string
    endTime: string
    isAvailable: boolean
    isActive: boolean
    schedule: {
        id: string
        date: string
        startTime: string
        endTime: string
        durationMinutes: number
    }
    professional_unit: {
        id: string
    }
    units: {
        id: string
        name: string
        address: string
        city: string
        state: string
    }
    specialties: {
        id: string
        name: string
    }
    procedures: {
        id: string
        description: string
        code: string
        price: string
        observation: string
    }
}

interface SlotInfo {
    time: string
    endTime: string
    durationMinutes: number
    professionalUnitId: string
    unitName: string
    unitAddress: string
    specialtyName: string
    procedureDescription: string
    procedureCode: string
    procedurePrice: string
    date: string
    isAvailable: boolean
}

interface PatientApiResponse {
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

type SearchMode = "cpf" | "nome"

interface PatientInfo {
    id: string
    name: string
    cpf: string
    birthdate: string
    email: string
    phone: string
    sex: string
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

function formatPhone(value: string) {
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

// --- Component ---

export function Agendamentos() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { sessionUnit } = useSessionUnit()
    const isMedic = sessionUnit?.selectedRoles?.key === "medic"
    const sessionProfessionalUnitId = sessionUnit?.selectedProfessionalUnitId ?? null

    const scheduleSlotId = searchParams.get("scheduleSlotId") ?? ""
    const date = searchParams.get("date") ?? ""
    const professionalName = searchParams.get("professionalName") ?? ""
    const specialtyName = searchParams.get("specialtyName") ?? ""

    const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null)
    const [isSlotLoading, setIsSlotLoading] = useState(false)

    const [searchMode, setSearchMode] = useState<SearchMode>("cpf")
    const [cpfInput, setCpfInput] = useState("")
    const [cpfError, setCpfError] = useState<string | null>(null)
    const [nameInput, setNameInput] = useState("")
    const [nameResults, setNameResults] = useState<PatientInfo[]>([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [isNameSearching, setIsNameSearching] = useState(false)
    const [isSearching, setIsSearching] = useState(false)
    const [patient, setPatient] = useState<PatientInfo | null>(null)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [isScheduling, setIsScheduling] = useState(false)
    const [scheduleSuccess, setScheduleSuccess] = useState(false)
    const [scheduleError, setScheduleError] = useState<string | null>(null)
    const skipNameSearchRef = useRef(false)

    useEffect(() => {
        if (!scheduleSlotId) return
        setIsSlotLoading(true)
        fetchWithAuth<ScheduleSlotApiResponse>(`${authBaseUrl}/schedules/full-slot/${scheduleSlotId}`)
            .then((data) => {
                setSlotInfo({
                    time: data.startTime.slice(0, 5),
                    endTime: data.endTime.slice(0, 5),
                    durationMinutes: data.schedule.durationMinutes,
                    professionalUnitId: data.professional_unit.id,
                    unitName: data.units.name,
                    unitAddress: [data.units.address, data.units.city, data.units.state].filter(Boolean).join(", "),
                    specialtyName: data.specialties.name,
                    procedureDescription: data.procedures.description,
                    procedureCode: data.procedures.code,
                    procedurePrice: data.procedures.price,
                    date: new Date(`${data.schedule.date}T12:00:00`).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
                    isAvailable: data.isAvailable,
                })
            })
            .catch(() => {})
            .finally(() => setIsSlotLoading(false))
    }, [scheduleSlotId])

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
                const data = await fetchWithAuth<PatientApiResponse[]>(
                    `${authBaseUrl}/patients/patient-full-data-by-user-name?name=${encodeURIComponent(nameInput.trim())}&isActive=true`,
                )
                const results = Array.isArray(data) ? data.map((item) => ({
                    id: item.id,
                    name: item.users.socialName || item.users.name,
                    cpf: formatCpf(item.users.cpf),
                    birthdate: new Date(item.users.birthdate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
                    email: item.users.email,
                    phone: formatPhone(item.users.phone ?? ""),
                    sex: item.users.sex ?? "Não informado",
                })) : []
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
        setPatient(null)
    }

    const handleSearch = async () => {
        if (!isValidCpf(cpfInput)) {
            setCpfError("CPF deve ter 11 dígitos")
            return
        }
        setIsSearching(true)
        setSearchError(null)
        setPatient(null)
        const cpfDigits = cpfInput.replace(/\D/g, "")
        try {
            const data = await fetchWithAuth<PatientApiResponse>(
                `${authBaseUrl}/patients/patient-full-data-by-user-cpf/${cpfDigits}?isActive=true`,
            )
            setPatient({
                id: data.id,
                name: data.users.socialName || data.users.name,
                cpf: formatCpf(data.users.cpf),
                birthdate: new Date(data.users.birthdate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
                email: data.users.email,
                phone: formatPhone(data.users.phone ?? ""),
                sex: data.users.sex ?? "Não informado",
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : ""
            const isNotFound = message.includes("404") || message.toLowerCase().includes("not found") || message.toLowerCase().includes("não encontrado")
            setSearchError(
                isNotFound
                    ? "Nenhum paciente encontrado com esse CPF."
                    : "Erro ao buscar paciente. Tente novamente.",
            )
        } finally {
            setIsSearching(false)
        }
    }

    const handleSelectMode = (mode: SearchMode) => {
        setSearchMode(mode)
        setPatient(null)
        setSearchError(null)
        setCpfInput("")
        setCpfError(null)
        setNameInput("")
        setNameResults([])
        setShowDropdown(false)
    }

    const handleSelectPatient = (p: PatientInfo) => {
        skipNameSearchRef.current = true
        setPatient(p)
        setShowDropdown(false)
        setNameInput(p.name)
    }

    const handleAgendar = async () => {
        if (!patient) return
        setIsScheduling(true)
        setScheduleError(null)
        try {
            await fetchWithAuth(`${authBaseUrl}/appointments/`, {
                method: "POST",
                body: JSON.stringify({
                    patientId: patient.id,
                    professionalUnitId: slotInfo?.professionalUnitId,
                    scheduleSlotId,
                    statusCode: 1,
                }),
            })
            setScheduleSuccess(true)
        } catch (err) {
            const message = err instanceof Error ? err.message : ""
            setScheduleError(message || "Erro ao verificar disponibilidade. Tente novamente.")
        } finally {
            setIsScheduling(false)
        }
    }

    if (scheduleSuccess) {
        return (
            <div className="flex flex-col h-full min-h-screen bg-background">
                <PageHeader title="Agendamento" />
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Agendamento realizado!</h2>
                    <p className="text-sm text-muted-foreground text-center">
                        {patient?.name} foi agendado(a) para {slotInfo?.date || date} às {slotInfo?.time || "—"} com {professionalName}.
                    </p>
                    <BackButton onClick={() => navigate(-1)} >
                        Voltar às agendas
                    </BackButton>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PageHeader title="Agendamento" />
            <main className="flex-1 flex flex-col px-4 py-6 md:px-6 md:py-8 gap-6">

                {/* Busca full-width */}
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
                    onNameChange={(e) => { setNameInput(e.target.value); setPatient(null); setSearchError(null) }}
                    isNameSearching={isNameSearching}
                    nameResults={nameResults}
                    showDropdown={showDropdown}
                    onSelectResult={(result) => {
                        const p = nameResults.find((n) => n.id === result.id)
                        if (p) handleSelectPatient(p)
                    }}
                    noResultsText="Nenhum paciente encontrado."
                />

                {searchError && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {searchError}
                    </div>
                )}

                {/* Cards lado a lado */}
                <div className="grid grid-cols-2 gap-6">

                    {/* Card paciente */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h2 className="text-base font-semibold text-foreground">Paciente</h2>
                        </div>
                        <div className="px-6 py-5">
                            {patient ? (
                                <div className="flex flex-col gap-5">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <UserCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-foreground">{patient.name}</p>
                                            <p className="text-sm text-muted-foreground">{patient.cpf}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Data de nascimento</p>
                                            <p className="text-sm font-medium text-foreground">{patient.birthdate}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Sexo</p>
                                            <p className="text-sm font-medium text-foreground">{patient.sex}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                                            <p className="text-sm font-medium text-foreground">{patient.phone}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">E-mail</p>
                                            <p className="text-sm font-medium text-foreground truncate">{patient.email}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
                                    <User className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">Busque um paciente para continuar</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card resumo da consulta */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h2 className="text-base font-semibold text-foreground">Resumo da Consulta</h2>
                        </div>
                        <div className="px-6 py-5">
                            {isSlotLoading ? (
                                <div className="flex flex-col gap-4 border-l-2 border-primary pl-4">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="h-5 w-5 rounded bg-muted animate-pulse shrink-0" />
                                            <div className="h-4 rounded bg-muted animate-pulse flex-1" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4 border-l-2 border-primary pl-4">
                                    {/* Médico */}
                                    <div className="flex items-center gap-4">
                                        <UserCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-base font-semibold text-foreground">{professionalName || "Profissional"}</p>
                                            <p className="text-sm text-muted-foreground">{slotInfo?.specialtyName || specialtyName || "Especialidade"}</p>
                                        </div>
                                    </div>

                                    {/* Unidade */}
                                    {slotInfo?.unitName && (
                                        <div className="flex items-start gap-4">
                                            <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-base font-semibold text-foreground">{slotInfo.unitName}</p>
                                                {slotInfo.unitAddress && (
                                                    <p className="text-sm text-muted-foreground">{slotInfo.unitAddress}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Procedimento */}
                                    {slotInfo?.procedureDescription && (
                                        <div className="flex items-start gap-4">
                                            <ClipboardList className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-base font-semibold text-foreground">{slotInfo.procedureDescription}</p>
                                                {slotInfo.procedureCode && (
                                                    <p className="text-sm text-muted-foreground">Cód. {slotInfo.procedureCode}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Data */}
                                    <div className="flex items-center gap-4">
                                        <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-base font-semibold text-foreground">{slotInfo?.date || date || "—"}</p>
                                            {slotInfo?.date && (
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {new Date(`${slotInfo.date.split("/").reverse().join("-")}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" })}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hora */}
                                    <div className="flex items-center gap-4">
                                        <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div>
                                            <p className="text-base font-semibold text-foreground">
                                                {slotInfo ? `${slotInfo.time} – ${slotInfo.endTime}` : "—"}
                                            </p>
                                            {slotInfo?.durationMinutes && (
                                                <p className="text-sm text-muted-foreground">{slotInfo.durationMinutes} min</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Valor */}
                                    {slotInfo?.procedurePrice && (
                                        <div className="flex items-center gap-4">
                                            <Wallet className="h-5 w-5 text-muted-foreground shrink-0" />
                                            <p className="text-base font-semibold text-foreground">
                                                R$ {parseFloat(slotInfo.procedurePrice).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card de status de disponibilidade */}
                {!isSlotLoading && slotInfo && !scheduleError && (
                    slotInfo.isAvailable ? (
                        <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>Horário <span className="font-semibold">disponível</span> para agendamento.</span>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>Este horário está <span className="font-semibold">ocupado</span> e não pode ser agendado.</span>
                        </div>
                    )
                )}

                {scheduleError && (
                    <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{scheduleError}</span>
                    </div>
                )}

                {isMedic && slotInfo && sessionProfessionalUnitId && slotInfo.professionalUnitId !== sessionProfessionalUnitId && (
                    <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Você não tem permissão para agendar em uma agenda de outro profissional.</span>
                    </div>
                )}

                {/* Rodapé */}
                <div className="mt-auto flex items-center justify-end gap-2 border-t pt-5">
                    <BackButton onClick={() => navigate(-1)} />
                    <SaveButton
                        type="button"
                        isSaving={isScheduling}
                        disabled={!patient || slotInfo?.isAvailable === false || (isMedic && !!sessionProfessionalUnitId && slotInfo?.professionalUnitId !== sessionProfessionalUnitId)}
                        onClick={handleAgendar}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                        label="Gravar"
                        savingLabel="Gravando..."
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 gap-2 disabled:cursor-not-allowed"
                    />
                </div>

            </main>
        </div>
    )
}

export default Agendamentos

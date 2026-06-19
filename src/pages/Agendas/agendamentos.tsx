import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { ArrowLeft, Calendar, CheckCircle2, Clock, Search, User, UserCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"
import { digitsOnly } from "../Profissionais/edicao-profissionais"

// --- Types ---

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

    const scheduleSlotId = searchParams.get("scheduleSlotId") ?? ""
    const time = searchParams.get("time") ?? ""
    const date = searchParams.get("date") ?? ""
    const professionalName = searchParams.get("professionalName") ?? ""

    const [cpfInput, setCpfInput] = useState("")
    const [cpfError, setCpfError] = useState<string | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [patient, setPatient] = useState<PatientInfo | null>(null)
    const [searchError, setSearchError] = useState<string | null>(null)
    const [isScheduling, setIsScheduling] = useState(false)
    const [scheduleSuccess, setScheduleSuccess] = useState(false)

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
                cpf: data.users.cpf,
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

    const handleAgendar = async () => {
        if (!patient) return
        setIsScheduling(true)
        try {
            // TODO: chamar rota de agendamento (scheduleSlotId + patientId)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            setScheduleSuccess(true)
        } catch {
            // handle error
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
                        {patient?.name} foi agendado(a) para {date} às {time} com {professionalName}.
                    </p>
                    <Button onClick={() => navigate(-1)} className="mt-2 cursor-pointer">
                        Voltar às agendas
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
        <PageHeader title="Agendamento" />
        <main className="flex-1 flex flex-col px-4 py-6 md:px-6 md:py-8">

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Esquerda — Busca de paciente */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground mb-0.5">Informações do Paciente</h2>
                            <p className="text-xs text-muted-foreground">Busque o paciente pelo CPF para prosseguir com o agendamento.</p>
                        </div>

                        {/* Campo CPF + botão buscar */}
                        <div className="flex gap-2 items-start">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-xs font-medium text-muted-foreground">CPF</label>
                                <Input
                                    value={cpfInput}
                                    onChange={handleCpfChange}
                                    onKeyDown={(e) => e.key === "Enter" && !isSearching && isValidCpf(cpfInput) && handleSearch()}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    className={cpfError ? "border-red-500 focus-visible:ring-red-300" : ""}
                                />
                                {cpfError && <span className="text-xs text-red-500">{cpfError}</span>}
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-transparent select-none">-</label>
                                <Button
                                    onClick={handleSearch}
                                    disabled={isSearching || !isValidCpf(cpfInput)}
                                    className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Search className="w-4 h-4 mr-1.5" />
                                    {isSearching ? "Buscando..." : "Buscar"}
                                </Button>
                            </div>
                        </div>

                        {/* Erro de busca */}
                        {searchError && (
                            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                {searchError}
                            </div>
                        )}

                        {/* Card do paciente */}
                        {patient && (
                            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                                <div className="px-5 py-4 flex items-center gap-3 border-b border-border bg-muted/30">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground leading-tight">{patient.name}</p>
                                        <p className="text-xs text-muted-foreground">CPF: {patient.cpf}</p>
                                    </div>
                                </div>
                                <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Data de nascimento</p>
                                        <p className="font-medium text-foreground">
                                            {patient.birthdate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Sexo</p>
                                        <p className="font-medium text-foreground">
                                            {patient.sex}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">Telefone</p>
                                        <p className="font-medium text-foreground">{patient.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5">E-mail</p>
                                        <p className="font-medium text-foreground">{patient.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Placeholder quando ainda não buscou */}
                        {!patient && !searchError && !isSearching && (
                            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                <User className="h-8 w-8 opacity-30" />
                                <p className="text-sm">Nenhum paciente buscado ainda</p>
                            </div>
                        )}
                    </div>

                    {/* Direita — Informações da agenda/horário */}
                    <div className="flex flex-col gap-4">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground mb-0.5">Informações da Agenda</h2>
                            <p className="text-xs text-muted-foreground">Horário selecionado para o agendamento.</p>
                        </div>

                        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-4 flex items-center gap-3 border-b border-border bg-muted/30">
                                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                    <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground leading-tight">
                                        {professionalName || "Profissional"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Médico(a)</p>
                                </div>
                            </div>

                            <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Data</p>
                                    <p className="font-medium text-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {date || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Horário</p>
                                    <p className="font-medium text-foreground flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        {time || "—"}
                                    </p>
                                </div>
                            </div>

                            <div className="px-5 pb-4">
                                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                        Horário disponível para agendamento
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Resumo quando paciente encontrado */}
                        {patient && (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800 px-5 py-4">
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Resumo do agendamento</p>
                                <div className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                                    <p><span className="font-medium">Paciente:</span> {patient.name}</p>
                                    <p><span className="font-medium">Profissional:</span> {professionalName}</p>
                                    <p><span className="font-medium">Data e hora:</span> {date} às {time}</p>
                                </div>
                            </div>
                        )}

                        {/* ID do slot (referência técnica) */}
                        {scheduleSlotId && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span>ID do horário:</span>
                                <span className="font-mono bg-muted px-2 py-0.5 rounded truncate max-w-xs">{scheduleSlotId}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rodapé — botões */}
                <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => navigate(-1)}
                                className="gap-2 cursor-pointer"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar
                            </Button>

                            <Button
                                onClick={handleAgendar}
                                disabled={!patient || isScheduling}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {isScheduling ? "Agendando..." : "Agendar"}
                            </Button>
                        </div>
                    </div>
            
                </div>
        </main>
        </div>
    )
}

export default Agendamentos

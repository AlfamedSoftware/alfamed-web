import { useEffect, useReducer, useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
    Calendar, Clock, Phone, Mail, Stethoscope, FlaskConical, CheckCircle,
    User, ClipboardList, Hash, PersonStanding, CalendarDays,
    Play, Square, AlertTriangle,
} from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"
import { BackButton, SaveButton } from "@/components/ui/buttons"
import { Button } from "@/components/ui/button"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet"

// --- Types ---

interface ExamDetail {
    id: string
    statusId: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    schedules: {
        id: string
        date: string
        startTime: string
        endTime: string
        procedures: { id: string; description: string; code: string }
        specialties: { id: string; name: string }
    }
    schedules_slots: {
        id: string
        startTime: string
        endTime: string
    }
    patients: {
        id: string
        name: string
        socialName: string
        cpf: string
        phone: string
        email: string
        sex: string
        birthdate: string
    }
    professional_units: {
        id: string
        professional: {
            id: string
            crm: string
            user: { id: string; name: string }
        }
    }
    requests: {
        id: string
        statusId: string
        statusCode: number
        statusDescription: string
        performedAt: string
        complementaryInfo: string
        justification: string
        procedures: {
            id: string
            description: string
            code: string
            price: string
        }
        createdAt: string
        updatedAt: string
    }[]
}

// --- Status config ---

const STATUS_CONFIG: Record<number, { label: string; badgeClass: string }> = {
    2: { label: "Aguardando realização", badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
    3: { label: "Paciente em exame",     badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"    },
}

// --- Fetch reducer ---

type FetchState  = { data: ExamDetail | null; isLoading: boolean; error: string | null }
type FetchAction =
    | { type: "loading" }
    | { type: "success"; data: ExamDetail }
    | { type: "error"; message: string }

function fetchReducer(_: FetchState, action: FetchAction): FetchState {
    switch (action.type) {
        case "loading": return { data: null,        isLoading: true,  error: null }
        case "success": return { data: action.data, isLoading: false, error: null }
        case "error":   return { data: null,        isLoading: false, error: action.message }
    }
}

// --- Helpers ---

function formatDate(dateStr: string): string {
    if (!dateStr) return "—"
    const [y, m, d] = dateStr.split("-")
    return `${d}/${m}/${y}`
}

function formatTime(timeStr: string): string {
    return timeStr?.slice(0, 5) ?? "—"
}

function formatCpf(cpf: string): string {
    const d = cpf?.replace(/\D/g, "") ?? ""
    if (d.length !== 11) return cpf
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

function formatPhone(phone: string): string {
    const d = phone?.replace(/\D/g, "") ?? ""
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return phone || "Não informado"
}

function formatSex(sex: string): string {
    if (sex === "M") return "Masculino"
    if (sex === "F") return "Feminino"
    if (sex === "O") return "Outro"
    return sex || "Não informado"
}

function formatPrice(price: string): string {
    const num = parseFloat(price)
    if (isNaN(num)) return "—"
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num)
}

function formatBRL(value: number): string {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

function getDayOfWeek(yyyymmdd: string): string {
    if (!yyyymmdd) return ""
    const day = new Date(`${yyyymmdd}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", timeZone: "America/Sao_Paulo" })
    return day.charAt(0).toUpperCase() + day.slice(1)
}

function calcDuration(start?: string, end?: string): number | null {
    if (!start || !end) return null
    const [sh, sm] = start.split(":").map(Number)
    const [eh, em] = end.split(":").map(Number)
    const diff = (eh * 60 + em) - (sh * 60 + sm)
    return diff > 0 ? diff : null
}

function calcAge(yyyymmdd: string): number | null {
    if (!yyyymmdd) return null
    const [y, m, d] = yyyymmdd.split("-")
    const birth = new Date(Number(y), Number(m) - 1, Number(d))
    if (isNaN(birth.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
    return age
}

// --- InfoRow ---

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-3.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
        </div>
    )
}

// --- Sheet type ---

type ActiveSheet = "finalizar" | "encerrar" | null

// --- Main component ---

export function DetalhesGestaoExames() {
    const navigate = useNavigate()
    const { appointmentId } = useParams<{ appointmentId: string }>()

    const [{ data, isLoading, error }, dispatch] = useReducer(fetchReducer, {
        data: null, isLoading: false, error: null,
    })

    const [isSubmitting,      setIsSubmitting]      = useState(false)
    const [activeSheet,       setActiveSheet]       = useState<ActiveSheet>(null)
    const [complementaryInfo, setComplementaryInfo] = useState("")
    const [justification,     setJustification]     = useState("")

    useEffect(() => {
        if (!appointmentId) return
        dispatch({ type: "loading" })
        fetchWithAuth<ExamDetail>(`${authBaseUrl}/exam-management/${appointmentId}`)
            .then((d) => dispatch({ type: "success", data: d }))
            .catch((err) =>
                dispatch({ type: "error", message: err instanceof Error ? err.message : "Erro ao carregar detalhes" })
            )
    }, [appointmentId])

    const currentStatus = data?.requests[0]?.statusCode ?? null
    const statusCfg     = currentStatus !== null ? STATUS_CONFIG[currentStatus] : null

    const total = data?.requests.reduce((sum, r) => {
        const price = parseFloat(r.procedures?.price ?? "0")
        return sum + (isNaN(price) ? 0 : price)
    }, 0) ?? 0

    const callPatch = async (path: string, body?: unknown) => {
        if (!appointmentId) return
        setIsSubmitting(true)
        try {
            await fetchWithAuth(`${authBaseUrl}/exam-management/${appointmentId}/${path}`, {
                method: "PATCH",
                ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
            })
            navigate(-1)
        } catch (err) {
            console.error(err)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleIniciar = () => void callPatch("iniciar")

    const handleFinalizar = () => {
        const body = complementaryInfo.trim() ? { complementaryInfo: complementaryInfo.trim() } : undefined
        void callPatch("finalizar", body)
    }

    const handleEncerrar = () => {
        const statusCode = currentStatus === 3 ? 7 : 8
        void callPatch("encerrar", { statusCode, justification: justification.trim() })
    }

    const closeSheet = () => setActiveSheet(null)

    const patientDisplayName = data?.patients?.socialName || data?.patients?.name || "—"

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PageHeader title="Detalhes do Exame" />

            <main className="flex-1 flex flex-col px-4 py-6 md:px-6 md:py-8 gap-6">
                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mb-3" />
                        <p className="text-sm">Carregando detalhes...</p>
                    </div>
                )}

                {!isLoading && data && (
                    <>
                        {/* Status badge */}
                        {statusCfg && (
                            <div>
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusCfg.badgeClass}`}>
                                    {statusCfg.label}
                                </span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            {/* Paciente */}
                            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                                <div className="px-4 py-3 bg-primary">
                                    <p className="text-base font-semibold text-white">Paciente</p>
                                </div>
                                <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-3">
                                    <InfoRow icon={User}           label="Nome"       value={patientDisplayName} />
                                    <InfoRow icon={Hash}           label="CPF"        value={data.patients?.cpf ? formatCpf(data.patients.cpf) : "—"} />
                                    <InfoRow icon={Calendar}       label="Nascimento" value={data.patients?.birthdate ? `${formatDate(data.patients.birthdate)} · ${calcAge(data.patients.birthdate) ?? "—"} anos` : "—"} />
                                    <InfoRow icon={PersonStanding} label="Sexo"       value={formatSex(data.patients?.sex)} />
                                    <InfoRow icon={Phone}          label="Telefone"   value={data.patients?.phone ? formatPhone(data.patients.phone) : "Não informado"} />
                                    <InfoRow icon={Mail}           label="E-mail"     value={data.patients?.email || "Não informado"} />
                                </div>
                            </div>

                            {/* Atendimento */}
                            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                                <div className="px-4 py-3 bg-primary">
                                    <p className="text-base font-semibold text-white">Atendimento</p>
                                </div>
                                <div className="p-4 flex flex-col gap-3">
                                    <InfoRow icon={User}          label="Profissional"  value={data.professional_units?.professional?.user?.name ?? "—"} />
                                    <InfoRow icon={Stethoscope}   label="Especialidade" value={data.schedules?.specialties?.name ?? "—"} />
                                    <InfoRow icon={ClipboardList} label="Procedimento"  value={data.schedules?.procedures?.description ?? "—"} />
                                    <InfoRow icon={CalendarDays}  label="Data"          value={data.schedules?.date ? `${formatDate(data.schedules.date)} · ${getDayOfWeek(data.schedules.date)}` : "—"} />
                                    <InfoRow icon={Clock}         label="Horário"       value={`${formatTime(data.schedules_slots?.startTime)} – ${formatTime(data.schedules_slots?.endTime)}${calcDuration(data.schedules_slots?.startTime, data.schedules_slots?.endTime) !== null ? ` · ${calcDuration(data.schedules_slots?.startTime, data.schedules_slots?.endTime)} min` : ""}`} />
                                </div>
                            </div>
                        </div>

                        {/* Exames Solicitados */}
                        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                            <div className="px-4 py-3 bg-primary flex items-center justify-between">
                                <p className="text-base font-semibold text-white">Exames Solicitados</p>
                                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                                    {data.requests.length} {data.requests.length === 1 ? "exame" : "exames"}
                                </span>
                            </div>
                            <div className="p-4">
                                {data.requests.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">Nenhum exame solicitado.</p>
                                ) : (
                                    <div className="flex flex-col">
                                        {data.requests.map((req) => (
                                            <div key={req.id} className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0 first:pt-0">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                        <FlaskConical className="size-3.5 text-muted-foreground" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">{req.procedures?.description ?? "—"}</p>
                                                        {req.procedures?.code && (
                                                            <p className="text-xs text-muted-foreground">Cód. {req.procedures.code}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-foreground shrink-0">
                                                    {formatPrice(req.procedures?.price)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between pt-4">
                                            <p className="text-base font-semibold text-foreground">Total</p>
                                            <p className="text-base font-semibold text-foreground">{formatBRL(total)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div className="mt-auto flex items-center justify-end gap-2 border-t pt-5">
                    <BackButton onClick={() => navigate(-1)} />

                    {currentStatus === 2 && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                disabled={isSubmitting}
                                onClick={() => setActiveSheet("encerrar")}
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Encerrar
                            </Button>
                            <SaveButton
                                type="button"
                                label="Iniciar Exame"
                                savingLabel="Iniciando..."
                                isSaving={isSubmitting}
                                disabled={!data || isLoading}
                                icon={<Play className="w-4 h-4" />}
                                onClick={handleIniciar}
                            />
                        </>
                    )}

                    {currentStatus === 3 && (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                disabled={isSubmitting}
                                onClick={() => setActiveSheet("encerrar")}
                                className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 cursor-pointer"
                            >
                                <AlertTriangle className="w-4 h-4" />
                                Encerrar
                            </Button>
                            <SaveButton
                                type="button"
                                label="Finalizar Exame"
                                savingLabel="Finalizando..."
                                isSaving={isSubmitting}
                                disabled={!data || isLoading}
                                icon={<CheckCircle className="w-4 h-4" />}
                                onClick={() => setActiveSheet("finalizar")}
                            />
                        </>
                    )}

                </div>
            </main>

            {/* Sheet — Finalizar exame (3 → 4) */}
            <Sheet open={activeSheet === "finalizar"} onOpenChange={(open) => { if (!open) closeSheet() }}>
                <SheetContent side="right" className="flex flex-col gap-0 p-0">
                    <SheetHeader className="p-6 pb-4 border-b">
                        <SheetTitle>Finalizar exame</SheetTitle>
                        <SheetDescription>
                            Confirme a conclusão do exame. Informações complementares são opcionais.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 p-6 flex-1">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Informações complementares{" "}
                                <span className="text-muted-foreground font-normal">(opcional)</span>
                            </label>
                            <textarea
                                value={complementaryInfo}
                                onChange={(e) => setComplementaryInfo(e.target.value)}
                                rows={5}
                                placeholder="Observações sobre o exame..."
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                    <SheetFooter className="border-t px-6 py-4 flex flex-row justify-end gap-2">
                        <Button type="button" variant="outline" size="lg" onClick={closeSheet} className="cursor-pointer">
                            Cancelar
                        </Button>
                        <SaveButton
                            type="button"
                            label="Confirmar finalização"
                            savingLabel="Finalizando..."
                            isSaving={isSubmitting}
                            icon={<CheckCircle className="w-4 h-4" />}
                            onClick={handleFinalizar}
                        />
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Sheet — Encerrar (2 → 8 | 3 → 7) */}
            <Sheet open={activeSheet === "encerrar"} onOpenChange={(open) => { if (!open) closeSheet() }}>
                <SheetContent side="right" className="flex flex-col gap-0 p-0">
                    <SheetHeader className="p-6 pb-4 border-b">
                        <SheetTitle>Encerrar pedido</SheetTitle>
                        <SheetDescription>
                            {currentStatus === 2
                                ? "O paciente não compareceu para realizar o exame."
                                : "O exame não pôde ser realizado."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 p-6 flex-1">
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                            {currentStatus === 2 ? "Status: Paciente não compareceu" : "Status: Exame não realizado"}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">
                                Justificativa <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                rows={5}
                                placeholder="Descreva o motivo do encerramento..."
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                    <SheetFooter className="border-t px-6 py-4 flex flex-row justify-end gap-2">
                        <Button type="button" variant="outline" size="lg" onClick={closeSheet} className="cursor-pointer">
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            size="lg"
                            variant="destructive"
                            disabled={!justification.trim() || isSubmitting}
                            onClick={handleEncerrar}
                            className="cursor-pointer"
                        >
                            <Square className="w-4 h-4" />
                            {isSubmitting ? "Encerrando..." : "Confirmar encerramento"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

        </div>
    )
}

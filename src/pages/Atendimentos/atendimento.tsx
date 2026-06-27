import { useCallback, useEffect, useRef, useState } from "react"
import {
    Mail, Phone, Stethoscope, Clock, Calendar, User, Lock,
    NotebookPen, ClipboardList, BookOpen, ScrollText, FileCheck,
    Microscope, PlayCircle, UserX,
} from "lucide-react"
import { useNavigate, useParams } from "react-router"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { BackButton, SaveButton } from "@/components/ui/buttons"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Anamnese {
    id: string
    appointmentId: string
    mainComplaint: string
    painLevel: number
    takingMedication: string
    knownAllergy: string
    hadSurgery: boolean
    surgeryDetails: string
    familyHistory: boolean
    familyHistoryDetails: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

interface AttendimentFullData {
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
    statusCode: number
    statusDescription: string
    isActive: boolean
    appointment_status: {
        id: string
        code: number
        description: string
        isActive: boolean
    }
    users: {
        id: string
        name: string
        socialName: string
        cpf: string
        birthdate: string
        phone: string
        email: string
        sex: string
        image: string
        isActive: boolean
    }
    schedules: {
        id: string
        date: string
        isActive: boolean
    }
    schedules_slots: {
        id: string
        startTime: string
        endTime: string
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
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useAttendanceSchedule(appointmentId?: string) {
    const [schedule, setSchedule] = useState<AttendimentFullData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refetch = useCallback(async () => {
        if (!appointmentId) {
            setSchedule(null)
            setIsLoading(false)
            return
        }
        setIsLoading(true)
        setError(null)
        try {
            const data = await fetchWithAuth<AttendimentFullData>(
                `${authBaseUrl}/attendiments/attendiment-full-data/${appointmentId}`
            )
            setSchedule(data)
        } catch (err) {
            setSchedule(null)
            setError(err instanceof Error ? err.message : "Falha ao carregar atendimento")
        } finally {
            setIsLoading(false)
        }
    }, [appointmentId])

    useEffect(() => { void refetch() }, [refetch])

    return { schedule, isLoading, error, refetch }
}

function useAnamnese(appointmentId?: string, enabled = false) {
    const [anamnese, setAnamnese] = useState<Anamnese | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetch = useCallback(async () => {
        if (!appointmentId || !enabled) return
        setIsLoading(true)
        setError(null)
        try {
            const data = await fetchWithAuth<Anamnese[]>(`${authBaseUrl}/anamnesis/${appointmentId}`)
            setAnamnese(data?.[0] ?? null)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao carregar anamnese")
        } finally {
            setIsLoading(false)
        }
    }, [appointmentId, enabled])

    useEffect(() => { void fetch() }, [fetch])

    return { anamnese, isLoading, error }
}

function useUpdateScheduleStatus() {
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const patch = async (url: string, body?: object) => {
        setIsUpdating(true)
        setError(null)
        try {
            await fetchWithAuth<void>(url, {
                method: "PATCH",
                ...(body ? { body: JSON.stringify(body) } : {}),
            })
        } catch (err) {
            const message = err instanceof Error ? err.message : "Falha ao atualizar status"
            setError(message)
            throw err
        } finally {
            setIsUpdating(false)
        }
    }

    const iniciar = (id: string) =>
        patch(`${authBaseUrl}/attendiments/${id}/iniciar`)

    const registrarFalta = (id: string) =>
        patch(`${authBaseUrl}/attendiments/${id}/falta`)

    const finalizar = (id: string, data: { diagnostics: string; clinicNotes: string }) =>
        patch(`${authBaseUrl}/attendiments/${id}/finalizar`, data)

    return { iniciar, registrarFalta, finalizar, isUpdating, error }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(birthDate: string) {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    if (
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
    ) age -= 1
    return age
}

function formatBirthdate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
}

function formatSex(value: string) {
    if (value === "M") return "Masculino"
    if (value === "F") return "Feminino"
    return value ? "Outro" : "—"
}

function formatPhone(value: string) {
    if (!value) return "—"
    const digits = value.replace(/\D/g, "").slice(0, 11)
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, digits.length > 10 ? 7 : 6)
    const second = digits.slice(digits.length > 10 ? 7 : 6, digits.length > 10 ? 11 : 10)
    if (!ddd) return digits
    if (!first) return `(${ddd}`
    if (!second) return `(${ddd}) ${first}`
    return `(${ddd}) ${first}-${second}`
}

function formatScheduleDate(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number)
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(
        new Date(year, month - 1, day)
    )
}

function formatSlotTime(timeStr: string) {
    return timeStr.slice(0, 5)
}

function slotDurationMinutes(start: string, end: string) {
    const [sh, sm] = start.split(":").map(Number)
    const [eh, em] = end.split(":").map(Number)
    return Math.max(0, eh * 60 + em - (sh * 60 + sm))
}

function statusBadgeClass(statusCode: number): string {
    switch (statusCode) {
        case 1: return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        case 2: return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        case 3: return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        case 4: return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        default: return "bg-muted text-muted-foreground"
    }
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

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

// ─── Prontuário Tabs ──────────────────────────────────────────────────────────

function EmptyState({ Icon, label, description }: { Icon: React.ElementType; label: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}

function LockedState() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Lock className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Inicie o atendimento para visualizar este campo.</p>
        </div>
    )
}

function TextEditorTab({
    value,
    onChange,
    placeholder,
    isStarted,
    readOnly = false,
}: {
    value: string
    onChange: (v: string) => void
    placeholder: string
    isStarted: boolean
    readOnly?: boolean
}) {
    if (readOnly) {
        return value ? (
            <div className="w-full h-full min-h-[200px] rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-foreground whitespace-pre-wrap overflow-auto">
                {value}
            </div>
        ) : (
            <EmptyState
                Icon={ClipboardList}
                label="Nenhum registro"
                description="Nada foi registrado neste campo."
            />
        )
    }
    if (!isStarted) return <LockedState />
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full min-h-[200px] resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 placeholder:text-muted-foreground"
        />
    )
}

function AnamneseField({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{value || "—"}</p>
        </div>
    )
}

function AnamneseBoolField({ label, value, details, detailsLabel }: { label: string; value: boolean; details: string; detailsLabel: string }) {
    return (
        <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{value ? "Sim" : "Não"}</p>
            {value && (
                <div className="mt-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{detailsLabel}</p>
                    <p className="text-sm font-medium text-foreground">{details || "—"}</p>
                </div>
            )}
        </div>
    )
}

function AnamneseTab({ appointmentId, isStarted }: { appointmentId: string; isStarted: boolean }) {
    const { anamnese, isLoading, error } = useAnamnese(appointmentId, isStarted)

    if (!isStarted) return <LockedState />

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-9 w-full rounded-lg bg-muted animate-pulse" />
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
            </div>
        )
    }

    if (!anamnese) {
        return (
            <EmptyState
                Icon={ClipboardList}
                label="Anamnese não encontrada"
                description="Nenhuma anamnese foi registrada pelo aplicativo móvel."
            />
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <AnamneseField label="Queixa Principal" value={anamnese.mainComplaint} />
                </div>
                <AnamneseField label="Nível de Dor (0–10)" value={String(anamnese.painLevel)} />
                <AnamneseField label="Medicamentos em Uso" value={anamnese.takingMedication} />
                <AnamneseField label="Alergias Conhecidas" value={anamnese.knownAllergy} />
                <AnamneseBoolField
                    label="Passou por Cirurgia?"
                    value={anamnese.hadSurgery}
                    details={anamnese.surgeryDetails}
                    detailsLabel="Detalhes da Cirurgia"
                />
                <AnamneseBoolField
                    label="Histórico Familiar?"
                    value={anamnese.familyHistory}
                    details={anamnese.familyHistoryDetails}
                    detailsLabel="Detalhes do Histórico Familiar"
                />
            </div>
        </div>
    )
}

const ACTIVE_TABS = [
    { key: "anamnese"     as const, label: "Anamnese",               Icon: ClipboardList },
    { key: "clinicNotes"  as const, label: "Notas Clínicas",         Icon: NotebookPen  },
    { key: "prontuario"   as const, label: "Prontuário",             Icon: BookOpen     },
    { key: "diagnostics"  as const, label: "Diagnóstico",            Icon: Stethoscope  },
    { key: "receitas"     as const, label: "Receitas",               Icon: ScrollText   },
    { key: "atestados"    as const, label: "Atestados",              Icon: FileCheck    },
    { key: "exames"       as const, label: "Solicitação de Exames",  Icon: Microscope   },
] as const

type TabKey = typeof ACTIVE_TABS[number]["key"]

function ProntuarioTabs({
    data,
    onValuesChange,
}: {
    data: AttendimentFullData
    onValuesChange: (values: { clinicNotes: string; diagnostics: string }) => void
}) {
    const [activeTab, setActiveTab] = useState<TabKey>("anamnese")
    const [clinicNotes, setClinicNotes] = useState(data.clinicNotes ?? "")
    const [diagnostics, setDiagnostics] = useState(data.diagnostics ?? "")
    const isStarted = data.appointment_status.code === 2
    const isFinished = data.appointment_status.code === 3

    function renderContent() {
        switch (activeTab) {
            case "clinicNotes":
                return (
                    <TextEditorTab
                        value={clinicNotes}
                        onChange={(v) => { setClinicNotes(v); onValuesChange({ clinicNotes: v, diagnostics }) }}
                        placeholder="Registre as notas clínicas do atendimento..."
                        isStarted={isStarted}
                        readOnly={isFinished}
                    />
                )
            case "anamnese":
                return <AnamneseTab appointmentId={data.id} isStarted={isStarted} />
            case "diagnostics":
                return (
                    <TextEditorTab
                        value={diagnostics}
                        onChange={(v) => { setDiagnostics(v); onValuesChange({ clinicNotes, diagnostics: v }) }}
                        placeholder="Registre o diagnóstico do atendimento..."
                        isStarted={isStarted}
                        readOnly={isFinished}
                    />
                )
            default:
                return (
                    <EmptyState
                        Icon={ACTIVE_TABS.find((t) => t.key === activeTab)!.Icon}
                        label={ACTIVE_TABS.find((t) => t.key === activeTab)!.label}
                        description="Este módulo estará disponível em breve."
                    />
                )
        }
    }

    return (
        <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex overflow-x-auto border-b border-border px-2 pt-2 gap-0.5 scrollbar-none">
                {ACTIVE_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            "shrink-0 rounded-t-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                            activeTab === tab.key
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-auto p-6">
                {renderContent()}
            </div>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Atendimento() {
    const { appointmentId } = useParams()
    const navigate = useNavigate()

    const { schedule, isLoading, error, refetch } = useAttendanceSchedule(appointmentId)
    const { iniciar, registrarFalta, finalizar, error: updateError } = useUpdateScheduleStatus()
    const [activeAction, setActiveAction] = useState<"falta" | "iniciar" | "finalizar" | null>(null)
    const pendingValuesRef = useRef({ clinicNotes: "", diagnostics: "" })

    useEffect(() => {
        if (schedule) {
            pendingValuesRef.current = {
                clinicNotes: schedule.clinicNotes ?? "",
                diagnostics: schedule.diagnostics ?? "",
            }
        }
    }, [schedule])

    const handleIniciar = async () => {
        if (!appointmentId) return
        setActiveAction("iniciar")
        try { await iniciar(appointmentId); await refetch() }
        finally { setActiveAction(null) }
    }

    const handleFalta = async () => {
        if (!appointmentId) return
        setActiveAction("falta")
        try { await registrarFalta(appointmentId); await refetch() }
        finally { setActiveAction(null) }
    }

    const handleFinalizar = async () => {
        if (!appointmentId || !schedule) return
        setActiveAction("finalizar")
        try {
            await finalizar(appointmentId, {
                diagnostics: pendingValuesRef.current.diagnostics,
                clinicNotes: pendingValuesRef.current.clinicNotes,
            })
            await refetch()
        } finally { setActiveAction(null) }
    }

    if (isLoading) {
        return (
            <div className="flex min-h-0 flex-1 flex-col bg-background">
                <PageHeader title="Atendimento" />
                <main className="flex flex-1 min-h-0 flex-col gap-4 p-4 overflow-hidden">
                    {/* Info cards */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        {/* Patient card skeleton */}
                        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <Skeleton className="size-8 rounded-full" />
                                <div className="flex flex-col gap-1.5">
                                    <Skeleton className="h-3 w-16 rounded" />
                                    <Skeleton className="h-4 w-36 rounded" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Skeleton className="mt-0.5 size-7 rounded-lg shrink-0" />
                                        <div className="flex flex-col gap-1.5">
                                            <Skeleton className="h-3 w-20 rounded" />
                                            <Skeleton className="h-4 w-28 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Appointment card skeleton */}
                        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border pb-3">
                                <Skeleton className="h-3 w-24 rounded" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                            <div className="flex flex-col gap-2.5">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Skeleton className="mt-0.5 size-7 rounded-lg shrink-0" />
                                        <div className="flex flex-col gap-1.5">
                                            <Skeleton className="h-3 w-28 rounded" />
                                            <Skeleton className="h-4 w-44 rounded" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Tabs skeleton */}
                    <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="flex gap-1 border-b border-border px-2 pt-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <Skeleton key={i} className="h-7 w-20 rounded-lg shrink-0 mb-2" />
                            ))}
                        </div>
                        <div className="flex flex-1 items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Skeleton className="size-12 rounded-full" />
                                <Skeleton className="h-4 w-32 rounded" />
                                <Skeleton className="h-3 w-52 rounded" />
                            </div>
                        </div>
                    </div>

                    {/* Footer skeleton */}
                    <div className="mt-auto flex items-center justify-end gap-2 border-t pt-5">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <Skeleton className="h-10 w-36 rounded-lg" />
                        <Skeleton className="h-10 w-40 rounded-lg" />
                    </div>
                </main>
            </div>
        )
    }

    if (error || !schedule) {
        return (
            <div className="flex min-h-0 flex-1 flex-col bg-background">
                <PageHeader title="Atendimento" />
                <main className="flex flex-1 flex-col gap-4 p-4">
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error ?? "Atendimento não encontrado"}
                    </div>
                    <Button type="button" variant="outline" onClick={() => navigate("/atendimentos")}>
                        Voltar
                    </Button>
                </main>
            </div>
        )
    }

    const patientName = schedule.users.socialName || schedule.users.name
    const startTime = formatSlotTime(schedule.schedules_slots.startTime)
    const endTime = formatSlotTime(schedule.schedules_slots.endTime)
    const duration = slotDurationMinutes(schedule.schedules_slots.startTime, schedule.schedules_slots.endTime)
    const apptDate = schedule.schedules.date ? formatScheduleDate(schedule.schedules.date) : ""

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-background">
            <PageHeader title="Atendimento" />

            <main className="flex flex-1 min-h-0 flex-col gap-4 p-4 overflow-hidden">
                {updateError ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{updateError}</div>
                ) : null}

                {/* Info cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                    {/* Patient */}
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center gap-2 border-b border-border pb-3">
                            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                {patientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Paciente</p>
                                <p className="text-sm font-semibold text-foreground capitalize">{patientName}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <InfoRow
                                icon={Calendar}
                                label="Data de nascimento"
                                value={schedule.users.birthdate
                                    ? `${formatBirthdate(schedule.users.birthdate)} · ${calcAge(schedule.users.birthdate)} anos`
                                    : "—"}
                            />
                            <InfoRow icon={User} label="Sexo" value={formatSex(schedule.users.sex)} />
                            <InfoRow icon={Phone} label="Telefone" value={formatPhone(schedule.users.phone)} />
                            <InfoRow icon={Mail} label="E-mail" value={schedule.users.email || "—"} />
                        </div>
                    </div>

                    {/* Appointment */}
                    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agendamento</p>
                            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadgeClass(schedule.appointment_status.code))}>
                                {schedule.appointment_status.description}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <InfoRow icon={Stethoscope} label="Especialidade / Procedimento" value={`${schedule.specialties.name} · ${schedule.procedures.description}`} />
                            <InfoRow
                                icon={Clock}
                                label="Horário"
                                value={`${startTime} – ${endTime} (${duration} min) · ${apptDate}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Prontuário tabs */}
                <ProntuarioTabs
                    data={schedule}
                    onValuesChange={(v) => { pendingValuesRef.current = v }}
                />

                {/* Footer */}
                <div className="mt-auto flex items-center justify-end gap-2 border-t pt-5">
                    <BackButton onClick={() => navigate("/atendimentos")} disabled={activeAction !== null} />
                    {schedule.appointment_status.code === 1 && (
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="cursor-pointer gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            onClick={() => void handleFalta()}
                            disabled={activeAction !== null}
                        >
                            {activeAction === "falta"
                                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-red-400 border-t-transparent" />Registrando...</>
                                : <><UserX className="w-4 h-4" />Registrar Falta</>
                            }
                        </Button>
                    )}
                    {schedule.appointment_status.code === 1 && (
                        <SaveButton
                            type="button"
                            isSaving={activeAction === "iniciar"}
                            disabled={activeAction !== null}
                            onClick={() => void handleIniciar()}
                            icon={<PlayCircle className="w-4 h-4" />}
                            label="Iniciar"
                            savingLabel="Iniciando..."
                        />
                    )}
                    {schedule.appointment_status.code === 2 && (
                        <SaveButton
                            type="button"
                            isSaving={activeAction === "finalizar"}
                            disabled={activeAction !== null}
                            onClick={() => void handleFinalizar()}
                            label="Finalizar"
                            savingLabel="Finalizando..."
                        />
                    )}
                </div>
            </main>
        </div>
    )
}

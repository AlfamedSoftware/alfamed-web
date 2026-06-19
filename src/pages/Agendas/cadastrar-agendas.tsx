import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { AlertTriangle, ArrowLeft, Clock, Info, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { professionalsService, type ProfessionalUnitFullData } from "@/Servicos/professionals.service"
import { specialtiesService, type SpecialtyUnitFullData } from "@/Servicos/specialties.service"
import { proceduresService, type ProcedureUnitFullData } from "@/Servicos/procedures.service"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"

// --- Helpers ---

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

function isBeforeToday(dateStr: string): boolean {
    const [d, m, y] = dateStr.split("/")
    const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
}

function dateInputToApiFormat(dateInput: string): string {
    const [d, m, y] = dateInput.split("/")
    return `${y}-${m}-${d}`
}

function formatTimeInput(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 4)
    if (digits.length <= 2) return digits
    return `${digits.slice(0, 2)}:${digits.slice(2)}`
}

function isValidTime(timeStr: string): boolean {
    const match = timeStr.match(/^(\d{2}):(\d{2})$/)
    if (!match) return false
    const h = parseInt(match[1], 10)
    const min = parseInt(match[2], 10)
    return h >= 0 && h <= 23 && min >= 0 && min <= 59
}

function getProfessionalName(professional: ProfessionalUnitFullData): string {
    const users = professional.users
    const firstUser = Array.isArray(users) ? users[0] : users
    return firstUser?.name ?? "Profissional"
}

function getMidnightInfo(timeStr: string, slotsStr: string, durStr: string) {
    if (!isValidTime(timeStr)) return null
    const slotsNum = parseInt(slotsStr, 10)
    const durNum = parseInt(durStr, 10)
    if (isNaN(slotsNum) || slotsNum < 1 || isNaN(durNum) || durNum < 1) return null
    const [h, m] = timeStr.split(":").map(Number)
    const startMin = h * 60 + m
    const totalMin = startMin + slotsNum * durNum
    const maxSlots = Math.floor((1440 - startMin) / durNum)
    return {
        overflows: totalMin > 1440,
        maxSlots: Math.max(maxSlots, 0),
        endHHMM: `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`,
    }
}

function selectClass(hasError?: boolean) {
    return [
        "h-10 w-full rounded-md border bg-background px-3 text-sm outline-none",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:opacity-50 cursor-pointer",
        hasError ? "border-red-400" : "border-input",
    ].join(" ")
}

// --- Field wrapper ---

function Field({
    label,
    error,
    children,
    className,
}: {
    label: string
    error?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={`flex flex-col gap-1 ${className ?? ""}`}>
            <label className="text-sm font-medium">{label}</label>
            {children}
            {error && <span className="text-xs text-destructive">{error}</span>}
        </div>
    )
}

// --- Main Component ---

type FormErrors = Partial<Record<
    "professionalUnitId" | "specialtyId" | "procedureId" | "date" | "time" | "slots" | "durationMinutes",
    string
>>

export function CadastrarAgendas() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { sessionUnit } = useSessionUnit()
    const selectedUnitId = sessionUnit?.selectedUnitId ?? null

    const [professionalUnitId, setProfessionalUnitId] = useState(searchParams.get("professionalUnitId") ?? "")
    const [specialtyId, setSpecialtyId] = useState(searchParams.get("specialtyId") ?? "")
    const [procedureId, setProcedureId] = useState("")
    const [dateInput, setDateInput] = useState(searchParams.get("date") ?? getTodayFormatted())
    const [timeInput, setTimeInput] = useState("")
    const [slots, setSlots] = useState("")
    const [durationMinutes, setDurationMinutes] = useState("")

    const [professionals, setProfessionals] = useState<ProfessionalUnitFullData[]>([])
    const [isProfessionalsLoading, setIsProfessionalsLoading] = useState(false)
    const [specialties, setSpecialties] = useState<SpecialtyUnitFullData[]>([])
    const [isSpecialtiesLoading, setIsSpecialtiesLoading] = useState(false)
    const [procedures, setProcedures] = useState<ProcedureUnitFullData[]>([])
    const [isProceduresLoading, setIsProceduresLoading] = useState(false)

    const [errors, setErrors] = useState<FormErrors>({})
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    useEffect(() => {
        if (!selectedUnitId) return
        setIsProfessionalsLoading(true)
        professionalsService
            .listByUnit(selectedUnitId, { isActive: true, roleKey: "medic" })
            .then(setProfessionals)
            .catch(() => {})
            .finally(() => setIsProfessionalsLoading(false))
    }, [selectedUnitId])

    useEffect(() => {
        if (!selectedUnitId) return
        setIsSpecialtiesLoading(true)
        specialtiesService
            .listByUnit(selectedUnitId, { isActive: true })
            .then(setSpecialties)
            .catch(() => {})
            .finally(() => setIsSpecialtiesLoading(false))
    }, [selectedUnitId])

    useEffect(() => {
        setProcedures([])
        setProcedureId("")
        if (!selectedUnitId || !specialtyId) return
        setIsProceduresLoading(true)
        proceduresService
            .listByUnit(selectedUnitId, { specialtyId, isActive: true })
            .then(setProcedures)
            .catch(() => {})
            .finally(() => setIsProceduresLoading(false))
    }, [selectedUnitId, specialtyId])

    function clearError(field: keyof FormErrors) {
        setErrors((prev) => ({ ...prev, [field]: undefined }))
    }

    const midnightInfo = getMidnightInfo(timeInput, slots, durationMinutes)

    function validate(): FormErrors {
        const e: FormErrors = {}
        if (!professionalUnitId) e.professionalUnitId = "Selecione um profissional"
        if (!specialtyId) e.specialtyId = "Selecione uma especialidade"
        if (!procedureId) e.procedureId = "Selecione um procedimento"
        if (dateInput.length < 10) e.date = "Informe a data completa"
        else if (!isValidDateFormat(dateInput)) e.date = "Data inválida"
        else if (isBeforeToday(dateInput)) e.date = "A data não pode ser anterior à data atual"
        if (timeInput.length < 5) e.time = "Informe o horário completo"
        else if (!isValidTime(timeInput)) e.time = "Horário inválido (00:00 – 23:59)"
        const slotsNum = parseInt(slots, 10)
        if (!slots || isNaN(slotsNum) || slotsNum < 1) e.slots = "Mínimo 1 vaga"
        const durNum = parseInt(durationMinutes, 10)
        if (!durationMinutes || isNaN(durNum) || durNum < 1) e.durationMinutes = "Mínimo 1 minuto"
        return e
    }

    const handleSubmit = async (e: { preventDefault(): void }) => {
        e.preventDefault()
        const validationErrors = validate()
        setErrors(validationErrors)
        if (Object.keys(validationErrors).length > 0) return

        if (midnightInfo?.overflows) return

        setIsSaving(true)
        setSaveError(null)

        try {
            await fetchWithAuth(`${authBaseUrl}/schedules`, {
                method: "POST",
                body: JSON.stringify({
                    professionalUnitId,
                    specialtyId,
                    procedureId,
                    date: dateInputToApiFormat(dateInput),
                    startTime: timeInput,
                    slots: parseInt(slots, 10),
                    durationMinutes: parseInt(durationMinutes, 10),
                }),
            })
            alert("Agenda criada com sucesso.")
            navigate("/agendas")
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Erro ao criar agenda")
        } finally {
            setIsSaving(false)
        }
    }


    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <PageHeader title="Criar Agenda" />

            <main className="flex-1 flex flex-col px-4 py-6 md:px-6 md:py-8">
                {saveError && (
                    <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {saveError}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                        <Field label="Profissional" error={errors.professionalUnitId} className="md:col-span-2">
                            <select
                                value={professionalUnitId}
                                onChange={(e) => { setProfessionalUnitId(e.target.value); clearError("professionalUnitId") }}
                                disabled={isProfessionalsLoading}
                                className={selectClass(!!errors.professionalUnitId)}
                            >
                                <option value="">Selecione um profissional</option>
                                {professionals.map((p) => (
                                    <option key={p.id} value={p.id}>{getProfessionalName(p)}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Especialidade" error={errors.specialtyId}>
                            <select
                                value={specialtyId}
                                onChange={(e) => { setSpecialtyId(e.target.value); clearError("specialtyId") }}
                                disabled={isSpecialtiesLoading}
                                className={selectClass(!!errors.specialtyId)}
                            >
                                <option value="">Selecione uma especialidade</option>
                                {specialties.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Procedimento" error={errors.procedureId}>
                            <select
                                value={procedureId}
                                onChange={(e) => { setProcedureId(e.target.value); clearError("procedureId") }}
                                disabled={isProceduresLoading}
                                className={selectClass(!!errors.procedureId)}
                            >
                                <option value="">{isProceduresLoading ? "Carregando..." : "Selecione um procedimento"}</option>
                                {procedures.map((p) => (
                                    <option key={p.id} value={p.id}>{p.description}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Data" error={errors.date}>
                            <Input
                                value={dateInput}
                                onChange={(e) => { setDateInput(formatDateInput(e.target.value)); clearError("date") }}
                                placeholder="dd/mm/aaaa"
                                maxLength={10}
                                inputMode="numeric"
                                className={errors.date ? "border-red-400 focus-visible:ring-red-300" : ""}
                            />
                        </Field>

                        <Field label="Horário de início" error={errors.time}>
                            <div className="relative">
                                <Input
                                    value={timeInput}
                                    onChange={(e) => { setTimeInput(formatTimeInput(e.target.value)); clearError("time") }}
                                    placeholder="hh:mm"
                                    maxLength={5}
                                    inputMode="numeric"
                                    className={`pr-9 ${errors.time ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                                />
                                <Clock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </Field>

                        <Field label="Quantidade de vagas" error={errors.slots}>
                            <Input
                                type="number"
                                min={1}
                                value={slots}
                                onChange={(e) => { setSlots(e.target.value); clearError("slots") }}
                                placeholder="Ex.: 10"
                                className={errors.slots ? "border-red-400 focus-visible:ring-red-300" : ""}
                            />
                        </Field>

                        <Field label="Tempo por consulta (min)" error={errors.durationMinutes}>
                            <Input
                                type="number"
                                min={1}
                                value={durationMinutes}
                                onChange={(e) => { setDurationMinutes(e.target.value); clearError("durationMinutes") }}
                                placeholder="Ex.: 30"
                                className={errors.durationMinutes ? "border-red-400 focus-visible:ring-red-300" : ""}
                            />
                        </Field>

                    </div>

                    {midnightInfo && (
                        midnightInfo.overflows ? (
                            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>
                                    A configuração ultrapassa a meia-noite.{" "}
                                    <span className="font-semibold">
                                        Máximo de {midnightInfo.maxSlots} vaga{midnightInfo.maxSlots === 1 ? "" : "s"} para o horário {timeInput} com {durationMinutes} min por consulta.
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
                                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>
                                    A agenda terá <span className="font-semibold">{slots} {parseInt(slots) === 1 ? "vaga" : "vagas"}</span> de{" "}
                                    <span className="font-semibold">{durationMinutes} min</span> — término estimado às{" "}
                                    <span className="font-semibold">{midnightInfo.endHHMM}</span>.
                                </span>
                            </div>
                        )
                    )}

                    <div className="mt-auto flex items-center justify-end gap-2 border-t pt-5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                const params = new URLSearchParams()
                                if (professionalUnitId) params.set("professionalUnitId", professionalUnitId)
                                if (specialtyId) params.set("specialtyId", specialtyId)
                                if (dateInput.length === 10 && isValidDateFormat(dateInput)) params.set("date", dateInput)
                                const qs = params.toString()
                                navigate(`/agendas${qs ? `?${qs}` : ""}`)
                            }}
                            className="cursor-pointer"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Voltar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || !!midnightInfo?.overflows}
                            className="cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            {isSaving ? "Criando..." : "Criar"}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    )
}

export default CadastrarAgendas

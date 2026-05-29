import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
    Loader2,
    Save,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"
import { professionalsService, type Professional } from "@/services/professionals.service"

const professionalEditSchema = z.object({
    name: z.string().min(1, "Informe o nome completo"),
    email: z.string().email("Informe um e-mail válido"),
    phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone deve estar no formato (11) 99999-9999"),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),
    birthdate: z.string().min(1, "Informe a data de nascimento"),
    specialty: z.string().min(1, "Informe a especialidade"),
    crmState: z.string().length(2, "Selecione o estado do CRM"),
    crmNumber: z.string().regex(/^\d{4,6}$/, "O número do CRM deve conter apenas dígitos"),
    unitName: z.string().min(1, "Informe a unidade"),
    status: z.enum(["active", "inactive"]),
    loginEnabled: z.boolean(),
    // removed consultationTime/availableDays/workingHours — use structured schedules instead
})

type ProfessionalEditForm = z.infer<typeof professionalEditSchema>

function getInitials(name?: string) {
    const value = name?.trim()
    if (!value) return "PR"
    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

function digitsOnly(value: string) {
    return value.replace(/\D/g, "")
}

function formatCpf(value: string) {
    const digits = digitsOnly(value).slice(0, 11)
    const part1 = digits.slice(0, 3)
    const part2 = digits.slice(3, 6)
    const part3 = digits.slice(6, 9)
    const part4 = digits.slice(9, 11)

    if (!part1) return ""
    if (!part2) return part1
    if (!part3) return `${part1}.${part2}`
    if (!part4) return `${part1}.${part2}.${part3}`
    return `${part1}.${part2}.${part3}-${part4}`
}

function formatPhone(value: string) {
    const digits = digitsOnly(value).slice(0, 11)
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, digits.length > 10 ? 7 : 6)
    const second = digits.slice(digits.length > 10 ? 7 : 6, digits.length > 10 ? 11 : 10)

    if (!ddd) return ""
    if (!first) return `(${ddd}`
    if (!second) return `(${ddd}) ${first}`
    return `(${ddd}) ${first}-${second}`
}

const brStates = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

function formatDateInput(value?: string) {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return date.toISOString().slice(0, 10)
}

function FieldSkeleton() {
    return <div className="h-11 animate-pulse rounded-xl bg-muted" />
}

function ToggleSwitch({
    checked,
    onClick,
}: {
    checked: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors",
                checked ? "bg-primary" : "bg-muted",
            )}
            aria-pressed={checked}
        >
            <span
                className={cn(
                    "h-6 w-6 rounded-full bg-background shadow-sm transition-transform duration-200",
                    checked ? "translate-x-6" : "translate-x-0",
                )}
            />
        </button>
    )
}

export function ProfessionalProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [professional, setProfessional] = useState<Professional | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [schedules, setSchedules] = useState<{
        id?: string
        dayOfWeek: number
        startTime: string
        endTime: string
        appointmentDurationMinutes: number
        isActive?: boolean
    }[]>([])

    const form = useForm<ProfessionalEditForm>({
        resolver: zodResolver(professionalEditSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            cpf: "",
            birthdate: "",
            specialty: "Cardiologia",
            crmState: "SP",
            crmNumber: "",
            unitName: "",
            status: "active",
            loginEnabled: true,
            // schedules will be used instead of free-text agenda fields
        },
    })

    useEffect(() => {
        let alive = true
        if (!id) return

        setIsLoading(true)
        professionalsService
            .getById(id)
            .then((data) => {
                if (!alive) return
                setProfessional(data)
                const crmValue = data.crm ?? ""
                // Parse CRM in new format: SC12345 (2 letters + 4-6 digits)
                const crmMatch = crmValue.match(/^([A-Z]{2})(\d{4,6})$/)
                form.reset({
                    name: data.name ?? "",
                    email: data.email ?? "",
                    phone: formatPhone(data.phone ?? data.users?.[0]?.phone ?? ""),
                    cpf: formatCpf(data.cpf ?? data.users?.[0]?.cpf ?? ""),
                    birthdate: formatDateInput(data.birthdate ?? data.users?.[0]?.birthdate),
                    specialty: "Cardiologia",
                    crmState: crmMatch?.[1] ?? "SP",
                    crmNumber: crmMatch?.[2] ?? "",
                    unitName: data.unit?.name ?? "",
                    status: data.isActive ? "active" : "inactive",
                    loginEnabled: true,
                })
                // load schedules
                professionalsService.getSchedules(id).then((s) => {
                    if (!alive) return
                    setSchedules(
                        (s ?? []).map((it: any) => ({
                            id: it.id,
                            dayOfWeek: it.dayOfWeek,
                            startTime: (it.startTime as string)?.slice(0, 5) ?? "08:00",
                            endTime: (it.endTime as string)?.slice(0, 5) ?? "12:00",
                            appointmentDurationMinutes: it.appointmentDurationMinutes,
                            isActive: it.isActive,
                        })),
                    )
                }).catch(() => { })
            })
            .catch(() => "Erro ao carregar profissional")
            .finally(() => {
                if (alive) setIsLoading(false)
            })

        return () => {
            alive = false
        }
    }, [id, form])

    const initials = useMemo(() => getInitials(professional?.name), [professional?.name])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <PageHeader title="Editar Profissional" />
                <main className="px-4 py-8 sm:px-6 lg:px-8">
                    <div className="mx-auto w-full max-w-[1080px] overflow-hidden rounded-[24px] border border-border bg-card shadow-lg">
                        <div className="border-b border-border px-6 py-8 sm:px-10">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 animate-pulse rounded-full bg-muted" />
                                <div className="space-y-2">
                                    <div className="h-5 w-48 animate-pulse rounded bg-muted" />
                                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-6 sm:px-10 sm:py-8">
                            <div className="grid gap-5">
                                <FieldSkeleton />
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FieldSkeleton />
                                    <FieldSkeleton />
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FieldSkeleton />
                                    <FieldSkeleton />
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <FieldSkeleton />
                                    <FieldSkeleton />
                                </div>
                                <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                    <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                                    <div className="mt-3 h-4 w-72 animate-pulse rounded bg-muted" />
                                </div>
                                <div className="grid gap-5 sm:grid-cols-3">
                                    <FieldSkeleton />
                                    <FieldSkeleton />
                                    <FieldSkeleton />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    const onSubmit = async (values: ProfessionalEditForm) => {
        if (!id) return

        setIsSaving(true)
        try {
            await professionalsService.update(id, {
                name: values.name,
                email: values.email,
                phone: values.phone,
                cpf: values.cpf,
                birthdate: new Date(`${values.birthdate}T00:00:00.000Z`).toISOString(),
                crm: `${values.crmState}${values.crmNumber}`,
                isActive: values.status === "active",
            })
            // persist schedules after updating professional
            try {
                await professionalsService.replaceSchedules(id, schedules.map((s) => ({
                    id: s.id,
                    dayOfWeek: s.dayOfWeek,
                    startTime: `${s.startTime}:00`,
                    endTime: `${s.endTime}:00`,
                    appointmentDurationMinutes: Number(s.appointmentDurationMinutes),
                    isActive: s.isActive ?? true,
                })))
            } catch (e) {
                // ignore schedule save errors for now
            }
            navigate("/profissionais")
        } catch {
            // Handle error
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <PageHeader title="Editar Profissional" />

            <main className="px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto w-full max-w-[1080px] overflow-hidden rounded-[24px] border border-border bg-card shadow-lg">
                    <div className="border-b border-border px-6 py-8 sm:px-10">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
                                {initials}
                            </div>
                            <div>
                                <h2 className="text-[18px] font-semibold text-foreground">{professional?.name ?? "Dra. Mariana Souza"}</h2>
                                <p className="text-sm text-muted-foreground">{form.watch("specialty")}</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-6 sm:px-10 sm:py-8">
                        <div className="grid gap-5">
                            <section className="grid gap-4">
                                <h3 className="text-sm font-semibold text-foreground">Dados pessoais</h3>
                                <div className="grid gap-5">
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Nome completo</span>
                                        <Input className="h-11 rounded-xl" {...form.register("name")} />
                                    </label>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <label className="grid gap-2">
                                            <span className="text-sm font-medium text-foreground">Especialidade</span>
                                            <Input className="h-11 rounded-xl" {...form.register("specialty")} />
                                        </label>
                                    </div>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <label className="grid gap-2">
                                            <span className="text-sm font-medium text-foreground">E-mail</span>
                                            <Input type="email" className="h-11 rounded-xl" {...form.register("email")} />
                                        </label>
                                        <label className="grid gap-2">
                                            <span className="text-sm font-medium text-foreground">Telefone</span>
                                            <Input
                                                inputMode="numeric"
                                                placeholder="(11) 98765-4321"
                                                className="h-11 rounded-xl"
                                                {...form.register("phone", {
                                                    onChange: (event) => {
                                                        form.setValue("phone", formatPhone(event.target.value), { shouldDirty: true })
                                                    },
                                                })}
                                            />
                                        </label>
                                    </div>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <label className="grid gap-2">
                                            <span className="text-sm font-medium text-foreground">CPF</span>
                                            <Input
                                                inputMode="numeric"
                                                placeholder="000.000.000-00"
                                                className="h-11 rounded-xl"
                                                {...form.register("cpf", {
                                                    onChange: (event) => {
                                                        form.setValue("cpf", formatCpf(event.target.value), { shouldDirty: true })
                                                    },
                                                })}
                                            />
                                        </label>
                                        <label className="grid gap-2">
                                            <span className="text-sm font-medium text-foreground">Data nascimento</span>
                                            <Input type="date" className="h-11 rounded-xl" {...form.register("birthdate")} />
                                        </label>
                                    </div>
                                </div>
                            </section>

                            <section className="grid gap-4">
                                <h3 className="text-sm font-semibold text-foreground">Profissionais</h3>
                                <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Profissional ativo</p>
                                            <p className="text-xs text-muted-foreground">Desative para ocultar das agendas e listagens.</p>
                                        </div>
                                        <ToggleSwitch
                                            checked={form.watch("status") === "active"}
                                            onClick={() =>
                                                form.setValue(
                                                    "status",
                                                    form.watch("status") === "active" ? "inactive" : "active",
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="grid gap-4">
                                <h3 className="text-sm font-semibold text-foreground">Registro profissional</h3>
                                <div className="grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Estado</span>
                                        <select
                                            className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
                                            {...form.register("crmState")}
                                        >
                                            {brStates.map((state) => (
                                                <option key={state} value={state}>
                                                    {state}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Número do CRM</span>
                                        <Input
                                            inputMode="numeric"
                                            placeholder="123456"
                                            className="h-11 rounded-xl"
                                            {...form.register("crmNumber", {
                                                onChange: (event) => {
                                                    const digits = digitsOnly(event.target.value).slice(0, 6)
                                                    form.setValue("crmNumber", digits, { shouldDirty: true })
                                                },
                                            })}
                                        />
                                    </label>
                                </div>
                            </section>

                            <section className="grid gap-4">
                                <h3 className="text-sm font-semibold text-foreground">Agenda</h3>
                                <div className="grid gap-5 sm:grid-cols-3">
                                    {/* Agenda fields removed — use structured Escalas below */}
                                </div>
                            </section>
                            <section className="grid gap-4">
                                <h3 className="text-sm font-semibold text-foreground">Escalas</h3>
                                <div className="grid gap-5 sm:grid-cols-3">
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Escalas</h4>
                                    <div className="space-y-2">
                                        {schedules.map((row, idx) => (
                                            <div key={row.id ?? idx} className="grid grid-cols-6 gap-2 items-center">
                                                <select
                                                    className="h-10 rounded-xl border border-input px-2"
                                                    value={row.dayOfWeek}
                                                    onChange={(e) => {
                                                        const v = Number(e.target.value)
                                                        setSchedules((prev) => prev.map((p, i) => i === idx ? { ...p, dayOfWeek: v } : p))
                                                    }}
                                                >
                                                    <option value={0}>Domingo</option>
                                                    <option value={1}>Segunda</option>
                                                    <option value={2}>Terça</option>
                                                    <option value={3}>Quarta</option>
                                                    <option value={4}>Quinta</option>
                                                    <option value={5}>Sexta</option>
                                                    <option value={6}>Sábado</option>
                                                </select>
                                                <input type="time" className="h-10 rounded-xl border border-input px-2" value={row.startTime} onChange={(e) => setSchedules((prev) => prev.map((p, i) => i === idx ? { ...p, startTime: e.target.value } : p))} />
                                                <input type="time" className="h-10 rounded-xl border border-input px-2" value={row.endTime} onChange={(e) => setSchedules((prev) => prev.map((p, i) => i === idx ? { ...p, endTime: e.target.value } : p))} />
                                                <input type="number" min={1} className="h-10 rounded-xl border border-input px-2" value={row.appointmentDurationMinutes} onChange={(e) => setSchedules((prev) => prev.map((p, i) => i === idx ? { ...p, appointmentDurationMinutes: Number(e.target.value) } : p))} />
                                                <label className="flex items-center gap-2">
                                                    <input type="checkbox" checked={!!row.isActive} onChange={(e) => setSchedules((prev) => prev.map((p, i) => i === idx ? { ...p, isActive: e.target.checked } : p))} />
                                                    <span className="text-sm">Ativo</span>
                                                </label>
                                                <button type="button" className="text-destructive" onClick={() => setSchedules((prev) => prev.filter((_, i) => i !== idx))}>Remover</button>
                                            </div>
                                        ))}

                                        <div>
                                            <button type="button" className="text-primary-foreground underline" onClick={() => setSchedules((prev) => [...prev, { dayOfWeek: 1, startTime: "08:00", endTime: "12:00", appointmentDurationMinutes: 30, isActive: true }])}>
                                                + Adicionar escala
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-xl px-5"
                                onClick={() => navigate(-1)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="h-11 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Salvar alterações
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}

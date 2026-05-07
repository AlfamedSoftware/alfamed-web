import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"
import { adminUpmService, type AdminUpmUser } from "@/services/admin/admin-upm.service"

const upmUserEditSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.email("E-mail inválido"),
    cpf: z.string().regex(/^\d{11}$/, "CPF deve conter 11 dígitos"),
    birthdate: z.string().min(1, "Data de nascimento é obrigatória"),
    phone: z.string().regex(/^\d{10,11}$/, "Telefone deve conter 10 ou 11 dígitos"),
    status: z.enum(["active", "inactive"]),
})

type UpmUserEditForm = z.infer<typeof upmUserEditSchema>

function digitsOnly(value: string) {
    return value.replace(/\D/g, "")
}

function formatCpfDisplay(cpf: string): string {
    const digits = cpf.replace(/\D/g, "").slice(0, 11)
    if (digits.length !== 11) return cpf
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhoneDisplay(phone: string): string {
    const digits = phone.replace(/\D/g, "").slice(0, 11)
    if (digits.length < 10) return phone
    if (digits.length === 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function formatDateInput(value?: string) {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    return date.toISOString().slice(0, 10)
}

function getInitials(name?: string) {
    const value = name?.trim()
    if (!value) return "US"
    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

function getAvatarColor(seed: string): string {
    const colors = [
        "bg-blue-500",
        "bg-violet-500",
        "bg-emerald-500",
        "bg-amber-500",
        "bg-rose-500",
        "bg-cyan-500",
        "bg-fuchsia-500",
        "bg-orange-500",
        "bg-teal-500",
        "bg-indigo-500",
    ]
    let hash = 0
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
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
                checked ? "bg-green-500" : "bg-slate-300 dark:bg-slate-600",
            )}
            aria-pressed={checked}
        >
            <span
                className={cn(
                    "h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200",
                    checked ? "translate-x-6" : "translate-x-0",
                )}
            />
        </button>
    )
}

export function UpmUserProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [user, setUser] = useState<AdminUpmUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<UpmUserEditForm>({
        resolver: zodResolver(upmUserEditSchema),
        defaultValues: {
            name: "",
            email: "",
            cpf: "",
            birthdate: "",
            phone: "",
            status: "active",
        },
    })

    useEffect(() => {
        let alive = true
        if (!id) return

        const loadUser = async () => {
            setIsLoading(true)
            setError(null)

            try {
                // Buscar lista de usuários e encontrar o que corresponde ao ID
                const users = await adminUpmService.listUsers()
                const foundUser = users.find((u) => u.professionalUnitId === id)

                if (!foundUser) {
                    if (alive) {
                        setError("Usuário não encontrado")
                        setIsLoading(false)
                    }
                    return
                }

                if (alive) {
                    setUser(foundUser)
                    form.reset({
                        name: foundUser.name,
                        email: foundUser.email,
                        cpf: digitsOnly(foundUser.cpf),
                        birthdate: formatDateInput(foundUser.birthdate),
                        phone: digitsOnly(foundUser.phone),
                        status: foundUser.status ? "active" : "inactive",
                    })
                    setIsLoading(false)
                }
            } catch (err) {
                if (alive) {
                    setError(
                        err instanceof Error ? err.message : "Falha ao carregar dados do usuário",
                    )
                    setIsLoading(false)
                }
            }
        }

        void loadUser()
        return () => {
            alive = false
        }
    }, [id, form])

    const handleSubmit = async (data: UpmUserEditForm) => {
        if (!user) return

        setIsSaving(true)
        setError(null)

        try {
            await adminUpmService.updateUser(user.professionalUnitId, {
                user: {
                    name: data.name,
                    email: data.email,
                    cpf: digitsOnly(data.cpf),
                    birthdate: data.birthdate,
                    phone: digitsOnly(data.phone),
                    status: data.status === "active",
                },
            })

            navigate("/admin/upm")
        } catch (err) {
            const message = err instanceof Error ? err.message : "Falha ao salvar alterações"
            setError(message)
        } finally {
            setIsSaving(false)
        }
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <PageHeader title="Editar usuário" />
                <div className="mx-auto max-w-2xl p-4 sm:p-6">
                    <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-4">
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        <Button
                            onClick={() => navigate("/admin/upm")}
                            className="mt-4 cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <PageHeader
                title="Editar usuário"
            />

            <div className="mx-auto max-w-2xl p-4 sm:p-6">
                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                                <FieldSkeleton />
                            </div>
                        ))}
                    </div>
                ) : user ? (
                    <form onSubmit={form.handleSubmit(handleSubmit)}>
                        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-6">
                            {/* Header */}
                            <div className="flex items-start justify-between pb-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-4">
                                    <div
                                        className={cn(
                                            "flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-lg",
                                            getAvatarColor(user.userId),
                                        )}
                                    >
                                        {getInitials(user.name)}
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                            {user.name}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {user.unitName} · Alfamed
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-6">
                                {/* Name and Email */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Nome completo
                                        </label>
                                        <Input
                                            {...form.register("name")}
                                            placeholder="Nome"
                                            className="mt-1"
                                        />
                                        {form.formState.errors.name && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                {form.formState.errors.name.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            E-mail
                                        </label>
                                        <Input
                                            {...form.register("email")}
                                            placeholder="email@example.com"
                                            className="mt-1"
                                        />
                                        {form.formState.errors.email && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                {form.formState.errors.email.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* CPF and Birthdate */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            CPF
                                        </label>
                                        <Input
                                            inputMode="numeric"
                                            placeholder="000.000.000-00"
                                            maxLength={14}
                                            onChange={(e) => {
                                                // Store only digits in the form value
                                                const digitsValue = digitsOnly(e.target.value).slice(0, 11)
                                                form.setValue("cpf", digitsValue)
                                            }}
                                            // Display formatted CPF while keeping raw digits in form
                                            value={formatCpfDisplay(form.watch("cpf") ?? "")}
                                            className="mt-1"
                                        />
                                        {form.formState.errors.cpf && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                {form.formState.errors.cpf.message}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Data de nascimento
                                        </label>
                                        <Input
                                            {...form.register("birthdate")}
                                            type="date"
                                            className="mt-1"
                                        />
                                        {form.formState.errors.birthdate && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                {form.formState.errors.birthdate.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Telefone
                                    </label>
                                    <Input
                                        inputMode="numeric"
                                        placeholder="(11) 99999-9999"
                                        maxLength={15}
                                        onChange={(e) => {
                                            const digitsValue = digitsOnly(e.target.value).slice(0, 11)
                                            form.setValue("phone", digitsValue)
                                        }}
                                        value={formatPhoneDisplay(form.watch("phone") ?? "")}
                                        className="mt-1"
                                    />
                                    {form.formState.errors.phone && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {form.formState.errors.phone.message}
                                        </p>
                                    )}
                                </div>

                                {/* Status Toggle */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Status
                                        </label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {form.watch("status") === "active" ? "Ativo" : "Inativo"}
                                        </p>
                                    </div>
                                    <ToggleSwitch
                                        checked={form.watch("status") === "active"}
                                        onClick={() => {
                                            const currentStatus = form.watch("status")
                                            form.setValue("status", currentStatus === "active" ? "inactive" : "active")
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => navigate("/admin/upm")}
                                    className="cursor-pointer"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSaving || form.formState.isSubmitting}
                                    className="cursor-pointer"
                                >
                                    {isSaving || form.formState.isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Salvar alterações
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                ) : null}
            </div>
        </div>
    )
}

import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import {
    Loader2,
    Save,
} from "lucide-react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PasswordInput from "@/components/ui/password-input"
import { PageHeader } from "@/components/page-header"
import { authBaseUrl } from "@/lib/auth"
import { cn } from "@/lib/utils"
import {
    professionalsService,
    type ProfessionalFullData,
    type UpdateProfessionalInput,
    professionalFullSchema,
    professionalProfileSchema,
    type ProfessionalFullForm,
    type ProfessionalProfileForm,
    formatCpf,
    formatPhone,
    digitsOnly,
} from "@/Servicos/professionals.service"
import { ToastContainer, useToast } from "./Componentes/Toast"
import { AlteracaoProfissionaisSkeleton } from "./Componentes/Skeleton/alteracao-profissionais-skeleton"

type ProfessionalEditForm = ProfessionalFullForm | ProfessionalProfileForm

type ProfessionalRole = {
    id: string
    description: string
}

type ProfessionalProfileData = ProfessionalFullData

// ============================================================================
// UI HELPERS - Formatação e utilidades de interface
// ============================================================================

function getInitials(name?: string) {
    const value = name?.trim()
    if (!value) return "PR"
    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

function toBooleanStatus(value: unknown, fallback = false): boolean {
    if (value === true) return true
    if (value === false) return false
    return fallback
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

// ============================================================================
// DATA EXTRACTION HELPERS - Extrai dados da API para popular o formulário
// ============================================================================
// Estas funções processam as respostas da API que vêm em diferentes formatos
// e extraem os valores necessários para popular o formulário

function parseProfessionalRoles(data: unknown): ProfessionalRole[] {
    const payload = data as { data?: unknown; items?: unknown; roles?: unknown }
    const source = Array.isArray(data)
        ? data
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.items)
                ? payload.items
                : Array.isArray(payload?.roles)
                    ? payload.roles
                    : []

    return source.flatMap((item) => {
        if (!item || typeof item !== "object") {
            return []
        }

        const role = item as Record<string, unknown>
        const id = role.id
        const description = role.description

        if (typeof id !== "string" || typeof description !== "string") {
            return []
        }

        return [{ id, description }]
    })
}

function firstItem<T>(value: T | T[] | undefined): T | undefined {
    return Array.isArray(value) ? value[0] : value
}

function firstRecord(value: unknown): Record<string, unknown> | undefined {
    const item = Array.isArray(value) ? value[0] : value
    return item && typeof item === "object" ? item as Record<string, unknown> : undefined
}

function getPrimaryUser(data: ProfessionalProfileData) {
    return firstItem(data.users)
}

function getProfessionalName(data?: ProfessionalProfileData | null): string | undefined {
    if (!data) return undefined
    const payload = data as ProfessionalProfileData & { name?: unknown }
    if (typeof payload.name === "string") return payload.name
    return getPrimaryUser(data)?.name
}

function getProfessionalEmail(data: ProfessionalProfileData): string {
    const payload = data as ProfessionalProfileData & { email?: unknown }
    if (typeof payload.email === "string") return payload.email
    return getPrimaryUser(data)?.email ?? ""
}

function getProfessionalSocialName(data: ProfessionalProfileData): string {
    const payload = data as ProfessionalProfileData & { socialName?: unknown }
    const user = getPrimaryUser(data) as { socialName?: unknown } | undefined
    if (typeof payload.socialName === "string") return payload.socialName
    return typeof user?.socialName === "string" ? user.socialName : ""
}

function getProfessionalCpf(data: ProfessionalProfileData): string {
    const payload = data as ProfessionalProfileData & { cpf?: unknown }
    if (typeof payload.cpf === "string") return payload.cpf
    return getPrimaryUser(data)?.cpf ?? ""
}

function getProfessionalBirthdate(data: ProfessionalProfileData): string | undefined {
    const payload = data as ProfessionalProfileData & { birthdate?: unknown }
    if (typeof payload.birthdate === "string") return payload.birthdate
    return getPrimaryUser(data)?.birthdate
}

function getProfessionalPhone(data: ProfessionalProfileData): string {
    const payload = data as ProfessionalProfileData & { phone?: unknown }
    if (typeof payload.phone === "string") return payload.phone
    return getPrimaryUser(data)?.phone ?? ""
}

function getProfessionalSex(data: ProfessionalProfileData): ProfessionalEditForm["sex"] {
    const payload = data as ProfessionalProfileData & { sex?: unknown }
    const user = getPrimaryUser(data) as { sex?: unknown } | undefined
    const value =
        typeof payload.sex === "string"
            ? payload.sex
            : typeof user?.sex === "string"
                ? user.sex
                : ""

    if (value === "F" || value === "M") {
        return value
    }

    return ""
}

function getProfessionalCrm(data: ProfessionalProfileData): string {
    const payload = data as ProfessionalProfileData & {
        crm?: unknown
        crmNumber?: unknown
        professional?: { crm?: unknown; crmNumber?: unknown } | null
        professionals?: unknown
    }
    const professional = firstRecord(payload.professionals)

    if (typeof payload.crm === "string") return payload.crm
    if (typeof payload.crmNumber === "string") return payload.crmNumber
    if (typeof payload.professional?.crm === "string") return payload.professional.crm
    if (typeof payload.professional?.crmNumber === "string") return payload.professional.crmNumber
    if (typeof professional?.crm === "string") return professional.crm
    if (typeof professional?.crmNumber === "string") return professional.crmNumber

    return ""
}

function getProfessionalUnitStatus(data: ProfessionalProfileData): boolean {
    const payload = data as ProfessionalProfileData & {
        professionalUnitStatus?: unknown
        professional?: { isActive?: unknown } | null
        professionals?: unknown
    }
    const professional = firstRecord(payload.professionals)

    return toBooleanStatus(payload.professionalUnitStatus ?? data.isActive ?? payload.professional?.isActive ?? professional?.isActive, true)
}

function getPatientStatus(data: ProfessionalProfileData): boolean {
    const payload = data as ProfessionalProfileData & {
        patientStatus?: unknown
        patient?: { isActive?: unknown } | null
        patients?: unknown
    }
    const patient = firstRecord(payload.patients)

    return toBooleanStatus(payload.patientStatus ?? payload.patient?.isActive ?? patient?.isActive, true)
}

function getProfessionalRoleId(data: ProfessionalProfileData): string {
    const payload = data as ProfessionalProfileData & {
        roleId?: unknown
        role?: { id?: unknown } | null
        roles?: unknown
    }
    const role = firstRecord(payload.roles)

    if (typeof payload.roleId === "string") return payload.roleId
    if (typeof payload.role?.id === "string") return payload.role.id
    if (typeof role?.id === "string") return role.id

    return ""
}

// ============================================================================
// RESPONSE PARSING - Extrai dados de respostas específicas da API
// ============================================================================

function extractCreatedUserId(data: unknown): string | null {
    if (!data || typeof data !== "object") {
        return null
    }

    const payload = data as Record<string, unknown>
    const directId = payload.id
    if (typeof directId === "string" && directId.length > 0) {
        return directId
    }

    const user = payload.user
    if (user && typeof user === "object") {
        const userId = (user as Record<string, unknown>).id
        if (typeof userId === "string" && userId.length > 0) {
            return userId
        }
    }

    const dataNode = payload.data
    if (dataNode && typeof dataNode === "object") {
        const dataId = (dataNode as Record<string, unknown>).id
        if (typeof dataId === "string" && dataId.length > 0) {
            return dataId
        }

        const dataUser = (dataNode as Record<string, unknown>).user
        if (dataUser && typeof dataUser === "object") {
            const nestedId = (dataUser as Record<string, unknown>).id
            if (typeof nestedId === "string" && nestedId.length > 0) {
                return nestedId
            }
        }
    }

    return null
}

interface ProfessionalProfileProps {
    professionalUnitId?: string
    afterSavePath?: string | null
    isProfileView?: boolean
    isRegisterMode?: boolean
    onCreated?: () => void
    showPageHeader?: boolean
    onCancel?: () => void
}

// ============================================================================
// PAYLOAD BUILDERS - Constrói dados para enviar para a API
// ============================================================================
// Estas funções preparam os dados do formulário no formato esperado pela API

function buildRegisterPayload(values: ProfessionalFullForm | ProfessionalProfileForm) {
    const v = values as ProfessionalFullForm
    return {
        name: v.name?.trim(),
        email: v.email?.trim(),
        password: v.password,
        cpf: (v.cpf ?? "").replace(/\D/g, ""),
        phone: (v.phone ?? "").replace(/\D/g, ""),
        birthdate: v.birthdate ? new Date(`${v.birthdate}T00:00:00.000Z`).toISOString() : undefined,
        crm: v.crmState && v.crmNumber ? `${v.crmState}${v.crmNumber}` : undefined,
        sex: v.sex || undefined,
    }
}

function buildAdminUpdatePayload(
    values: ProfessionalFullForm | ProfessionalProfileForm,
    data?: ProfessionalProfileData | null,
    professionalUnitId?: string
): UpdateProfessionalInput {
    const v = values as ProfessionalFullForm
    const fullData = data as ProfessionalFullData | undefined

    // Extrair IDs do data
    const userRecord = Array.isArray(fullData?.users) ? fullData.users[0] : fullData?.users as any
    const professionalRecord = Array.isArray(fullData?.professionals) ? fullData.professionals[0] : fullData?.professional as any
    const patientRecord = Array.isArray(fullData?.patients) ? fullData.patients[0] : undefined

    const payload: UpdateProfessionalInput = {
        // IDs das tabelas
        professionalUnitId: fullData?.id || professionalUnitId,
        userId: typeof userRecord?.id === "string" ? userRecord.id : undefined,
        professionalId: typeof professionalRecord?.id === "string" ? professionalRecord.id : undefined,
        patientId: typeof patientRecord?.id === "string" ? patientRecord.id : undefined,
        // Dados de usuário
        name: v.name,
        socialName: v.socialName,
        cpf: v.cpf?.replace(/\D/g, ""),
        email: v.email,
        birthdate: v.birthdate ? new Date(`${v.birthdate}T00:00:00.000Z`).toISOString() : undefined,
        phone: v.phone?.replace(/\D/g, ""),
        sex: v.sex || undefined,
        // Profissional
        crmState: v.crmState || undefined,
        crmNumber: v.crmNumber || undefined,
        professionalUnitStatus: v.professionalUnitStatus ?? true,
        // Unidade
        roleId: v.roleId || undefined,
        // Paciente
        patientStatus: v.patientStatus ?? true,
    }

    if (v.password) payload.password = v.password
    return payload
}

function buildProfileUpdatePayload(
    values: ProfessionalFullForm | ProfessionalProfileForm,
    data?: ProfessionalProfileData | null,
    professionalUnitId?: string
): UpdateProfessionalInput {
    const v = values as ProfessionalProfileForm
    const fullData = data as ProfessionalFullData | undefined

    // Extrair IDs do data
    const userRecord = Array.isArray(fullData?.users) ? fullData.users[0] : fullData?.users as any
    const professionalRecord = Array.isArray(fullData?.professionals) ? fullData.professionals[0] : fullData?.professional as any

    const payload: UpdateProfessionalInput = {
        // IDs das tabelas
        professionalUnitId: fullData?.id || professionalUnitId,
        userId: typeof userRecord?.id === "string" ? userRecord.id : undefined,
        professionalId: typeof professionalRecord?.id === "string" ? professionalRecord.id : undefined,
        // Dados de usuário
        name: v.name,
        socialName: v.socialName,
        cpf: v.cpf?.replace(/\D/g, ""),
        email: v.email,
        birthdate: v.birthdate ? new Date(`${v.birthdate}T00:00:00.000Z`).toISOString() : undefined,
        phone: v.phone?.replace(/\D/g, ""),
        sex: v.sex || undefined,
    }

    if (v.password) payload.password = v.password
    return payload
}

// ============================================================================
// COMPONENT - Formulário de edição/cadastro de profissional
// ============================================================================

export function ProfessionalProfile({
    professionalUnitId,
    afterSavePath = "/profissionais",
    isProfileView = false,
    isRegisterMode = false,
    onCreated,
    showPageHeader = true,
    onCancel,
}: ProfessionalProfileProps = {}) {
    const { id: routeProfessionalId } = useParams()
    const effectiveProfessionalUnitId = professionalUnitId ?? routeProfessionalId
    const id = effectiveProfessionalUnitId
    const navigate = useNavigate()
    const { toasts, dismiss, toast } = useToast()
    const [professional, setProfessional] = useState<ProfessionalProfileData | null>(null)
    const [isLoading, setIsLoading] = useState(!isRegisterMode)
    const [isSaving, setIsSaving] = useState(false)
    const [roles, setRoles] = useState<ProfessionalRole[]>([])
    const [isRolesLoading, setIsRolesLoading] = useState(false)
    const [rolesError, setRolesError] = useState("")
    const formSchema = isProfileView ? professionalProfileSchema : professionalFullSchema

    const form = useForm<ProfessionalEditForm>({
        resolver: zodResolver(formSchema) as Resolver<ProfessionalEditForm>,
        defaultValues: {
            name: "",
            socialName: "",
            email: "",
            phone: "",
            cpf: "",
            birthdate: "",
            roleId: "",
            password: "",
            confirmPassword: "",
            crmState: "SP",
            crmNumber: "",
            sex: "",
            professionalUnitStatus: true,
            patientStatus: true,
        },
    })

    useEffect(() => {
        const controller = new AbortController()

        async function loadRoles() {
            setIsRolesLoading(true)
            setRolesError("")

            try {
                const response = await fetch(`${authBaseUrl}/roles?isActive=true&internal=false`, {
                    credentials: "include",
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error("Não foi possível carregar os cargos.")
                }

                const data = await response.json()
                setRoles(parseProfessionalRoles(data))
            } catch (error) {
                if ((error as Error).name === "AbortError") {
                    return
                }

                setRoles([])
                setRolesError("Não foi possível carregar os cargos.")
            } finally {
                setIsRolesLoading(false)
            }
        }

        void loadRoles()

        return () => {
            controller.abort()
        }
    }, [])

    useEffect(() => {
        let alive = true
        if (isRegisterMode) {
            setProfessional(null)
            setIsLoading(false)
            form.reset({
                name: "",
                socialName: "",
                email: "",
                phone: "",
                cpf: "",
                birthdate: "",
                roleId: "",
                password: "",
                confirmPassword: "",
                crmState: "SP",
                crmNumber: "",
                sex: "",
                professionalUnitStatus: true,
                patientStatus: true,
            })
            return
        }

        if (!id) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        const request = professionalsService.getFullDataByProfessionalUnitId(effectiveProfessionalUnitId)

        request
            .then((data) => {
                if (!alive) return
                setProfessional(data)
                const crmValue = getProfessionalCrm(data)
                // Parse CRM in new format: SC12345 (2 letters + 4-6 digits)
                const crmMatch = crmValue.match(/^([A-Z]{2})(\d{4,6})$/)
                form.reset({
                    // Usuario
                    name: getProfessionalName(data) ?? "",
                    socialName: getProfessionalSocialName(data),
                    cpf: formatCpf(getProfessionalCpf(data)),
                    email: getProfessionalEmail(data),
                    birthdate: formatDateInput(getProfessionalBirthdate(data)),
                    phone: formatPhone(getProfessionalPhone(data)),
                    sex: getProfessionalSex(data),
                    // Profissional
                    crmState: crmMatch?.[1] ?? "SP",
                    crmNumber: crmMatch?.[2] ?? "",
                    professionalUnitStatus: getProfessionalUnitStatus(data),

                    // Unidade
                    roleId: getProfessionalRoleId(data),
                    patientStatus: getPatientStatus(data),

                    // Campos de senha sempre iniciam vazios
                    password: "",
                    confirmPassword: "",
                })
            })
            .catch(() => toast.error("Erro ao carregar profissional"))
            .finally(() => {
                if (alive) setIsLoading(false)
            })

        return () => {
            alive = false
        }
    }, [id, effectiveProfessionalUnitId, form, toast, isRegisterMode])

    const professionalName = useMemo(() => getProfessionalName(professional), [professional])
    const initials = useMemo(() => getInitials(professionalName), [professionalName])

    if (isLoading) {
        return (
            <>
                {showPageHeader ? (
                    <PageHeader title={isProfileView ? "Perfil" : isRegisterMode ? "Cadastro de Profissionais" : "Editar Cadastro"} />
                ) : null}
                <AlteracaoProfissionaisSkeleton isProfileView={isProfileView} />
            </>
        )
    }

    const onSubmit = async (values: ProfessionalEditForm) => {
        if (isRegisterMode) {
            if (!values.password) {
                form.setError("password", { message: "Senha e obrigatoria" })
                return
            }

            if (values.password.length < 8) {
                form.setError("password", { message: "Senha deve ter pelo menos 8 caracteres" })
                return
            }

            if (!values.confirmPassword) {
                form.setError("confirmPassword", { message: "Confirmacao de senha e obrigatoria" })
                return
            }

            if (values.password !== values.confirmPassword) {
                form.setError("confirmPassword", { message: "As senhas devem ser iguais" })
                return
            }

            setIsSaving(true)
            try {
                const payload = buildRegisterPayload(values as ProfessionalFullForm)

                const response = await fetch(`${authBaseUrl}/auth/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null) as { message?: string } | null
                    toast.error(errorData?.message ?? "Nao foi possivel cadastrar o profissional")
                    return
                }

                const registerData = await response.json().catch(() => null)
                const createdUserId = extractCreatedUserId(registerData)
                if (!createdUserId) {
                    toast.error("Usuario criado, mas nao foi possivel identificar o ID retornado")
                    return
                }

                const professionalResponse = await fetch(`${authBaseUrl}/professionals/link-user`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ userId: createdUserId, isActive: values.professionalUnitStatus }),
                })

                if (!professionalResponse.ok) {
                    const errorData = await professionalResponse.json().catch(() => null) as { message?: string } | null
                    toast.error(errorData?.message ?? "Usuario criado, mas nao foi possivel vincular a tabela de profissionais")
                    return
                }

                const createdProfessional = await professionalResponse.json().catch(() => null)
                const professionalId =
                    createdProfessional && typeof createdProfessional === "object"
                        ? (createdProfessional as { id?: unknown }).id
                        : null
                const professionalUnitId =
                    createdProfessional && typeof createdProfessional === "object"
                        ? (createdProfessional as { professionalUnitId?: unknown }).professionalUnitId
                        : null

                if (typeof professionalUnitId !== "string" || professionalUnitId.length === 0) {
                    toast.error("Usuario criado, mas nao foi possivel identificar o professionalUnitId retornado")
                    return
                }

                const patientResponse = await fetch(`${authBaseUrl}/patients`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ userId: createdUserId, isActive: values.patientStatus }),
                })

                if (!patientResponse.ok) {
                    const errorData = await patientResponse.json().catch(() => null) as { message?: string } | null
                    toast.error(errorData?.message ?? "Profissional criado, mas nao foi possivel vincular a tabela de pacientes")
                    return
                }

                if (values.roleId) {
                    await professionalsService.linkProfessionalUnitRole({
                        professionalUnitId,
                        roleId: values.roleId,
                    })
                }

                if (typeof professionalId === "string" && professionalId.length > 0 && values.crmState && values.crmNumber) {
                    await fetch(`${authBaseUrl}/professionals/${professionalId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ crm: `${values.crmState}${values.crmNumber}` }),
                    }).catch(() => null)
                }

                toast.success("Profissional cadastrado")
                onCreated?.()
                if (afterSavePath) {
                    navigate(afterSavePath)
                }
            } catch {
                toast.error("Erro ao cadastrar profissional")
            } finally {
                setIsSaving(false)
            }
            return
        }

        if (!id) return

        // Validar senhas se fornecidas
        if (values.password || values.confirmPassword) {
            if (values.password !== values.confirmPassword) {
                toast.error("As senhas devem ser iguais")
                return
            }
        }

        setIsSaving(true)
        try {
            const isProfile = isProfileView
            const dataToSend = isProfile
                ? buildProfileUpdatePayload(values as ProfessionalProfileForm, professional, id)
                : buildAdminUpdatePayload(values as ProfessionalFullForm, professional, id)

            if (isProfile) {
                await professionalsService.updateProfile(id, dataToSend)
            } else {
                await professionalsService.updateFull(id, dataToSend)
            }

            toast.success("Profissional atualizado")
            if (afterSavePath) {
                navigate(afterSavePath)
            }
        } catch {
            toast.error("Erro ao salvar alterações")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {showPageHeader ? (
                <PageHeader title={isProfileView ? "Perfil" : isRegisterMode ? "Cadastro de Profissionais" : "Editar Cadastro"} />
            ) : null}

            <main className="w-full h-full">
                <div className="border-b border-border px-6 py-8 sm:px-10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground shadow-sm">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-[18px] font-semibold text-foreground">
                                {professionalName ?? (isRegisterMode ? "Novo profissional" : "Dra. Mariana Souza")}
                            </h2>
                        </div>
                    </div>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-6 sm:px-10 sm:py-8">
                    <div className="grid gap-5">
                        <section className="grid gap-4">
                            <h3 className="text-primary text-lg font-semibold">Usuário</h3>
                            <div className="grid gap-5">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Nome completo</span>
                                        <Input className="h-11 rounded-xl" {...form.register("name")} />
                                    </label>
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Nome social (opcional)</span>
                                        <Input className="h-11 rounded-xl" {...form.register("socialName")} />
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
                                        <span className="text-sm font-medium text-foreground">E-mail</span>
                                        <Input type="email" className="h-11 rounded-xl" {...form.register("email")} />
                                    </label>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Data de nascimento</span>
                                        <Input type="date" className="h-11 rounded-xl" {...form.register("birthdate")} />
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
                                        <span className="text-sm font-medium text-foreground">Sexo</span>
                                        <select
                                            className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
                                            {...form.register("sex")}
                                        >
                                            <option value="">Selecione uma opção</option>
                                            <option value="F">Feminino</option>
                                            <option value="M">Masculino</option>
                                        </select>
                                    </label>
                                    <div />
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Senha</span>
                                        <PasswordInput className="h-11 rounded-xl" autoComplete="new-password" {...form.register("password")} />
                                        {form.formState.errors.password?.message ? (
                                            <span className="text-sm font-medium text-destructive">
                                                {form.formState.errors.password.message}
                                            </span>
                                        ) : null}
                                    </label>
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Confirme sua senha</span>
                                        <PasswordInput className="h-11 rounded-xl" autoComplete="new-password" {...form.register("confirmPassword")} />
                                        {form.formState.errors.confirmPassword?.message ? (
                                            <span className="text-sm font-medium text-destructive">
                                                {form.formState.errors.confirmPassword.message}
                                            </span>
                                        ) : null}
                                    </label>
                                </div>

                            </div>
                        </section>

                        <section className="grid gap-4">
                            <h3 className="text-primary text-lg font-semibold">Profissional</h3>
                            
                            <div className="grid gap-5 sm:grid-cols-2">
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
                            
                            {!isProfileView && (
                                <div className="grid gap-2 sm:grid-cols-1">
                                    <p className="text-sm font-semibold text-foreground">Profissional ativo</p>
                                    <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Desative para esse profissional não apareça nas seções de agendas e agendamentos do sistema.</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.watch("professionalUnitStatus") ?? true}
                                                onClick={() =>
                                                    form.setValue(
                                                        "professionalUnitStatus",
                                                        !(form.watch("professionalUnitStatus") ?? true),
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {!isProfileView && (
                            <section className="grid gap-4">
                                <h3 className="text-primary text-lg font-semibold">Unidade</h3>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Cargo</span>
                                        <select
                                            className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={isRolesLoading || roles.length === 0}
                                            {...form.register("roleId")}
                                        >
                                            <option value="">
                                                {isRolesLoading ? "Carregando cargos..." : "Selecione um cargo"}
                                            </option>
                                            {roles.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.description}
                                                </option>
                                            ))}
                                        </select>
                                        {form.formState.errors.roleId?.message ? (
                                            <span className="text-sm font-medium text-destructive">
                                                {form.formState.errors.roleId.message}
                                            </span>
                                        ) : null}
                                        {rolesError ? (
                                            <span className="text-sm font-medium text-destructive">
                                                {rolesError}
                                            </span>
                                        ) : null}
                                    </label>
                                </div>

                            </section>
                        )}

                        {!isProfileView && (
                            <section className="grid gap-4">
                                <h3 className="text-primary text-lg font-semibold">Paciente</h3>

                                <div className="grid gap-2 sm:grid-cols-1">
                                    <p className="text-sm font-semibold text-foreground">Paciente ativo</p>
                                    <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Desative para que esse usuário não acesse o sistema como paciente (Via aplicativo mobile).</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.watch("patientStatus") ?? true}
                                                onClick={() =>
                                                    form.setValue(
                                                        "patientStatus",
                                                        !(form.watch("patientStatus") ?? true),
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                    </div>

                    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                        {!isProfileView && (
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11 rounded-xl px-5"
                                onClick={() => onCancel?.() ?? navigate(-1)}
                            >
                                Cancelar
                            </Button>
                        )}
                        <Button
                            type="submit"
                            className="h-11 rounded-xl bg-primary px-5 text-primary-foreground hover:bg-primary/90"
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isRegisterMode ? "Cadastrar profissional" : "Salvar alterações"}
                        </Button>
                    </div>
                </form>
            </main>

            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </div>
    )
}

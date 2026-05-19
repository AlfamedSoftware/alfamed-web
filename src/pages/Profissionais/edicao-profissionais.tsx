import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useSession } from "@/hooks/use-session"
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
import { professionalsService, type ProfessionalUnitFullData } from "@/Servicos/professionals.service"
import * as z from "zod"
import { ToastContainer, useToast } from "./Componentes/Toast"
import { AlteracaoProfissionaisSkeleton } from "./Componentes/Skeleton/alteracao-profissionais-skeleton"

// ============================================================================
// FORM VALUE TYPE - valores usados pelo formulário (UI)
// ============================================================================

type ProfessionalFormValues = z.infer<typeof professionalRegisterSchema>

type ProfessionalRole = {
    id: string
    description: string
}

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

const sexOptions = [
    { value: "M", label: "Masculino" },
    { value: "F", label: "Feminino" },
    { value: "O", label: "Outros" },
] as const

function ToggleSwitch({
    checked,
    onClick,
    disabled = false,
}: {
    checked: boolean
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={cn(
                "relative inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors",
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
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

function getIdFromNode(node: unknown): string | undefined {
    const record = firstRecord(node)
    const id = record?.id
    return typeof id === "string" && id.length > 0 ? id : undefined
}

function getPrimaryUser(data: ProfessionalUnitFullData) {
    return firstItem(data.users)
}

function getProfessionalName(data?: ProfessionalUnitFullData | null): string | undefined {
    if (!data) return undefined
    const payload = data as ProfessionalUnitFullData & { name?: unknown }
    if (typeof payload.name === "string") return payload.name
    return getPrimaryUser(data)?.name
}

function getProfessionalEmail(data: ProfessionalUnitFullData): string {
    const payload = data as ProfessionalUnitFullData & { email?: unknown }
    if (typeof payload.email === "string") return payload.email
    return getPrimaryUser(data)?.email ?? ""
}

function getProfessionalSocialName(data: ProfessionalUnitFullData): string {
    const payload = data as ProfessionalUnitFullData & { socialName?: unknown }
    const user = getPrimaryUser(data) as { socialName?: unknown } | undefined
    if (typeof payload.socialName === "string") return payload.socialName
    return typeof user?.socialName === "string" ? user.socialName : ""
}

function getProfessionalCpf(data: ProfessionalUnitFullData): string {
    const payload = data as ProfessionalUnitFullData & { cpf?: unknown }
    if (typeof payload.cpf === "string") return payload.cpf
    return getPrimaryUser(data)?.cpf ?? ""
}

function getProfessionalBirthdate(data: ProfessionalUnitFullData): string | undefined {
    const payload = data as ProfessionalUnitFullData & { birthdate?: unknown }
    if (typeof payload.birthdate === "string") return payload.birthdate
    return getPrimaryUser(data)?.birthdate
}

function getProfessionalPhone(data: ProfessionalUnitFullData): string {
    const payload = data as ProfessionalUnitFullData & { phone?: unknown }
    if (typeof payload.phone === "string") return payload.phone
    return getPrimaryUser(data)?.phone ?? ""
}

function getProfessionalSex(data: ProfessionalUnitFullData): ProfessionalFormValues["sex"] {
    const payload = data as ProfessionalUnitFullData & { sex?: unknown }
    const user = getPrimaryUser(data) as { sex?: unknown } | undefined
    const value =
        typeof payload.sex === "string"
            ? payload.sex
            : typeof user?.sex === "string"
                ? user.sex
                : ""

    if (value === "F" || value === "M" || value === "O") {
        return value
    }

    return ""
}

function getProfessionalCrm(data: ProfessionalUnitFullData): string {
    const payload = data as ProfessionalUnitFullData & {
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

function getProfessionalUnitStatus(data: ProfessionalUnitFullData): boolean {
    const payload = data as ProfessionalUnitFullData & {
        professionalUnitStatus?: unknown
        professional?: { isActive?: unknown } | null
        professionals?: unknown
    }
    const professional = firstRecord(payload.professionals)

    return toBooleanStatus(payload.professionalUnitStatus ?? data.isActive ?? payload.professional?.isActive ?? professional?.isActive, true)
}

function getPatientStatus(data: ProfessionalUnitFullData): boolean {
    const payload = data as ProfessionalUnitFullData & {
        patientStatus?: unknown
        patient?: { isActive?: unknown } | null
        patients?: unknown
    }
    const patient = firstRecord(payload.patients)

    return toBooleanStatus(payload.patientStatus ?? payload.patient?.isActive ?? patient?.isActive, true)
}

function getProfessionalRoleId(data: ProfessionalUnitFullData): string {
    const payload = data as ProfessionalUnitFullData & {
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

function getProfessionalUnitRoleId(data: ProfessionalUnitFullData): string {
    const payload = data as ProfessionalUnitFullData & {
        professionalUnitRoleId?: unknown
        professionalUnitRole?: { id?: unknown } | null
        professionalUnitRoles?: unknown
    }
    const unitRole = firstRecord(payload.professionalUnitRoles)

    if (typeof payload.professionalUnitRoleId === "string") return payload.professionalUnitRoleId
    if (typeof payload.professionalUnitRole?.id === "string") return payload.professionalUnitRole.id
    if (typeof unitRole?.id === "string") return unitRole.id

    return ""
}

// ============================================================================
// RESPONSE PARSING - Extrai dados de respostas específicas da API
// ============================================================================



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

// --- Schemas e tipos (movidos do service)
export const professionalFormFieldsSchema = z.object({
    name: z.string().min(1, "Informe o nome completo"),
    socialName: z.string().optional(),
    email: z.string().email("Informe um e-mail válido"),
    phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone deve estar no formato (11) 99999-9999"),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),
    birthdate: z.string().min(1, "Informe a data de nascimento"),
    sex: z.enum(["", "F", "M", "O"]),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
})


export const professionalFormBaseSchema = professionalFormFieldsSchema.superRefine((data, ctx) => {
    const pwd = data.password
    const cpwd = data.confirmPassword

    if (!pwd) {
        return
    }

    if (pwd.length < 8) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Senha deve ter pelo menos 8 caracteres", path: ["password"] })
    }

    if (!cpwd) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Confirmação de senha é obrigatória",
            path: ["confirmPassword"],
        })
        return
    }

    if (pwd !== cpwd) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "As senhas devem ser iguais",
            path: ["confirmPassword"],
        })
    }
})

// ============================================================================
// SCHEMAS POR MODO
// - profile: permite cargo e dados profissionais opcionais
// - full: exige cargo e dados profissionais
// - register: exige senha/confirmação
// ============================================================================

export const professionalProfileSchema = professionalFormBaseSchema.extend({
    userId: z.string().optional(),
    professionalId: z.string().optional(),
    roleId: z.string().optional(),
    crmState: z.string().optional(),
    crmNumber: z.string().optional(),
    professionalUnitStatus: z.boolean().optional(),
    patientStatus: z.boolean().optional(),
})

export const professionalFullSchema = professionalProfileSchema.safeExtend({
    roleId: z.string().min(1, "Cargo é obrigatório"),
    crmState: z.string().length(2, "Selecione o estado do CRM"),
    crmNumber: z.string().regex(/^\d{4,6}$/, "O número do CRM deve conter apenas dígitos"),
    professionalUnitId: z.string().optional(),
    professionalUnitRoleId: z.string().optional(),
    patientId: z.string().optional(),
    professionalUnitStatus: z.boolean(),
    patientStatus: z.boolean(),
})


export const professionalRegisterSchema = professionalFullSchema

export const professionalUiSchema = professionalProfileSchema

export const professionalRegisterPayloadSchema = professionalFormFieldsSchema
    .pick({
        name: true,
        email: true,
        phone: true,
        cpf: true,
        birthdate: true,
        sex: true,
        socialName: true,
    })
    .extend({
        // backend/register usa estes campos
        password: z.string().min(1),
        // crm vai no formato consolidado no payload (ex.: SP + 12345)
        crm: z.string().min(1).optional(),
    })



export type ProfessionalFullForm = z.infer<typeof professionalFullSchema>
export type ProfessionalProfileForm = z.infer<typeof professionalProfileSchema>
export type ProfessionalRegisterForm = z.infer<typeof professionalRegisterSchema>
export type ProfessionalRegisterPayload = z.infer<typeof professionalRegisterPayloadSchema>
export type ProfessionalUiForm = z.infer<typeof professionalUiSchema>

export interface UpdateProfessionalBaseInput {
    name?: string
    socialName?: string
    cpf?: string
    email?: string
    birthdate?: string
    phone?: string
    sex?: string
    password?: string
    crmState?: string
    crmNumber?: string
}

export interface UpdateProfessionalProfileInput extends UpdateProfessionalBaseInput {
    userId?: string
    professionalId?: string
}

export interface UpdateProfessionalFullInput extends UpdateProfessionalProfileInput {
    roleId?: string
    professionalUnitId?: string
    professionalUnitRoleId?: string
    patientId?: string
    professionalUnitStatus?: boolean
    patientStatus?: boolean
}

// ============================================================================
// CREATE INTERFACE - payload para a rota `full-create`
// ============================================================================
export interface CreateProfessionalFullInput {
    name: string
    socialName?: string
    cpf?: string
    email?: string
    birthdate?: string
    phone?: string
    sex?: string
    password: string
    crm?: string
    roleId?: string
    professionalUnitStatus?: boolean
    patientStatus?: boolean
}

export function digitsOnly(value: string) {
    return value.replace(/\D/g, "")
}

export function formatCpf(value: string) {
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

export function formatPhone(value: string) {
    const digits = digitsOnly(value).slice(0, 11)
    const ddd = digits.slice(0, 2)
    const first = digits.slice(2, digits.length > 10 ? 7 : 6)
    const second = digits.slice(digits.length > 10 ? 7 : 6, digits.length > 10 ? 11 : 10)

    if (!ddd) return ""
    if (!first) return `(${ddd}`
    if (!second) return `(${ddd}) ${first}`
    return `(${ddd}) ${first}-${second}`
}



function buildFullUpdatePayload(
    values: ProfessionalFullForm,
    data?: ProfessionalUnitFullData | null,
): UpdateProfessionalFullInput {
    const v = values as ProfessionalFullForm
    const fullData = data as (ProfessionalUnitFullData & {
        user?: unknown
        professional?: unknown
        patient?: unknown
    }) | undefined

    // Extrai IDs vindos da API, aceitando formato objeto, array ou chave singular.
    const userId = getIdFromNode(fullData?.users ?? fullData?.user)
    const professionalId = getIdFromNode(fullData?.professionals ?? fullData?.professional)
    const patientId = getIdFromNode(fullData?.patients ?? fullData?.patient)
    const professionalUnitRoleId = fullData ? getProfessionalUnitRoleId(fullData) || undefined : undefined

    const payload: UpdateProfessionalFullInput = {
        // IDs das tabelas
        professionalUnitId: fullData?.id || undefined,
        userId,
        professionalId,
        patientId,
        roleId: v.roleId || undefined,
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
        professionalUnitRoleId,
        // Paciente
        patientStatus: v.patientStatus ?? true,
    }

    if (v.password) payload.password = v.password
    return payload
}

/**
 * Build payload for single-step creation endpoint `/professional-units/full-create`.
 * Constrói um objeto com os campos necessários para criar usuário/profissional/unidade.
 */
function buildFullCreatePayload(values: ProfessionalFormValues): CreateProfessionalFullInput {
    const v = values as ProfessionalFormValues

    const payload: CreateProfessionalFullInput = {
        name: v.name.trim(),
        socialName: v.socialName?.trim(),
        cpf: v.cpf?.replace(/\D/g, ""),
        email: v.email?.trim(),
        birthdate: v.birthdate ? new Date(`${v.birthdate}T00:00:00.000Z`).toISOString() : undefined,
        phone: v.phone?.replace(/\D/g, ""),
        sex: v.sex || undefined,
        password: v.password ?? "",
        crm: v.crmState && v.crmNumber ? `${v.crmState}${v.crmNumber}` : undefined,
        roleId: v.roleId || undefined,
        professionalUnitStatus: v.professionalUnitStatus ?? true,
        patientStatus: v.patientStatus ?? true,
    }

    return payload
}

function buildProfileUpdatePayload(
    values: ProfessionalProfileForm,
    data?: ProfessionalUnitFullData | null,
): UpdateProfessionalProfileInput {
    const v = values as ProfessionalProfileForm
    const fullData = data as (ProfessionalUnitFullData & {
        user?: unknown
        professional?: unknown
    }) | undefined

    // Extrai IDs vindos da API, aceitando formato objeto, array ou chave singular.
    const userId = getIdFromNode(fullData?.users ?? fullData?.user)
    const professionalId = getIdFromNode(fullData?.professionals ?? fullData?.professional)

    const payload: UpdateProfessionalProfileInput = {
        // IDs das tabelas
        userId,
        professionalId,
        // Dados de usuário
        name: v.name,
        socialName: v.socialName,
        cpf: v.cpf?.replace(/\D/g, ""),
        email: v.email,
        birthdate: v.birthdate ? new Date(`${v.birthdate}T00:00:00.000Z`).toISOString() : undefined,
        phone: v.phone?.replace(/\D/g, ""),
        sex: v.sex || undefined,
        // Profissional (opcionais no profile)
        crmState: v.crmState || undefined,
        crmNumber: v.crmNumber || undefined,
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
    const { user: sessionUser } = useSession()
    const { toasts, dismiss, toast } = useToast()
    const [professional, setProfessional] = useState<ProfessionalUnitFullData | null>(null)
    const [isLoading, setIsLoading] = useState(!isRegisterMode)
    const [isSaving, setIsSaving] = useState(false)

    const [roles, setRoles] = useState<ProfessionalRole[]>([])
    const [isRolesLoading, setIsRolesLoading] = useState(false)
    const [rolesError, setRolesError] = useState("")
    const formSchema = useMemo(
        () => (isProfileView ? professionalProfileSchema : isRegisterMode ? professionalRegisterSchema : professionalFullSchema),
        [isProfileView, isRegisterMode],
    )
    const form = useForm<ProfessionalFormValues>({
        resolver: zodResolver(formSchema) as Resolver<ProfessionalFormValues>,
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
    const professionalUserId = useMemo(() => {
        const currentProfessional = professional as ProfessionalUnitFullData & { user?: unknown }
        return getIdFromNode(currentProfessional?.users ?? currentProfessional?.user)
    }, [professional])
    const isEditingLoggedProfessional = !isRegisterMode && !!sessionUser?.id && professionalUserId === sessionUser.id

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


    const onSubmit = async (values: ProfessionalFormValues) => {
        if (isRegisterMode) {
            setIsSaving(true)
            try {
                const fullPayload = buildFullCreatePayload(values as ProfessionalFormValues)

                const response = await fetch(`${authBaseUrl}/professional-units/full-create`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(fullPayload),
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null) as { message?: string } | null
                    toast.error(errorData?.message ?? "Nao foi possivel cadastrar profissional")
                    return
                }

                toast.success("Profissional cadastrado")
                onCreated?.()
                if (afterSavePath) navigate(afterSavePath)
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
                ? buildProfileUpdatePayload(values as ProfessionalProfileForm, professional)
                    : buildFullUpdatePayload(values as ProfessionalFullForm, professional)

            if (isProfile) {
                const response = await fetch(`${authBaseUrl}/professional-units/profile-update`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(dataToSend),
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null) as { message?: string } | null
                    toast.error(errorData?.message ?? "Nao foi possivel atualizar o perfil")
                    return
                }
            } else {
                const response = await fetch(`${authBaseUrl}/professional-units/full-update`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify(dataToSend),
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null) as { message?: string } | null
                    toast.error(errorData?.message ?? "Nao foi possivel atualizar o profissional")
                    return
                }
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
                                            {sexOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
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
                                            className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
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
                                <div className="grid gap-2 sm:grid-cols-1" title={isEditingLoggedProfessional ? "Não é possivel alterar as informações de acesso do profissional logado." : undefined}>
                                    <p className="text-sm font-semibold text-foreground">Profissional ativo</p>
                                    <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Desative para esse profissional não consiga fazer login na unidade e também não apareça nas seções de agendas e agendamentos do sistema.</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={form.watch("professionalUnitStatus") ?? true}
                                                disabled={isEditingLoggedProfessional}
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
                                <div className="grid gap-5 sm:grid-cols-2" title={isEditingLoggedProfessional ? "Não é possivel alterar as informações de acesso do profissional logado." : undefined}>
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-foreground">Cargo</span>
                                        <select
                                            className="h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            disabled={isRolesLoading || roles.length === 0 || isEditingLoggedProfessional}
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

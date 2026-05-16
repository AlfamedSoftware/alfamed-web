import { authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"
import * as z from "zod"

// Usado na listagem de profissionais (e agora também como tipo principal para o profile/full-update).
export interface ProfessionalUnitFullData {
    id: string
    isActive: boolean
    patients?: { id: string; isActive: boolean }
    professionals?: { id: string; isActive: boolean }
    professionalUnitRoles?: { id: string }
    roles?: { id: string; name: string; isActive: boolean }
    users?: {
        id: string
        name: string
        email: string
        phone?: string
        cpf?: string
        birthdate?: string
        isActive: boolean
    }
}

export interface UpdateProfessionalInput {
    // IDs das tabelas relacionadas
    professionalUnitId?: string
    userId?: string
    professionalId?: string
    patientId?: string

    // Users
    name?: string
    socialName?: string
    cpf?: string
    email?: string
    birthdate?: string
    phone?: string
    password?: string
    sex?: string

    // Profissional
    crmState?: string
    crmNumber?: string
    professionalUnitStatus?: boolean

    // Units
    roleId?: string

    // Patients
    patientStatus?: boolean
}

export interface LinkProfessionalUnitRoleInput {
    professionalUnitId: string
    roleId: string
}

export const professionalFormBaseSchema = z.object({
    name: z.string().min(1, "Informe o nome completo"),
    socialName: z.string().optional(),
    email: z.string().email("Informe um e-mail válido"),
    phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Telefone deve estar no formato (11) 99999-9999"),
    cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),
    birthdate: z.string().min(1, "Informe a data de nascimento"),
    sex: z.enum(["", "F", "M"]),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
})

export const professionalFullSchema = professionalFormBaseSchema
    .extend({
        roleId: z.string("Cargo é obrigatório").min(1, "Cargo é obrigatório"),
        crmState: z.string().length(2, "Selecione o estado do CRM"),
        crmNumber: z.string().regex(/^\d{4,6}$/, "O número do CRM deve conter apenas dígitos"),
        professionalUnitStatus: z.boolean(),
        patientStatus: z.boolean(),
    })
    .superRefine((data, ctx) => {
        const pwd = data.password
        const cpwd = data.confirmPassword
        if (pwd || cpwd) {
            if (pwd && pwd.length < 8) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Senha deve ter pelo menos 8 caracteres", path: ["password"] })
            }
            if (!pwd) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Senha é obrigatória", path: ["password"] })
            }
            if (!cpwd) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Confirmação de senha é obrigatória",
                    path: ["confirmPassword"],
                })
            }
            if (pwd && cpwd && pwd !== cpwd) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "As senhas devem ser iguais",
                    path: ["confirmPassword"],
                })
            }
        }
    })

export const professionalProfileSchema = professionalFormBaseSchema
    .extend({
        roleId: z.string().optional(),
        crmState: z.string().optional(),
        crmNumber: z.string().optional(),
        professionalUnitStatus: z.boolean().optional(),
        patientStatus: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
        const pwd = data.password
        const cpwd = data.confirmPassword
        if (pwd || cpwd) {
            if (pwd && pwd.length < 8) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Senha deve ter pelo menos 8 caracteres", path: ["password"] })
            }
            if (!pwd) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Senha é obrigatória", path: ["password"] })
            }
            if (!cpwd) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Confirmação de senha é obrigatória",
                    path: ["confirmPassword"],
                })
            }
            if (pwd && cpwd && pwd !== cpwd) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "As senhas devem ser iguais",
                    path: ["confirmPassword"],
                })
            }
        }
    })

export type ProfessionalFullForm = z.infer<typeof professionalFullSchema>
export type ProfessionalProfileForm = z.infer<typeof professionalProfileSchema>

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

// API
export const professionalsService = {
    getFullDataByProfessionalUnitId: (professionalUnitId: string): Promise<ProfessionalUnitFullData> =>
        fetchWithAuth<ProfessionalUnitFullData>(
            `${authBaseUrl}/professional-units/professional-unit-full-data/${professionalUnitId}`,
        ),

    listByUnit: (unitId: string): Promise<ProfessionalUnitFullData[]> =>
        fetchWithAuth<ProfessionalUnitFullData[]>(`${authBaseUrl}/professional-units/list-professional-unit-full-data-by-unit/${unitId}`),

    updateFull: (professionalUnitId: string, data: UpdateProfessionalInput): Promise<ProfessionalUnitFullData> =>
        fetchWithAuth<ProfessionalUnitFullData>(`${authBaseUrl}/professional-units/full-update/${professionalUnitId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    updateProfile: (professionalUnitId: string, data: UpdateProfessionalInput): Promise<ProfessionalUnitFullData> =>
        fetchWithAuth<ProfessionalUnitFullData>(`${authBaseUrl}/professional-units/full-update/${professionalUnitId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),

    linkProfessionalUnitRole: (data: LinkProfessionalUnitRoleInput): Promise<unknown> =>
        fetchWithAuth<unknown>(`${authBaseUrl}/professional_unit/link-role`, {
            method: "POST",
            body: JSON.stringify(data),
        }),
}

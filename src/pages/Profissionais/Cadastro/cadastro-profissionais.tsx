import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Check, Loader2 } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { authBaseUrl } from "@/lib/auth"
import { useSession } from "@/hooks/use-session"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const cadastroProfissionalSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    socialName: z.string().optional(),
    email: z.string().email("Informe um e-mail válido"),
    cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
    birthdate: z.string().min(1, "Data de nascimento é obrigatória"),
    phone: z.string().min(10, "Telefone inválido"),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(8, "Confirmação de senha é obrigatória"),
    sex: z.enum(["male", "female", "other", "not_informed"]),
    emailVerified: z.boolean(),
    image: z.string().optional(),
    isActive: z.boolean(),
    twoFactorEnabled: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas devem ser iguais",
    path: ["confirmPassword"],
})

type CadastroProfissionalSchemaType = z.infer<typeof cadastroProfissionalSchema>

type ProfessionalOption = {
    id: number
    name: string
    socialName: string | null
}

function getStringField(record: Record<string, unknown>, field: string): string | null {
    const value = record[field]

    if (typeof value === "string") {
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : null
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value)
    }

    return null
}

function getNumericId(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value
    }

    if (typeof value === "string") {
        const parsed = Number(value)
        if (Number.isFinite(parsed)) {
            return parsed
        }
    }

    return null
}

function extractCurrentUnitIdentifier(session: unknown, user: unknown): string | null {
    const sessionRecord =
        session && typeof session === "object" ? (session as Record<string, unknown>) : null
    const userRecord = user && typeof user === "object" ? (user as Record<string, unknown>) : null

    const candidateKeys = [
        "unitId",
        "currentUnitId",
        "unidadeId",
        "currentUnidadeId",
        "unitKey",
        "currentUnitKey",
        "unidadeKey",
        "currentUnidadeKey",
        "organizationKey",
        "tenantKey",
    ]

    for (const key of candidateKeys) {
        const sessionValue = sessionRecord ? getStringField(sessionRecord, key) : null
        if (sessionValue) {
            return sessionValue
        }

        const userValue = userRecord ? getStringField(userRecord, key) : null
        if (userValue) {
            return userValue
        }
    }

    if (sessionRecord?.activeUnit && typeof sessionRecord.activeUnit === "object") {
        const activeUnitRecord = sessionRecord.activeUnit as Record<string, unknown>
        const activeUnitIdentifier =
            getStringField(activeUnitRecord, "id") ?? getStringField(activeUnitRecord, "key")
        if (activeUnitIdentifier) {
            return activeUnitIdentifier
        }
    }

    if (userRecord?.activeUnit && typeof userRecord.activeUnit === "object") {
        const activeUnitRecord = userRecord.activeUnit as Record<string, unknown>
        const activeUnitIdentifier =
            getStringField(activeUnitRecord, "id") ?? getStringField(activeUnitRecord, "key")
        if (activeUnitIdentifier) {
            return activeUnitIdentifier
        }
    }

    if (sessionRecord?.unit && typeof sessionRecord.unit === "object") {
        const unitRecord = sessionRecord.unit as Record<string, unknown>
        const unitIdentifier = getStringField(unitRecord, "id") ?? getStringField(unitRecord, "key")
        if (unitIdentifier) {
            return unitIdentifier
        }
    }

    if (sessionRecord?.units && typeof sessionRecord.units === "object") {
        const unitsRecord = sessionRecord.units as Record<string, unknown>
        const unitIdentifier = getStringField(unitsRecord, "id") ?? getStringField(unitsRecord, "key")
        if (unitIdentifier) {
            return unitIdentifier
        }
    }

    return null
}

function extractProfessionalOptions(payload: unknown): ProfessionalOption[] {
    const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null

    const candidates = [
        payload,
        root?.data,
        root?.professionals,
        root?.items,
        root?.results,
    ]

    const source = candidates.find((candidate) => Array.isArray(candidate))
    if (!Array.isArray(source)) {
        return []
    }

    const options: ProfessionalOption[] = []

    for (const item of source) {
        if (!item || typeof item !== "object") {
            continue
        }

        const record = item as Record<string, unknown>
        const professionalsNode =
            record.professionals && typeof record.professionals === "object"
                ? (record.professionals as Record<string, unknown>)
                : null
        const usersNode =
            record.users && typeof record.users === "object"
                ? (record.users as Record<string, unknown>)
                : null

        const id = getNumericId(professionalsNode?.id ?? record.id)
        const idFromFlatKey = getNumericId(record["professionals.id"])
        const name =
            getStringField(usersNode ?? record, "name") ??
            getStringField(record, "users.name")
        const socialName = getStringField(record, "socialName")

        const resolvedId = id ?? idFromFlatKey

        if (resolvedId === null || !name) {
            continue
        }

        options.push({
            id: resolvedId,
            name,
            socialName,
        })
    }

    return options.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
}

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

export function CadastroProfissionais() {
    const { session, user, isLoading: isLoadingSession } = useSession()
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false)
    const [professionalsErrorMessage, setProfessionalsErrorMessage] = useState("")
    const [selectedProfessionalId, setSelectedProfessionalId] = useState(0)
    const [professionalOptions, setProfessionalOptions] = useState<ProfessionalOption[]>([])
    const isEditingProfessional = selectedProfessionalId !== 0

    useEffect(() => {
        if (!successMessage) {
            return
        }

        const timeoutId = window.setTimeout(() => {
            setSuccessMessage("")
        }, 4000)

        return () => {
            window.clearTimeout(timeoutId)
        }
    }, [successMessage])

    useEffect(() => {
        if (isLoadingSession) {
            return
        }

        const unitIdentifier = extractCurrentUnitIdentifier(session, user)
        if (!unitIdentifier) {
            setProfessionalOptions([])
            setProfessionalsErrorMessage("Não foi possível identificar a unidade atual.")
            return
        }

        const abortController = new AbortController()

        const fetchProfessionals = async () => {
            setIsLoadingProfessionals(true)
            setProfessionalsErrorMessage("")

            try {
                const queryParams = new URLSearchParams({
                    unitId: unitIdentifier,
                    unitKey: unitIdentifier,
                })

                const response = await fetch(
                    `${authBaseUrl}/professionals/by-unit?${queryParams.toString()}`,
                    {
                        credentials: "include",
                        signal: abortController.signal,
                    },
                )

                if (!response.ok) {
                    throw new Error("Não foi possível carregar os profissionais da unidade.")
                }

                const data: unknown = await response.json()
                setProfessionalOptions(extractProfessionalOptions(data))
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return
                }

                setProfessionalOptions([])
                setProfessionalsErrorMessage("Não foi possível carregar os profissionais da unidade.")
            } finally {
                setIsLoadingProfessionals(false)
            }
        }

        void fetchProfessionals()

        return () => {
            abortController.abort()
        }
    }, [isLoadingSession, session, user])

    const form = useForm<CadastroProfissionalSchemaType>({
        resolver: zodResolver(cadastroProfissionalSchema),
        defaultValues: {
            name: "",
            socialName: "",
            email: "",
            cpf: "",
            birthdate: "",
            phone: "",
            password: "",
            confirmPassword: "",
            sex: "not_informed",
            emailVerified: false,
            image: "",
            isActive: true,
            twoFactorEnabled: false,
        },
    })

    async function onSubmit(values: CadastroProfissionalSchemaType) {
        setIsLoading(true)
        setSuccessMessage("")
        form.clearErrors("root")

        try {
            const payload = {
                name: values.name.trim(),
                email: values.email.trim(),
                password: values.password,
                cpf: values.cpf.replace(/\D/g, ""),
                phone: values.phone.replace(/\D/g, ""),
                birthdate: new Date(`${values.birthdate}T00:00:00.000Z`).toISOString(),
            }

            const response = await fetch(`${authBaseUrl}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                let errorMessage = "Não foi possível cadastrar o profissional."

                try {
                    const errorData = (await response.json()) as { message?: string }
                    if (errorData?.message) {
                        errorMessage = errorData.message
                    }
                } catch {
                    // Keep default message when response body is not JSON.
                }

                form.setError("root", {
                    message: errorMessage,
                })
                return
            }

            let registerData: unknown = null
            try {
                registerData = await response.json()
            } catch {
                form.setError("root", {
                    message: "Usuário criado, mas não foi possível ler o retorno do cadastro.",
                })
                return
            }

            const createdUserId = extractCreatedUserId(registerData)
            if (!createdUserId) {
                form.setError("root", {
                    message: "Usuário criado, mas não foi possível identificar o ID retornado.",
                })
                return
            }

            const professionalResponse = await fetch(`${authBaseUrl}/professionals/link-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ userId: createdUserId, isActive: values.isActive }),
            })

            if (!professionalResponse.ok) {
                let professionalErrorMessage =
                    "Usuário criado, mas não foi possível víncular a tabela de profissionais."

                try {
                    const errorData = (await professionalResponse.json()) as { message?: string }
                    if (errorData?.message) {
                        professionalErrorMessage = errorData.message
                    }
                } catch {
                    // Keep default message when response body is not JSON.
                }

                form.setError("root", {
                    message: professionalErrorMessage,
                })
                return
            }

            const patientResponse = await fetch(`${authBaseUrl}/patients/link-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ userId: createdUserId, isActive: values.isActive }),
            })

            if (!patientResponse.ok) {
                let patientErrorMessage =
                    "Profissional criado, mas não foi possível víncular a tabela de pacientes."

                try {
                    const errorData = (await patientResponse.json()) as { message?: string }
                    if (errorData?.message) {
                        patientErrorMessage = errorData.message
                    }
                } catch {
                    // Keep default message when response body is not JSON.
                }

                form.setError("root", {
                    message: patientErrorMessage,
                })
                return
            }

            setSuccessMessage("Profissional cadastrado com sucesso.")
            form.reset({
                ...form.getValues(),
                name: "",
                socialName: "",
                email: "",
                cpf: "",
                birthdate: "",
                phone: "",
                password: "",
                confirmPassword: "",
                sex: "not_informed",
                emailVerified: false,
                image: "",
                isActive: true,
                twoFactorEnabled: false,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <PageHeader title="Cadastro de Profissionais" />
            <div className="flex flex-1 flex-col p-4">
                <div className="mx-auto w-full max-w-5xl">
                    <div className="mb-6 grid gap-2">
                        <h1 className="text-2xl font-bold text-primary">Novo profissional</h1>
                        <p className="text-muted-foreground">
                            Preencha os dados do usuário para concluir o cadastro de profissionais.
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
                            <div className="grid gap-2">
                                <label
                                    htmlFor="professional-selector"
                                    className="text-sm font-medium leading-none"
                                >
                                    Profissional
                                </label>
                                <select
                                    id="professional-selector"
                                    value={selectedProfessionalId}
                                    onChange={(event) =>
                                        setSelectedProfessionalId(Number(event.target.value))
                                    }
                                    className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px]"
                                    disabled={isLoadingProfessionals}
                                >
                                    <option value={0}>Adicionar novo profissional</option>
                                    {professionalOptions.map((professional) => (
                                        <option key={professional.id} value={professional.id}>
                                            {professional.socialName
                                                ? `${professional.name} (${professional.socialName})`
                                                : professional.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="min-h-[20px] text-sm text-muted-foreground">
                                    {isLoadingProfessionals
                                        ? "Carregando profissionais..."
                                        : professionalsErrorMessage}
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome completo" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="socialName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome profissional</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nome profissional (opcional)" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>E-mail</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="nome@dominio.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cpf"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CPF</FormLabel>
                                            <FormControl>
                                                <Input placeholder="000.000.000-00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="birthdate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data de nascimento</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telefone</FormLabel>
                                            <FormControl>
                                                <Input placeholder="(00) 00000-0000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Senha</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Defina uma senha segura"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirmar senha</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    placeholder="Confirme sua senha"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="sex"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sexo</FormLabel>
                                            <FormControl>
                                                <select
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    className="border-input bg-background h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px]"
                                                >
                                                    <option value="not_informed">Não informado</option>
                                                    <option value="male">Masculino</option>
                                                    <option value="female">Feminino</option>
                                                    <option value="other">Outro</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="emailVerified"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                                            <FormLabel>Email verificado</FormLabel>
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={(event) => field.onChange(event.target.checked)}
                                                    className="h-4 w-4 accent-primary"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                                            <FormLabel>Ativo</FormLabel>
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={(event) => field.onChange(event.target.checked)}
                                                    className="h-4 w-4 accent-primary"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="twoFactorEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
                                            <FormLabel>2FA habilitado</FormLabel>
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={(event) => field.onChange(event.target.checked)}
                                                    className="h-4 w-4 accent-primary"
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="min-h-[24px] text-sm font-medium text-emerald-600">
                                {successMessage}
                            </div>

                            <div className="min-h-[24px] text-sm font-medium text-destructive">
                                {form.formState.errors.root?.message}
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" className="min-w-48" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {isEditingProfessional ? "Salvando alterações..." : "Cadastrando..."}
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            {isEditingProfessional
                                                ? "Salvar alterações"
                                                : "Cadastrar profissional"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </>
    )
}

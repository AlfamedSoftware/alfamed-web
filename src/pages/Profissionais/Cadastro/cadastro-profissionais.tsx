import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Check, Loader2 } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { authBaseUrl } from "@/lib/auth"
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

interface CadastroProfissionaisFormProps {
    onCreated?: () => void
    showHeader?: boolean
    className?: string
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

export function CadastroProfissionaisForm({
    onCreated,
    showHeader = true,
    className,
}: CadastroProfissionaisFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")

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
                    void 0
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
                    void 0
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
                    void 0
                }

                form.setError("root", {
                    message: patientErrorMessage,
                })
                return
            }

            setSuccessMessage("Profissional cadastrado com sucesso.")
            onCreated?.()
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
        <div className={className ?? "mx-auto w-full max-w-5xl"}>
            {showHeader ? (
                <div className="mb-6 grid gap-2">
                    <h1 className="text-2xl font-bold text-primary">Novo profissional</h1>
                    <p className="text-muted-foreground">
                        Preencha os dados do usuário para concluir o cadastro de profissionais.
                    </p>
                </div>
            ) : null}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
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
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Check className="mr-2 h-4 w-4" />
                                    Cadastrar profissional
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}

export function CadastroProfissionais() {
    return (
        <>
            <PageHeader title="Cadastro de Profissionais" />
            <div className="flex flex-1 flex-col p-4">
                <CadastroProfissionaisForm />
            </div>
        </>
    )
}

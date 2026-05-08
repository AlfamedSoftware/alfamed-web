import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { API_URL } from "@/lib/auth"

const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, "Senha deve ter no mínimo 8 caracteres")
        .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
        .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
        .regex(/[0-9]/, "Senha deve conter pelo menos um número"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não correspondem",
    path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPassword() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [isValidatingToken, setIsValidatingToken] = useState(true)
    const [tokenValid, setTokenValid] = useState(false)
    const [tokenError, setTokenError] = useState<string>("")
    const [isResetting, setIsResetting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const token = searchParams.get("token") || ""

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    // Valida o token quando a página carrega
    useEffect(() => {
        if (!token) {
            setTokenError("Token não fornecido na URL")
            setIsValidatingToken(false)
            return
        }

        const validateToken = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/auth/validate-reset-token/${encodeURIComponent(token)}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                )

                const result = await response.json()

                if (result.valid) {
                    setTokenValid(true)
                } else {
                    setTokenError(result.message || "Token inválido ou expirado")
                }
            } catch (error) {
                setTokenError("Erro ao validar token. Tente solicitar um novo link.")
            } finally {
                setIsValidatingToken(false)
            }
        }

        validateToken()
    }, [token])

    async function onSubmit(data: ResetPasswordFormData) {
        setIsResetting(true)
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token,
                    password: data.password,
                }),
                credentials: "include",
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                form.setError("root", {
                    message: result.message || "Erro ao redefinir senha",
                })
                return
            }

            setSuccess(true)

            // Redireciona para login após 3 segundos
            setTimeout(() => {
                navigate("/sign-in", { replace: true })
            }, 3000)
        } catch (error) {
            form.setError("root", {
                message: "Erro ao redefinir senha. Tente novamente.",
            })
        } finally {
            setIsResetting(false)
        }
    }

    if (isValidatingToken) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 px-4">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-slate-700 dark:text-slate-300">Validando link de redefinição...</p>
                </div>
            </div>
        )
    }

    if (!tokenValid) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-4">
                <div className="w-full max-w-[420px]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
                        <div className="flex justify-center mb-4">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold text-center mb-2 text-slate-900 dark:text-slate-50">Link inválido ou expirado</h1>
                        <p className="text-center mb-6 text-slate-700 dark:text-slate-300">
                            {tokenError}
                        </p>
                        <Button
                            onClick={() => navigate("/sign-in", { replace: true })}
                            className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                            Voltar para login
                        </Button>
                        <Button
                            variant="link"
                            onClick={() => navigate("/sign-in", { replace: true })}
                            className="w-full mt-2 text-blue-600 dark:text-blue-400"
                        >
                            Solicitar novo link
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-4">
                <div className="w-full max-w-[420px]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-50">Senha redefinida com sucesso!</h1>
                        <p className="mb-6 text-slate-700 dark:text-slate-300">
                            Você será redirecionado para o login. Você já pode fazer login com sua nova senha.
                        </p>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Redirecionando em 3 segundos...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-4">
            <div className="w-full max-w-[420px]">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-50">Redefinir senha</h1>
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                            Digite sua nova senha. Certifique-se de usar uma senha forte e segura.
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Password Field */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nova senha</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    disabled={isResetting}
                                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-500"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Confirm Password Field */}
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirmar senha</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    disabled={isResetting}
                                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-500"
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Password Requirements */}
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900/60 dark:bg-slate-800">
                                <p className="mb-2 font-semibold text-blue-900 dark:text-blue-300">Requisitos de senha:</p>
                                <ul className="space-y-1 text-blue-800 dark:text-slate-200">
                                    <li className={form.getValues("password").length >= 8 ? "text-green-700 dark:text-green-400" : ""}>
                                        ✓ Mínimo 8 caracteres
                                    </li>
                                    <li className={/[A-Z]/.test(form.getValues("password")) ? "text-green-700 dark:text-green-400" : ""}>
                                        ✓ Pelo menos uma letra maiúscula
                                    </li>
                                    <li className={/[a-z]/.test(form.getValues("password")) ? "text-green-700 dark:text-green-400" : ""}>
                                        ✓ Pelo menos uma letra minúscula
                                    </li>
                                    <li className={/[0-9]/.test(form.getValues("password")) ? "text-green-700 dark:text-green-400" : ""}>
                                        ✓ Pelo menos um número
                                    </li>
                                </ul>
                            </div>

                            {/* Error Message */}
                            {form.formState.errors.root && (
                                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <p className="text-sm">{form.formState.errors.root.message}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                                disabled={isResetting || !tokenValid}
                            >
                                {isResetting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Redefinindo...
                                    </>
                                ) : (
                                    "Redefinir senha"
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                className="w-full border-slate-300 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-50 dark:hover:bg-slate-800"
                                onClick={() => navigate("/sign-in", { replace: true })}
                                disabled={isResetting}
                            >
                                Voltar para login
                            </Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
    )
}

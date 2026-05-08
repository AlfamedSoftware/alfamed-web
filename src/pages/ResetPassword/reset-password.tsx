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
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Validando link de redefinição...</p>
                </div>
            </div>
        )
    }

    if (!tokenValid) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="w-full max-w-[420px]">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="flex justify-center mb-4">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold text-center mb-2">Link inválido ou expirado</h1>
                        <p className="text-muted-foreground text-center mb-6">
                            {tokenError}
                        </p>
                        <Button
                            onClick={() => navigate("/sign-in", { replace: true })}
                            className="w-full"
                        >
                            Voltar para login
                        </Button>
                        <Button
                            variant="link"
                            onClick={() => navigate("/sign-in", { replace: true })}
                            className="w-full mt-2"
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
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                <div className="w-full max-w-[420px]">
                    <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2">Senha redefinida com sucesso!</h1>
                        <p className="text-muted-foreground mb-6">
                            Você será redirecionado para o login. Você já pode fazer login com sua nova senha.
                        </p>
                        <div className="text-sm text-muted-foreground">
                            Redirecionando em 3 segundos...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-[420px]">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-primary mb-2">Redefinir senha</h1>
                        <p className="text-muted-foreground text-sm">
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
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                                                    {...field}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                                <p className="font-semibold text-blue-900 mb-2">Requisitos de senha:</p>
                                <ul className="space-y-1 text-blue-800">
                                    <li className={form.getValues("password").length >= 8 ? "text-green-600" : ""}>
                                        ✓ Mínimo 8 caracteres
                                    </li>
                                    <li className={/[A-Z]/.test(form.getValues("password")) ? "text-green-600" : ""}>
                                        ✓ Pelo menos uma letra maiúscula
                                    </li>
                                    <li className={/[a-z]/.test(form.getValues("password")) ? "text-green-600" : ""}>
                                        ✓ Pelo menos uma letra minúscula
                                    </li>
                                    <li className={/[0-9]/.test(form.getValues("password")) ? "text-green-600" : ""}>
                                        ✓ Pelo menos um número
                                    </li>
                                </ul>
                            </div>

                            {/* Error Message */}
                            {form.formState.errors.root && (
                                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <p className="text-sm">{form.formState.errors.root.message}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
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
                                className="w-full"
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

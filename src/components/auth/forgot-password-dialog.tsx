import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
// Usamos um modal inline em vez do Dialog ausente
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

const forgotPasswordSchema = z.object({
    email: z.string().email("Email inválido"),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

interface ForgotPasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ForgotPasswordDialog({ open, onOpenChange }: ForgotPasswordDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [successEmail, setSuccessEmail] = useState("")

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(data: ForgotPasswordFormData) {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
                credentials: "include",
            })

            if (!response.ok) {
                throw new Error("Erro ao solicitar redefinição de senha")
            }

            const result = await response.json()

            if (result.success) {
                setSuccess(true)
                setSuccessEmail(data.email)
                form.reset()

                // Fecha a dialog após 3 segundos
                setTimeout(() => {
                    onOpenChange(false)
                    setSuccess(false)
                }, 3000)
            } else {
                form.setError("root", {
                    message: result.message || "Erro ao solicitar redefinição de senha",
                })
            }
        } catch (error) {
            form.setError("root", {
                message: "Erro ao solicitar redefinição de senha. Tente novamente.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        if (!isLoading) {
            onOpenChange(false)
            setSuccess(false)
            form.reset()
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Content */}
            <div className="relative rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 animate-in fade-in-0 zoom-in-95 duration-200 bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-800">
                {success ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Email enviado com sucesso!</h3>
                        <p className="mt-4">
                            Se o email <strong>{successEmail}</strong> existe em nossa base de dados, você
                            receberá um link de redefinição de senha.
                        </p>
                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                            O link expira em 15 minutos. Verifique sua caixa de entrada (e spam).
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Esqueceu sua senha?</h3>
                            <p className="text-sm text-slate-700 dark:text-slate-400">Digite seu email para receber um link de redefinição de senha</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="seu@email.com"
                                                    type="email"
                                                    disabled={isLoading}
                                                    className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-50 dark:placeholder:text-slate-500"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {form.formState.errors.root && (
                                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                        <p className="text-sm">{form.formState.errors.root.message}</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            "Enviar link de redefinição"
                                        )}
                                    </Button>
                                </div>

                                <p className="text-xs text-muted-foreground text-center">
                                    Por segurança, não informamos se o email existe em nossa base. Se houver uma conta
                                    associada, você receberá um email com instruções.
                                </p>
                            </form>
                        </Form>
                    </>
                )}
            </div>
        </div>
    )
}

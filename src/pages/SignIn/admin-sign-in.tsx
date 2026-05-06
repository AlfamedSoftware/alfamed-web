import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ShieldCheck, Loader2 } from "lucide-react"
import { useNavigate } from "react-router"
import { auth } from "@/lib/auth"
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
import { ensureStorageAccessBeforeLogin } from "@/lib/storage-access"

const adminSignInSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
})

type AdminSignInSchemaType = z.infer<typeof adminSignInSchema>

export function AdminSignIn() {
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const form = useForm<AdminSignInSchemaType>({
        resolver: zodResolver(adminSignInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit({ email, password }: AdminSignInSchemaType) {
        if (!email.toLowerCase().endsWith("@alfamed.com")) {
            form.setError("email", {
                message: "Use um e-mail corporativo @alfamed.com",
            })
            return
        }

        setIsLoading(true)

        try {
            const storageAccess = await ensureStorageAccessBeforeLogin()
            if (!storageAccess.granted) {
                form.setError("root", {
                    message: "No Safari, permita o acesso a cookies para concluir o login.",
                })
                return
            }

            const response = await auth.signIn.email({
                email,
                password,
                callbackURL: `${window.location.origin}/admin/unidades`,
            })

            if (response?.error) {
                form.setError("root", {
                    message: "Credenciais inválidas para a área interna",
                })
                return
            }

            navigate("/admin/unidades", { replace: true })
        } catch {
            form.setError("root", {
                message: "Falha ao autenticar. Tente novamente.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-200 dark:border-cyan-900 bg-cyan-50 dark:bg-cyan-900/30 px-3 py-1 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Área Interna
                    </span>
                </div>

                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">ServiceDesk Alfamed</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acesso exclusivo para equipe interna.</p>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 mt-6">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-mail corporativo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="nome@alfamed.com" {...field} />
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
                                        <Input type="password" placeholder="Sua senha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="min-h-[20px] text-sm font-medium text-destructive">
                            {form.formState.errors.root?.message}
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full cursor-pointer">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                "Entrar na área interna"
                            )}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    )
}

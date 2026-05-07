import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { useState } from "react"
import { Loader2 } from "lucide-react"
import loginLogo from "@/assets/auth/login.svg"
import { useNavigate } from "react-router"

const signInSchema = z.object({
    email: z.string(),
    password: z.string(),
})

type signInSchemaType = z.infer<typeof signInSchema>

export function SignIn() {
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate()

    const form = useForm<signInSchemaType>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit({ email, password }: signInSchemaType) {
        setIsLoading(true)
        try {
            const response = await auth.signIn.email({
                email,
                password,
                callbackURL: `${window.location.origin}/session`,
            })

            if (response?.error) {
                if (response.error.status === 401) {
                    // Check if the error message indicates account is inactive
                    const errorMessage = response.error.message || "";
                    if (errorMessage.includes("inactive")) {
                        form.setError("root", {
                            message: "Sua conta foi desativada. Entre em contato com o suporte.",
                        })
                    } else {
                        form.setError("root", {
                            message: "Email ou senha inválidos",
                        })
                    }
                } else if (response.error.status === 400) {
                    form.setError("root", {
                        message: "Email ou senha inválidos",
                    })
                }
                return
            }

            navigate("/session", { replace: true })
        } catch {
            form.setError("root", {
                message: "Ocorreu um erro inesperado. Tente novamente.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[420px] gap-6">
                    <div className="grid gap-2">
                        <h1 className="text-2xl font-bold text-primary">Bem-vindo ao Alfamed</h1>
                        <p className="text-balance text-muted-foreground">
                            Use seu e-mail e senha para acessar sua conta
                        </p>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 ">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <Input placeholder="insira seu e-mail" {...field} />
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
                                            <Input placeholder="insira sua senha" type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="min-h-[24px]">
                                <div className={`text-sm font-medium text-destructive`}>
                                    {form.formState.errors.root?.message}
                                </div>
                            </div>
                            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando...
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </Button>
                        </form>
                    </Form>
                    <div className="text-center">
                        <Button variant="link" className="text-primary cursor-pointer text-base">
                            Esqueceu sua senha?
                        </Button>
                    </div>
                </div>
            </div>
            <div className="hidden lg:flex items-center justify-start pl-20 h-full">
                <div className="w-full max-w-[600px] pb-24]shadow-[0_30px_100px_-50px_rgba(0,0,0,0.95)] backdrop-blur-sm">
                    <img
                        src={loginLogo}
                        alt="Image"
                        className="h-full w-full object-contain"
                    />
                </div>
            </div>
        </div>
    )
}

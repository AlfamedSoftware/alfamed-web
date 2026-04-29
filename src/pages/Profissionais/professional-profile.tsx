import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { PageHeader } from "@/components/page-header"
import { professionalsService, type Professional } from "@/services/professionals.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { cn } from "@/lib/utils"
import { ToastContainer, useToast } from "./components/Toast"

function getInitials(name?: string) {
    const value = name?.trim()
    if (!value) return "PR"
    const parts = value.split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function ProfessionalProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [professional, setProfessional] = useState<Professional | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { toasts, dismiss, toast } = useToast()

    const form = useForm({
        defaultValues: {
            name: "",
            email: "",
            isActive: true,
        },
    })

    useEffect(() => {
        if (!id) return
        const controller = new AbortController()
        setLoading(true)
        setError(null)
        professionalsService
            .getById(id)
            .then((data) => {
                setProfessional(data)
                form.reset({ name: data.name ?? "", email: data.email ?? "", isActive: data.isActive })
            })
            .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar"))
            .finally(() => setLoading(false))

        return () => controller.abort()
    }, [id])

    const handleToggleActive = async () => {
        if (!id || !professional) return
        const newValue = !professional.isActive
        try {
            await professionalsService.update(id, { isActive: newValue })
            setProfessional((p) => (p ? { ...p, isActive: newValue } : p))
            form.setValue("isActive", newValue)
            toast.success(newValue ? "Profissional ativado" : "Profissional desativado")
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erro ao alterar status"
            setError(msg)
            toast.error(msg)
        }
    }

    async function onSubmit(values: any) {
        // Backend currently accepts only { isActive?: boolean } on PATCH /professionals/:id
        if (!id) return
        setSaving(true)
        try {
            await professionalsService.update(id, {
                isActive: professional?.isActive,
            })
            toast.success("Status salvo com sucesso")
            navigate("/profissionais")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro ao salvar")
            toast.error(err instanceof Error ? err.message : "Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title="Profissionais" />

            <div className="p-6">
                <div className="max-w-3xl mx-auto bg-card rounded-lg shadow-sm p-6 border border-border text-card-foreground">
                    {error && <div className="text-sm text-destructive mb-3">{error}</div>}
                    {loading || !professional ? (
                        <div className="text-sm text-muted-foreground">Carregando...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex flex-col items-center md:items-start">
                                <div
                                    className={cn(
                                        "w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-xl",
                                        "bg-slate-400",
                                    )}
                                >
                                    {getInitials(professional.name)}
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">Foto do profissional</p>
                                <div className="mt-3">
                                    <button
                                        onClick={handleToggleActive}
                                        className={cn(
                                            "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                                            professional.isActive
                                                ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                                                : "bg-popover text-muted-foreground border border-border hover:bg-popover",
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "w-2 h-2 rounded-full",
                                                professional.isActive ? "bg-green-500" : "bg-[var(--muted-foreground)]",
                                            )}
                                        />
                                        {professional.isActive ? "Ativo" : "Desativado"}
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nome</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Nome completo" {...field} />
                                                    </FormControl>
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
                                                        <Input placeholder="email@exemplo.com" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {/* 'Ativo' control removed — use the status button at left */}

                                        <div className="flex items-center justify-end gap-2 mt-4">
                                            <Button variant="ghost" onClick={() => navigate(-1)}>
                                                Voltar
                                            </Button>
                                            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
                                        </div>
                                    </form>
                                </Form>
                                <ToastContainer toasts={toasts} onDismiss={dismiss} />
                                <div className="mt-6 text-sm text-muted-foreground">
                                    <p>Use o botão de status à esquerda para ativar/desativar o profissional.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

import { useEffect, useMemo, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams } from "react-router"
import { Save } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { proceduresService, type ProcedureUnitFullData } from "@/Servicos/procedures.service"

const procedureFormSchema = z.object({
    description: z.string().min(1, "Informe a descrição do procedimento"),
    code: z.string().min(1, "Informe o código do procedimento"),
    price: z.string().min(1, "Informe o valor do procedimento"),
    observation: z.string().optional(),
    isActive: z.boolean(),
})

type ProcedureFormValues = z.infer<typeof procedureFormSchema>

interface ProcedureProfileProps {
    procedureId?: string
    afterSavePath?: string | null
    isRegisterMode?: boolean
    showPageHeader?: boolean
    onCancel?: () => void
}

function normalizeValue(value?: string | null) {
    return value?.trim() ?? ""
}

function getProcedureLabel(isRegisterMode: boolean) {
    return isRegisterMode ? "Cadastro de Procedimento" : "Edição de Procedimento"
}

function getProcedureFromList(data: ProcedureUnitFullData[], id?: string) {
    if (!id) {
        return null
    }

    return data.find((procedure) => procedure.id === id) ?? null
}

export function ProcedureProfile({
    procedureId,
    afterSavePath = "/procedimentos",
    isRegisterMode = false,
    showPageHeader = true,
    onCancel,
}: ProcedureProfileProps = {}) {
    const { id: routeProcedureId } = useParams()
    const effectiveProcedureId = procedureId ?? routeProcedureId
    const navigate = useNavigate()
    const { sessionUnit, isLoading: isSessionUnitLoading } = useSessionUnit()
    const [procedure, setProcedure] = useState<ProcedureUnitFullData | null>(null)
    const [isLoading, setIsLoading] = useState(!isRegisterMode)
    const [isSaving, setIsSaving] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [saveMessage, setSaveMessage] = useState<string | null>(null)

    const form = useForm<ProcedureFormValues>({
        resolver: zodResolver(procedureFormSchema) as Resolver<ProcedureFormValues>,
        defaultValues: {
            description: "",
            code: "",
            price: "",
            observation: "",
            isActive: true,
        },
    })

    const pageTitle = useMemo(() => getProcedureLabel(isRegisterMode), [isRegisterMode])
    const unitId = sessionUnit?.selectedUnitId ?? ""

    useEffect(() => {
        if (isRegisterMode) {
            setIsLoading(false)
            return
        }

        if (isSessionUnitLoading) {
            return
        }

        if (!unitId) {
            setLoadError("Nenhuma unidade selecionada na sessão.")
            setIsLoading(false)
            return
        }

        let alive = true

        async function loadProcedure() {
            setIsLoading(true)
            setLoadError(null)

            try {
                const data = await proceduresService.listByUnit(unitId)

                if (!alive) {
                    return
                }

                const current = getProcedureFromList(data, effectiveProcedureId)

                if (!current) {
                    setLoadError("Procedimento não encontrado para edição.")
                    return
                }

                setProcedure(current)
                form.reset({
                    description: current.description,
                    code: current.code,
                    price: current.price,
                    observation: normalizeValue(current.observation),
                    isActive: current.isActive,
                })
            } catch (error) {
                if (!alive || (error as Error).name === "AbortError") {
                    return
                }

                setLoadError(error instanceof Error ? error.message : "Falha ao carregar procedimento")
            } finally {
                if (alive) {
                    setIsLoading(false)
                }
            }
        }

        void loadProcedure()

        return () => {
            alive = false
        }
    }, [effectiveProcedureId, form, isRegisterMode, isSessionUnitLoading, unitId])

    const handleSubmit = async (values: ProcedureFormValues) => {
        setIsSaving(true)
        setSaveMessage(null)
        setLoadError(null)

        try {
            if (isRegisterMode) {
                const createdProcedure = await proceduresService.create({
                    description: values.description.trim(),
                    observation: values.observation?.trim() || "",
                    code: values.code.trim(),
                    price: values.price.trim(),
                    isActive: values.isActive,
                })

                setProcedure(createdProcedure)
                setSaveMessage("Procedimento cadastrado com sucesso.")

                if (afterSavePath) {
                    navigate(afterSavePath)
                }
                return
            }

            const summary = [
                `Descrição: ${values.description.trim()}`,
                `Código: ${values.code.trim()}`,
                `Valor: ${values.price.trim()}`,
                values.observation?.trim() ? `Observação: ${values.observation.trim()}` : null,
                `Status: ${values.isActive ? "Ativo" : "Inativo"}`,
            ]
                .filter(Boolean)
                .join(" | ")

            setSaveMessage(`A edição ainda está aguardando o endpoint de atualização. ${summary}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
            return
        }

        if (afterSavePath) {
            navigate(afterSavePath)
            return
        }

        navigate("/procedimentos")
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            {showPageHeader ? <PageHeader title={pageTitle} /> : null}

            <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
                {isSessionUnitLoading || isLoading ? (
                    <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-sm">
                        Carregando procedimento...
                    </div>
                ) : (
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        {loadError ? (
                            <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {loadError}
                            </div>
                        ) : null}

                        <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-5">
                            <div className="grid gap-5 md:grid-cols-2">
                                <label className="grid gap-2 md:col-span-2">
                                    <span className="text-sm font-medium">Descrição</span>
                                    <Input placeholder="Ex.: Consulta oftalmológica" {...form.register("description")} />
                                    {form.formState.errors.description ? (
                                        <span className="text-xs text-destructive">
                                            {form.formState.errors.description.message}
                                        </span>
                                    ) : null}
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-sm font-medium">Código</span>
                                    <Input placeholder="Ex.: PROC-001" {...form.register("code")} />
                                    {form.formState.errors.code ? (
                                        <span className="text-xs text-destructive">{form.formState.errors.code.message}</span>
                                    ) : null}
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-sm font-medium">Valor</span>
                                    <Input placeholder="Ex.: 120,00" {...form.register("price")} />
                                    {form.formState.errors.price ? (
                                        <span className="text-xs text-destructive">{form.formState.errors.price.message}</span>
                                    ) : null}
                                </label>

                                <label className="grid gap-2 md:col-span-2">
                                    <span className="text-sm font-medium">Observação</span>
                                    <textarea
                                        rows={4}
                                        placeholder="Observações adicionais do procedimento"
                                        className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                                        {...form.register("observation")}
                                    />
                                </label>

                                <label className="flex items-center gap-3 md:col-span-2">
                                    <input type="checkbox" className="h-4 w-4 rounded border-input" {...form.register("isActive")} />
                                    <div className="grid gap-0.5">
                                        <span className="text-sm font-medium">Procedimento ativo</span>
                                        <span className="text-xs text-muted-foreground">
                                            Procedimentos inativos continuam visíveis na edição, mas não aparecem na lista padrão.
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {procedure
                                        ? "A edição está pronta visualmente, aguardando integração do endpoint de gravação."
                                        : "Cadastro preparado com a mesma estrutura dos profissionais."}
                                </p>

                                <div className="flex flex-col items-start gap-2 sm:items-end">
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={handleCancel} className="cursor-pointer">
                                            Cancelar
                                        </Button>

                                        <Button type="submit" disabled={isLoading || isSaving} className="cursor-pointer">
                                            <Save className="h-4 w-4" />
                                            {isSaving ? "Salvando..." : "Salvar"}
                                        </Button>
                                    </div>

                                    {saveMessage ? <p className="text-sm font-medium text-blue-600">{saveMessage}</p> : null}
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    )
}
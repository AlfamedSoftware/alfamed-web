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
import { proceduresService } from "@/Servicos/procedures.service"
import { cn } from "@/lib/utils"
import { ProcedureFormSkeleton } from "./Skeleton/edicao-procedimento-skeleton"

const procedureFormSchema = z.object({
    description: z.string().min(1, "Informe a descrição do procedimento"),
    code: z
        .string()
        .min(1, "Informe o código do procedimento")
        .regex(/^[A-Z0-9]{6}$/, "Informe um código alfanumérico com 6 caracteres"),
    price: z
        .string()
        .min(1, "Informe o valor do procedimento")
        .regex(
            /^(0|[1-9]\d*|[1-9]\d{0,2}(\.\d{3})+),\d{2}$/,
            "Informe um valor positivo ou zero no formato 0,00",
        ),
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

function formatNumberToPrice(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

function formatPriceValue(value: string) {
    const normalizedValue = value.trim().replace(/[^\d,.-]/g, "")

    if (!normalizedValue) {
        return "0,00"
    }

    if (/^\d+$/.test(normalizedValue)) {
        return formatNumberToPrice(Number(normalizedValue))
    }

    if (/^\d+\.\d{2}$/.test(normalizedValue)) {
        return formatNumberToPrice(Number(normalizedValue))
    }

    const valueWithoutThousands = normalizedValue.replace(/\./g, "")

    if (/^\d+,\d{1,2}$/.test(valueWithoutThousands)) {
        const [integerPart, decimalPart] = valueWithoutThousands.split(",")
        return formatNumberToPrice(Number(`${integerPart}.${decimalPart.padEnd(2, "0")}`))
    }

    return normalizedValue
}

function normalizeCodeValue(value: string) {
    return value.trim().toUpperCase()
}

function getProcedureLabel(isRegisterMode: boolean) {
    return isRegisterMode ? "Cadastro de Procedimento" : "Edição de Procedimento"
}

function ToggleSwitch({
    checked,
    onClick,
    disabled = false,
}: {
    checked: boolean
    onClick: () => void
    disabled?: boolean
}) {
    return (
        <button
            type="button"
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={cn(
                "relative inline-flex h-8 w-14 items-center rounded-full p-1 transition-colors",
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                checked ? "bg-primary" : "bg-muted",
            )}
            aria-pressed={checked}
        >
            <span
                className={cn(
                    "h-6 w-6 rounded-full bg-background shadow-sm transition-transform duration-200",
                    checked ? "translate-x-6" : "translate-x-0",
                )}
            />
        </button>
    )
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
    const { isLoading: isSessionUnitLoading } = useSessionUnit()
    const [isLoading, setIsLoading] = useState(!isRegisterMode)
    const [isSaving, setIsSaving] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [saveMessage, setSaveMessage] = useState<string | null>(null)

    const form = useForm<ProcedureFormValues>({
        resolver: zodResolver(procedureFormSchema) as Resolver<ProcedureFormValues>,
        defaultValues: {
            description: "",
            code: "",
            price: "0,00",
            observation: "",
            isActive: true,
        },
    })

    const pageTitle = useMemo(() => getProcedureLabel(isRegisterMode), [isRegisterMode])
    const priceField = form.register("price", {
        onBlur: (event) => {
            form.setValue("price", formatPriceValue(event.target.value), {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
    })
    const codeField = form.register("code")

    useEffect(() => {
        if (isRegisterMode) {
            setIsLoading(false)
            return
        }

        if (isSessionUnitLoading) {
            return
        }

        if (!effectiveProcedureId) {
            setLoadError("Procedimento não informado para edição.")
            setIsLoading(false)
            return
        }

        const procedureIdToLoad = effectiveProcedureId

        let alive = true

        async function loadProcedure() {
            setIsLoading(true)
            setLoadError(null)

            try {
                const current = await proceduresService.getById(procedureIdToLoad)

                if (!alive) {
                    return
                }

                form.reset({
                    description: current.description,
                    code: normalizeCodeValue(current.code),
                    price: formatPriceValue(current.price),
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
    }, [effectiveProcedureId, form, isRegisterMode, isSessionUnitLoading])

    const handleSubmit = async (values: ProcedureFormValues) => {
        setIsSaving(true)
        setSaveMessage(null)
        setLoadError(null)

        try {
            if (isRegisterMode) {
                await proceduresService.create({
                    description: values.description.trim(),
                    observation: values.observation?.trim() || "",
                    code: normalizeCodeValue(values.code),
                    price: values.price.trim(),
                    isActive: values.isActive,
                })

                setSaveMessage("Procedimento cadastrado com sucesso.")

                if (afterSavePath) {
                    navigate(afterSavePath)
                }
                return
            }

            if (!effectiveProcedureId) {
                setLoadError("Procedimento não informado para edição.")
                return
            }

            await proceduresService.update({
                procedureId: effectiveProcedureId,
                description: values.description.trim(),
                observation: values.observation?.trim() || null,
                code: normalizeCodeValue(values.code),
                price: values.price.trim(),
                isActive: values.isActive,
            })

            setSaveMessage("Procedimento atualizado com sucesso.")
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Erro ao salvar procedimento")
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
                    <ProcedureFormSkeleton />
                ) : (
                    <>
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
                            <Input
                                maxLength={6}
                                placeholder="Ex.: A1B2C3"
                                {...codeField}
                                onChange={(event) => {
                                    event.target.value = normalizeCodeValue(event.target.value)
                                    void codeField.onChange(event)
                                }}
                            />
                            {form.formState.errors.code ? (
                                <span className="text-xs text-destructive">{form.formState.errors.code.message}</span>
                            ) : null}
                        </label>

                        <label className="grid gap-2">
                            <span className="text-sm font-medium">Valor</span>
                            <Input inputMode="decimal" placeholder="Ex.: 120,00" {...priceField} />
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

                        <div className="grid gap-2 md:col-span-2">
                            <p className="text-sm font-semibold text-foreground">Procedimento ativo</p>
                            <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Desative para esse procedimento não aparecer nas listas padrão de seleção.
                                        </p>
                                    </div>

                                    <input type="checkbox" className="sr-only" tabIndex={-1} aria-hidden="true" {...form.register("isActive")} />
                                    <ToggleSwitch
                                        checked={form.watch("isActive") ?? true}
                                        onClick={() =>
                                            form.setValue("isActive", !(form.watch("isActive") ?? true), { shouldDirty: true })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
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
                    </>
                )}
            </main>
        </div>
    )
}

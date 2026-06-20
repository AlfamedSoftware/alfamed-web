import { useEffect, useMemo, useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams } from "react-router"
import { AlertTriangle, ArrowLeft, CheckCircle2, Plus } from "lucide-react"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { specialtiesService } from "@/Servicos/specialties.service"
import { cn } from "@/lib/utils"
import { SpecialtyFormSkeleton } from "./Skeleton/edicao-especialidade-skeleton"
import { BackButton, SaveButton } from "@/components/ui/buttons"

const specialtyFormSchema = z.object({
    description: z.string().min(1, "Informe a descrição da especialidade"),
    isActive: z.boolean(),
})

type SpecialtyFormValues = z.infer<typeof specialtyFormSchema>

interface SpecialtyProfileProps {
    specialtyId?: string
    afterSavePath?: string | null
    isRegisterMode?: boolean
    showPageHeader?: boolean
    onCancel?: () => void
}

function getSpecialtyLabel(isRegisterMode: boolean) {
    return isRegisterMode ? "Cadastro de Especialidade" : "Edição de Especialidade"
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

export function SpecialtyProfile({
    specialtyId,
    afterSavePath = "/specialties",
    isRegisterMode = false,
    showPageHeader = true,
    onCancel,
}: SpecialtyProfileProps = {}) {
    const { id: routeSpecialtyId } = useParams()
    const effectiveSpecialtyId = specialtyId ?? routeSpecialtyId
    const navigate = useNavigate()
    const { isLoading: isSessionUnitLoading } = useSessionUnit()
    const [isLoading, setIsLoading] = useState(!isRegisterMode)
    const [isSaving, setIsSaving] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [registerSuccess, setRegisterSuccess] = useState(false)
    const [registeredName, setRegisteredName] = useState("")
    const form = useForm<SpecialtyFormValues>({
        resolver: zodResolver(specialtyFormSchema) as Resolver<SpecialtyFormValues>,
        defaultValues: {
            description: "",
            isActive: true,
        },
    })

    const pageTitle = useMemo(() => getSpecialtyLabel(isRegisterMode), [isRegisterMode])

    useEffect(() => {
        if (isRegisterMode) {
            setIsLoading(false)
            return
        }

        if (isSessionUnitLoading) {
            return
        }

        if (!effectiveSpecialtyId) {
            setLoadError("Especialidade não informada para edição.")
            setIsLoading(false)
            return
        }

        const specialtyIdToLoad = effectiveSpecialtyId
        let alive = true

        async function loadSpecialty() {
            setIsLoading(true)
            setLoadError(null)

            try {
                const current = await specialtiesService.getById(specialtyIdToLoad)

                if (!alive) {
                    return
                }

                form.reset({
                    description: current.name ?? "",
                    isActive: current.isActive,
                })
            } catch (error) {
                if (!alive || (error as Error).name === "AbortError") {
                    return
                }

                setLoadError(error instanceof Error ? error.message : "Falha ao carregar especialidade")
            } finally {
                if (alive) {
                    setIsLoading(false)
                }
            }
        }

        void loadSpecialty()

        return () => {
            alive = false
        }
    }, [effectiveSpecialtyId, form, isRegisterMode, isSessionUnitLoading])

    const handleSubmit = async (values: SpecialtyFormValues) => {
        setIsSaving(true)
        setLoadError(null)

        try {
            if (isRegisterMode) {
                await specialtiesService.create({
                    name: values.description.trim(),
                    isActive: values.isActive,
                })

                setRegisteredName(values.description.trim())
                setRegisterSuccess(true)
                return
            }

            if (!effectiveSpecialtyId) {
                setLoadError("Especialidade não informada para edição.")
                return
            }

            await specialtiesService.update({
                specialtyId: effectiveSpecialtyId,
                name: values.description.trim(),
                isActive: values.isActive,
            })

            navigate(afterSavePath ?? "/especialidades")
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Erro ao salvar especialidade")
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

        navigate("/especialidades")
    }

    if (isRegisterMode && registerSuccess) {
        return (
            <div className="flex flex-col h-full min-h-screen bg-background">
                {showPageHeader ? <PageHeader title={pageTitle} /> : null}
                <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
                    <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">Especialidade cadastrada com sucesso!</h2>
                    <p className="text-sm text-muted-foreground text-center">{registeredName}</p>
                    <div className="mt-2 flex gap-3">
                        <Button onClick={() => navigate("/especialidades")} className="cursor-pointer">
                            <ArrowLeft className="w-4 h-4" />
                            Voltar para especialidades
                        </Button>
                        <Button
                            onClick={() => {
                                setRegisterSuccess(false)
                                setRegisteredName("")
                                form.reset({ description: "", isActive: true })
                            }}
                            className="cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            Cadastrar nova especialidade
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            {showPageHeader ? <PageHeader title={pageTitle} /> : null}

            <main className="flex-1 flex flex-col px-4 py-6 md:px-6 md:py-8">
                {isSessionUnitLoading || isLoading ? (
                    <SpecialtyFormSkeleton />
                ) : (
                    <>
                        {loadError ? (
                            <div className="flex items-start gap-3 mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{loadError}</span>
                            </div>
                        ) : null}

                        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 gap-5">
                            <div className="grid gap-5">
                                <label className="grid gap-2">
                                    <span className="text-sm font-medium">Descrição</span>
                                    <Input placeholder="Ex.: Cardiologista" {...form.register("description")} />
                                    {form.formState.errors.description ? (
                                        <span className="text-xs text-destructive">
                                            {form.formState.errors.description.message}
                                        </span>
                                    ) : null}
                                </label>

                                <div className="grid gap-2">
                                    <p className="text-sm font-semibold text-foreground">Especialidade ativa</p>
                                    <div className="rounded-2xl border border-border bg-muted/30 px-5 py-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">
                                                    Desative para essa especialidade não aparecer nas listas padrão de seleção.
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

                            <div className="mt-auto flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-end">
                                <div className="flex flex-col items-start gap-2 sm:items-end">
                                    <div className="flex gap-2">
                                        <BackButton onClick={handleCancel} />

                                        <SaveButton isSaving={isSaving} disabled={isLoading} />
                                    </div>

                                </div>
                            </div>
                        </form>
                    </>
                )}
            </main>
        </div>
    )
}
import { auth } from "@/lib/auth"
import { authBaseUrl } from "@/lib/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router"

interface UnitProfile {
    id: string
    name: string
}

interface SessionClinicsResponse {
    clinics: UnitProfile[]
    selectedClinicId?: string
}

export function SelecaoUnidade() {
    const navigate = useNavigate()
    const [units, setUnits] = useState<UnitProfile[]>([])
    const [isUnitsLoading, setIsUnitsLoading] = useState(true)
    const [unitsError, setUnitsError] = useState<string | null>(null)
    const [selectedUnitId, setSelectedUnitId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const getClinicsContext = useCallback(async (signal?: AbortSignal): Promise<SessionClinicsResponse | null> => {
        try {
            const response = await fetch(`${authBaseUrl}/session/clinics`, {
                method: "GET",
                credentials: "include",
                cache: "no-store",
                signal,
            })

            if (!response.ok) {
                return null
            }

            return (await response.json()) as SessionClinicsResponse
        } catch (error) {
            if ((error as Error).name === "AbortError") {
                throw error
            }
            return null
        }
    }, [])

    const handleSelectClinic = useCallback(async (clinicId: string) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const response = await fetch(`${authBaseUrl}/session/select-clinic`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ clinicId }),
            })

            if (!response.ok) {
                const error = (await response.json()) as { message?: string }
                setSubmitError(error.message ?? "Erro ao selecionar clínica")
                return
            }

            for (let attempt = 0; attempt < 3; attempt++) {
                const context = await getClinicsContext()
                const confirmedClinicId = context?.selectedClinicId ?? null
                if (confirmedClinicId === clinicId) {
                    navigate("/home", { replace: true })
                    return
                }
            }

            setSubmitError("Não foi possível confirmar a clínica selecionada na sessão.")
        } catch (error) {
            setSubmitError("Erro de conexão ao selecionar clínica")
            console.error("Failed to select clinic:", error)
        } finally {
            setIsSubmitting(false)
        }
    }, [getClinicsContext, navigate])

    useEffect(() => {
        const controller = new AbortController()

        const fetchUnits = async () => {
            setIsUnitsLoading(true)
            setUnitsError(null)

            try {
                const context = await getClinicsContext(controller.signal)
                if (!context) {
                    setUnits([])
                    setUnitsError("Erro ao carregar clínicas da sessão.")
                    return
                }

                const selectedClinicId =
                    typeof context.selectedClinicId === "string" && context.selectedClinicId.length > 0
                        ? context.selectedClinicId
                        : null

                if (!Array.isArray(context.clinics)) {
                    setUnits([])
                    setUnitsError("Resposta inválida ao carregar clínicas.")
                    return
                }

                const parsedUnits = context.clinics.filter(
                    (unit): unit is UnitProfile =>
                        typeof unit?.id === "string" && unit.id.length > 0 && typeof unit.name === "string",
                )

                setUnits(parsedUnits)

                if (selectedClinicId) {
                    setSelectedUnitId(selectedClinicId)
                    return
                }

                if (parsedUnits.length === 1) {
                    setSelectedUnitId(parsedUnits[0].id)
                }
            } catch (error) {
                if ((error as Error).name === "AbortError") return
                setUnits([])
                setUnitsError("Erro de conexão ao buscar clínicas.")
            } finally {
                setIsUnitsLoading(false)
            }
        }

        void fetchUnits()

        return () => controller.abort()
    }, [getClinicsContext])

    function handleContinueToHome() {
        if (!selectedUnitId) return

        const selectedUnit = units.find((unit) => unit.id === selectedUnitId)
        if (!selectedUnit) return

        void handleSelectClinic(selectedUnit.id)
    }

    async function handleLogout() {
        await auth.signOut()
        navigate("/login", { replace: true })
    }

    if (isUnitsLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm">
                    <Skeleton className="h-8 w-52" />
                    <Skeleton className="mt-4 h-4 w-72" />
                    <Skeleton className="mt-6 h-10 w-full" />
                    <Skeleton className="mt-3 h-10 w-full" />
                </div>
            </div>
        )
    }

    const hasUnits = units.length > 0

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <section className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-primary">Seleção de Unidade</h1>
                {!unitsError && hasUnits && (
                    <p className="mt-2 text-sm text-muted-foreground">
                        Escolha a unidade que deseja acessar no sistema.
                    </p>
                )}

                {!unitsError && !hasUnits && (
                    <p className="mt-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                        Nenhuma unidade vinculada ao usuário.<br />
                        Entre em contato com o administrador da unidade para obter acesso.
                    </p>
                )}

                <div className="mt-6">
                    {(unitsError || submitError) && (
                        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {unitsError || submitError}
                        </p>
                    )}

                    {hasUnits && (
                        <div className="flex flex-col gap-3">
                            <select
                                value={selectedUnitId}
                                onChange={(event) => setSelectedUnitId(event.target.value)}
                                className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
                            >
                                <option value="" disabled hidden>
                                    Selecione uma unidade
                                </option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleContinueToHome}
                                disabled={!selectedUnitId || isSubmitting}
                                className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? "Atualizando sessão..." : "Ir para Home"}
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-4 h-10 w-full rounded-md border px-4 text-sm font-medium text-foreground hover:bg-muted"
                    >
                        Sair
                    </button>
                </div>
            </section>
        </main>
    )
}

import { auth, authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"
import { Loading } from "@/components/Loading/loading"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useSessionUnit } from "@/contexts/session-unit-context"

interface UnitOption {
    id: string
    name: string
    roles: {
        id: string
        description: string
        key: string
    }
}

interface SessionUnitsResponse {
    units: UnitOption[]
}

export function SelecaoUnidade() {
    const navigate = useNavigate()
    const { refreshSessionUnit } = useSessionUnit()
    const [units, setUnits] = useState<UnitOption[]>([])
    const [isUnitsLoading, setIsUnitsLoading] = useState(true)
    const [unitsError, setUnitsError] = useState<string | null>(null)
    const [selectedUnitId, setselectedUnitId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const autoSelectTriggeredRef = useRef(false)

    const getUnitsContext = useCallback(async (): Promise<SessionUnitsResponse | null> => {
        try {
            return await fetchWithAuth<SessionUnitsResponse>(`${authBaseUrl}/session/list-units-acessable-by-professional`)
        } catch (error) {
            if ((error as Error).name === "AbortError") {
                throw error
            }
            return null
        }
    }, [])

    const handleSelectUnit = useCallback(async (unitId: string): Promise<boolean> => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await fetchWithAuth<void>(`${authBaseUrl}/session/select-unit`, {
                method: "POST",
                body: JSON.stringify({ unitId }),
            })

            await auth.getSession()
            await refreshSessionUnit()

            navigate("/home", { replace: true })
            return true
        } catch (error) {
            setSubmitError("Erro de conexão ao selecionar unidade")
            console.error("Failed to select unit:", error)
            return false
        } finally {
            setIsSubmitting(false)
        }
    }, [navigate, refreshSessionUnit])

    useEffect(() => {
        const controller = new AbortController()
        let isActive = true

        const fetchUnits = async () => {
            setIsUnitsLoading(true)
            setUnitsError(null)

            try {
                const context = await getUnitsContext()
                if (!isActive) return

                if (!context) {
                    setUnits([])
                    setUnitsError("Erro ao carregar unidades da sessão.")
                    return
                }

                if (!Array.isArray(context.units)) {
                    setUnits([])
                    setUnitsError("Resposta inválida ao carregar unidades.")
                    return
                }

                const parsedUnits = context.units.filter(
                    (unit): unit is UnitOption =>
                        typeof unit?.id === "string" && unit.id.length > 0 && typeof unit.name === "string",
                )

                if (parsedUnits.length === 1 && !autoSelectTriggeredRef.current) {
                    autoSelectTriggeredRef.current = true
                    // Auto-seleciona e aguarda a finalização da seleção (navegação).
                    // Se a seleção falhar, exibimos a UI de seleção normalmente.
                    const success = await handleSelectUnit(parsedUnits[0].id)
                    if (!success && isActive) {
                        setUnits(parsedUnits)
                        setIsUnitsLoading(false)
                    }
                    return
                }

                setUnits(parsedUnits)
            } catch (error) {
                if ((error as Error).name === "AbortError" || !isActive) return
                setUnits([])
                setUnitsError("Erro de conexão ao buscar unidades.")
            } finally {
                // Não desliga o loading se já acionamos autoSelect (aguardando navegação).
                if (isActive && !autoSelectTriggeredRef.current) {
                    setIsUnitsLoading(false)
                }
            }
        }

        void fetchUnits()

        return () => {
            isActive = false
            controller.abort()
        }
    }, [getUnitsContext, handleSelectUnit])

    function handleContinueToHome() {
        if (!selectedUnitId) return

        const selectedUnit = units.find((unit) => unit.id === selectedUnitId)
        if (!selectedUnit) return

        void handleSelectUnit(selectedUnit.id)
    }

    async function handleLogout() {
        await auth.signOut()
        navigate("/login", { replace: true })
    }

    const hasUnits = units.length > 0

    if (isUnitsLoading) {
        return <Loading fullScreen message="Verificando suas credenciais..." />
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <section className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-primary">Seleção de Unidade</h1>
                <div className="mt-6">
                    {(unitsError || submitError) && (
                        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {unitsError || submitError}
                        </p>
                    )}

                    {!unitsError && !hasUnits && (
                        <p className="mt-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                            Nenhuma unidade vinculada ao usuário.<br />
                            Entre em contato com o administrador da unidade para obter acesso.
                        </p>
                    )}

                    {hasUnits && (
                        <div className="flex flex-col gap-3">
                            <select
                                value={selectedUnitId}
                                onChange={(event) => setselectedUnitId(event.target.value)}
                                className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
                            >
                                <option value="" disabled>
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
                                {isSubmitting ? "Atualizando sessão..." : "Entrar"}
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

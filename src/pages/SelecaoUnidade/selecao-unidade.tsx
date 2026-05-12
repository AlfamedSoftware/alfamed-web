import { auth, authBaseUrl } from "@/lib/auth"
import { fetchWithAuth } from "@/lib/api-client"
import { Skeleton } from "@/components/ui/skeleton"
import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"

interface UnitProfile {
    id: string
    name: string
}

interface SessionUnitsResponse {
    units: UnitProfile[]
    selectedUnitId?: string
}

export function SelecaoUnidade() {
    const navigate = useNavigate()
    const [units, setUnits] = useState<UnitProfile[]>([])
    const [isUnitsLoading, setIsUnitsLoading] = useState(true)
    const [unitsError, setUnitsError] = useState<string | null>(null)
    const [selectedUnitId, setselectedUnitId] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const autoSelectTriggeredRef = useRef(false)

    const getUnitsContext = useCallback(async (): Promise<SessionUnitsResponse | null> => {
        try {
            return await fetchWithAuth<SessionUnitsResponse>(`${authBaseUrl}/session/units`)
        } catch (error) {
            if ((error as Error).name === "AbortError") {
                throw error
            }
            return null
        }
    }, [])

    const handleSelectUnit = useCallback(async (unitId: string) => {
        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await fetchWithAuth<void>(`${authBaseUrl}/session/select-unit`, {
                method: "POST",
                body: JSON.stringify({ unitId }),
            })

            // Refrescar a sessão no cliente após o servidor setar o cookie
            await auth.getSession()

            // Redirecionar para home
            navigate("/home", { replace: true })
        } catch (error) {
            setSubmitError("Erro de conexão ao selecionar unidade")
            console.error("Failed to select unit:", error)
        } finally {
            setIsSubmitting(false)
        }
    }, [navigate])

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
                    setUnitsError("Erro ao carregar clínicas da sessão.")
                    return
                }

                const selectedUnitId =
                    typeof context.selectedUnitId === "string" && context.selectedUnitId.length > 0
                        ? context.selectedUnitId
                        : null

                if (!Array.isArray(context.units)) {
                    setUnits([])
                    setUnitsError("Resposta inválida ao carregar clínicas.")
                    return
                }

                const parsedUnits = context.units.filter(
                    (unit): unit is UnitProfile =>
                        typeof unit?.id === "string" && unit.id.length > 0 && typeof unit.name === "string",
                )

                setUnits(parsedUnits)

                if (selectedUnitId) {
                    setselectedUnitId(selectedUnitId)
                }

                if (parsedUnits.length === 1 && !autoSelectTriggeredRef.current) {
                    // Se tem apenas 1 unidade, seleciona e redireciona direto
                    autoSelectTriggeredRef.current = true
                    const onlyId = parsedUnits[0].id
                    setselectedUnitId(onlyId)
                    void handleSelectUnit(onlyId)
                }
            } catch (error) {
                if ((error as Error).name === "AbortError" || !isActive) return
                setUnits([])
                setUnitsError("Erro de conexão ao buscar clínicas.")
            } finally {
                if (isActive) {
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

    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <section className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm">
                <h1 className="text-2xl font-semibold text-primary">Seleção de Unidade</h1>
                {isUnitsLoading ? (
                    <div className="mt-6">
                        <Skeleton className="h-4 w-72" />
                        <div className="mt-4">
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="mt-3">
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                ) : (
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
                                {units.length === 1 ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-full">
                                            <Skeleton className="h-10 w-full" />
                                        </div>
                                    </div>
                                ) : (
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
                                )}

                                {units.length !== 1 && (
                                    <button
                                        type="button"
                                        onClick={handleContinueToHome}
                                        disabled={!selectedUnitId || isSubmitting}
                                        className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Atualizando sessão..." : "Entrar"}
                                    </button>
                                )}
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
                )}
            </section>
        </main>
    )
}

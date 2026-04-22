import { useSession } from "@/hooks/use-session"
import { auth } from "@/lib/auth"
import { authBaseUrl } from "@/lib/auth"
import { getSelectedUnit, setSelectedUnit } from "@/lib/selected-unit"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"

interface UnitProfile {
    id: string
    name: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

function getBearerToken(session: unknown): string | null {
    if (!session || typeof session !== "object") return null
    const s = session as Record<string, unknown>

    const tokenCandidates = [s.token, s.accessToken, s.sessionToken, s.bearerToken]
    for (const candidate of tokenCandidates) {
        if (typeof candidate === "string" && candidate.length > 0) {
            return candidate
        }
    }

    return null
}

export function SelecaoUnidade() {
    const { session, user, isLoading } = useSession()
    const navigate = useNavigate()
    const [units, setUnits] = useState<UnitProfile[]>([])
    const [isUnitsLoading, setIsUnitsLoading] = useState(true)
    const [unitsError, setUnitsError] = useState<string | null>(null)
    const [selectedUnitId, setSelectedUnitId] = useState("")

    const userId = useMemo(() => {
        if (!user || typeof user !== "object") return ""
        const id = (user as Record<string, unknown>).id
        return typeof id === "string" ? id : ""
    }, [user])

    useEffect(() => {
        if (!userId) return

        const existing = getSelectedUnit(userId)
        if (existing?.id) {
            setSelectedUnitId(existing.id)
        }
    }, [userId])

    useEffect(() => {
        if (!session) {
            setUnits([])
            setIsUnitsLoading(false)
            return
        }

        const controller = new AbortController()

        const fetchUnits = async () => {
            setIsUnitsLoading(true)
            setUnitsError(null)

            try {
                const bearerToken = getBearerToken(session)
                if (!bearerToken) {
                    setUnits([])
                    setUnitsError("Token de sessão não encontrado para carregar unidades.")
                    return
                }

                const usedEndpoint = `${authBaseUrl}/units/by-user`
                const response = await fetch(usedEndpoint, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${bearerToken}`,
                    },
                    signal: controller.signal,
                })

                if (response.status === 401) {
                    setUnits([])
                    setUnitsError("Não autenticado para carregar unidades (401).")
                    return
                }

                if (response.status === 500) {
                    setUnits([])
                    setUnitsError("Erro interno no servidor ao carregar unidades (500).")
                    return
                }

                if (!response.ok) {
                    setUnits([])
                    setUnitsError(`Erro ao carregar unidades (${response.status}) em ${usedEndpoint}`)
                    return
                }

                const data = (await response.json()) as unknown
                if (!Array.isArray(data)) {
                    setUnits([])
                    setUnitsError("Resposta inválida ao carregar unidades.")
                    return
                }

                const parsedUnits = data
                    .map((item) => {
                        if (!item || typeof item !== "object") return null
                        const unit = item as Record<string, unknown>

                        if (typeof unit.id !== "string" || typeof unit.name !== "string") return null

                        return {
                            id: unit.id,
                            name: unit.name,
                            isActive: typeof unit.isActive === "boolean" ? unit.isActive : false,
                            createdAt: typeof unit.createdAt === "string" ? unit.createdAt : "",
                            updatedAt: typeof unit.updatedAt === "string" ? unit.updatedAt : "",
                        }
                    })
                    .filter((unit): unit is UnitProfile => unit !== null)

                setUnits(parsedUnits)

                if (parsedUnits.length === 1 && userId) {
                    const onlyUnit = parsedUnits[0]
                    setSelectedUnit(userId, { id: onlyUnit.id, name: onlyUnit.name })
                    setSelectedUnitId(onlyUnit.id)
                    navigate("/home", { replace: true })
                }
            } catch (error) {
                if ((error as Error).name === "AbortError") return
                setUnits([])
                setUnitsError("Erro de conexão ao buscar unidades.")
            } finally {
                setIsUnitsLoading(false)
            }
        }

        void fetchUnits()

        return () => controller.abort()
    }, [session, userId, navigate])

    function handleContinueToHome() {
        if (!selectedUnitId || !userId) return

        const selectedUnit = units.find((unit) => unit.id === selectedUnitId)
        if (!selectedUnit) return

        setSelectedUnit(userId, selectedUnit)
        navigate("/home", { replace: true })
    }

    async function handleLogout() {
        await auth.signOut()
        navigate("/login", { replace: true })
    }

    if (isLoading || isUnitsLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
                <div className="rounded-xl border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
                    Carregando unidades...
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
                    {unitsError && (
                        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {unitsError}
                        </p>
                    )}

                    {hasUnits && (
                        <div className="flex flex-col gap-3">
                            <select
                                value={selectedUnitId}
                                onChange={(event) => setSelectedUnitId(event.target.value)}
                                className="h-10 rounded-md border bg-background px-3 text-sm text-foreground"
                            >
                                <option value="">Selecione uma unidade</option>
                                {units.map((unit) => (
                                    <option key={unit.id} value={unit.id}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleContinueToHome}
                                disabled={!selectedUnitId}
                                className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Ir para Home
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

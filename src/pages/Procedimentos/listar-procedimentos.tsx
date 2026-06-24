import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { CheckCircle2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { proceduresService, type ProcedureUnitFullData } from "@/services/procedures.service"

import { ProcedureCard } from "./Componentes/listar-procedimentos-card"
import { ProcedureEmptyState } from "./Componentes/ProcedureEmptyState"
import { ProcedureFilters } from "./Componentes/ProcedureFilters"
import { ProcedureSearch } from "./Componentes/ProcedureSearch"
import { ProcedureGridSkeleton } from "./Componentes/Skeleton/listar-procedimentos-skeleton"

type ProcedureFilter = "all" | "active" | "inactive"

function matchesQuery(procedure: ProcedureUnitFullData, query: string) {
    if (!query.trim()) {
        return true
    }

    const normalizedQuery = query.trim().toLowerCase()

    return [procedure.description, procedure.code, procedure.observation ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
}

export function Procedimentos() {
    const navigate = useNavigate()
    const { sessionUnit } = useSessionUnit()
    const [searchParams] = useSearchParams()
    const [showSavedBanner, setShowSavedBanner] = useState(() => searchParams.get("salvo") === "true")
    const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (!showSavedBanner) return
        navigate({ search: "" }, { replace: true })
        savedTimerRef.current = setTimeout(() => setShowSavedBanner(false), 5000)
        return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current) }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps
    const selectedUnitId = sessionUnit?.selectedUnitId ?? null

    const [procedures, setProcedures] = useState<ProcedureUnitFullData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeFilter, setActiveFilter] = useState<ProcedureFilter>("all")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchProcedures = async () => {
            if (!selectedUnitId) {
                setProcedures([])
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                const data = await proceduresService.listByUnit(selectedUnitId)
                setProcedures(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao carregar procedimentos")
            } finally {
                setIsLoading(false)
            }
        }

        void fetchProcedures()
    }, [selectedUnitId])

    const counts = useMemo(
        () => ({
            all: procedures.length,
            active: procedures.filter((procedure) => procedure.isActive).length,
            inactive: procedures.filter((procedure) => !procedure.isActive).length,
        }),
        [procedures],
    )

    const filtered = useMemo(() => {
        let list = procedures

        if (activeFilter === "active") {
            list = list.filter((procedure) => procedure.isActive)
        }

        if (activeFilter === "inactive") {
            list = list.filter((procedure) => !procedure.isActive)
        }

        if (searchQuery.trim()) {
            list = list.filter((procedure) => matchesQuery(procedure, searchQuery))
        }

        return list
    }, [procedures, activeFilter, searchQuery])

    const isFiltered = activeFilter !== "all" || searchQuery.trim() !== ""

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PageHeader title="Procedimentos" />
            {showSavedBanner && (
                <div className="flex items-center gap-3 bg-green-600 px-6 py-3 text-white text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Procedimento salvo com sucesso.
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 px-6 py-4">
                <ProcedureFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />

                <div className="flex-1" />

                <ProcedureSearch value={searchQuery} onChange={setSearchQuery} />

                <Button
                    id="new-procedure-btn"
                    onClick={() => navigate("cadastro")}
                    className="h-9 gap-1.5 rounded-full bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700 cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    Novo procedimento
                </Button>
            </div>

            <main className="flex-1 px-6 pb-8">
                {error ? (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {isLoading ? (
                    <ProcedureGridSkeleton count={24} />
                ) : filtered.length === 0 ? (
                    <ProcedureEmptyState isFiltered={isFiltered} />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((procedure) => (
                            <ProcedureCard key={procedure.id} procedure={procedure} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
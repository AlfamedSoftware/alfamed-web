import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { useSessionUnit } from "@/contexts/session-unit-context"
import { specialtiesService, type SpecialtyUnitFullData } from "@/Servicos/specialties.service"

import { SpecialtyCard } from "./Componentes/specialty-card"
import { SpecialtyEmptyState } from "./Componentes/specialty-empty-state"
import { SpecialtyFilters } from "./Componentes/specialty-filters"
import { SpecialtySearch } from "./Componentes/specialty-search"
import { SpecialtyGridListSkeleton } from "./Componentes/Skeleton/listar-especialidades-skeleton"

type SpecialtyFilter = "all" | "active" | "inactive"

function matchesQuery(specialty: SpecialtyUnitFullData, query: string) {
    if (!query.trim()) {
        return true
    }

    const normalizedQuery = query.trim().toLowerCase()

    return specialty.name.toLowerCase().includes(normalizedQuery)
}

export function Especialidades() {
    const navigate = useNavigate()
    const { sessionUnit } = useSessionUnit()
    const selectedUnitId = sessionUnit?.selectedUnitId ?? null

    const [specialties, setSpecialties] = useState<SpecialtyUnitFullData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeFilter, setActiveFilter] = useState<SpecialtyFilter>("all")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchSpecialties = async () => {
            if (!selectedUnitId) {
                setSpecialties([])
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                const data = await specialtiesService.listByUnit(selectedUnitId)
                setSpecialties(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro ao carregar especialidades")
            } finally {
                setIsLoading(false)
            }
        }

        void fetchSpecialties()
    }, [selectedUnitId])

    const counts = useMemo(
        () => ({
            all: specialties.length,
            active: specialties.filter((specialty) => specialty.isActive).length,
            inactive: specialties.filter((specialty) => !specialty.isActive).length,
        }),
        [specialties],
    )

    const filtered = useMemo(() => {
        let list = specialties

        if (activeFilter === "active") {
            list = list.filter((specialty) => specialty.isActive)
        }

        if (activeFilter === "inactive") {
            list = list.filter((specialty) => !specialty.isActive)
        }

        if (searchQuery.trim()) {
            list = list.filter((specialty) => matchesQuery(specialty, searchQuery))
        }

        return list
    }, [specialties, activeFilter, searchQuery])

    const isFiltered = activeFilter !== "all" || searchQuery.trim() !== ""

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <PageHeader title="Especialidades" />

            <div className="flex flex-wrap items-center gap-3 px-6 py-4">
                <SpecialtyFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />

                <div className="flex-1" />

                <SpecialtySearch value={searchQuery} onChange={setSearchQuery} />

                <Button
                    id="new-specialty-btn"
                    onClick={() => navigate("/cadastro-especialidades")}
                    className="h-9 gap-1.5 rounded-full bg-blue-600 px-4 text-white shadow-sm hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Nova Especialidade
                </Button>
            </div>

            <main className="flex-1 px-6 pb-8">
                {error ? (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {isLoading ? (
                    <SpecialtyGridListSkeleton count={24} />
                ) : filtered.length === 0 ? (
                    <SpecialtyEmptyState isFiltered={isFiltered} />
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((specialty) => (
                            <SpecialtyCard key={specialty.id} specialty={specialty} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
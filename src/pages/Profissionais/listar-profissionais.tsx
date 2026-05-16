import { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProfessionals, type ProfessionalFilter } from "@/hooks/use-professionals"

import { ProfessionalCard } from "./Componentes/listar-profissionais-card"
import { PageHeader } from "@/components/page-header"
import { ProfessionalFilters } from "./Componentes/ProfessionalFilters"
import { ProfessionalSearch } from "./Componentes/ProfessionalSearch"
import { ProfessionalGridSkeleton } from "./Componentes/Skeleton/listar-profissionais-skeleton"
import { ProfessionalEmptyState } from "./Componentes/ProfessionalEmptyState"
import { fetchWithAuth } from "@/lib/api-client"
import { authBaseUrl } from "@/lib/auth"

interface SessionUnitsResponse {
    units: Array<{ id: string; name: string }>
    selectedUnitId?: string
}

export function Profissionais() {
    const navigate = useNavigate()
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)

    // Fetch selectedUnitId from session
    useEffect(() => {
        const fetchUnitId = async () => {
            try {
                const data = await fetchWithAuth<SessionUnitsResponse>(`${authBaseUrl}/session/units`)
                if (data.selectedUnitId) {
                    setSelectedUnitId(data.selectedUnitId)
                }
            } catch (err) {
                console.error("Error fetching unit id:", err)
            }
        }
        fetchUnitId()
    }, [])

    const { professionals, isLoading, error, counts } = useProfessionals(selectedUnitId || "")

    const [activeFilter, setActiveFilter] = useState<ProfessionalFilter>("all")
    const [searchQuery, setSearchQuery] = useState("")

    const filtered = useMemo(() => {
        let list = professionals

        if (activeFilter === "active") list = list.filter((p) => p.isActive)
        if (activeFilter === "inactive") list = list.filter((p) => !p.isActive)

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            list = list.filter(
                (p) =>
                    p.id.toLowerCase().includes(q) ||
                    p.userId.toLowerCase().includes(q) ||
                    (p.name?.toLowerCase().includes(q) ?? false) ||
                    (p.email?.toLowerCase().includes(q) ?? false),
            )
        }

        return list
    }, [professionals, activeFilter, searchQuery])

    const isFiltered = activeFilter !== "all" || searchQuery.trim() !== ""

    return (
        <div className="flex flex-col h-full min-h-screen bg-background">
            <PageHeader title="Profissionais" />

            <div className="flex flex-wrap items-center gap-3 px-6 py-4">
                <ProfessionalFilters
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    counts={counts}
                />

                <div className="flex-1" />

                <ProfessionalSearch value={searchQuery} onChange={setSearchQuery} />

                <Button
                    id="new-professional-btn"
                    onClick={() => navigate("/cadastro-profissionais")}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 h-9 gap-1.5 shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Profissional
                </Button>
            </div>

            <main className="flex-1 px-6 pb-8">
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <ProfessionalGridSkeleton count={24} />
                ) : filtered.length === 0 ? (
                    <ProfessionalEmptyState isFiltered={isFiltered} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((professional) => (
                            <ProfessionalCard
                                key={professional.id}
                                professional={professional}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
